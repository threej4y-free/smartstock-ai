import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models import MovementType, SaleStatus


class ApiModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class ProductCreate(ApiModel):
    sku: str = Field(min_length=1, max_length=80)
    name: str = Field(min_length=1, max_length=200)
    category: str = Field(min_length=1, max_length=120)
    unit_cost: Decimal = Field(ge=0, max_digits=12, decimal_places=2)
    list_price: Decimal = Field(ge=0, max_digits=12, decimal_places=2)
    pack_size: int = Field(default=1, gt=0)
    minimum_order: int = Field(default=0, ge=0)
    active: bool = True


class ProductRead(ProductCreate):
    id: uuid.UUID
    available_stock: int = 0
    reserved_stock: int = 0
    physical_stock: int = 0
    next_expiration: date | None = None
    created_at: datetime
    updated_at: datetime


class SupplierCreate(ApiModel):
    name: str = Field(min_length=1, max_length=200)
    tax_id: str | None = Field(default=None, max_length=32)
    email: str | None = Field(default=None, max_length=254)
    phone: str | None = Field(default=None, max_length=40)


class SupplierRead(SupplierCreate):
    id: uuid.UUID
    active: bool
    created_at: datetime
    updated_at: datetime


class StockReceiptCreate(ApiModel):
    product_id: uuid.UUID
    batch_number: str = Field(min_length=1, max_length=100)
    quantity: int = Field(gt=0)
    received_at: date = Field(default_factory=date.today)
    expires_at: date | None = None
    supplier_id: uuid.UUID | None = None
    supplier_name: str | None = Field(default=None, min_length=1, max_length=200)
    invoice_number: str | None = Field(default=None, max_length=100)
    unit_cost: Decimal = Field(ge=0, max_digits=12, decimal_places=2)
    location: str | None = Field(default=None, max_length=80)
    actor: str = Field(default="system", min_length=1, max_length=120)

    @model_validator(mode="after")
    def supplier_is_identified(self) -> "StockReceiptCreate":
        if not self.supplier_id and not self.supplier_name:
            raise ValueError("supplier_id or supplier_name is required")
        return self


class InventoryLotRead(ApiModel):
    id: uuid.UUID
    product_id: uuid.UUID
    supplier_id: uuid.UUID
    batch_number: str
    invoice_number: str | None
    received_at: date
    expires_at: date | None
    unit_cost: Decimal
    quantity_received: int
    quantity_available: int
    quantity_reserved: int
    sellable_quantity: int
    location: str | None
    blocked_at: datetime | None
    block_reason: str | None
    status: str
    days_to_expiry: int | None
    created_at: datetime
    updated_at: datetime


class InventoryPolicyUpdate(ApiModel):
    expiration_safety_days: int = Field(ge=0, le=365)


class InventoryPolicyRead(InventoryPolicyUpdate):
    updated_at: datetime | None = None


class StockMovementRead(ApiModel):
    id: uuid.UUID
    product_id: uuid.UUID
    lot_id: uuid.UUID
    movement_type: MovementType
    quantity: int
    reason: str
    reference: str | None
    occurred_at: datetime
    actor: str


class SaleLineCreate(ApiModel):
    product_id: uuid.UUID
    quantity: int = Field(gt=0)
    unit_price: Decimal | None = Field(default=None, ge=0, max_digits=12, decimal_places=2)


class SaleCreate(ApiModel):
    reference: str = Field(min_length=1, max_length=120)
    sold_at: datetime | None = None
    items: list[SaleLineCreate] = Field(min_length=1)
    actor: str = Field(default="system", min_length=1, max_length=120)


class SaleItemRead(ApiModel):
    id: uuid.UUID
    product_id: uuid.UUID
    lot_id: uuid.UUID
    quantity: int
    unit_price: Decimal


class SaleRead(ApiModel):
    id: uuid.UUID
    reference: str
    sold_at: datetime
    status: SaleStatus
    total_amount: Decimal
    items: list[SaleItemRead]


class HealthRead(ApiModel):
    status: str
