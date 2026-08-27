from datetime import UTC, date, datetime
from decimal import Decimal

import pytest
from sqlalchemy import select

from app.errors import ConflictError, InsufficientStockError
from app.models import MovementType, StockMovement
from app.schemas import SaleCreate, SaleLineCreate, StockReceiptCreate
from app.services.inventory import (
    create_product,
    create_sale,
    create_supplier,
    product_stock_summary,
    receive_stock,
)

TODAY = date(2026, 8, 27)


def product(db):
    return create_product(
        db,
        sku="caf-500-01",
        name="Café Especial 500g",
        category="Mercearia",
        unit_cost=Decimal("24.90"),
        list_price=Decimal("39.90"),
        pack_size=12,
        minimum_order=24,
        active=True,
    )


def supplier(db):
    return create_supplier(db, name="Casa do Grão")


def receipt(product_id, supplier_id, batch, quantity, expires_at):
    return StockReceiptCreate(
        product_id=product_id,
        supplier_id=supplier_id,
        batch_number=batch,
        quantity=quantity,
        received_at=TODAY,
        expires_at=expires_at,
        invoice_number=f"NF-{batch}",
        unit_cost=Decimal("24.90"),
        actor="Marina Costa",
    )


def test_receipt_creates_lot_and_auditable_movement(db):
    item = product(db)
    vendor = supplier(db)

    lot = receive_stock(
        db, receipt(item.id, vendor.id, "LT-001", 48, date(2026, 9, 18)), today=TODAY
    )

    movement = db.scalar(select(StockMovement))
    assert lot.quantity_received == 48
    assert lot.quantity_available == 48
    assert lot.quantity_reserved == 0
    assert lot.supplier_id == vendor.id
    assert movement is not None
    assert movement.lot_id == lot.id
    assert movement.movement_type is MovementType.RECEIPT
    assert movement.quantity == 48
    assert movement.reference == "NF-LT-001"


def test_expired_receipt_is_blocked_and_not_sellable(db):
    item = product(db)
    vendor = supplier(db)
    expired = receive_stock(
        db, receipt(item.id, vendor.id, "OLD", 20, date(2026, 8, 26)), today=TODAY
    )

    summary = product_stock_summary(db, item.id, on_date=TODAY)
    assert expired.blocked_at is not None
    assert expired.block_reason == "expired"
    assert summary["physical_stock"] == 20
    assert summary["available_stock"] == 0


def test_sale_uses_fefo_and_never_consumes_expired_lot(db):
    item = product(db)
    vendor = supplier(db)
    expired = receive_stock(
        db, receipt(item.id, vendor.id, "EXPIRED", 50, date(2026, 8, 26)), today=TODAY
    )
    later = receive_stock(
        db, receipt(item.id, vendor.id, "LATER", 10, date(2026, 10, 1)), today=TODAY
    )
    first = receive_stock(
        db, receipt(item.id, vendor.id, "FIRST", 5, date(2026, 9, 1)), today=TODAY
    )

    sale = create_sale(
        db,
        SaleCreate(
            reference="SALE-001",
            sold_at=datetime(2026, 8, 27, 14, 30, tzinfo=UTC),
            actor="PDV",
            items=[SaleLineCreate(product_id=item.id, quantity=8)],
        ),
    )

    assert [(line.lot_id, line.quantity) for line in sale.items] == [
        (first.id, 5),
        (later.id, 3),
    ]
    assert first.quantity_available == 0
    assert later.quantity_available == 7
    assert expired.quantity_available == 50
    assert sale.total_amount == Decimal("319.20")
    sale_movements = list(
        db.scalars(
            select(StockMovement)
            .where(StockMovement.movement_type == MovementType.SALE)
            .order_by(StockMovement.quantity)
        )
    )
    assert sorted(movement.quantity for movement in sale_movements) == [-5, -3]


def test_insufficient_sellable_stock_does_not_change_lots(db):
    item = product(db)
    vendor = supplier(db)
    lot = receive_stock(db, receipt(item.id, vendor.id, "ONLY", 4, date(2026, 9, 1)), today=TODAY)

    with pytest.raises(InsufficientStockError, match="requested 5, available 4"):
        create_sale(
            db,
            SaleCreate(
                reference="SALE-TOO-LARGE",
                sold_at=datetime(2026, 8, 27, tzinfo=UTC),
                items=[SaleLineCreate(product_id=item.id, quantity=5)],
            ),
        )

    assert lot.quantity_available == 4
    assert not list(
        db.scalars(select(StockMovement).where(StockMovement.movement_type == MovementType.SALE))
    )


def test_duplicate_batch_is_rejected_per_product(db):
    item = product(db)
    vendor = supplier(db)
    receive_stock(db, receipt(item.id, vendor.id, "DUPLICATE", 4, date(2026, 9, 1)), today=TODAY)

    with pytest.raises(ConflictError, match="Batch number"):
        receive_stock(
            db,
            receipt(item.id, vendor.id, "DUPLICATE", 8, date(2026, 10, 1)),
            today=TODAY,
        )


def test_database_constraint_prevents_negative_available_quantity(db):
    item = product(db)
    vendor = supplier(db)
    lot = receive_stock(db, receipt(item.id, vendor.id, "CHECK", 4, date(2026, 9, 1)), today=TODAY)
    lot.quantity_available = -1

    with pytest.raises(Exception, match="ck_lots_available_nonnegative"):
        db.flush()
