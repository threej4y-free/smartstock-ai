from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Supplier
from app.schemas import SupplierCreate, SupplierRead
from app.services.inventory import create_supplier

router = APIRouter(prefix="/suppliers", tags=["suppliers"])
DbSession = Annotated[Session, Depends(get_db)]


@router.post("", response_model=SupplierRead, status_code=status.HTTP_201_CREATED)
def post_supplier(payload: SupplierCreate, db: DbSession) -> Supplier:
    return create_supplier(db, **payload.model_dump())


@router.get("", response_model=list[SupplierRead])
def get_suppliers(
    db: DbSession,
    active: bool | None = None,
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
) -> list[Supplier]:
    statement = select(Supplier)
    if active is not None:
        statement = statement.where(Supplier.active == active)
    return list(db.scalars(statement.order_by(Supplier.name).limit(limit).offset(offset)))
