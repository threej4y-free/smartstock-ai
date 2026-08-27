from datetime import date


def create_product(client):
    response = client.post(
        "/api/v1/products",
        json={
            "sku": "CAF-500-01",
            "name": "Café Especial 500g",
            "category": "Mercearia",
            "unit_cost": "24.90",
            "list_price": "39.90",
            "pack_size": 12,
            "minimum_order": 24,
        },
    )
    assert response.status_code == 201
    return response.json()


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_receipt_endpoint_persists_all_form_fields(client):
    product = create_product(client)
    response = client.post(
        "/api/v1/inventory/receipts",
        json={
            "product_id": product["id"],
            "batch_number": "LT-2608-030",
            "quantity": 48,
            "received_at": str(date.today()),
            "expires_at": "2030-09-18",
            "supplier_name": "Casa do Grão",
            "invoice_number": "NF-18452",
            "unit_cost": "23.70",
            "location": "B-01-02",
            "actor": "Marina Costa",
        },
    )

    assert response.status_code == 201
    lot = response.json()
    assert lot["batch_number"] == "LT-2608-030"
    assert lot["quantity_received"] == 48
    assert lot["quantity_available"] == 48
    assert lot["quantity_reserved"] == 0
    assert lot["invoice_number"] == "NF-18452"
    assert lot["unit_cost"] == "23.70"
    assert lot["location"] == "B-01-02"
    assert lot["status"] == "healthy"

    movements = client.get("/api/v1/inventory/movements").json()
    assert len(movements) == 1
    assert movements[0]["lot_id"] == lot["id"]
    assert movements[0]["movement_type"] == "receipt"
    assert movements[0]["quantity"] == 48

    refreshed_product = client.get(f"/api/v1/products/{product['id']}").json()
    assert refreshed_product["available_stock"] == 48
    assert refreshed_product["physical_stock"] == 48


def test_sale_endpoint_returns_structured_insufficient_stock_error(client):
    product = create_product(client)
    response = client.post(
        "/api/v1/sales",
        json={
            "reference": "SALE-EMPTY",
            "items": [{"product_id": product["id"], "quantity": 1}],
        },
    )

    assert response.status_code == 409
    assert response.json()["error"]["code"] == "insufficient_stock"


def test_integrity_error_is_returned_as_structured_conflict(client):
    first = client.post("/api/v1/suppliers", json={"name": "Supplier One", "tax_id": "123"})
    duplicate_tax_id = client.post(
        "/api/v1/suppliers", json={"name": "Supplier Two", "tax_id": "123"}
    )

    assert first.status_code == 201
    assert duplicate_tax_id.status_code == 409
    assert duplicate_tax_id.json()["error"] == {
        "code": "integrity_conflict",
        "message": "A resource with the same unique key already exists",
    }


def test_inventory_policy_is_configurable(client):
    initial = client.get("/api/v1/inventory/policy")
    updated = client.put("/api/v1/inventory/policy", json={"expiration_safety_days": 5})
    current = client.get("/api/v1/inventory/policy")

    assert initial.status_code == 200
    assert initial.json()["expiration_safety_days"] == 2
    assert updated.status_code == 200
    assert updated.json()["expiration_safety_days"] == 5
    assert current.json()["expiration_safety_days"] == 5
