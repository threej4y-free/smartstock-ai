from __future__ import annotations

import uuid
from collections import defaultdict
from datetime import UTC, date, datetime, timedelta
from decimal import Decimal

from sqlalchemy import and_, case, func, or_, select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.errors import ConflictError, InsufficientStockError, NotFoundError
from app.models import (
    InventoryLot,
    InventoryPolicy,
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


def get_expiration_safety_days(session: Session) -> int:
    configured = session.scalar(
        select(InventoryPolicy.expiration_safety_days).where(InventoryPolicy.id == 1)
    )
    return int(configured if configured is not None else get_settings().expiration_safety_days)


def update_inventory_policy(session: Session, expiration_safety_days: int) -> InventoryPolicy:
    policy = session.get(InventoryPolicy, 1)
    if policy is None:
        policy = InventoryPolicy(id=1, expiration_safety_days=expiration_safety_days)
        session.add(policy)
    else:
        policy.expiration_safety_days = expiration_safety_days
    session.flush()
    return policy


def _eligible_lots_statement(product_id: uuid.UUID, on_date: date, expiration_safety_days: int):
    minimum_expiration = on_date + timedelta(days=expiration_safety_days)
    return (
        select(InventoryLot)
        .where(
            InventoryLot.product_id == product_id,
            InventoryLot.quantity_available > 0,
            InventoryLot.blocked_at.is_(None),
            or_(
                InventoryLot.expires_at.is_(None),
                InventoryLot.expires_at >= minimum_expiration,
            ),
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
    session: Session,
    product_id: uuid.UUID,
    quantity: int,
    *,
    on_date: date,
    expiration_safety_days: int | None = None,
) -> list[tuple[InventoryLot, int]]:
    if quantity <= 0:
        raise ValueError("quantity must be positive")
    safety_days = (
        expiration_safety_days
        if expiration_safety_days is not None
        else get_expiration_safety_days(session)
    )
    lots = list(session.scalars(_eligible_lots_statement(product_id, on_date, safety_days)))
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

    safety_days = get_expiration_safety_days(session)
    planned_allocations: list[tuple[Product, Decimal, int, list[tuple[InventoryLot, int]]]] = []
    for product_id, line in sorted(grouped.items(), key=lambda item: item[0].hex):
        product = session.get(Product, product_id)
        if not product or not product.active:
            raise NotFoundError(f"Active product {product_id} not found")
        quantity = int(line["quantity"])
        requested_price = line["unit_price"]
        unit_price = requested_price if requested_price is not None else product.list_price
        allocations = allocate_fefo(
            session,
            product_id,
            quantity,
            on_date=sold_at.date(),
            expiration_safety_days=safety_days,
        )
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
    session: Session,
    product_id: uuid.UUID,
    *,
    on_date: date | None = None,
    expiration_safety_days: int | None = None,
) -> dict[str, int | date | None]:
    return product_stock_summaries(
        session,
        [product_id],
        on_date=on_date,
        expiration_safety_days=expiration_safety_days,
    )[product_id]


def product_stock_summaries(
    session: Session,
    product_ids: list[uuid.UUID],
    *,
    on_date: date | None = None,
    expiration_safety_days: int | None = None,
) -> dict[uuid.UUID, dict[str, int | date | None]]:
    if not product_ids:
        return {}
    reference_day = on_date or date.today()
    safety_days = (
        expiration_safety_days
        if expiration_safety_days is not None
        else get_expiration_safety_days(session)
    )
    minimum_expiration = reference_day + timedelta(days=safety_days)
    eligible = and_(
        InventoryLot.blocked_at.is_(None),
        or_(
            InventoryLot.expires_at.is_(None),
            InventoryLot.expires_at >= minimum_expiration,
        ),
    )
    rows = session.execute(
        select(
            InventoryLot.product_id,
            func.coalesce(
                func.sum(InventoryLot.quantity_available + InventoryLot.quantity_reserved), 0
            ).label("physical_stock"),
            func.coalesce(func.sum(InventoryLot.quantity_reserved), 0).label("reserved_stock"),
            func.coalesce(
                func.sum(case((eligible, InventoryLot.quantity_available), else_=0)), 0
            ).label("available_stock"),
            func.min(
                case(
                    (and_(eligible, InventoryLot.expires_at.is_not(None)), InventoryLot.expires_at)
                )
            ).label("next_expiration"),
        )
        .where(InventoryLot.product_id.in_(product_ids))
        .group_by(InventoryLot.product_id)
    )
    summaries = {
        product_id: {
            "available_stock": 0,
            "reserved_stock": 0,
            "physical_stock": 0,
            "next_expiration": None,
        }
        for product_id in product_ids
    }
    for row in rows:
        summaries[row.product_id] = {
            "available_stock": int(row.available_stock),
            "reserved_stock": int(row.reserved_stock),
            "physical_stock": int(row.physical_stock),
            "next_expiration": row.next_expiration,
        }
    return summaries


def lot_operational_fields(
    lot: InventoryLot,
    *,
    on_date: date | None = None,
    expiration_safety_days: int | None = None,
) -> dict[str, object]:
    reference_day = on_date or date.today()
    safety_days = (
        expiration_safety_days
        if expiration_safety_days is not None
        else get_settings().expiration_safety_days
    )
    days = (lot.expires_at - reference_day).days if lot.expires_at else None
    expired = days is not None and days < 0
    blocked = lot.blocked_at is not None
    inside_safety_window = days is not None and days < safety_days
    if blocked:
        status = "blocked"
    elif expired:
        status = "expired"
    elif inside_safety_window:
        status = "expiration_safety_window"
    elif days is not None and days <= 7:
        status = "expires_in_7_days"
    elif days is not None and days <= 15:
        status = "expires_in_15_days"
    else:
        status = "healthy"
    return {
        "sellable_quantity": (
            0 if blocked or expired or inside_safety_window else lot.quantity_available
        ),
        "status": status,
        "days_to_expiry": days,
    }
