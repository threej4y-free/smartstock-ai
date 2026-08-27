"""Inventory foundation.

Revision ID: 20260827_0001
Revises:
Create Date: 2026-08-27
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "20260827_0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

uuid_type = sa.Uuid()
movement_type = sa.Enum(
    "RECEIPT",
    "SALE",
    "RESERVATION",
    "RELEASE",
    "ADJUSTMENT",
    "LOSS",
    name="movement_type",
    native_enum=False,
)
sale_status = sa.Enum("COMPLETED", "CANCELLED", name="sale_status", native_enum=False)


def upgrade() -> None:
    op.create_table(
        "products",
        sa.Column("id", uuid_type, nullable=False),
        sa.Column("sku", sa.String(80), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("category", sa.String(120), nullable=False),
        sa.Column("unit_cost", sa.Numeric(12, 2), nullable=False),
        sa.Column("list_price", sa.Numeric(12, 2), nullable=False),
        sa.Column("pack_size", sa.Integer(), nullable=False),
        sa.Column("minimum_order", sa.Integer(), nullable=False),
        sa.Column("active", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.CheckConstraint("unit_cost >= 0", name="ck_products_unit_cost_nonnegative"),
        sa.CheckConstraint("list_price >= 0", name="ck_products_list_price_nonnegative"),
        sa.CheckConstraint("pack_size > 0", name="ck_products_pack_size_positive"),
        sa.CheckConstraint("minimum_order >= 0", name="ck_products_minimum_order_nonnegative"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("sku"),
    )
    op.create_index("ix_products_name", "products", ["name"])
    op.create_index("ix_products_sku", "products", ["sku"])

    op.create_table(
        "suppliers",
        sa.Column("id", uuid_type, nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("tax_id", sa.String(32)),
        sa.Column("email", sa.String(254)),
        sa.Column("phone", sa.String(40)),
        sa.Column("active", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
        sa.UniqueConstraint("tax_id"),
    )
    op.create_index("ix_suppliers_name", "suppliers", ["name"])

    op.create_table(
        "inventory_lots",
        sa.Column("id", uuid_type, nullable=False),
        sa.Column("product_id", uuid_type, nullable=False),
        sa.Column("supplier_id", uuid_type, nullable=False),
        sa.Column("batch_number", sa.String(100), nullable=False),
        sa.Column("invoice_number", sa.String(100)),
        sa.Column("received_at", sa.Date(), nullable=False),
        sa.Column("expires_at", sa.Date()),
        sa.Column("unit_cost", sa.Numeric(12, 2), nullable=False),
        sa.Column("quantity_received", sa.Integer(), nullable=False),
        sa.Column("quantity_available", sa.Integer(), nullable=False),
        sa.Column("quantity_reserved", sa.Integer(), nullable=False),
        sa.Column("location", sa.String(80)),
        sa.Column("blocked_at", sa.DateTime(timezone=True)),
        sa.Column("block_reason", sa.String(240)),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.CheckConstraint("unit_cost >= 0", name="ck_lots_unit_cost_nonnegative"),
        sa.CheckConstraint("quantity_received > 0", name="ck_lots_received_positive"),
        sa.CheckConstraint("quantity_available >= 0", name="ck_lots_available_nonnegative"),
        sa.CheckConstraint("quantity_reserved >= 0", name="ck_lots_reserved_nonnegative"),
        sa.CheckConstraint(
            "quantity_available + quantity_reserved <= quantity_received",
            name="ck_lots_quantities_within_received",
        ),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["supplier_id"], ["suppliers.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("product_id", "batch_number", name="uq_lots_product_batch"),
    )
    op.create_index("ix_inventory_lots_product_id", "inventory_lots", ["product_id"])
    op.create_index("ix_inventory_lots_supplier_id", "inventory_lots", ["supplier_id"])
    op.create_index("ix_inventory_lots_invoice_number", "inventory_lots", ["invoice_number"])
    op.create_index("ix_inventory_lots_expires_at", "inventory_lots", ["expires_at"])
    op.create_index(
        "ix_lots_fefo",
        "inventory_lots",
        ["product_id", "blocked_at", "expires_at", "received_at"],
    )

    op.create_table(
        "sales",
        sa.Column("id", uuid_type, nullable=False),
        sa.Column("reference", sa.String(120), nullable=False),
        sa.Column(
            "sold_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("status", sale_status, nullable=False),
        sa.Column("total_amount", sa.Numeric(14, 2), nullable=False),
        sa.CheckConstraint("total_amount >= 0", name="ck_sales_total_nonnegative"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_sales_reference", "sales", ["reference"], unique=True)
    op.create_index("ix_sales_sold_at", "sales", ["sold_at"])

    op.create_table(
        "sale_items",
        sa.Column("id", uuid_type, nullable=False),
        sa.Column("sale_id", uuid_type, nullable=False),
        sa.Column("product_id", uuid_type, nullable=False),
        sa.Column("lot_id", uuid_type, nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("unit_price", sa.Numeric(12, 2), nullable=False),
        sa.CheckConstraint("quantity > 0", name="ck_sale_items_quantity_positive"),
        sa.CheckConstraint("unit_price >= 0", name="ck_sale_items_price_nonnegative"),
        sa.ForeignKeyConstraint(["sale_id"], ["sales.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["lot_id"], ["inventory_lots.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_sale_items_sale_id", "sale_items", ["sale_id"])
    op.create_index("ix_sale_items_product_id", "sale_items", ["product_id"])
    op.create_index("ix_sale_items_lot_id", "sale_items", ["lot_id"])

    op.create_table(
        "stock_movements",
        sa.Column("id", uuid_type, nullable=False),
        sa.Column("product_id", uuid_type, nullable=False),
        sa.Column("lot_id", uuid_type, nullable=False),
        sa.Column("movement_type", movement_type, nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("reason", sa.String(240), nullable=False),
        sa.Column("reference", sa.String(120)),
        sa.Column(
            "occurred_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("actor", sa.String(120), nullable=False),
        sa.CheckConstraint("quantity <> 0", name="ck_movements_quantity_nonzero"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["lot_id"], ["inventory_lots.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_stock_movements_product_id", "stock_movements", ["product_id"])
    op.create_index("ix_stock_movements_lot_id", "stock_movements", ["lot_id"])
    op.create_index("ix_stock_movements_movement_type", "stock_movements", ["movement_type"])
    op.create_index("ix_stock_movements_reference", "stock_movements", ["reference"])
    op.create_index("ix_stock_movements_occurred_at", "stock_movements", ["occurred_at"])


def downgrade() -> None:
    op.drop_table("stock_movements")
    op.drop_table("sale_items")
    op.drop_table("sales")
    op.drop_table("inventory_lots")
    op.drop_table("suppliers")
    op.drop_table("products")
