# Budget App — Claude Guidelines

Personal home budgeting web app. Single-user, Raspberry Pi target.
Spec and step-by-step implementation order live in `ai/`.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Rust + Axum 0.7 |
| Database | PostgreSQL 16 via sqlx 0.7 (async, no ORM) |
| Migrations | sqlx migrate (embedded in binary) |
| Frontend | React + Vite (not yet started) |
| UI | shadcn/ui + Tailwind CSS |

## Project Structure

```
budget-app/
  ai/                        # specs and implementation plan — read before coding
    implementation_plan.md   # step-by-step build order (authoritative)
    project_plan.md          # full data model, API spec, architecture decisions
  backend/
    migrations/              # sqlx SQL migration files (0001–0004 complete)
    src/
      main.rs                # router setup, DB pool init, migrations on startup
      db.rs                  # type alias: Db = sqlx::PgPool
      error.rs               # AppError enum + IntoResponse + From<sqlx::Error>
      models/                # serde structs (one file per resource) — see models/CLAUDE.md
      handlers/              # axum handlers (one file per resource) — see handlers/CLAUDE.md
      queries/               # sqlx query functions (one file per resource) — see queries/CLAUDE.md
  dev.sh                     # starts Postgres container + cargo run locally
```

## Common Commands

```bash
# Run all tests
cd backend && cargo test

# Start locally (requires Docker)
bash dev.sh
bash dev.sh stop   # tear down the DB container

# Check compilation
cd backend && cargo check

# Add a migration
cd backend && sqlx migrate add <name>
```

## API

All endpoints prefixed `/api/v1`. Errors: `{ "error": "message" }`.

Currently implemented:
- `GET /health`
- `GET /api/v1/categories` — list all (defaults + custom)
- `POST /api/v1/categories` — create custom category
- `GET /api/v1/categories/:id`
- `PATCH /api/v1/categories/:id` — 403 if `is_default`
- `DELETE /api/v1/categories/:id` — 403 if `is_default`
- `GET /api/v1/accounts` — list with computed balances
- `POST /api/v1/accounts`
- `GET /api/v1/accounts/:id` — includes computed balance
- `PATCH /api/v1/accounts/:id`
- `DELETE /api/v1/accounts/:id` — 409 if transactions exist
- `GET /api/v1/transactions` — filterable, paginated (`account_id`, `category_id`, `transaction_type`, `date_from`, `date_to`, `sort_by`, `sort_order`, `page`, `page_size`)
- `POST /api/v1/transactions` — supports INCOME, EXPENSE, TRANSFER
- `GET /api/v1/transactions/:id`
- `PATCH /api/v1/transactions/:id`
- `DELETE /api/v1/transactions/:id`
- `GET /api/v1/reports/account-balances`
- `GET /api/v1/reports/spending-by-category?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD`
- `GET /api/v1/reports/monthly-summary?year=YYYY`

## Coding Standards

- **Four Rules of Simple Design** (in priority order):
  1. Code works (passes tests)
  2. Reveals intent
  3. No duplication
  4. Minimal elements — no over-engineering
- Write meaningful tests with assertions for all new code; never skip or weaken failing tests
- Prefer functional style: explicit parameters, immutability, declarative over imperative, minimal state
- Short functions; one responsibility per module; low coupling between modules

## Architecture Rules

- Modularise by concern (models / handlers / queries), one file per resource
- Handlers receive `State(db)`, `Path`, `Query`, `Json` — delegate immediately to `queries/`
- Never expose internal error details to API clients — use `AppError::Internal`
- All handlers annotated with `#[tracing::instrument(skip(db))]`
- Use runtime sqlx queries (`sqlx::query_as::<_, T>(sql).bind(...)`) — avoids compile-time DB dependency

## Error Handling

`AppError` variants → HTTP status:
- `NotFound` → 404
- `BadRequest(String)` → 400
- `Conflict(String)` → 409
- `Forbidden(String)` → 403
- `Internal(anyhow::Error)` → 500 (detail hidden from client, logged via `tracing::error!`)

## Commit Strategy

- One task = one commit
- Every commit is self-contained and includes its tests
- Use conventional commit format: `feat:`, `fix:`, `refactor:`, `test:`, `chore:`
- Do not amend published commits

## Safe Practices

- Do not change test assertions during refactoring
- Do not skip failing tests — fix the root cause
- Do not invent unknown APIs; ask if unsure
- Read `ai/implementation_plan.md` before starting each new step
