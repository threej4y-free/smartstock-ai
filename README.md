# SmartStock

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
- Expired or manually blocked lots remain auditable but contribute zero sellable units
- Products, suppliers, lots, movements and sales are exposed under `/api/v1`

The frontend still uses demonstration data while the API integration is developed. It must not
write a second inventory balance when that integration is added.

### API surface

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET`, `POST` | `/api/v1/products` | List and register catalog products |
| `GET` | `/api/v1/products/{product_id}` | Return a product with stock derived from lots |
| `GET`, `POST` | `/api/v1/suppliers` | List and register suppliers |
| `POST` | `/api/v1/inventory/receipts` | Receive stock and create a lot plus movement |
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
blocking and insufficient-stock errors.

## Forecasting concept

The proposed forecasting pipeline uses historical sales, price changes, calendar events, promotions, and lagged demand features. Temporal validation prevents future data from leaking into training.

Forecast results are represented as:

- **P10:** conservative demand scenario, used for expiration and excess-risk analysis
- **P50:** most likely demand scenario, used as the central planning reference
- **P90:** high-demand scenario, used for stockout-risk analysis

The current frontend uses demonstration data from `src/data.ts`. It does not claim real model accuracy or production performance. Real forecasts require a trained model, historical data, and the backend API.

## Inventory logic

SmartStock is designed around batch-level inventory rather than a single product quantity. Expired inventory is never considered sellable, and FEFO prioritizes the valid batch with the nearest expiration date.

Purchase recommendations are expected to consider inventory position, incoming orders, reservations, supplier lead time, safety stock, minimum order quantity, package size, and expiration risk.

## Administration and access control

The current version runs as **SmartStock Demo** in an **Ambiente local**. It intentionally does not present a fictional authenticated user.

Authentication, user management, role-based permissions, multi-company tenancy, and a separate administrative panel are outside the current frontend scope. They should be introduced only when the backend supports secure sessions, audit logs, companies, stores, teams, and access-control policies.

## Current limitations

- The frontend still reads demonstration data instead of the API
- Settings persist only during the active browser session
- Integrations and purchase actions are interface demonstrations
- Forecast values do not come from a trained production model
- Reservation, release, adjustment and loss commands are not exposed through the API yet
- PostgreSQL integration tests and continuous integration are not configured yet
- Authentication and multi-company access are not implemented

## Next steps

1. Connect the React interface to the API and remove duplicated inventory state from the frontend
2. Add reservation, release, adjustment and loss commands with the same transactional guarantees
3. Add PostgreSQL integration tests, frontend tests and GitHub Actions
4. Add the M5 data ingestion and temporal-validation pipeline
5. Train baselines and a validated P10/P50/P90 forecasting model
6. Build replenishment, excess and expiration recommendations from persisted data
7. Introduce authentication, authorization and multi-company administration when required

## Disclaimer

This repository is a portfolio project. Demonstration values must not be used for real purchasing or inventory decisions without validated production data and model monitoring.
