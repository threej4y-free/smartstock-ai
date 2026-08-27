import uuid
from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import case, select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.models import InventoryLot, InventoryPolicy, StockMovement
from app.schemas import (
    InventoryLotRead,
    InventoryPolicyRead,
    InventoryPolicyUpdate,
    StockMovementRead,
    StockReceiptCreate,
)
from app.services.inventory import (
    get_expiration_safety_days,
    lot_operational_fields,
    receive_stock,
    update_inventory_policy,
)

router = APIRouter(prefix="/inventory", tags=["inventory"])
DbSession = Annotated[Session, Depends(get_db)]


def _read_lot(
    lot: InventoryLot, on_date: date | None = None, expiration_safety_days: int | None = None
) -> InventoryLotRead:
    return InventoryLotRead.model_validate(
        {
            **lot.__dict__,
            **lot_operational_fields(
                lot,
                on_date=on_date,
                expiration_safety_days=expiration_safety_days,
            ),
        }
    )


@router.post("/receipts", response_model=InventoryLotRead, status_code=status.HTTP_201_CREATED)
def post_receipt(payload: StockReceiptCreate, db: DbSession) -> InventoryLotRead:
    safety_days = get_expiration_safety_days(db)
    return _read_lot(receive_stock(db, payload), expiration_safety_days=safety_days)


@router.get("/policy", response_model=InventoryPolicyRead)
def get_policy(db: DbSession) -> InventoryPolicyRead:
    policy = db.get(InventoryPolicy, 1)
    if policy:
        return InventoryPolicyRead.model_validate(policy)
    return InventoryPolicyRead(expiration_safety_days=get_settings().expiration_safety_days)


@router.put("/policy", response_model=InventoryPolicyRead)
def put_policy(payload: InventoryPolicyUpdate, db: DbSession) -> InventoryPolicy:
    return update_inventory_policy(db, payload.expiration_safety_days)


@router.get("/lots", response_model=list[InventoryLotRead])
def get_lots(
    db: DbSession,
    product_id: uuid.UUID | None = None,
    include_empty: bool = False,
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
) -> list[InventoryLotRead]:
    statement = select(InventoryLot)
    if product_id:
        statement = statement.where(InventoryLot.product_id == product_id)
    if not include_empty:
        statement = statement.where(
            InventoryLot.quantity_available + InventoryLot.quantity_reserved > 0
        )
    statement = statement.order_by(
        case((InventoryLot.blocked_at.is_not(None), 1), else_=0),
        case((InventoryLot.expires_at.is_(None), 1), else_=0),
        InventoryLot.expires_at.asc(),
        InventoryLot.received_at.asc(),
    )
    lots = db.scalars(statement.limit(limit).offset(offset)).all()
    safety_days = get_expiration_safety_days(db)
    return [_read_lot(lot, expiration_safety_days=safety_days) for lot in lots]


@router.get("/movements", response_model=list[StockMovementRead])
def get_movements(
    db: DbSession,
    product_id: uuid.UUID | None = None,
    lot_id: uuid.UUID | None = None,
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
) -> list[StockMovement]:
    statement = select(StockMovement)
    if product_id:
        statement = statement.where(StockMovement.product_id == product_id)
    if lot_id:
        statement = statement.where(StockMovement.lot_id == lot_id)
    return list(
        db.scalars(statement.order_by(StockMovement.occurred_at.desc()).limit(limit).offset(offset))
    )
