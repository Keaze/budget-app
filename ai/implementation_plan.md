# Home Budget App — Implementation Plan
**Version 1.0 — March 2026**
Backend: Rust + Axum | Frontend: React + Vite | Database: PostgreSQL

> This document is the step-by-step implementation order for the Home Budget App. It is a companion to the Development Plan (`budget_app_dev_plan.md`), which contains the full data model, API spec, and architecture decisions. Each step below is a discrete, testable unit of work. Complete them in order — later steps depend on earlier ones.

---

## Table of Contents

1. [Step 1 — Project Scaffold](#step-1--project-scaffold)
2. [Step 2 — Database & Migrations](#step-2--database--migrations)
3. [Step 3 — Backend Skeleton](#step-3--backend-skeleton)
4. [Step 4 — Categories API](#step-4--categories-api)
5. [Step 5 — Accounts API](#step-5--accounts-api)
6. [Step 6 — Transactions API (Basic)](#step-6--transactions-api-basic)
7. [Step 7 — Transactions API (Filtering & Pagination)](#step-7--transactions-api-filtering--pagination)
8. [Step 8 — Transfers](#step-8--transfers)
9. [Step 9 — Reports API](#step-9--reports-api)
10. [Step 10 — Frontend Scaffold](#step-10--frontend-scaffold)
11. [Step 11 — App Shell & Navigation](#step-11--app-shell--navigation)
12. [Step 12 — Categories Page](#step-12--categories-page)
13. [Step 13 — Accounts Page](#step-13--accounts-page)
14. [Step 14 — Add & Edit Transaction](#step-14--add--edit-transaction)
15. [Step 15 — Transactions Page](#step-15--transactions-page)
16. [Step 16 — Dashboard](#step-16--dashboard)
17. [Step 17 — Reports Page](#step-17--reports-page)
18. [Step 18 — Validation & Error Handling](#step-18--validation--error-handling)
19. [Step 19 — UI Polish](#step-19--ui-polish)
20. [Step 20 — Docker & Deployment](#step-20--docker--deployment)

---

## Conventions used in this document

- **Depends on:** lists steps that must be complete before starting this one
- **Done when:** a concrete, verifiable acceptance criterion — not "it works", but what specifically can be tested
- `BE` = backend task, `FE` = frontend task, `INFRA` = infrastructure/config task

---

## Step 1 — Project Scaffold

**Type:** `INFRA`
**Depends on:** nothing

### Tasks

1. Create the monorepo root directory `budget-app/`
2. Initialise the Rust backend:
   ```bash
   cd budget-app
   cargo new backend
   ```
3. Initialise the React frontend:
   ```bash
   npm create vite@latest frontend -- --template react
   ```
4. Create `docker-compose.yml` with three services: `db`, `backend`, `frontend` (stubs are fine at this stage — just enough to define the network and volumes)
5. Create `.env.example` with all required variable names and placeholder values:
   ```bash
   DATABASE_URL=postgresql://budget:secret@db:5432/budget
   BIND_ADDR=0.0.0.0:3001
   RUST_LOG=info
   CORS_ORIGIN=http://localhost
   ```
6. Create `.gitignore` at the root covering `.env`, `target/`, `node_modules/`, `dist/`
7. Create a root `README.md` with a one-paragraph description and a placeholder "Quick Start" section (fill in detail at Step 20)

### Done when
- `budget-app/` contains `backend/`, `frontend/`, `docker-compose.yml`, `.env.example`, `.gitignore`, `README.md`
- `cargo check` passes in `backend/`
- `npm install && npm run dev` starts the Vite dev server in `frontend/`

---

## Step 2 — Database & Migrations

**Type:** `INFRA` + `BE`
**Depends on:** Step 1

### Tasks

1. Add `sqlx` to `backend/Cargo.toml` with features: `runtime-tokio-rustls`, `postgres`, `uuid`, `chrono`, `decimal`, `migrate`
2. Install the sqlx CLI locally:
   ```bash
   cargo install sqlx-cli --no-default-features --features rustls,postgres
   ```
3. Create the `backend/migrations/` directory
4. Write migration `0001_create_accounts.sql`:
   - `accounts` table as defined in the dev plan (section 3.1)
5. Write migration `0002_create_categories.sql`:
   - `categories` table as defined in the dev plan (section 3.2)
6. Write migration `0003_create_transactions.sql`:
   - `transactions` table as defined in the dev plan (section 3.3)
   - All three indexes: `account_id`, `date DESC`, `category_id`
7. Write migration `0004_seed_default_categories.sql`:
   - `INSERT` all 14 default categories with `is_default = true`
   - Use `ON CONFLICT (name) DO NOTHING` so re-running is safe
8. Run all migrations against a local Postgres instance to verify they apply cleanly:
   ```bash
   sqlx migrate run --database-url "postgresql://budget:secret@localhost:5432/budget"
   ```

### Done when
- All four migration files exist in `backend/migrations/`
- `sqlx migrate run` completes with no errors
- `psql` inspection confirms all three tables exist with correct columns, constraints, and indexes
- All 14 default categories are present in the `categories` table with `is_default = true`

---

## Step 3 — Backend Skeleton

**Type:** `BE`
**Depends on:** Step 2

### Tasks

1. Add all required crates to `Cargo.toml`:
   - `axum`, `tokio` (full), `serde` (derive), `serde_json`, `uuid` (v4 + serde), `chrono` (serde), `rust_decimal` (serde-with-float), `validator` (derive), `tower-http` (cors + trace), `thiserror`, `anyhow`, `tracing`, `tracing-subscriber` (env-filter feature), `dotenvy`
2. Create `src/main.rs`:
   - Load `.env` with `dotenvy`
   - Initialise `tracing_subscriber` driven by the `RUST_LOG` env var:
     ```rust
     tracing_subscriber::fmt()
         .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
         .init();
     ```
   - Connect to Postgres and create a `PgPool`
   - Run `sqlx::migrate!()` on startup
   - Define a minimal router (a single `GET /health` returning `200 OK`)
   - Bind to `BIND_ADDR` from env
3. Create `src/error.rs` using `thiserror`:
   - Define `AppError` with `#[derive(Debug, thiserror::Error)]` and variants: `NotFound`, `BadRequest(String)`, `Conflict(String)`, `Internal(#[from] anyhow::Error)`
   - Implement `IntoResponse` for `AppError` — map each variant to the correct HTTP status and JSON body `{ "error": "..." }`. Never expose `Internal` error details to the client.
   - Implement `From<sqlx::Error>` for `AppError` — map `RowNotFound` to `NotFound`; log all other DB errors via `tracing::error!` before wrapping in `Internal`
   - See dev plan section 5.2 for the full implementation
4. Create `src/db.rs`:
   - Type alias: `pub type Db = sqlx::PgPool`
5. Create stub files: `src/models/mod.rs`, `src/handlers/mod.rs`, `src/queries/mod.rs`

### Done when
- `cargo build` compiles with no errors
- `curl http://localhost:3001/health` returns `200 OK`
- `RUST_LOG=debug cargo run` prints structured log output to stdout, including the health check request
- A deliberate bad DB URL produces a clear `tracing::error!` log on startup (not a panic)

---

## Step 4 — Categories API

**Type:** `BE`
**Depends on:** Step 3

### Why categories before accounts
Categories have no foreign key dependencies, making them the simplest resource to implement end-to-end. Getting this right establishes the handler/query pattern used by all subsequent resources.

### Tasks

1. Create `src/models/category.rs`:
   ```rust
   pub struct Category { id, name, icon, color, is_default }
   pub struct CreateCategoryRequest { name, icon?, color? }  // validated: name non-empty
   pub struct UpdateCategoryRequest { name?, icon?, color? }
   ```
2. Create `src/queries/categories.rs`:
   - `list_all(db) -> Vec<Category>`
   - `get_by_id(db, id) -> Option<Category>`
   - `create(db, req) -> Category`
   - `update(db, id, req) -> Option<Category>`
   - `delete(db, id) -> bool` — returns false if not found
3. Create `src/handlers/categories.rs` with five handlers:
   - `GET /categories` → `list_all`
   - `POST /categories` → `create` (reject if `is_default` would be set)
   - `GET /categories/:id` → `get_by_id` (404 if missing)
   - `PATCH /categories/:id` → `update` (403 if `is_default = true`)
   - `DELETE /categories/:id` → `delete` (403 if `is_default = true`)
   - Annotate all handlers with `#[tracing::instrument(skip(db))]`
4. Register routes in `main.rs` under `/api/v1/categories`

### Done when
- `GET /api/v1/categories` returns all 14 seeded default categories
- `POST /api/v1/categories` creates a custom category and returns it with a generated UUID
- `PATCH` on a default category returns `403 Forbidden`
- `DELETE` on a default category returns `403 Forbidden`
- `DELETE` on a custom category removes it; subsequent `GET` returns `404`

---

## Step 5 — Accounts API

**Type:** `BE`
**Depends on:** Step 3

### Tasks

1. Create `src/models/account.rs`:
   ```rust
   pub struct Account { id, name, account_type, currency, initial_balance, created_at, updated_at }
   pub struct AccountWithBalance { /* Account fields */ balance: Decimal }
   pub struct CreateAccountRequest { name, account_type, currency?, initial_balance? }
   pub struct UpdateAccountRequest { name?, account_type?, initial_balance? }
   ```
2. Create `src/queries/accounts.rs`:
   - `list_all_with_balances(db) -> Vec<AccountWithBalance>` — use the all-accounts balance query from dev plan section 3.4
   - `get_by_id_with_balance(db, id) -> Option<AccountWithBalance>` — use the single-account balance query
   - `create(db, req) -> Account`
   - `update(db, id, req) -> Option<Account>`
   - `delete(db, id) -> Result<(), AppError>` — return `Conflict` if transactions exist for this account
3. Create `src/handlers/accounts.rs` with five handlers:
   - `GET /accounts` → `list_all_with_balances`
   - `POST /accounts` → `create`
   - `GET /accounts/:id` → `get_by_id_with_balance` (404 if missing)
   - `PATCH /accounts/:id` → `update` (404 if missing)
   - `DELETE /accounts/:id` → `delete` (409 if transactions exist)
   - Annotate all handlers with `#[tracing::instrument(skip(db))]`
4. Register routes in `main.rs` under `/api/v1/accounts`

### Done when
- `POST /api/v1/accounts` creates a checking account with `initial_balance = 1000`
- `GET /api/v1/accounts/:id` returns the account with `balance = 1000` (no transactions yet)
- `DELETE` on an account that has transactions returns `409 Conflict`
- `DELETE` on an account with no transactions succeeds and returns `204 No Content`

---

## Step 6 — Transactions API (Basic)

**Type:** `BE`
**Depends on:** Step 5

### Tasks

1. Create `src/models/transaction.rs`:
   ```rust
   pub struct Transaction { id, account_id, category_id?, transaction_type, amount, label, notes?, date, transfer_to_account_id?, created_at }
   pub struct CreateTransactionRequest { account_id, category_id?, transaction_type, amount, label, notes?, date }
   pub struct UpdateTransactionRequest { category_id?, label?, notes?, amount?, date? }
   ```
2. Create `src/queries/transactions.rs`:
   - `get_by_id(db, id) -> Option<Transaction>`
   - `create(db, req) -> Transaction`
   - `update(db, id, req) -> Option<Transaction>`
   - `delete(db, id) -> bool`
3. Create `src/handlers/transactions.rs`:
   - `POST /transactions` → `create` (validate: amount > 0, account exists, category exists if provided)
   - `GET /transactions/:id` → `get_by_id`
   - `PATCH /transactions/:id` → `update`
   - `DELETE /transactions/:id` → `delete`
4. Register routes under `/api/v1/transactions`
5. Verify account balance updates: after creating an INCOME transaction for account A, `GET /accounts/:id` must reflect the updated balance

### Done when
- Create an INCOME transaction of $500 for an account with `initial_balance = 1000`; `GET /accounts/:id` returns `balance = 1500`
- Create an EXPENSE transaction of $200; balance returns `1300`
- `DELETE` the expense; balance returns `1500` again
- `PATCH` on a non-existent transaction returns `404`

---

## Step 7 — Transactions API (Filtering & Pagination)

**Type:** `BE`
**Depends on:** Step 6

### Tasks

1. Define a `TransactionQuery` struct for query parameters:
   ```rust
   pub struct TransactionQuery {
     account_id: Option<Uuid>,
     category_id: Option<Uuid>,
     transaction_type: Option<String>,
     date_from: Option<DateTime<Utc>>,
     date_to: Option<DateTime<Utc>>,
     page: Option<i64>,         // default 1
     page_size: Option<i64>,    // default 50
     sort_by: Option<String>,   // "date" | "amount" | "label", default "date"
     sort_order: Option<String> // "asc" | "desc", default "desc"
   }
   ```
2. Implement `list(db, query) -> (Vec<Transaction>, total_count)` in `queries/transactions.rs`:
   - Build the WHERE clause dynamically based on which filters are set
   - Use `LIMIT` / `OFFSET` for pagination
   - Validate `sort_by` against an allowlist (`date`, `amount`, `label`) before interpolating into SQL — never interpolate user input directly
3. Add `GET /transactions` handler using `TransactionQuery`
4. Return a paginated response envelope:
   ```json
   {
     "data": [...],
     "page": 1,
     "page_size": 50,
     "total": 120
   }
   ```

### Done when
- `GET /transactions?account_id=<uuid>` returns only transactions for that account
- `GET /transactions?transaction_type=EXPENSE&date_from=2026-01-01` filters correctly
- `GET /transactions?page=2&page_size=10` returns the correct slice with accurate `total`
- `GET /transactions?sort_by=amount&sort_order=asc` returns transactions sorted by amount ascending
- An invalid `sort_by` value (e.g. `sort_by=injected_sql`) returns `400 Bad Request`

---

## Step 8 — Transfers

**Type:** `BE`
**Depends on:** Step 6

### Tasks

1. Extend `CreateTransactionRequest` to include `transfer_to_account_id: Option<Uuid>`
2. Add validation in the `POST /transactions` handler:
   - If `transaction_type = TRANSFER`: `transfer_to_account_id` must be present and must differ from `account_id`
   - If `transaction_type != TRANSFER`: `transfer_to_account_id` must be absent
3. Verify balance computation handles transfers correctly in both the single-account and all-accounts queries (the SQL for this is already defined in dev plan section 3.4 — ensure the queries in Step 5 use it)
4. Add a dedicated test: create a transfer of $300 from account A (`initial_balance = 1000`) to account B (`initial_balance = 500`):
   - Account A balance should be `700`
   - Account B balance should be `800`
   - Deleting the transfer should restore both balances

### Done when
- Transfer creation returns `201` with the transaction record including `transfer_to_account_id`
- Both account balances reflect the transfer correctly
- Attempting a transfer with `account_id == transfer_to_account_id` returns `400 Bad Request`
- Attempting a transfer without `transfer_to_account_id` returns `400 Bad Request`

---

## Step 9 — Reports API

**Type:** `BE`
**Depends on:** Step 7, Step 8

### Tasks

1. Create `src/handlers/reports.rs` and `src/queries/reports.rs`
2. Implement `GET /reports/account-balances`:
   - Reuse the all-accounts balance query from `queries/accounts.rs`
   - Returns an array of `{ id, name, account_type, currency, balance }`
3. Implement `GET /reports/spending-by-category`:
   - Query params: `date_from`, `date_to` (both required)
   - SQL: sum of EXPENSE amounts grouped by `category_id`, joined to category name and color
   - Only include categories with at least one expense in the range
   - Returns: `[{ category_id, category_name, color, total }]`
4. Implement `GET /reports/monthly-summary`:
   - Query param: `year` (required, integer)
   - SQL: for each month in the year, sum INCOME and EXPENSE amounts separately
   - Returns: `[{ month: 1..12, income: Decimal, expenses: Decimal }]` — include all 12 months even if zero
5. Register all three routes under `/api/v1/reports`

### Done when
- `GET /reports/account-balances` returns all accounts with correct balances
- `GET /reports/spending-by-category?date_from=2026-01-01&date_to=2026-01-31` returns grouped expense totals
- `GET /reports/monthly-summary?year=2026` returns 12 entries, zeroes for months with no transactions
- Missing required query params (`date_from`, `date_to`, `year`) return `400 Bad Request`

---

## Step 10 — Frontend Scaffold

**Type:** `FE`
**Depends on:** Step 1

### Tasks

1. In `frontend/`, install dependencies:
   ```bash
   npm install react-router-dom axios recharts
   npm install -D tailwindcss postcss autoprefixer @types/react
   npx tailwindcss init -p
   ```
2. Install and configure shadcn/ui:
   ```bash
   npx shadcn-ui@latest init
   ```
3. Configure Tailwind: add `./src/**/*.{js,jsx}` to `content` in `tailwind.config.js`
4. Create `src/api/client.js` — an axios instance with `baseURL = /api/v1` and default JSON headers
5. Create `src/api/` files, one per resource: `accounts.js`, `transactions.js`, `categories.js`, `reports.js` — stub functions only at this stage (e.g. `export const getAccounts = () => client.get('/accounts')`)
6. Configure the Vite dev proxy in `vite.config.js` to forward `/api` to `http://localhost:3001`
7. Create `src/utils/logger.js` — a structured logging wrapper that suppresses `info` and `warn` in production builds but always logs errors (see dev plan section 6.4). Use `logger` throughout the app instead of `console.log`.
8. Create `src/utils/errorReporting.js` — registers a global `unhandledrejection` handler that POSTs error details to `POST /api/v1/client-errors` (see dev plan section 6.4). Call `initErrorReporting()` in `src/main.jsx` before mounting React.
9. Add `POST /api/v1/client-errors` to the backend at this point — it requires no DB access, just logs the payload via `tracing::warn!` and returns `204 No Content`

### Done when
- `npm run dev` starts the Vite server with no errors
- A manual call to `getAccounts()` in the browser console returns the list of accounts from the backend
- Tailwind utility classes apply correctly (test with a single styled `div`)
- `logger.info('test')` prints to the console in dev mode and is silent in a production build (`npm run build && npm run preview`)
- `POST /api/v1/client-errors` returns `204` and the payload appears in backend logs

---

## Step 11 — App Shell & Navigation

**Type:** `FE`
**Depends on:** Step 10

### Tasks

1. Set up React Router in `src/main.jsx` with routes for all 8 pages (stub page components returning placeholder text are fine)
2. Create `src/components/Layout.jsx`:
   - Renders a bottom tab bar on mobile (`< 768px`) with icons and labels for: Dashboard, Transactions, Reports, Accounts, Categories
   - Renders a collapsible left sidebar on desktop with the same links
   - Uses a `<main>` element for page content with appropriate padding
3. Wrap all routes in `<Layout>`
4. Install and configure an icon library (e.g. `lucide-react`)
5. Verify active route is highlighted in the navigation

### Done when
- Navigating between stub pages works in the browser
- On a narrow viewport (360px), the bottom tab bar is visible and the sidebar is hidden
- On a wide viewport (1024px+), the sidebar is visible and the bottom tab bar is hidden
- Active link is visually distinguished in both nav styles

---

## Step 12 — Categories Page

**Type:** `FE`
**Depends on:** Step 11, Step 4

### Tasks

1. Create `src/pages/CategoriesPage.jsx`:
   - Fetches and displays all categories on load
   - Shows a visual distinction between default categories (read-only badge) and custom categories (edit/delete buttons)
2. Create `src/components/CategoryForm.jsx`:
   - Fields: name (required), icon (optional emoji input), color (optional hex color picker)
   - Used for both create and edit
3. Implement create flow: inline form or modal, calls `POST /categories`, refreshes list on success
4. Implement edit flow: pre-fills form with existing values, calls `PATCH /categories/:id`
5. Implement delete flow: confirmation dialog before calling `DELETE /categories/:id`
6. Show an error message if the user attempts to edit or delete a default category (should not be reachable via UI, but handle the API error gracefully)

### Done when
- All 14 default categories appear with a "Default" badge and no edit/delete controls
- A new custom category can be created, edited, and deleted
- Deleting a custom category removes it from the list without a page reload
- Form shows validation error if name is empty

---

## Step 13 — Accounts Page

**Type:** `FE`
**Depends on:** Step 11, Step 5

### Tasks

1. Create `src/pages/AccountsPage.jsx`:
   - Fetches and displays all accounts with their computed balances
2. Create `src/components/AccountCard.jsx`:
   - Displays: account name, type badge (Checking / Savings / Credit Card), current balance
   - Balance is colour-coded: positive = green, negative = red (relevant for credit cards)
   - Clicking the card navigates to `/transactions?account_id=<id>`
3. Create `src/components/AccountForm.jsx`:
   - Fields: name (required), type (select: CHECKING / SAVINGS / CREDIT_CARD), currency (default USD), initial balance (default 0)
4. Implement create, edit, and delete flows (same pattern as Step 12)
5. Delete shows a warning if the account has transactions (the API returns 409 — display a clear message rather than a generic error)

### Done when
- All accounts are listed with correct balances
- Creating a new account immediately appears in the list with the correct balance
- Attempting to delete an account with transactions shows a user-friendly error message
- Clicking an account card navigates to the transactions page filtered to that account

---

## Step 14 — Add & Edit Transaction

**Type:** `FE`
**Depends on:** Step 13, Step 8

### Tasks

1. Create `src/components/TransactionForm.jsx` — the core shared form:
   - **Type selector** (tab or segmented control): Income / Expense / Transfer
   - **Account** — searchable select, populated from `GET /accounts`
   - **Amount** — numeric input, positive numbers only
   - **Label** — text input (required)
   - **Category** — `CategoryPicker` component (searchable select with colour swatch, populated from `GET /categories`)
   - **Date** — date picker, defaults to today
   - **Notes** — optional textarea
   - **Transfer destination** — second account select, only visible when type = Transfer; must differ from source account
2. Create `src/pages/AddTransactionPage.jsx` — wraps `TransactionForm`, calls `POST /transactions`, redirects to `/transactions` on success
3. Create `src/pages/EditTransactionPage.jsx` — fetches existing transaction, pre-fills `TransactionForm`, calls `PATCH /transactions/:id` on submit
4. Create `src/components/CategoryPicker.jsx` — searchable dropdown showing category name with colour swatch

### Done when
- All three transaction types (Income, Expense, Transfer) can be created via the form
- Transfer mode shows a second account selector; it excludes the source account
- Submitting with an empty label shows a validation error before hitting the API
- After creating a transaction, the user is redirected to the transactions list
- Editing a transaction pre-fills all fields correctly

---

## Step 15 — Transactions Page

**Type:** `FE`
**Depends on:** Step 14, Step 7

### Tasks

1. Create `src/pages/TransactionsPage.jsx`:
   - On load, reads filter state from URL query params and passes them to `GET /transactions`
   - Renders `FilterBar` above the list
   - Renders a table on tablet/desktop, card list on mobile
2. Create `src/components/TransactionRow.jsx` (table row) and `src/components/TransactionCard.jsx` (mobile card):
   - Show: date, label, category badge with colour, account name, amount
   - Amount colour: green for INCOME, red for EXPENSE, grey for TRANSFER
   - Edit icon links to `/transactions/:id/edit`
   - Delete icon shows confirmation dialog, then calls `DELETE /transactions/:id`
3. Create `src/components/FilterBar.jsx`:
   - Controls: date range (from/to), account select, category select, type select
   - Any change updates URL query params (use `useSearchParams` from React Router)
   - A "Clear filters" button resets all filters
4. Implement pagination controls: Previous / Next buttons and a page indicator; reflect `page` in the URL

### Done when
- The transactions list loads and displays all transactions, paginated to 50 per page
- Changing any filter updates the URL and re-fetches the list
- Navigating to `/transactions?account_id=<uuid>` pre-applies the account filter (used by AccountCard)
- Deleting a transaction removes it from the list immediately
- On a 360px viewport, card layout renders without horizontal overflow

---

## Step 16 — Dashboard

**Type:** `FE`
**Depends on:** Step 15, Step 9

### Tasks

1. Create `src/pages/DashboardPage.jsx` — the root `/` route
2. Layout (responsive):
   - Mobile: stacked single column — balances → recent transactions
   - Desktop: two columns — left: balances + recent transactions; right: mini spending chart
3. **Balance overview section**: render one `AccountCard` per account, fetched from `GET /reports/account-balances`
4. **Recent transactions section**: fetch `GET /transactions?page_size=10` (most recent 10); render as `TransactionCard` list; a "View all" link navigates to `/transactions`
5. **Mini spending chart**: fetch `GET /reports/spending-by-category` for the current calendar month; render as a small Recharts pie chart with a legend; clicking a segment navigates to `/transactions?category_id=<id>` filtered to that category

### Done when
- Dashboard loads all three sections with real data
- Account balances match those shown on the Accounts page
- The mini pie chart shows the correct category breakdown for the current month
- Clicking a pie segment navigates to the filtered transactions page
- Page is usable on a 360px viewport without horizontal scroll

---

## Step 17 — Reports Page

**Type:** `FE`
**Depends on:** Step 16

### Tasks

1. Create `src/pages/ReportsPage.jsx`
2. **Spending by Category chart**:
   - Date range picker (from/to), defaults to current month
   - Fetches `GET /reports/spending-by-category?date_from=...&date_to=...`
   - Renders as a full-size Recharts `PieChart` with labels and a legend
   - Clicking a slice navigates to `/transactions?category_id=<id>&date_from=...&date_to=...`
   - Shows "No expenses in this period" if the response is empty
3. **Monthly Summary chart**:
   - Year selector (defaults to current year)
   - Fetches `GET /reports/monthly-summary?year=...`
   - Renders as a Recharts `BarChart` with grouped bars: Income (green) and Expenses (red) per month
   - X-axis shows month abbreviations (Jan–Dec)
   - Shows all 12 months, zero-height bars for months with no data
4. **Account Balances overview**: render a simple summary table (account name, type, balance) beneath the charts

### Done when
- Both charts render with correct data
- Changing the date range or year re-fetches and re-renders the chart
- Charts are legible on a 360px viewport (Recharts responsive container)
- Empty state message renders correctly when there are no expenses in the selected range

---

## Step 18 — Validation & Error Handling

**Type:** `BE` + `FE`
**Depends on:** Step 17

### Tasks

#### Backend
1. Add the `validator` crate's `#[derive(Validate)]` to all request structs:
   - `CreateTransactionRequest`: `amount` must be > 0, `label` must be non-empty
   - `CreateAccountRequest`: `name` must be non-empty, `account_type` must be a valid enum value
   - `CreateCategoryRequest`: `name` must be non-empty, max 50 chars
2. Call `payload.validate()?` at the top of every `POST` and `PATCH` handler (before hitting the DB)
3. Map `ValidationError` to `AppError::BadRequest` with a descriptive message
4. Add a global `tower` fallback handler for unmatched routes returning `404 Not Found` as JSON

#### Frontend
1. Add client-side validation to `TransactionForm`, `AccountForm`, and `CategoryForm` — show inline field errors before submitting to the API
2. Create a global `ErrorToast` component: displays API error messages (from non-2xx responses) as a dismissible toast notification
3. Handle these specific cases explicitly in the UI (not just a generic toast):
   - `409 Conflict` on account delete → "This account has transactions and cannot be deleted"
   - `403 Forbidden` on category edit/delete → "Default categories cannot be modified"
   - `400 Bad Request` → show the `error` field from the response body

### Done when
- Submitting a `POST /transactions` with `amount = 0` returns `400` with a clear error message
- Submitting a `POST /accounts` with an empty name returns `400`
- A `GET` to a non-existent route returns `404` as JSON (not HTML)
- In the UI, all form validation errors appear inline before any API call is made
- A failed API call shows a toast with the error message

---

## Step 19 — UI Polish

**Type:** `FE`
**Depends on:** Step 18

### Tasks

1. **Loading states**: add a skeleton loader or spinner to every page and component that fetches data asynchronously — no page should show empty content while loading
2. **Empty states**: add a friendly empty state to every list:
   - Accounts page: "No accounts yet. Create your first account to get started."
   - Transactions page: "No transactions found. Try adjusting your filters or add a new transaction."
   - Categories page: (unlikely to be empty due to seeded defaults, but handle it)
   - Reports page: "No data for this period."
3. **Confirmation dialogs**: all destructive actions (delete account, delete transaction, delete category) must show a confirmation dialog using shadcn/ui `AlertDialog` before calling the API
4. **Responsive audit**: manually test every page at 360px, 768px, and 1280px — fix any layout overflow or unreadable content
5. **"Add transaction" floating button**: on mobile, add a prominent floating action button (FAB) on the Transactions page and Dashboard that navigates to `/transactions/new`
6. **Logger audit**: do a project-wide search for any remaining `console.log` calls and replace them with the appropriate `logger.info` / `logger.warn` / `logger.error` call

### Done when
- Every data-fetching component shows a skeleton/spinner while loading
- Every list page has a visible empty state when there is no data
- No destructive action can be triggered without a confirmation step
- No horizontal scroll at 360px on any page
- The FAB is visible on mobile and navigates to the add transaction form
- No `console.log` calls remain anywhere in `src/` — only `logger.*` calls

---

## Step 20 — Docker & Deployment

**Type:** `INFRA`
**Depends on:** Step 19

### Tasks

1. Write `backend/Dockerfile` — two-stage build (see dev plan section 7.1):
   - Stage 1: `rust:1.77-slim` — run `cargo build --release`
   - Stage 2: `debian:bookworm-slim` — copy binary and migrations folder
2. Write `frontend/Dockerfile`:
   - Stage 1: `node:20-alpine` — run `npm ci && npm run build`
   - Stage 2: `nginx:alpine` — copy `dist/` and an `nginx.conf`
3. Write `frontend/nginx.conf`:
   - Serve static files from `/usr/share/nginx/html`
   - Proxy `/api` to `http://backend:3001`
   - Return `index.html` for all non-API routes (for React Router client-side routing)
4. Complete `docker-compose.yml`:
   - `db`: `postgres:16-alpine`, named volume, environment variables from `.env`
   - `backend`: build from `./backend`, `depends_on: db`, env vars from `.env`
   - `frontend`: build from `./frontend`, port `80:80`, `depends_on: backend`
5. Update `README.md` with the complete Quick Start section:
   - Prerequisites (Docker, Docker Compose)
   - `cp .env.example .env` and what to fill in
   - `docker compose up --build`
   - Expected URLs and verification steps

### Done when
- `docker compose up --build` from a clean checkout brings up all three services with no errors
- `http://localhost` serves the React app
- `http://localhost/api/v1/accounts` returns JSON
- Stopping and restarting with `docker compose down && docker compose up` preserves all data (Postgres volume is persistent)
- `docker compose down -v` cleanly removes all containers and volumes

---

## Dependency Map

The diagram below shows which steps must be complete before each step can begin. Steps on the same row have no dependency on each other and can be worked in parallel if multiple developers or agents are working simultaneously.

```
Step 1 (Scaffold)
  └─ Step 2 (Migrations)
       └─ Step 3 (Backend Skeleton)
            ├─ Step 4 (Categories API)
            └─ Step 5 (Accounts API)
                 └─ Step 6 (Transactions Basic)
                      ├─ Step 7 (Filtering & Pagination)
                      └─ Step 8 (Transfers)
                           └─ Step 9 (Reports API)

Step 1 (Scaffold)
  └─ Step 10 (Frontend Scaffold)
       └─ Step 11 (App Shell)
            ├─ Step 12 (Categories Page)  ← also needs Step 4
            └─ Step 13 (Accounts Page)    ← also needs Step 5
                 └─ Step 14 (Add/Edit Transaction)  ← also needs Step 8
                      └─ Step 15 (Transactions Page)  ← also needs Step 7
                           └─ Step 16 (Dashboard)  ← also needs Step 9
                                └─ Step 17 (Reports Page)
                                     └─ Step 18 (Validation & Error Handling)
                                          └─ Step 19 (UI Polish)
                                               └─ Step 20 (Docker & Deployment)
```

**Earliest parallelism opportunity:** once Step 3 (backend skeleton) is done, the backend track (Steps 4–9) and frontend scaffold (Step 10) can proceed independently until Step 12/13 need the API to be available.
