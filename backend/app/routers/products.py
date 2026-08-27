import uuid
from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.errors import NotFoundError
from app.models import Product
from app.schemas import ProductCreate, ProductRead
from app.services.inventory import create_product, product_stock_summary

router = APIRouter(prefix="/products", tags=["products"])
DbSession = Annotated[Session, Depends(get_db)]


def _read_product(session: Session, product: Product, on_date: date | None = None) -> ProductRead:
    return ProductRead.model_validate(
        {**product.__dict__, **product_stock_summary(session, product.id, on_date=on_date)}
    )


@router.post("", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
def post_product(payload: ProductCreate, db: DbSession) -> ProductRead:
    product = create_product(db, **payload.model_dump())
    return _read_product(db, product)


@router.get("", response_model=list[ProductRead])
def get_products(
    db: DbSession,
    query: str | None = Query(default=None, max_length=200),
    active: bool | None = None,
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
) -> list[ProductRead]:
    statement = select(Product)
    if query:
        term = f"%{query.strip().lower()}%"
        statement = statement.where(
            or_(func.lower(Product.name).like(term), func.lower(Product.sku).like(term))
        )
    if active is not None:
        statement = statement.where(Product.active == active)
    products = db.scalars(statement.order_by(Product.name).limit(limit).offset(offset)).all()
    return [_read_product(db, product) for product in products]


@router.get("/{product_id}", response_model=ProductRead)
def get_product(product_id: uuid.UUID, db: DbSession) -> ProductRead:
    product = db.get(Product, product_id)
    if not product:
        raise NotFoundError("Product not found")
    return _read_product(db, product)
