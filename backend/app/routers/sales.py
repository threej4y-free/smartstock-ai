from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Sale
from app.schemas import SaleCreate, SaleRead
from app.services.inventory import create_sale

router = APIRouter(prefix="/sales", tags=["sales"])
DbSession = Annotated[Session, Depends(get_db)]


@router.post("", response_model=SaleRead, status_code=status.HTTP_201_CREATED)
def post_sale(payload: SaleCreate, db: DbSession) -> Sale:
    return create_sale(db, payload)
