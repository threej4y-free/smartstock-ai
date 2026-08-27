from __future__ import annotations

import uuid
from collections import defaultdict
from datetime import UTC, date, datetime
from decimal import Decimal

from sqlalchemy import case, func, or_, select
from sqlalchemy.orm import Session

from app.errors import ConflictError, InsufficientStockError, NotFoundError
from app.models import (
    InventoryLot,
    MovementType,
    Product,
    Sale,
    SaleItem,
    StockMovement,
    Supplier,
)
from app.schemas import SaleCreate, StockReceiptCreate


def _utcnow() -> datetime:
    return datetime.now(UTC)


def _normalized_sku(sku: str) -> str:
    return sku.strip().upper()


def create_product(session: Session, **values: object) -> Product:
    sku = _normalized_sku(str(values["sku"]))
    if session.scalar(select(Product.id).where(func.upper(Product.sku) == sku)):
        raise ConflictError(f"SKU {sku} already exists")
    product = Product(**{**values, "sku": sku})
    session.add(product)
    session.flush()
    return product


def create_supplier(session: Session, **values: object) -> Supplier:
    name = str(values["name"]).strip()
    if session.scalar(select(Supplier.id).where(func.lower(Supplier.name) == name.lower())):
        raise ConflictError(f"Supplier {name} already exists")
    supplier = Supplier(**{**values, "name": name})
    session.add(supplier)
    session.flush()
    return supplier


def _resolve_supplier(session: Session, receipt: StockReceiptCreate) -> Supplier:
    if receipt.supplier_id:
        supplier = session.get(Supplier, receipt.supplier_id)
        if not supplier or not supplier.active:
            raise NotFoundError("Active supplier not found")
        return supplier

    supplier_name = receipt.supplier_name.strip() if receipt.supplier_name else ""
    supplier = session.scalar(
        select(Supplier).where(func.lower(Supplier.name) == supplier_name.lower())
    )
    if supplier:
        if not supplier.active:
            raise ConflictError("Supplier is inactive")
        return supplier
    return create_supplier(session, name=supplier_name)


def receive_stock(
    session: Session, receipt: StockReceiptCreate, *, today: date | None = None
) -> InventoryLot:
    product = session.get(Product, receipt.product_id)
    if not product or not product.active:
        raise NotFoundError("Active product not found")

    duplicate = session.scalar(
        select(InventoryLot.id).where(
            InventoryLot.product_id == receipt.product_id,
            InventoryLot.batch_number == receipt.batch_number.strip(),
        )
    )
    if duplicate:
        raise ConflictError("Batch number already exists for this product")

    supplier = _resolve_supplier(session, receipt)
    reference_day = today or date.today()
    is_expired = receipt.expires_at is not None and receipt.expires_at < reference_day
    lot = InventoryLot(
        product=product,
        supplier=supplier,
        batch_number=receipt.batch_number.strip(),
        invoice_number=receipt.invoice_number.strip() if receipt.invoice_number else None,
        received_at=receipt.received_at,
        expires_at=receipt.expires_at,
        unit_cost=receipt.unit_cost,
        quantity_received=receipt.quantity,
        quantity_available=receipt.quantity,
        quantity_reserved=0,
        location=receipt.location.strip() if receipt.location else None,
        blocked_at=_utcnow() if is_expired else None,
        block_reason="expired" if is_expired else None,
    )
    session.add(lot)
    session.flush()
    session.add(
        StockMovement(
            product=product,
            lot=lot,
            movement_type=MovementType.RECEIPT,
            quantity=receipt.quantity,
            reason="Stock receipt",
            reference=receipt.invoice_number,
            actor=receipt.actor,
        )
    )
    session.flush()
    return lot


def _eligible_lots_statement(product_id: uuid.UUID, on_date: date):
    return (
        select(InventoryLot)
        .where(
            InventoryLot.product_id == product_id,
            InventoryLot.quantity_available > 0,
            InventoryLot.blocked_at.is_(None),
            or_(InventoryLot.expires_at.is_(None), InventoryLot.expires_at >= on_date),
        )
        .order_by(
            case((InventoryLot.expires_at.is_(None), 1), else_=0),
            InventoryLot.expires_at.asc(),
            InventoryLot.received_at.asc(),
            InventoryLot.created_at.asc(),
        )
        .with_for_update()
    )


