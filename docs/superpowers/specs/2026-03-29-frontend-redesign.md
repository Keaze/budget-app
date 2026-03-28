# Frontend Redesign Spec
Date: 2026-03-29
Approach: Full Layout Redesign (Option C)

## Overview

Complete visual overhaul of the budget app frontend. All pages redesigned. No backend changes. No logic changes — visual layer only.

---

## Design System

### Color Palette

| Role | Token | Hex |
|---|---|---|
| Primary action / income / active nav | `green-600` | `#16a34a` |
| Primary surface tint | `green-100` | `#dcfce7` |
| Page background | `green-50` | `#f0fdf4` |
| Expense / danger | `red-600` | `#dc2626` |
| Expense surface tint | `red-50` | `#fef2f2` |
| Body text | `stone-900` | `#1c1917` |
| Muted text / captions | `stone-500` | `#78716c` |
| Subtler muted text (notes) | `stone-400` | `#a8a29e` |
| Card background | `white` | `#ffffff` |
| Border | `stone-200` | `#e7e5e4` |
| Input background | `stone-50` | `#fafaf9` |

Blue is removed entirely. All previously blue elements (active nav, primary buttons, focus rings, links) become green.

### Typography

- **Font**: Inter (Google Fonts), loaded via `<link>` in `index.html`
- **Fallback**: `system-ui, sans-serif`
- Page titles: `text-2xl font-bold tracking-tight text-stone-900` (28px / 700)
- Section headings: `text-xl font-semibold text-stone-900` (20px / 600)
- Body: `text-[15px] text-stone-900` (15px / 400)
- Captions / labels: `text-[13px] text-stone-500` (13px / 400)
- Notes (inline): `text-[11px] text-stone-400` (11px / 400)
- Amounts: always `font-bold tabular-nums tracking-tight`
- Field labels: `text-[11px] font-semibold uppercase tracking-wide text-stone-500`

### Spacing & Shape

- Cards: `rounded-xl` (12px), `border border-stone-200`, `bg-white`
- Hero/summary areas: `rounded-2xl` (16px)
- Inputs & buttons: `rounded-lg` (8px)
- Badges / pills: `rounded-full`
- Card padding: `p-5` (20px) — up from current `px-4 py-3`
- Input padding: `px-3 py-2.5`
- Focus ring: `focus:ring-2 focus:ring-green-500`

### Dark Mode

**Removed entirely.** All `dark:` Tailwind classes are deleted. Light-only.

---

## Layout Shell

### Desktop (≥ `md`)

- **Top header bar**, full width, `bg-white border-b border-stone-200`, height `h-14`
- Left side: logo mark (green rounded square with "B") + "Budget" wordmark
- Center/right: horizontal nav links — `Dashboard`, `Transactions`, `Reports`, `Accounts`, `Categories`
- Active link: `bg-green-50 text-green-600 font-semibold rounded-md px-3 py-1.5`
- Inactive link: `text-stone-500 hover:text-stone-900 px-3 py-1.5`
- Far right: `+ Add Transaction` button (`bg-green-600 text-white rounded-lg px-4 py-2 text-sm font-semibold`)
- Page content area: `bg-green-50 min-h-screen`
- The collapsible sidebar is removed

### Mobile (< `md`)

- Header bar retained (logo + wordmark only, no nav links)
- Bottom tab bar: `bg-white border-t border-stone-200`, 5 tabs: Home, Transactions, Reports, Accounts, Categories
- Active tab label: `text-green-600 font-semibold`
- Inactive tab label: `text-stone-400`
- FAB (`+ Add Transaction`) retained on Dashboard and Transactions pages: `fixed bottom-20 right-4 bg-green-600`

---

## Pages

### Dashboard

**Hero strip** (replaces page title):
- `bg-white rounded-2xl border border-stone-200 p-6`
- Large total balance: `text-4xl font-bold tracking-tight`
- Three summary tiles alongside: Income (green-50 bg), Expenses (red-50 bg), Saved (green-50 bg) — all for current month
- Date subtitle below balance: "Across N accounts · Day, Month Date"

**Below hero — 2-column grid** (`grid-cols-2 gap-4`):
- Left col: **Recent Transactions** card — last 10, each row has category icon bg, description, date+account caption, amount. "View all →" link.
- Right col, stacked:
  - **Accounts** card — list of accounts with name, balance. "Manage →" link.
  - **Top Spending · [Month]** card — horizontal progress bars per category (top 5), amount right-aligned. Replaces the Recharts pie chart on the dashboard.

The Recharts pie on the dashboard is removed in favour of the inline bar approach (lighter, no chart dependency on this page).

### Transactions List

**Page header**: title left, `Filters` button right with active-filter count badge (`bg-green-600 text-white rounded-full text-xs`).

**Filter panel** (collapsible, collapsed by default when no filters active):
- `bg-white rounded-xl border border-stone-200 p-4`
- 4-column grid: From date, To date, Account select, Type select. Category select on second row.
- "✕ Clear filters" right-aligned in red, only shown when filters are active.

**Table (desktop)**:
- `bg-white rounded-xl border border-stone-200 overflow-hidden`
- Header row: `bg-stone-50 border-b`, uppercase 10px labels
- Columns: Date | Description+Notes | Category | Account | Amount | Actions
- Description cell: label on top (`text-[13px] font-medium`), note below (`text-[11px] text-stone-400`) — note only rendered if non-empty
- Category: colored pill badge (`bg-red-50 text-red-600` for expenses, `bg-green-100 text-green-700` for income)
- Amount: `font-bold tabular-nums`, green for income, red for expense, stone for transfer
- Alternating row background: `bg-white` / `bg-stone-50`

