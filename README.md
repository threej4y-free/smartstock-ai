# SmartStock

[![CI](https://github.com/threej4y-free/smartstock-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/threej4y-free/smartstock-ai/actions/workflows/ci.yml)

> A portfolio case study for demand forecasting and intelligent inventory management.

SmartStock is a responsive operations dashboard designed to help retail teams understand demand, prevent stockouts, reduce excess inventory, and prioritize perishable lots using FEFO (First Expired, First Out).

The project translates probabilistic forecasts into practical inventory decisions while clearly communicating uncertainty through P10, P50, and P90 scenarios.

## Product overview

Inventory teams frequently work across disconnected spreadsheets and react only after a product is already unavailable or close to expiration. SmartStock brings the main operational signals together in one interface:

- Current inventory position and days of cover
- Demand forecasts for 7 and 28 days
- P10–P90 confidence ranges
- Purchase recommendations and reorder risk
- Batch-level expiration control with FEFO priority
- Stock movements, reservations, losses and adjustments
- Purchase orders and operational alerts

## Portfolio highlights

- Original responsive interface designed without a UI template
- Fine-line visual system with sober, accessible colors
- Searchable product and inventory-entry workflows
- Probabilistic forecast visualization using Recharts
- Clear distinction between catalog registration and stock receiving
- Responsive tables and navigation for desktop and mobile
- Type-safe React components and strict TypeScript configuration
- Honest presentation of model uncertainty and demonstration data

## Main screens

| Area | Purpose |
| --- | --- |
| Dashboard | Executive view of sales, inventory value, risk and demand |
| Products | Product catalog, search, filters and stock position |
| Forecasts | P10, P50 and P90 demand scenarios and model explanation |
| Movements | Auditable history of receipts, sales, reservations and losses |
| Lots | FEFO priority, expiration status and quantity at risk |
| Purchases | Purchase-order status and supplier deliveries |
| Alerts | Stockout, excess, expiration and confidence warnings |
| Settings | Inventory, forecasting and notification preferences |

## Technology

- React, TypeScript and Vite
- Recharts
- Lucide React
- CSS with responsive layouts and design tokens
- ESLint
- FastAPI and Pydantic
- PostgreSQL and SQLAlchemy 2
- Alembic migrations
- Pytest and Ruff

## Backend foundation

The backend in `backend/` is the source of truth for the real inventory domain. Product stock
is not stored as a duplicated total: it is derived from inventory lots.

- A receipt creates an `InventoryLot` and a positive `StockMovement` atomically
- Every lot keeps its supplier, invoice, receipt date, expiration, unit cost and location
- Available and reserved quantities are constrained at database level
- Sales allocate valid, unblocked inventory using FEFO and may span multiple lots
- Multi-product sales acquire lot locks in deterministic product order to avoid deadlocks
- Explicit zero-value sale prices are preserved for samples and promotional items
- Expired or manually blocked lots remain auditable but contribute zero sellable units
- The expiration safety margin is persisted in PostgreSQL and enforced by stock queries and FEFO
- Unique-constraint races are returned as structured `409 Conflict` responses
- Products, suppliers, lots, movements and sales are exposed under `/api/v1`

The React application uses this API as its operational source. Product balances are read from the
lot-derived fields returned by FastAPI; the browser does not maintain a second inventory total.
An isolated in-memory demo adapter remains available for portfolio previews.

### Implementation status

| Area | Status |
| --- | --- |
| Responsive frontend | Connected to the API with demo fallback |
| Product and supplier persistence | Implemented in PostgreSQL |
| Lot receipts and movement ledger | Implemented and tested |
| FEFO allocation and expired-lot blocking | Implemented and tested |
| Expiration safety policy | Persisted and enforced by the backend |
| PostgreSQL concurrency tests | Automated in GitHub Actions |
| Frontend/API integration | Products, receipts, lots, movements, sales and policy connected |
| Demand forecasting and P10/P50/P90 model | Pending |
| Replenishment and expiration-risk engine | Pending |

### API surface

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET`, `POST` | `/api/v1/products` | List and register catalog products |
| `GET` | `/api/v1/products/{product_id}` | Return a product with stock derived from lots |
| `GET`, `POST` | `/api/v1/suppliers` | List and register suppliers |
| `POST` | `/api/v1/inventory/receipts` | Receive stock and create a lot plus movement |
| `GET`, `PUT` | `/api/v1/inventory/policy` | Read or change the expiration safety margin |
| `GET` | `/api/v1/inventory/lots` | List lots in FEFO order |
| `GET` | `/api/v1/inventory/movements` | Return the auditable inventory ledger |
| `POST` | `/api/v1/sales` | Register a sale and allocate stock through FEFO |
| `GET` | `/health` | Application health check |

## Run locally

```bash
git clone https://github.com/threej4y-free/smartstock-ai.git
cd smartstock-ai
npm install
npm run dev
```

Open `http://localhost:5173`.

### Frontend data modes

Copy `.env.example` to `.env` when you need to override the defaults:

```dotenv
VITE_DATA_MODE=auto
VITE_API_URL=http://127.0.0.1:8000/api/v1
```

| Mode | Behavior |
| --- | --- |
| `api` | Requires FastAPI; connection errors are shown and never replaced with demo data |
| `demo` | Uses the isolated in-memory adapter and never contacts the API |
| `auto` | Uses FastAPI when available and activates demo mode only when initial connection fails |

In API mode, catalog registration calls `POST /products`, receipts call
`POST /inventory/receipts`, sales call `POST /sales`, and the interface reloads products, lots and
movements from the backend after every successful operation. The expiration margin is read and
updated through `/inventory/policy`.

### Run the API and PostgreSQL

With Docker installed:

```bash
docker compose up --build
```

The API is available at `http://localhost:8000`, with interactive documentation at
`http://localhost:8000/docs`. The API container applies Alembic migrations before starting.

For local Python development, start PostgreSQL first and then run:

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -e ".[test]"
alembic upgrade head
uvicorn app.main:app --reload
```

## Quality checks

```bash
npm run lint
npm run build
cd backend
ruff check .
pytest
```

All frontend and backend checks must pass before a production deployment. The backend suite
currently covers receipts, lot traceability, database constraints, FEFO allocation, expired-lot
blocking, safety margins, zero-value prices and insufficient-stock errors. GitHub Actions also
starts PostgreSQL, applies every Alembic migration and runs concurrent integration tests against
the real database engine.

## Forecasting concept

The proposed forecasting pipeline uses historical sales, price changes, calendar events, promotions, and lagged demand features. Temporal validation prevents future data from leaking into training.

Forecast results are represented as:

- **P10:** conservative demand scenario, used for expiration and excess-risk analysis
- **P50:** most likely demand scenario, used as the central planning reference
- **P90:** high-demand scenario, used for stockout-risk analysis

The forecasting chart and demo adapter use clearly identified demonstration values from
`src/data.ts`. Operational inventory data comes from the selected data source. Real forecasts
still require a trained model, historical data and persisted prediction endpoints.

## Inventory logic

SmartStock is designed around batch-level inventory rather than a single product quantity. Expired inventory is never considered sellable, and FEFO prioritizes the valid batch with the nearest expiration date.

Purchase recommendations are expected to consider inventory position, incoming orders, reservations, supplier lead time, safety stock, minimum order quantity, package size, and expiration risk.

## Administration and access control

The current version can run against the local API or as **SmartStock Demo**. It intentionally does not present a fictional authenticated user.

Authentication, user management, role-based permissions, multi-company tenancy, and a separate administrative panel are outside the current frontend scope. They should be introduced only when the backend supports secure sessions, audit logs, companies, stores, teams, and access-control policies.

## Current limitations

- Settings other than the expiration safety margin persist only during the active browser session
- Integrations and purchase actions are interface demonstrations
- Forecast values do not come from a trained production model
- Reservation, release, adjustment and loss commands are not exposed through the API yet
- Authentication and multi-company access are not implemented

## Next steps

1. Add reservation, release, adjustment and loss commands with the same transactional guarantees
2. Add frontend component and end-to-end tests to the existing CI workflow
3. Add the M5 data ingestion and temporal-validation pipeline
4. Train baselines and a validated P10/P50/P90 forecasting model
5. Build replenishment, excess and expiration recommendations from persisted data
6. Introduce authentication, authorization and multi-company administration when required

## Disclaimer

This repository is a portfolio project. Demonstration values must not be used for real purchasing or inventory decisions without validated production data and model monitoring.
