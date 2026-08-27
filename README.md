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

- React
- TypeScript
- Vite
- Recharts
- Lucide React
- CSS with responsive layouts and design tokens
- ESLint

## Run locally

```bash
git clone https://github.com/threej4y-free/smartstock-ai.git
cd smartstock-ai
npm install
npm run dev
```

Open `http://localhost:5173`.

## Quality checks

```bash
npm run lint
npm run build
```

Both commands must pass before a production deployment.

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

- Demonstration data is stored in the frontend
- Settings persist only during the active browser session
- Integrations and purchase actions are interface demonstrations
- Forecast values do not come from a trained production model
- Authentication and multi-company access are not implemented

## Next steps

1. Connect the interface to a FastAPI backend and PostgreSQL database
2. Add the M5 data ingestion and validation pipeline
3. Train and compare baseline and gradient-boosting models
4. Persist products, batches, movements and settings
5. Add automated component and end-to-end tests
6. Introduce authentication and administration when required

## Disclaimer

This repository is a portfolio project. Demonstration values must not be used for real purchasing or inventory decisions without validated production data and model monitoring.