def allocate_fefo(
    session: Session, product_id: uuid.UUID, quantity: int, *, on_date: date
) -> list[tuple[InventoryLot, int]]:
    if quantity <= 0:
        raise ValueError("quantity must be positive")
    lots = list(session.scalars(_eligible_lots_statement(product_id, on_date)))
    total_available = sum(lot.quantity_available for lot in lots)
    if total_available < quantity:
        raise InsufficientStockError(
            f"Insufficient sellable stock: requested {quantity}, available {total_available}"
        )

    remaining = quantity
    allocations: list[tuple[InventoryLot, int]] = []
    for lot in lots:
        allocated = min(lot.quantity_available, remaining)
        if allocated:
            allocations.append((lot, allocated))
            remaining -= allocated
        if remaining == 0:
            break
    return allocations


def create_sale(session: Session, payload: SaleCreate) -> Sale:
    if session.scalar(select(Sale.id).where(Sale.reference == payload.reference.strip())):
        raise ConflictError("Sale reference already exists")

    grouped: dict[uuid.UUID, dict[str, object]] = defaultdict(
        lambda: {"quantity": 0, "unit_price": None}
    )
    for line in payload.items:
        current = grouped[line.product_id]
        current["quantity"] = int(current["quantity"]) + line.quantity
        if line.unit_price is not None:
            existing = current["unit_price"]
            if existing is not None and existing != line.unit_price:
                raise ConflictError("A product cannot have two prices in the same sale")
            current["unit_price"] = line.unit_price

    sold_at = payload.sold_at or _utcnow()
    if sold_at.tzinfo is None:
        sold_at = sold_at.replace(tzinfo=UTC)

    planned_allocations: list[tuple[Product, Decimal, int, list[tuple[InventoryLot, int]]]] = []
    for product_id, line in grouped.items():
        product = session.get(Product, product_id)
        if not product or not product.active:
            raise NotFoundError(f"Active product {product_id} not found")
        quantity = int(line["quantity"])
        unit_price = line["unit_price"] or product.list_price
        allocations = allocate_fefo(session, product_id, quantity, on_date=sold_at.date())
        planned_allocations.append((product, unit_price, quantity, allocations))

    sale = Sale(reference=payload.reference.strip(), sold_at=sold_at)
    session.add(sale)
    total = Decimal("0")
    for product, unit_price, quantity, allocations in planned_allocations:
        for lot, allocated in allocations:
            lot.quantity_available -= allocated
            sale.items.append(
                SaleItem(
                    product_id=product.id,
                    lot=lot,
                    quantity=allocated,
                    unit_price=unit_price,
                )
            )
            session.add(
                StockMovement(
                    product=product,
                    lot=lot,
                    movement_type=MovementType.SALE,
                    quantity=-allocated,
                    reason="FEFO sale",
                    reference=sale.reference,
                    occurred_at=sold_at,
                    actor=payload.actor,
                )
            )
        total += Decimal(quantity) * unit_price

    sale.total_amount = total
    session.flush()
    return sale


def product_stock_summary(
    session: Session, product_id: uuid.UUID, *, on_date: date | None = None
) -> dict[str, int | date | None]:
    reference_day = on_date or date.today()
    lots = list(session.scalars(select(InventoryLot).where(InventoryLot.product_id == product_id)))
    physical = sum(lot.quantity_available + lot.quantity_reserved for lot in lots)
    reserved = sum(lot.quantity_reserved for lot in lots)
    eligible = [
        lot
        for lot in lots
        if lot.blocked_at is None and (lot.expires_at is None or lot.expires_at >= reference_day)
    ]
    available = sum(lot.quantity_available for lot in eligible)
    expirations = [lot.expires_at for lot in eligible if lot.expires_at is not None]
    return {
        "available_stock": available,
        "reserved_stock": reserved,
        "physical_stock": physical,
        "next_expiration": min(expirations) if expirations else None,
    }


def lot_operational_fields(lot: InventoryLot, *, on_date: date | None = None) -> dict[str, object]:
    reference_day = on_date or date.today()
    days = (lot.expires_at - reference_day).days if lot.expires_at else None
    expired = days is not None and days < 0
    blocked = lot.blocked_at is not None
    if blocked:
        status = "blocked"
    elif expired:
        status = "expired"
    elif days is not None and days <= 7:
        status = "expires_in_7_days"
    elif days is not None and days <= 15:
        status = "expires_in_15_days"
    else:
        status = "healthy"
    return {
        "sellable_quantity": 0 if blocked or expired else lot.quantity_available,
        "status": status,
        "days_to_expiry": days,
    }
