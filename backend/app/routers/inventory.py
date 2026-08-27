import uuid
from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import case, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import InventoryLot, StockMovement
from app.schemas import InventoryLotRead, StockMovementRead, StockReceiptCreate
from app.services.inventory import lot_operational_fields, receive_stock

router = APIRouter(prefix="/inventory", tags=["inventory"])
DbSession = Annotated[Session, Depends(get_db)]


def _read_lot(lot: InventoryLot, on_date: date | None = None) -> InventoryLotRead:
    return InventoryLotRead.model_validate(
        {**lot.__dict__, **lot_operational_fields(lot, on_date=on_date)}
    )


@router.post("/receipts", response_model=InventoryLotRead, status_code=status.HTTP_201_CREATED)
def post_receipt(payload: StockReceiptCreate, db: DbSession) -> InventoryLotRead:
    return _read_lot(receive_stock(db, payload))


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
    return [_read_lot(lot) for lot in lots]


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
