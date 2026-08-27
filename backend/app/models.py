from __future__ import annotations

import enum
import uuid
from datetime import UTC, date, datetime
from decimal import Decimal

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    UniqueConstraint,
    Uuid,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def utcnow() -> datetime:
    return datetime.now(UTC)


class MovementType(str, enum.Enum):
    RECEIPT = "receipt"
    SALE = "sale"
    RESERVATION = "reservation"
    RELEASE = "release"
    ADJUSTMENT = "adjustment"
    LOSS = "loss"


class SaleStatus(str, enum.Enum):
    COMPLETED = "completed"
    CANCELLED = "cancelled"


movement_type_enum = Enum(MovementType, name="movement_type", native_enum=False)
sale_status_enum = Enum(SaleStatus, name="sale_status", native_enum=False)


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        onupdate=utcnow,
        server_default=func.now(),
        nullable=False,
    )


class Product(TimestampMixin, Base):
    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    sku: Mapped[str] = mapped_column(String(80), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(200), index=True, nullable=False)
    category: Mapped[str] = mapped_column(String(120), nullable=False)
    unit_cost: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    list_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    pack_size: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    minimum_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    active: Mapped[bool] = mapped_column(default=True, nullable=False)

    lots: Mapped[list[InventoryLot]] = relationship(back_populates="product")
    movements: Mapped[list[StockMovement]] = relationship(back_populates="product")

    __table_args__ = (
        CheckConstraint("unit_cost >= 0", name="ck_products_unit_cost_nonnegative"),
        CheckConstraint("list_price >= 0", name="ck_products_list_price_nonnegative"),
        CheckConstraint("pack_size > 0", name="ck_products_pack_size_positive"),
        CheckConstraint("minimum_order >= 0", name="ck_products_minimum_order_nonnegative"),
    )


class Supplier(TimestampMixin, Base):
    __tablename__ = "suppliers"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(200), unique=True, index=True, nullable=False)
    tax_id: Mapped[str | None] = mapped_column(String(32), unique=True)
    email: Mapped[str | None] = mapped_column(String(254))
    phone: Mapped[str | None] = mapped_column(String(40))
    active: Mapped[bool] = mapped_column(default=True, nullable=False)

    lots: Mapped[list[InventoryLot]] = relationship(back_populates="supplier")


class InventoryPolicy(Base):
    __tablename__ = "inventory_policy"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    expiration_safety_days: Mapped[int] = mapped_column(Integer, default=2, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        onupdate=utcnow,
        server_default=func.now(),
        nullable=False,
    )

    __table_args__ = (
        CheckConstraint("id = 1", name="ck_inventory_policy_singleton"),
        CheckConstraint(
            "expiration_safety_days >= 0",
            name="ck_inventory_policy_expiration_safety_nonnegative",
        ),
    )


class InventoryLot(TimestampMixin, Base):
    __tablename__ = "inventory_lots"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    product_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("products.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    supplier_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("suppliers.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    batch_number: Mapped[str] = mapped_column(String(100), nullable=False)
    invoice_number: Mapped[str | None] = mapped_column(String(100), index=True)
    received_at: Mapped[date] = mapped_column(Date, nullable=False)
    expires_at: Mapped[date | None] = mapped_column(Date, index=True)
    unit_cost: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    quantity_received: Mapped[int] = mapped_column(Integer, nullable=False)
    quantity_available: Mapped[int] = mapped_column(Integer, nullable=False)
    quantity_reserved: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    location: Mapped[str | None] = mapped_column(String(80))
    blocked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    block_reason: Mapped[str | None] = mapped_column(String(240))

    product: Mapped[Product] = relationship(back_populates="lots")
    supplier: Mapped[Supplier] = relationship(back_populates="lots")
    movements: Mapped[list[StockMovement]] = relationship(back_populates="lot")
    sale_items: Mapped[list[SaleItem]] = relationship(back_populates="lot")

    __table_args__ = (
        UniqueConstraint("product_id", "batch_number", name="uq_lots_product_batch"),
        CheckConstraint("unit_cost >= 0", name="ck_lots_unit_cost_nonnegative"),
        CheckConstraint("quantity_received > 0", name="ck_lots_received_positive"),
        CheckConstraint("quantity_available >= 0", name="ck_lots_available_nonnegative"),
        CheckConstraint("quantity_reserved >= 0", name="ck_lots_reserved_nonnegative"),
        CheckConstraint(
            "quantity_available + quantity_reserved <= quantity_received",
            name="ck_lots_quantities_within_received",
        ),
        Index("ix_lots_fefo", "product_id", "blocked_at", "expires_at", "received_at"),
    )


class StockMovement(Base):
    __tablename__ = "stock_movements"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    product_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("products.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    lot_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("inventory_lots.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    movement_type: Mapped[MovementType] = mapped_column(movement_type_enum, index=True)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    reason: Mapped[str] = mapped_column(String(240), nullable=False)
    reference: Mapped[str | None] = mapped_column(String(120), index=True)
    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, server_default=func.now(), index=True
    )
    actor: Mapped[str] = mapped_column(String(120), default="system", nullable=False)

    product: Mapped[Product] = relationship(back_populates="movements")
    lot: Mapped[InventoryLot] = relationship(back_populates="movements")

    __table_args__ = (CheckConstraint("quantity <> 0", name="ck_movements_quantity_nonzero"),)


class Sale(Base):
    __tablename__ = "sales"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    reference: Mapped[str] = mapped_column(String(120), unique=True, index=True, nullable=False)
    sold_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, server_default=func.now(), index=True
    )
    status: Mapped[SaleStatus] = mapped_column(
        sale_status_enum, default=SaleStatus.COMPLETED, nullable=False
    )
    total_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0, nullable=False)

    items: Mapped[list[SaleItem]] = relationship(
        back_populates="sale", cascade="all, delete-orphan"
    )

    __table_args__ = (CheckConstraint("total_amount >= 0", name="ck_sales_total_nonnegative"),)


class SaleItem(Base):
    __tablename__ = "sale_items"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    sale_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("sales.id", ondelete="CASCADE"), index=True, nullable=False
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("products.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    lot_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("inventory_lots.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    sale: Mapped[Sale] = relationship(back_populates="items")
    lot: Mapped[InventoryLot] = relationship(back_populates="sale_items")

    __table_args__ = (
        CheckConstraint("quantity > 0", name="ck_sale_items_quantity_positive"),
        CheckConstraint("unit_price >= 0", name="ck_sale_items_price_nonnegative"),
    )
