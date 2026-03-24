# Home Budget App — Development Plan
**Version 1.0 — March 2026**
Backend: Rust + Axum | Frontend: React + Vite | Database: PostgreSQL

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Recommended Tech Stack](#2-recommended-tech-stack)
3. [Data Model](#3-data-model)
4. [REST API Design](#4-rest-api-design)
5. [Axum Backend Structure](#5-axum-backend-structure)
6. [Frontend — Pages & Components](#6-frontend--pages--components)
7. [Docker & Deployment](#7-docker--deployment)
8. [Build Phases](#8-build-phases)
9. [Future Considerations](#9-future-considerations-post-v1)
10. [Open Questions](#10-open-questions--decisions-left-to-implementer)
- [Appendix: Quick-Start Checklist](#appendix-quick-start-checklist)

---

## 1. Project Overview

This document defines the full specification and phased build plan for a personal home budgeting web application. It is intended as a direct handoff reference for a developer or coding agent.

### 1.1 Goals

- Track income and expenses across multiple account types (checking, savings, credit card)
- Categorise every transaction with a name/label and a category
- Support transfers between owned accounts
- Provide visual reporting: spending by category, monthly summaries, and account balance overviews
- Run as a responsive web app accessible on phone, tablet, and desktop
- Single-user for v1; architecture designed so multi-user auth can be added later without redesign

### 1.2 Non-Goals (v1)

- Bank synchronisation / CSV import
- Multi-user authentication and role-based access
- Native mobile app (PWA shell is acceptable)
- Recurring transaction automation

---

## 2. Recommended Tech Stack

Rust + Axum gives the best performance-per-watt profile for a Raspberry Pi, near-zero memory overhead at idle, and compile-time safety guarantees that eliminate entire classes of runtime bugs. The tradeoff is a steeper initial setup compared to scripting-language backends.

| Layer | Technology | Rationale |
|---|---|---|
| Backend framework | Rust + Axum | Async, type-safe, extremely low memory — ideal for Raspberry Pi |
| Database driver | sqlx | Async Postgres driver with compile-time checked queries; no heavy ORM needed |
| DB migrations | sqlx migrate | Built into sqlx CLI; SQL-first, version-controlled migration files |
| Serialisation | serde + serde_json | Standard Rust JSON serialisation; zero-cost deserialisation |
| Validation | validator crate | Struct-level input validation with derive macros |
| Frontend | React + Vite | Fast build, excellent mobile support, large ecosystem |
| UI / Styling | shadcn/ui + Tailwind CSS | Accessible, responsive, no heavy dependencies |
| Charts | Recharts | React-native, lightweight, good mobile rendering |
| Database | PostgreSQL 16 | Relational, suits financial data, excellent Docker support |
| Containerisation | Docker + Docker Compose | Single-command startup; portable to any host |
| Auth (future) | axum-login or JWT (jsonwebtoken crate) | Can be layered on without re-architecting |

### 2.1 Key Rust Crates (Cargo.toml)

```toml
[dependencies]
axum = { version = "0.7", features = ["macros"] }
tokio = { version = "1", features = ["full"] }
sqlx = { version = "0.7", features = ["runtime-tokio-rustls", "postgres", "uuid", "chrono", "decimal"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
uuid = { version = "1", features = ["serde", "v4"] }
chrono = { version = "0.4", features = ["serde"] }
rust_decimal = { version = "1", features = ["serde-with-float"] }
validator = { version = "0.18", features = ["derive"] }
tower-http = { version = "0.5", features = ["cors", "trace"] }
thiserror = "1"
anyhow = "1"
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }
dotenvy = "0.15"
```

### 2.2 Repository Structure

```
budget-app/
  ├── backend/                  # Rust + Axum API
  │   ├── migrations/           # sqlx SQL migration files
  │   ├── src/
  │   │   ├── main.rs           # App entry, router setup, DB pool init
  │   │   ├── db.rs             # DB pool type alias, connection helper
  │   │   ├── error.rs          # AppError type, IntoResponse impl
  │   │   ├── models/           # Serde structs: Account, Transaction, Category
  │   │   ├── handlers/         # Axum handler fns (one file per resource)
  │   │   └── queries/          # sqlx query functions (one file per resource)
  │   ├── Cargo.toml
  │   └── Dockerfile
  ├── frontend/                 # React + Vite app
  │   ├── src/
  │   │   ├── components/
  │   │   ├── pages/
  │   │   └── api/              # fetch wrapper functions
  │   └── Dockerfile
  ├── docker-compose.yml
  └── .env.example
```

---

## 3. Data Model

All data lives in PostgreSQL. Schema is managed via sqlx migration files (plain SQL). Balances are never stored — they are always computed at query time from transaction history (see section 3.4 for the rationale behind this decision).

### 3.1 accounts table

```sql
CREATE TABLE accounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  account_type    TEXT NOT NULL CHECK (account_type IN ('CHECKING', 'SAVINGS', 'CREDIT_CARD')),
  currency        TEXT NOT NULL DEFAULT 'USD',
  initial_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 3.2 categories table

```sql
CREATE TABLE categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE,
  icon       TEXT,
  color      TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false
);
```

**Default categories to seed in a migration:**
Housing, Groceries, Dining Out, Transport, Entertainment, Healthcare, Utilities, Shopping, Personal Care, Education, Savings, Income, Transfer, Other.

### 3.3 transactions table

```sql
CREATE TABLE transactions (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id             UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  category_id            UUID REFERENCES categories(id) ON DELETE SET NULL,
  transaction_type       TEXT NOT NULL CHECK (transaction_type IN ('INCOME', 'EXPENSE', 'TRANSFER')),
  amount                 NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  label                  TEXT NOT NULL,
  notes                  TEXT,
  date                   TIMESTAMPTZ NOT NULL,
  transfer_to_account_id UUID REFERENCES accounts(id) ON DELETE RESTRICT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_transactions_account_id  ON transactions(account_id);
CREATE INDEX idx_transactions_date        ON transactions(date DESC);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);
```

**Transfer logic:** A transfer is a single row with `transaction_type = 'TRANSFER'`, `account_id` = source account, and `transfer_to_account_id` = destination account. The backend subtracts the amount from the source balance and adds it to the destination balance when computing balances. No mirror row is needed.

### 3.4 Balance Strategy

Three approaches were considered. The decision and rationale are documented here so future maintainers understand why the simpler approach was chosen.

#### Option A — Always recompute ✅ Chosen

Aggregate over all transactions for the account on every balance request. No derived data stored.

- ✅ Simple — edits and deletes require no additional updates
- ✅ Always correct by definition
- ✅ Sufficient for this data volume: 10 years of weekly transactions is ~5,000 rows; Postgres aggregates this in under a millisecond with the indexes in place
- ❌ Query time grows linearly with transaction history (not a practical concern for a single-user personal app)

#### Option B — Monthly balance snapshots

Store the computed balance at the end of each month. Current balance = latest snapshot + aggregate over transactions since that snapshot date.

- ✅ Bounds live calculation to at most ~31 days of transactions
- ❌ Any edit or delete to a past transaction invalidates all snapshots from that month onwards — requires cascading recalculation
- ❌ Meaningful added complexity not justified at this data volume
- 💡 Valid future optimisation if the app ever scales to many users or years of high-frequency transactions

#### Option C — Running balance per transaction

Each transaction row stores the running account balance after it is applied.

- ✅ Current balance is a single row lookup
- ❌ Inserting, editing, or deleting any transaction requires recalculating and updating every subsequent transaction for that account — a potentially large UPDATE cascade
- ❌ Prone to corruption under concurrent writes without careful locking
- ❌ Incompatible with allowing edits (banks use this pattern because they never edit ledger entries)

**Decision: use Option A for v1.** If performance ever becomes a concern, add Option B (monthly snapshots) as an optimisation at that point — it can be introduced without changing the existing query logic, only adding a cache layer on top.

#### Single-account balance query

Used by `GET /accounts/:id`:

```sql
SELECT
  a.initial_balance
  + COALESCE(SUM(CASE WHEN t.transaction_type = 'INCOME'  THEN t.amount ELSE 0 END), 0)
  - COALESCE(SUM(CASE WHEN t.transaction_type = 'EXPENSE' THEN t.amount ELSE 0 END), 0)
  - COALESCE(SUM(CASE WHEN t.transaction_type = 'TRANSFER' AND t.account_id = a.id             THEN t.amount ELSE 0 END), 0)
  + COALESCE(SUM(CASE WHEN t.transaction_type = 'TRANSFER' AND t.transfer_to_account_id = a.id THEN t.amount ELSE 0 END), 0)
  AS balance
FROM accounts a
LEFT JOIN transactions t ON t.account_id = a.id OR t.transfer_to_account_id = a.id
WHERE a.id = $1
GROUP BY a.id, a.initial_balance;
```

#### All-accounts balance query

Used by `GET /accounts` and `GET /reports/account-balances`. Computes every account balance in a **single round-trip** — avoids N queries for the dashboard overview:

```sql
SELECT
  a.id,
  a.name,
  a.account_type,
  a.currency,
  a.initial_balance
  + COALESCE(SUM(CASE WHEN t.transaction_type = 'INCOME'  THEN t.amount ELSE 0 END), 0)
  - COALESCE(SUM(CASE WHEN t.transaction_type = 'EXPENSE' THEN t.amount ELSE 0 END), 0)
  - COALESCE(SUM(CASE WHEN t.transaction_type = 'TRANSFER' AND t.account_id = a.id             THEN t.amount ELSE 0 END), 0)
  + COALESCE(SUM(CASE WHEN t.transaction_type = 'TRANSFER' AND t.transfer_to_account_id = a.id THEN t.amount ELSE 0 END), 0)
  AS balance
FROM accounts a
LEFT JOIN transactions t ON t.account_id = a.id OR t.transfer_to_account_id = a.id
GROUP BY a.id, a.name, a.account_type, a.currency, a.initial_balance;
```

The indexes on `account_id` and `date` defined in section 3.3 are sufficient to make both queries fast.

---

## 4. REST API Design

All endpoints are prefixed `/api/v1`. All request and response bodies are JSON. Errors return HTTP 4xx/5xx with body: `{ "error": "message" }`.

### 4.1 Accounts

| Method | Path | Description |
|---|---|---|
| GET | /accounts | List all accounts with computed balance |
| POST | /accounts | Create a new account |
| GET | /accounts/:id | Get single account with balance |
| PATCH | /accounts/:id | Update account name, type, or initial balance |
| DELETE | /accounts/:id | Delete account (rejected if transactions exist) |

### 4.2 Transactions

| Method | Path | Description |
|---|---|---|
| GET | /transactions | List transactions — filterable and paginated (see below) |
| POST | /transactions | Create a transaction or transfer |
| GET | /transactions/:id | Get single transaction |
| PATCH | /transactions/:id | Update a transaction |
| DELETE | /transactions/:id | Delete a transaction |

**Supported query parameters for `GET /transactions`:**

| Parameter | Description |
|---|---|
| `account_id` | Filter by account UUID |
| `category_id` | Filter by category UUID |
| `transaction_type` | `INCOME` \| `EXPENSE` \| `TRANSFER` |
| `date_from` / `date_to` | ISO 8601 date range |
| `page` / `page_size` | Pagination (default `page_size = 50`) |
| `sort_by` | `date` \| `amount` \| `label` (default: `date`) |
| `sort_order` | `asc` \| `desc` (default: `desc`) |

### 4.3 Categories

| Method | Path | Description |
|---|---|---|
| GET | /categories | List all categories (defaults + custom) |
| POST | /categories | Create a custom category |
| PATCH | /categories/:id | Update a custom category (default categories are immutable) |
| DELETE | /categories/:id | Delete a custom category (default categories are protected) |

### 4.4 Reports

| Method | Path | Description |
|---|---|---|
| GET | /reports/spending-by-category | Expense totals grouped by category for a date range |
| GET | /reports/monthly-summary | Income vs expenses per calendar month for a given year |
| GET | /reports/account-balances | Computed current balance for every account |

---

## 5. Axum Backend Structure

### 5.1 Router Setup (main.rs)

Organise routes by resource. Pass the sqlx `PgPool` as shared Axum state. Enable CORS for the frontend origin.

```rust
let pool = PgPool::connect(&database_url).await?;
sqlx::migrate!().run(&pool).await?;   // auto-run migrations on startup

let app = Router::new()
    .nest("/api/v1", api_router())
    .layer(CorsLayer::permissive())   // tighten in production
    .layer(TraceLayer::new_for_http())
    .with_state(pool);
```

### 5.2 Error Handling

Define a single `AppError` enum using `thiserror::Error` to derive `Display` and `Error` automatically. Implement `axum::response::IntoResponse` manually to control the HTTP status and JSON response body. This keeps all handler functions clean — they return `Result<Json<T>, AppError>`.

```rust
use thiserror::Error;
use axum::{response::{IntoResponse, Response}, http::StatusCode, Json};

#[derive(Debug, Error)]
pub enum AppError {
    #[error("resource not found")]
    NotFound,

    #[error("bad request: {0}")]
    BadRequest(String),

    #[error("conflict: {0}")]
    Conflict(String),

    #[error("internal error: {0}")]
    Internal(#[from] anyhow::Error),
}

impl From<sqlx::Error> for AppError {
    fn from(e: sqlx::Error) -> Self {
        match e {
            sqlx::Error::RowNotFound => AppError::NotFound,
            other => {
                tracing::error!(error = %other, "database error");
                AppError::Internal(other.into())
            }
        }
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let status = match &self {
            AppError::NotFound      => StatusCode::NOT_FOUND,
            AppError::BadRequest(_) => StatusCode::BAD_REQUEST,
            AppError::Conflict(_)   => StatusCode::CONFLICT,
            AppError::Internal(_)   => StatusCode::INTERNAL_SERVER_ERROR,
        };
        // Never leak internal error details to the client
        let message = match &self {
            AppError::Internal(_) => "an internal error occurred".to_string(),
            other => other.to_string(),
        };
        (status, Json(serde_json::json!({ "error": message }))).into_response()
    }
}
```

Note that `tracing::error!` is called inside the `sqlx::Error` conversion — this ensures the full database error appears in the server logs even though it is hidden from the API response.

### 5.3 Tracing & Logging

Initialise `tracing_subscriber` once in `main.rs`, driven by the `RUST_LOG` environment variable:

```rust
tracing_subscriber::fmt()
    .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
    .init();
```

`TraceLayer` (already on the router) automatically logs every HTTP request with method, path, status code, and latency — no per-handler boilerplate needed. For handlers that need more detail, use `#[tracing::instrument]`:

```rust
#[tracing::instrument(skip(db))]
async fn create_transaction(
    State(db): State<PgPool>,
    Json(payload): Json<CreateTransactionRequest>,
) -> Result<Json<Transaction>, AppError> {
    tracing::info!(account_id = %payload.account_id, amount = %payload.amount, "creating transaction");
    // ...
}
```

Use `RUST_LOG=debug` in local development and `RUST_LOG=info` in production.

### 5.4 Handler Pattern

Each handler receives `State(pool)`, optional `Path` params, optional `Query` params, and optional `Json` body. Example shape:

```rust
async fn create_transaction(
    State(pool): State<PgPool>,
    Json(payload): Json<CreateTransactionRequest>,
) -> Result<Json<Transaction>, AppError> {
    payload.validate()?;
    let tx = queries::transactions::create(&pool, payload).await?;
    Ok(Json(tx))
}
```

---

## 6. Frontend — Pages & Components

### 6.1 Pages

| Route | Page | Description |
|---|---|---|
| / | Dashboard | Balance overview + recent transactions + mini charts |
| /accounts | Accounts | List accounts with balances; create / edit / delete |
| /transactions | Transactions | Filterable, sortable, paginated transaction list |
| /transactions/new | Add Transaction | Form: income, expense, or transfer |
| /transactions/:id/edit | Edit Transaction | Pre-filled edit form |
| /reports | Reports | Spending pie chart + monthly bar chart |
| /categories | Categories | Manage default and custom categories |
| /settings | Settings | Placeholder for future auth config |

### 6.2 Key Components

- **AccountCard** — name, type badge, computed balance; links to filtered transaction view
- **TransactionRow** — date, label, category badge, amount colour-coded by type (green / red / grey)
- **TransactionForm** — shared create/edit form; shows transfer destination field when type = Transfer
- **CategoryPicker** — searchable dropdown with colour swatch; shows defaults and custom entries
- **SpendingPieChart** — Recharts pie; click a slice to drill into filtered transaction list
- **MonthlySummaryChart** — Recharts grouped bar chart; income vs expenses by month
- **FilterBar** — date range, account, category, type; state reflected in URL query params

### 6.3 Responsive Design

- Mobile-first; single column on small screens, multi-column on tablet/desktop
- Navigation: bottom tab bar on mobile (< 768px), collapsible sidebar on desktop
- Transactions: card layout mobile, table layout tablet+
- Charts must be legible at 360px minimum width
- Tailwind breakpoints: `sm` (640px), `md` (768px), `lg` (1024px)

### 6.4 Frontend Logging

Frontend logging serves two purposes: structured debug output during development, and capturing unhandled errors in production.

**Development logger (`src/utils/logger.js`)**

A thin wrapper around the browser console that is a no-op for `info` and `warn` in production builds. Errors are always logged regardless of environment.

```js
const isDev = import.meta.env.DEV;

export const logger = {
  info:  (...args) => isDev && console.info('[INFO]',  ...args),
  warn:  (...args) => isDev && console.warn('[WARN]',  ...args),
  error: (...args) =>          console.error('[ERROR]', ...args),
};
```

Use `logger` throughout the app instead of `console.log`:

```js
import { logger } from '@/utils/logger';

logger.info('Fetching transactions', { accountId, page });
logger.error('Failed to delete transaction', error);
```

**Production error reporting (`src/utils/errorReporting.js`)**

A global handler that catches unhandled promise rejections and forwards them to the backend, which logs them via `tracing`. No database table is needed — the backend handler simply logs the payload and returns `204`.

```js
export function initErrorReporting() {
  window.addEventListener('unhandledrejection', (event) => {
    fetch('/api/v1/client-errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: event.reason?.message ?? String(event.reason),
        stack:   event.reason?.stack,
        url:     window.location.href,
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {}); // never let error reporting itself throw
  });
}
```

Call `initErrorReporting()` once in `src/main.jsx` before mounting the React app. Add `POST /api/v1/client-errors` to the backend — it requires no auth and no DB write, just a `tracing::warn!` call and a `204` response.

---

## 7. Docker & Deployment

### 7.1 Rust Dockerfile (multi-stage build)

Use a two-stage Dockerfile: build stage using `rust:1.77-slim`, runtime stage using `debian:bookworm-slim`. Final image is ~30–50 MB.

```dockerfile
# Stage 1 — build
FROM rust:1.77-slim AS builder
WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY src ./src
COPY migrations ./migrations
RUN cargo build --release

# Stage 2 — runtime
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y libssl3 ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/target/release/backend /usr/local/bin/backend
COPY --from=builder /app/migrations /migrations
CMD ["backend"]
```

> **Note:** First build will be slow (10–20 min on a Raspberry Pi). Subsequent builds use Docker layer cache on dependencies. Consider cross-compiling on a faster machine targeting `aarch64-unknown-linux-gnu` if you plan to iterate frequently.

### 7.2 docker-compose.yml Services

| Service | Image / Build | Notes |
|---|---|---|
| db | postgres:16-alpine | Named volume for data persistence; internal network only |
| backend | Custom Rust Dockerfile | Runs on port 3001; depends_on db; runs migrations on startup |
| frontend | nginx (built React) | Serves static build on port 80; proxies /api to backend |

### 7.3 Environment Variables (.env)

```bash
DATABASE_URL=postgresql://budget:secret@db:5432/budget
BIND_ADDR=0.0.0.0:3001
RUST_LOG=info
CORS_ORIGIN=http://localhost   # tighten in production
# (future) JWT_SECRET=...
```

### 7.4 Raspberry Pi Notes

- Use `postgres:16-alpine` to minimise memory usage
- The Rust binary is compiled ahead of time — no interpreter at runtime, very low idle RAM
- Cross-compile on a faster machine targeting `aarch64-unknown-linux-gnu` to avoid slow on-device builds
- Alternatively, use Docker Buildx with `--platform linux/arm64` for cross-compilation in CI
- Expose only port 80 externally; backend stays on the internal Docker network

### 7.5 Cloud Migration Path

- Replace `db` service with a managed Postgres (Supabase, Railway, AWS RDS, Neon)
- Deploy backend container to any OCI-compatible host (Fly.io, Render, AWS ECS)
- Deploy frontend build to a CDN (Vercel, Cloudflare Pages)
- Update `DATABASE_URL` and `CORS_ORIGIN` — no code changes required

---

## 8. Build Phases

### Phase 1 — Foundation (Week 1–2)

- Scaffold monorepo, Docker Compose, `.env.example`
- Write initial sqlx migration: `accounts`, `categories`, `transactions` tables
- Seed migration for default categories
- Implement `AppError` type and `IntoResponse`
- Implement all Account handlers + queries (CRUD + computed balance)
- Implement all Category handlers + queries (CRUD; protect defaults)
- Build Accounts page in React (list, create, edit, delete)
- Build Categories page (list, create, edit; cannot delete/edit defaults)
- Basic responsive shell: navigation layout, routing

### Phase 2 — Transactions (Week 3–4)

- Implement Transaction handlers + queries (CRUD, filtering, pagination, sorting)
- Implement transfer creation logic and balance computation for transfers
- Build Transactions page with FilterBar
- Build Add Transaction form (income, expense, transfer modes)
- Build Edit Transaction page
- Dashboard page: BalanceOverviewWidget + recent 10 transactions

### Phase 3 — Reporting (Week 5)

- Implement `/reports/spending-by-category` SQL aggregation handler
- Implement `/reports/monthly-summary` SQL aggregation handler
- Implement `/reports/account-balances` handler
- Build Reports page: SpendingPieChart (Recharts)
- Build MonthlySummaryChart (Recharts grouped bar)
- Wire dashboard mini-charts to account-balances endpoint

### Phase 4 — Polish & Hardening (Week 6)

- Input validation on all payloads using the `validator` crate
- Consistent error responses from `AppError` for all failure modes
- Loading states, empty states, and skeleton screens throughout the UI
- Confirmation dialogs for all destructive actions
- README: prerequisites, `docker compose up` quick-start, first-run instructions
- End-to-end smoke test: create account, add transactions, view reports

---

## 9. Future Considerations (Post-v1)

### 9.1 Multi-User Auth

- Add a `users` table and `user_id` UUID foreign key to `accounts` and `categories`
- Add `POST /auth/register` and `POST /auth/login` endpoints returning a JWT
- Add an Axum middleware layer that extracts and validates the JWT from the `Authorization` header
- All queries already scoped by `account_id` — adding `user_id` scoping is a SQL filter addition
- No architectural redesign required

### 9.2 Other Future Features

- CSV import for bulk transaction entry
- **Monthly balance snapshots** — if transaction history grows large, add a `account_month_snapshots` table storing the computed balance at the end of each month; the balance query then only needs to aggregate transactions since the latest snapshot (see section 3.4)
- Recurring transactions via a background tokio task or cron
- Budget limits per category with over-budget visual indicators
- Dark mode toggle
- PWA manifest for add-to-home-screen on mobile

---

## 10. Open Questions & Decisions Left to Implementer

- **Timezone handling:** store all timestamps as `TIMESTAMPTZ` (UTC) in Postgres; display in browser local time via JS — confirm with user if a fixed timezone is preferred
- **Currency:** v1 stores a currency code per account but performs no conversion — confirm if multi-currency reporting is needed
- **Decimal precision:** `NUMERIC(12,2)` supports up to 10 digits before the decimal; adjust if larger amounts are needed
- **Hard delete vs soft delete:** hard delete recommended for v1 simplicity
- **Test approach:** consider sqlx test transactions for DB layer tests; `axum::test` for handler integration tests
- **Cross-compilation toolchain:** decide whether to build on-device (slow) or cross-compile for ARM (faster CI, more setup)

---

## Appendix: Quick-Start Checklist

1. Clone repository and run: `cp .env.example .env`
2. Edit `.env`: set `DATABASE_URL`, `RUST_LOG=info`, `CORS_ORIGIN`
3. Run: `docker compose up --build` *(first build will be slow for Rust)*
4. Backend runs sqlx migrations automatically on startup
5. Seed script for default categories runs as part of the initial migration
6. Frontend available at `http://localhost` (port 80)
7. API available at `http://localhost/api/v1` (proxied by nginx)
8. Verify: `GET http://localhost/api/v1/accounts` should return an empty array `[]`
9. Install sqlx-cli locally for writing new migrations: `cargo install sqlx-cli`
10. Create a new migration: `sqlx migrate add <name>`
