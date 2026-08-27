import os
import threading
from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, date, datetime, timedelta
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import Session, sessionmaker

from app.database import Base, get_db, transactional_session
from app.errors import InsufficientStockError
from app.main import create_app
from app.models import InventoryLot, InventoryPolicy
from app.schemas import SaleCreate, SaleLineCreate, StockReceiptCreate
from app.services.inventory import create_product, create_sale, create_supplier, receive_stock

DATABASE_URL = os.getenv("SMARTSTOCK_TEST_DATABASE_URL")
pytestmark = [
    pytest.mark.postgres,
    pytest.mark.skipif(not DATABASE_URL, reason="SMARTSTOCK_TEST_DATABASE_URL is not set"),
]


@pytest.fixture(scope="module")
def pg_session_factory():
    assert DATABASE_URL is not None
    url = make_url(DATABASE_URL)
    if "test" not in (url.database or "").lower():
        pytest.fail("PostgreSQL integration tests require a database name containing 'test'")
    engine = create_engine(url, pool_pre_ping=True)
    if engine.dialect.name != "postgresql":
        pytest.fail("SMARTSTOCK_TEST_DATABASE_URL must use PostgreSQL")
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, expire_on_commit=False, class_=Session)
    yield factory
    Base.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture(autouse=True)
def clean_database(pg_session_factory):
    with pg_session_factory() as session:
        for table in reversed(Base.metadata.sorted_tables):
            session.execute(table.delete())
        session.add(InventoryPolicy(id=1, expiration_safety_days=2))
        session.commit()


@pytest.fixture
def pg_client(pg_session_factory):
    application = create_app()

    def test_db():
        yield from transactional_session(pg_session_factory)

    application.dependency_overrides[get_db] = test_db
    with TestClient(application) as client:
        yield client


def seed_product(session: Session, sku: str, quantity: int = 10):
    item = create_product(
        session,
        sku=sku,
        name=f"Product {sku}",
        category="Integration",
        unit_cost=Decimal("5.00"),
        list_price=Decimal("10.00"),
        pack_size=1,
        minimum_order=0,
        active=True,
    )
    vendor = create_supplier(session, name=f"Supplier {sku}")
    receive_stock(
        session,
        StockReceiptCreate(
            product_id=item.id,
            supplier_id=vendor.id,
            batch_number=f"LOT-{sku}",
            quantity=quantity,
            received_at=date.today(),
            expires_at=date.today() + timedelta(days=30),
            unit_cost=Decimal("5.00"),
        ),
    )
    return item


def test_concurrent_multi_product_sales_do_not_deadlock(pg_session_factory):
    with pg_session_factory() as session:
        first = seed_product(session, "A", quantity=4)
        second = seed_product(session, "B", quantity=4)
        session.commit()
        product_ids = [first.id, second.id]

    barrier = threading.Barrier(2)

    def sell(reference: str, ids):
        with pg_session_factory() as session:
            session.execute(text("SET LOCAL lock_timeout = '5s'"))
            barrier.wait(timeout=5)
            sale = create_sale(
                session,
                SaleCreate(
                    reference=reference,
                    sold_at=datetime.now(UTC),
                    items=[SaleLineCreate(product_id=item_id, quantity=1) for item_id in ids],
                ),
            )
            session.commit()
            return sale.id

    with ThreadPoolExecutor(max_workers=2) as executor:
        futures = [
            executor.submit(sell, "SALE-AB", product_ids),
            executor.submit(sell, "SALE-BA", list(reversed(product_ids))),
        ]
        results = [future.result(timeout=10) for future in futures]

    assert len(results) == 2
    with pg_session_factory() as session:
        lots = session.query(InventoryLot).order_by(InventoryLot.product_id).all()
        assert [lot.quantity_available for lot in lots] == [2, 2]


def test_concurrent_sales_cannot_oversell(pg_session_factory):
    with pg_session_factory() as session:
        item = seed_product(session, "ONLY-ONE", quantity=1)
        session.commit()
        product_id = item.id

    barrier = threading.Barrier(2)

    def sell(reference: str):
        with pg_session_factory() as session:
            session.execute(text("SET LOCAL lock_timeout = '5s'"))
            barrier.wait(timeout=5)
            try:
                create_sale(
                    session,
                    SaleCreate(
                        reference=reference,
                        sold_at=datetime.now(UTC),
                        items=[SaleLineCreate(product_id=product_id, quantity=1)],
                    ),
                )
                session.commit()
                return "completed"
            except InsufficientStockError:
                session.rollback()
                return "insufficient"

    with ThreadPoolExecutor(max_workers=2) as executor:
        results = [
            future.result(timeout=10)
            for future in [
                executor.submit(sell, "SALE-ONE"),
                executor.submit(sell, "SALE-TWO"),
            ]
        ]

    assert sorted(results) == ["completed", "insufficient"]
    with pg_session_factory() as session:
        lot = session.query(InventoryLot).one()
        assert lot.quantity_available == 0


def test_postgres_integrity_error_returns_structured_409(pg_client):
    first = pg_client.post("/api/v1/suppliers", json={"name": "One", "tax_id": "same-tax-id"})
    duplicate = pg_client.post("/api/v1/suppliers", json={"name": "Two", "tax_id": "same-tax-id"})

    assert first.status_code == 201
    assert duplicate.status_code == 409
    assert duplicate.json()["error"] == {
        "code": "integrity_conflict",
        "message": "Supplier tax ID already exists",
    }
