from collections.abc import Callable, Generator

from sqlalchemy import create_engine
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import get_settings
from app.errors import IntegrityConflictError


class Base(DeclarativeBase):
    pass


settings = get_settings()
engine = create_engine(settings.database_url, echo=settings.sql_echo, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False, class_=Session)


def transactional_session(
    session_factory: Callable[[], Session],
) -> Generator[Session, None, None]:
    db = session_factory()
    try:
        yield db
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        constraint_name = getattr(getattr(exc.orig, "diag", None), "constraint_name", None)
        messages = {
            "products_sku_key": "SKU already exists",
            "suppliers_name_key": "Supplier already exists",
            "suppliers_tax_id_key": "Supplier tax ID already exists",
            "uq_lots_product_batch": "Batch number already exists for this product",
            "ix_sales_reference": "Sale reference already exists",
        }
        raise IntegrityConflictError(
            messages.get(constraint_name, "A resource with the same unique key already exists")
        ) from exc
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def get_db() -> Generator[Session, None, None]:
    yield from transactional_session(SessionLocal)