**Cards (mobile)**: same data, stacked card layout. Note shown under description in muted text.

**Pagination**: unchanged — Previous/Next buttons, styled with stone borders.

### Add / Edit Transaction Form

Centered, `max-w-lg`, `bg-white rounded-2xl border border-stone-200 p-6`.

- **Type toggle**: pill switcher (`bg-green-50 rounded-full p-1`), active option is `bg-white rounded-full shadow-sm font-semibold`. Active colors: Expense = `text-red-600`, Income = `text-green-600`, Transfer = `text-stone-700`.
- **Amount**: centered, large display — currency code prefix (from selected account, e.g. `USD`) in muted stone, amount in `text-4xl font-bold` colored by type (red/green/stone), underline border bottom only.
- **Field labels**: all uppercase 11px stone-500.
- **Inputs**: `bg-stone-50 border border-stone-200 rounded-lg px-3 py-2.5 text-[13px]`
- **Category + Account**: 2-column grid.
- **Notes**: full-width textarea, optional label.
- **Submit button**: `bg-green-600 text-white w-full rounded-lg py-3 font-semibold text-[13px]`

### Reports

**Tab bar** at top of content area:
- `bg-white border border-stone-200 rounded-xl p-1 w-fit`
- Three tabs: `Spending by Category`, `Monthly Summary`, `Account Balances`
- Active: `bg-green-600 text-white rounded-lg px-4 py-2 text-[12px] font-semibold`
- Inactive: `text-stone-500 px-4 py-2 text-[12px]`

**Spending by Category tab** (2-col layout):
- Left: date range pickers + horizontal bar chart (styled `div`s with green-50/red-600, no extra chart lib)
- Right (stacked): Period Summary card (total spent, categories, transactions, avg/day) + Recharts pie re-colored (red shades: `#dc2626`, `#f87171`, `#fca5a5`, `#fee2e2`)

**Monthly Summary tab**:
- Year selector + Recharts bar chart. Income bars: `#16a34a`. Expense bars: `#dc2626`. Grid lines: `#e7e5e4`.

**Account Balances tab**:
- Table: account name, type badge (green for asset types, red for credit), currency code + balance. Green/red coloring on balance amount.

### Accounts

**Layout**: `grid grid-cols-1 md:grid-cols-2 gap-4`

Each account card (`bg-white rounded-xl border border-stone-200 p-5`):
- Top row: account name (`font-semibold`) + type badge + edit/delete icons (stone-400, top-right)
- Type badge: `bg-green-100 text-green-700` for Checking/Savings, `bg-red-50 text-red-600` for Credit Card
- Balance: `text-2xl font-bold tracking-tight`, green if positive, red if negative
- Sub-caption: `{currency} · Click to view transactions` in stone-400
- Entire card is clickable (navigates to filtered transactions)

Last item in grid: dashed "add" placeholder card (`border-2 border-dashed border-green-200 bg-stone-50`) with a `+` icon and "Add account" label.

### Categories

**Layout**: `grid grid-cols-1 md:grid-cols-2 gap-3`

Each category card (`bg-white rounded-xl border border-stone-200 p-4`):
- Left: emoji icon in a 40×40 rounded-lg tile, background tinted from the category's own color at ~12% opacity — implemented as `style={{ background: category.color + '1f' }}` (hex alpha)
- Right: name (`font-semibold`) on top, color swatch circle + hex code below in stone-400
- Default categories: no edit/delete buttons, "Default" badge in `bg-stone-100 text-stone-400`
- Custom categories: edit + delete icons (stone-400)

Last item: dashed placeholder card, same pattern as Accounts.

---

## Components to Update

| Component | Changes |
|---|---|
| `Layout.jsx` | Replace sidebar with top header + bottom tabs |
| `DashboardPage.jsx` | Hero strip, 2-col layout, inline spending bars (remove pie) |
| `TransactionsPage.jsx` | Collapsible filter panel, updated table/card styles |
| `TransactionRow.jsx` | Note sub-line in description cell |
| `TransactionCard.jsx` | Note sub-line, updated colors |
| `AddTransactionPage.jsx` | Pass-through — form handles it |
| `EditTransactionPage.jsx` | Pass-through — form handles it |
| `TransactionForm.jsx` | Pill type toggle, large amount display, new input styles |
| `ReportsPage.jsx` | Tab bar, re-colored charts, 2-col spending layout |
| `AccountsPage.jsx` | 2-col grid, updated card layout |
| `AccountCard.jsx` | Large balance, type badge, tinted background |
| `AccountForm.jsx` | New input styles, modal style update |
| `CategoriesPage.jsx` | 2-col grid |
| `CategoryForm.jsx` | New input styles |
| `FilterBar.jsx` | Rename to `FilterPanel.jsx` and rewrite as collapsible panel; update all imports |
| `index.css` | Remove all dark mode vars, update CSS custom properties to stone/green palette |
| `index.html` | Add Inter font `<link>` |
| `tailwind.config.js` | Remove `darkMode` setting |

---

## Out of Scope

- No backend changes
- No routing changes
- No new features
- No changes to test assertions (visual only — class names may change, but behaviour is identical)
- No shadcn/ui adoption (stay with custom Tailwind components)
