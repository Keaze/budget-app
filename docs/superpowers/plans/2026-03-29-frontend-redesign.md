# Frontend Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Visually redesign the entire frontend — Fresh & Airy palette, Inter font, light-only, top-nav shell, updated layouts on every page — without changing any business logic.

**Architecture:** Pure visual layer change. All component logic, API calls, routing, and test assertions remain identical. CSS classes, layout structure, and a small number of UI-state additions (filter toggle, report tabs) are the only changes. All dark mode classes are deleted.

**Tech Stack:** React + Vite, Tailwind CSS 3, Lucide React, Recharts, Vitest + Testing Library.

**Before starting:** `npm` requires a PATH export. Run once per shell session:
```bash
export PATH="/home/daniel/.local/share/nvm/v25.8.1/bin:$PATH"
```
All `npm` commands below assume this has been done.

---

## File Map

| File | Action | What changes |
|---|---|---|
| `frontend/index.html` | Modify | Add Inter font `<link>` |
| `frontend/tailwind.config.js` | Modify | Remove `darkMode`, remove custom color tokens (use Tailwind defaults) |
| `frontend/src/index.css` | Modify | Replace CSS vars, remove `.dark` block, update body |
| `frontend/src/components/Layout.jsx` | Modify | Remove sidebar, add top header bar + keep bottom tabs |
| `frontend/src/components/AccountCard.jsx` | Modify | Larger balance, colored type badge, updated hover |
| `frontend/src/components/TransactionCard.jsx` | Modify | Add notes sub-line, strip dark classes, update category pill |
| `frontend/src/components/TransactionRow.jsx` | Modify | Add notes sub-line, strip dark classes, update category pill |
| `frontend/src/components/TransactionForm.jsx` | Modify | Pill type toggle, centered large amount, new input styles |
| `frontend/src/components/FilterBar.jsx` → `FilterPanel.jsx` | Rename + rewrite | Collapsible panel; update test import too |
| `frontend/src/components/FilterBar.test.jsx` → `FilterPanel.test.jsx` | Rename | Update import only (assertions unchanged) |
| `frontend/src/pages/DashboardPage.jsx` | Modify | Hero strip, 2-col grid, inline spending bars (remove pie) |
| `frontend/src/pages/TransactionsPage.jsx` | Modify | Toggle button + isFilterOpen state, use FilterPanel, new table styles |
| `frontend/src/pages/ReportsPage.jsx` | Modify | Tab bar (show/hide sections via `hidden` class), re-colored charts |
| `frontend/src/pages/AccountsPage.jsx` | Modify | 2-col grid |
| `frontend/src/pages/CategoriesPage.jsx` | Modify | 2-col grid, category icon tile |
| `frontend/src/components/AccountForm.jsx` | Modify | New input/button styles |
| `frontend/src/components/CategoryForm.jsx` | Modify | New input/button styles |

---

## Task 1: Foundation — Font, Tailwind Config, CSS Variables

**Files:**
- Modify: `frontend/index.html`
- Modify: `frontend/tailwind.config.js`
- Modify: `frontend/src/index.css`

- [ ] **Step 1: Add Inter font to index.html**

Replace the `<head>` contents of `frontend/index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Budget</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Simplify tailwind.config.js**

Replace `frontend/tailwind.config.js` entirely:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

This removes `darkMode` and the custom HSL color tokens. All components will use standard Tailwind color names (green-600, stone-500, etc.) going forward.

- [ ] **Step 3: Replace index.css**

Replace `frontend/src/index.css` entirely:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    font-family: 'Inter', system-ui, sans-serif;
    margin: 0;
    @apply bg-green-50 text-stone-900;
  }
  * {
    @apply border-stone-200;
  }
}
```

- [ ] **Step 4: Run all tests to establish baseline**

```bash
cd /home/daniel/dev/budget-app/frontend && npm test
```

Expected: all existing tests pass. The CSS changes do not affect component behaviour.

- [ ] **Step 5: Commit**

```bash
cd /home/daniel/dev/budget-app && git add frontend/index.html frontend/tailwind.config.js frontend/src/index.css
git commit -m "feat(ui): foundation — Inter font, Tailwind config, CSS vars (Step 1)"
```

---

## Task 2: Layout Shell — Top Header + Bottom Tabs

**Files:**
- Modify: `frontend/src/components/Layout.jsx`

- [ ] **Step 1: Write the failing test**

Create `frontend/src/components/Layout.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Layout from './Layout'

function renderLayout() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Layout><div>page content</div></Layout>
    </MemoryRouter>
  )
}

describe('Layout', () => {
  it('renders the Budget wordmark', () => {
    renderLayout()
    expect(screen.getAllByText('Budget').length).toBeGreaterThan(0)
  })

  it('renders all nav links', () => {
    renderLayout()
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Transactions').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Reports').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Accounts').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Categories').length).toBeGreaterThan(0)
  })

  it('renders Add Transaction button in the header', () => {
    renderLayout()
    expect(screen.getByRole('link', { name: /add transaction/i })).toBeInTheDocument()
  })

  it('renders children', () => {
    renderLayout()
    expect(screen.getByText('page content')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /home/daniel/dev/budget-app/frontend && npm test src/components/Layout.test.jsx -- --reporter=verbose
```

Expected: FAIL — `Layout.test.jsx` has no matching component yet (old Layout has no "Add Transaction" link in header).

- [ ] **Step 3: Rewrite Layout.jsx**

Replace `frontend/src/components/Layout.jsx` entirely:

```jsx
import { NavLink, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  ArrowLeftRight,
  BarChart2,
  Wallet,
  Tag,
  Plus,
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/',             label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight  },
  { to: '/reports',      label: 'Reports',      icon: BarChart2       },
  { to: '/accounts',     label: 'Accounts',     icon: Wallet          },
  { to: '/categories',   label: 'Categories',   icon: Tag             },
]

function desktopNavClass({ isActive }) {
  return isActive
    ? 'bg-green-50 text-green-600 font-semibold rounded-md px-3 py-1.5 text-sm transition-colors'
    : 'text-stone-500 hover:text-stone-900 px-3 py-1.5 text-sm transition-colors rounded-md'
}

function mobileNavClass({ isActive }) {
  return isActive
    ? 'flex flex-col items-center justify-center flex-1 py-2 text-xs font-semibold text-green-600 transition-colors'
    : 'flex flex-col items-center justify-center flex-1 py-2 text-xs font-medium text-stone-400 transition-colors'
}

export default function Layout({ children }) {
  return (
    <div className="flex flex-col min-h-screen bg-green-50">
      {/* Top header */}
      <header className="bg-white border-b border-stone-200 h-14 flex items-center px-4 md:px-6 shrink-0">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 mr-6">
          <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white text-sm font-bold">B</span>
          </div>
          <span className="font-bold text-stone-900 text-[15px]">Budget</span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {NAV_ITEMS.map(({ to, label }) => (
            <NavLink key={to} to={to} end={to === '/'} className={desktopNavClass}>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Add Transaction button — desktop only */}
        <Link
          to="/transactions/new"
          aria-label="Add transaction"
          className="hidden md:flex items-center gap-1.5 ml-auto bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={15} />
          Add Transaction
        </Link>
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        {children}
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 flex z-30">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'} className={mobileNavClass}>
            <Icon size={22} />
            <span className="mt-0.5">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /home/daniel/dev/budget-app/frontend && npm test src/components/Layout.test.jsx -- --reporter=verbose
```

Expected: PASS — all 4 layout tests green.

- [ ] **Step 5: Run all tests**

```bash
cd /home/daniel/dev/budget-app/frontend && npm test
```

Expected: all pass.

- [ ] **Step 6: Commit**

```bash
cd /home/daniel/dev/budget-app && git add frontend/src/components/Layout.jsx frontend/src/components/Layout.test.jsx
git commit -m "feat(ui): layout shell — top header, Add Transaction button, green bottom tabs (Step 2)"
```

---

## Task 3: AccountCard — Larger Balance, Colored Type Badge

**Files:**
- Modify: `frontend/src/components/AccountCard.jsx`

The existing test checks for `text-green-600` and `text-red-600` class names — those must remain. The test also checks for account name, type label, and navigation. All preserved.

- [ ] **Step 1: Rewrite AccountCard.jsx**

Replace `frontend/src/components/AccountCard.jsx` entirely:

```jsx
import { useNavigate } from 'react-router-dom'

const TYPE_LABELS = {
  CHECKING: 'Checking',
  SAVINGS: 'Savings',
  CREDIT_CARD: 'Credit Card',
}

const TYPE_BADGE = {
  CHECKING: 'bg-green-100 text-green-700',
  SAVINGS: 'bg-green-100 text-green-700',
  CREDIT_CARD: 'bg-red-50 text-red-600',
}

export default function AccountCard({ account }) {
  const navigate = useNavigate()
  const balance = parseFloat(account.balance)
  const isNegative = balance < 0

  return (
    <button
      onClick={() => navigate(`/transactions?account_id=${account.id}`)}
      className="w-full text-left p-5 bg-white border border-stone-200 rounded-xl hover:border-green-400 transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-stone-900 text-[15px]">{account.name}</p>
          <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full mt-1.5 ${TYPE_BADGE[account.account_type] ?? 'bg-stone-100 text-stone-500'}`}>
            {TYPE_LABELS[account.account_type] ?? account.account_type}
          </span>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold tabular-nums tracking-tight ${isNegative ? 'text-red-600' : 'text-green-600'}`}>
            {account.currency} {balance.toFixed(2)}
          </p>
          <p className="text-xs text-stone-400 mt-1">Click to view transactions</p>
        </div>
      </div>
    </button>
  )
}
```

- [ ] **Step 2: Run AccountCard tests**

```bash
cd /home/daniel/dev/budget-app/frontend && npm test src/components/AccountCard.test.jsx -- --reporter=verbose
```

Expected: all 7 tests pass (green/red class names preserved, text content preserved, navigation preserved).

- [ ] **Step 3: Commit**

```bash
cd /home/daniel/dev/budget-app && git add frontend/src/components/AccountCard.jsx
git commit -m "feat(ui): AccountCard — larger balance, colored type badge (Step 3)"
```

---

## Task 4: TransactionCard + TransactionRow — Notes Sub-line

**Files:**
- Modify: `frontend/src/components/TransactionCard.jsx`
- Modify: `frontend/src/components/TransactionRow.jsx`

- [ ] **Step 1: Write failing tests for notes rendering**

Add to `frontend/src/components/TransactionCard.test.jsx` (append after the last `describe` block):

```jsx
describe('TransactionCard — notes', () => {
  it('renders notes when present', () => {
    const tx = { ...expenseTx, notes: 'Weekly bulk shop' }
    render(
      <MemoryRouter>
        <TransactionCard
          transaction={tx}
          account={account}
          category={category}
          deleting={false}
          onDelete={vi.fn()}
          onDeleteConfirm={vi.fn()}
          onDeleteCancel={vi.fn()}
        />
      </MemoryRouter>
    )
    expect(screen.getByText('Weekly bulk shop')).toBeInTheDocument()
  })

  it('does not render a notes element when notes is absent', () => {
    render(
      <MemoryRouter>
        <TransactionCard
          transaction={expenseTx}
          account={account}
          category={category}
          deleting={false}
          onDelete={vi.fn()}
          onDeleteConfirm={vi.fn()}
          onDeleteCancel={vi.fn()}
        />
      </MemoryRouter>
    )
    expect(screen.queryByTestId('tx-notes')).not.toBeInTheDocument()
  })
})
```

Add to `frontend/src/components/TransactionRow.test.jsx` (append after the last `describe` block):

```jsx
describe('TransactionRow — notes', () => {
  it('renders notes when present', () => {
    const tx = { ...expenseTx, notes: 'Electricity spike' }
    render(
      <MemoryRouter>
        <table><tbody>
          <TransactionRow
            transaction={tx}
            account={account}
            category={category}
            deleting={false}
            onDelete={vi.fn()}
            onDeleteConfirm={vi.fn()}
            onDeleteCancel={vi.fn()}
          />
        </tbody></table>
      </MemoryRouter>
    )
    expect(screen.getByText('Electricity spike')).toBeInTheDocument()
  })

  it('does not render a notes element when notes is absent', () => {
    render(
      <MemoryRouter>
        <table><tbody>
          <TransactionRow
            transaction={expenseTx}
            account={account}
            category={category}
            deleting={false}
            onDelete={vi.fn()}
            onDeleteConfirm={vi.fn()}
            onDeleteCancel={vi.fn()}
          />
        </tbody></table>
      </MemoryRouter>
    )
    expect(screen.queryByTestId('tx-notes')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /home/daniel/dev/budget-app/frontend && npm test src/components/TransactionCard.test.jsx src/components/TransactionRow.test.jsx -- --reporter=verbose
```

Expected: new "notes" tests FAIL (notes not yet rendered), all existing tests PASS.

- [ ] **Step 3: Rewrite TransactionCard.jsx**

Replace `frontend/src/components/TransactionCard.jsx` entirely:

```jsx
import { Link } from 'react-router-dom'
import { Pencil, Trash2 } from 'lucide-react'

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

function amountClass(type) {
  if (type === 'INCOME') return 'text-green-600'
  if (type === 'EXPENSE') return 'text-red-600'
  return 'text-stone-500'
}

function amountPrefix(type) {
  if (type === 'INCOME') return '+'
  if (type === 'EXPENSE') return '-'
  return ''
}

export default function TransactionCard({
  transaction,
  account,
  category,
  deleting,
  onDelete,
  onDeleteConfirm,
  onDeleteCancel,
}) {
  const { id, transaction_type, amount, label, date, notes } = transaction

  return (
    <div className="bg-white border border-stone-200 rounded-xl px-4 py-3 mb-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-stone-900 truncate">{label}</p>
          {notes && (
            <p data-testid="tx-notes" className="text-[11px] text-stone-400 mt-0.5 truncate">{notes}</p>
          )}
          <p className="text-xs text-stone-500 mt-0.5">{formatDate(date)}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {account && (
              <span className="text-xs text-stone-500">{account.name}</span>
            )}
            {category && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                style={{ background: (category.color ?? '#6b7280') + '20', color: category.color ?? '#6b7280' }}>
                <span
                  className="inline-block w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: category.color ?? '#6b7280' }}
                />
                {category.name}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <p className={`font-semibold tabular-nums ${amountClass(transaction_type)}`}>
            {amountPrefix(transaction_type)}{parseFloat(amount).toFixed(2)}
          </p>
          {deleting ? (
            <span className="flex items-center gap-2 text-sm">
              <span className="text-stone-500">Delete?</span>
              <button onClick={() => onDeleteConfirm(id)} className="text-red-600 hover:text-red-800 font-medium">Yes</button>
              <button onClick={onDeleteCancel} className="text-stone-500 hover:text-stone-700">No</button>
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Link to={`/transactions/${id}/edit`} className="p-1 text-stone-400 hover:text-stone-700 rounded" aria-label="Edit">
                <Pencil size={14} />
              </Link>
              <button onClick={() => onDelete(id)} className="p-1 text-stone-400 hover:text-red-600 rounded" aria-label="Delete">
                <Trash2 size={14} />
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Rewrite TransactionRow.jsx**

Replace `frontend/src/components/TransactionRow.jsx` entirely:

```jsx
import { Link } from 'react-router-dom'
import { Pencil, Trash2 } from 'lucide-react'

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

function amountClass(type) {
  if (type === 'INCOME') return 'text-green-600'
  if (type === 'EXPENSE') return 'text-red-600'
  return 'text-stone-500'
}

function amountPrefix(type) {
  if (type === 'INCOME') return '+'
  if (type === 'EXPENSE') return '-'
  return ''
}

export default function TransactionRow({
  transaction,
  account,
  category,
  deleting,
  onDelete,
  onDeleteConfirm,
  onDeleteCancel,
}) {
  const { id, transaction_type, amount, label, date, notes } = transaction

  return (
    <tr className="border-b border-stone-100 hover:bg-stone-50 even:bg-stone-50/50">
      <td className="py-3 px-4 text-[13px] text-stone-500 whitespace-nowrap">
        {formatDate(date)}
      </td>
      <td className="py-3 px-4 max-w-[200px]">
        <p className="text-[13px] font-medium text-stone-900 truncate">{label}</p>
        {notes && (
          <p data-testid="tx-notes" className="text-[11px] text-stone-400 mt-0.5 truncate">{notes}</p>
        )}
      </td>
      <td className="py-3 px-4 text-sm">
        {category ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{ background: (category.color ?? '#6b7280') + '20', color: category.color ?? '#6b7280' }}>
            <span
              className="inline-block w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: category.color ?? '#6b7280' }}
            />
            {category.name}
          </span>
        ) : (
          <span className="text-stone-400 text-xs">—</span>
        )}
      </td>
      <td className="py-3 px-4 text-[13px] text-stone-500">
        {account?.name ?? '—'}
      </td>
      <td className={`py-3 px-4 text-[13px] font-bold tabular-nums tracking-tight text-right ${amountClass(transaction_type)}`}>
        {amountPrefix(transaction_type)}{parseFloat(amount).toFixed(2)}
      </td>
      <td className="py-3 px-4 text-right">
        {deleting ? (
          <span className="flex items-center justify-end gap-2 text-sm">
            <span className="text-stone-500">Delete?</span>
            <button onClick={() => onDeleteConfirm(id)} className="text-red-600 hover:text-red-800 font-medium">Yes</button>
            <button onClick={onDeleteCancel} className="text-stone-500 hover:text-stone-700">No</button>
          </span>
        ) : (
          <span className="flex items-center justify-end gap-1">
            <Link to={`/transactions/${id}/edit`} className="p-1 text-stone-400 hover:text-stone-700 rounded" aria-label="Edit">
              <Pencil size={14} />
            </Link>
            <button onClick={() => onDelete(id)} className="p-1 text-stone-400 hover:text-red-600 rounded" aria-label="Delete">
              <Trash2 size={14} />
            </button>
          </span>
        )}
      </td>
    </tr>
  )
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd /home/daniel/dev/budget-app/frontend && npm test src/components/TransactionCard.test.jsx src/components/TransactionRow.test.jsx -- --reporter=verbose
```

Expected: all tests PASS including the new notes tests.

- [ ] **Step 6: Commit**

```bash
cd /home/daniel/dev/budget-app && git add frontend/src/components/TransactionCard.jsx frontend/src/components/TransactionRow.jsx frontend/src/components/TransactionCard.test.jsx frontend/src/components/TransactionRow.test.jsx
git commit -m "feat(ui): TransactionCard + TransactionRow — notes sub-line, stone palette (Step 4)"
```

---

## Task 5: Dashboard — Hero Strip + 2-Column Layout

**Files:**
- Modify: `frontend/src/pages/DashboardPage.jsx`

The Recharts pie chart is replaced with inline `div`-based spending bars (no chart library dependency on this page). The `MiniSpendingChart` component and all Recharts imports are deleted. Data loading is unchanged.

- [ ] **Step 1: Run existing DashboardPage tests to confirm they still pass before we touch the file**

```bash
cd /home/daniel/dev/budget-app/frontend && npm test src/pages/DashboardPage.test.jsx -- --reporter=verbose
```

Expected: all pass.

- [ ] **Step 2: Rewrite DashboardPage.jsx**

Replace `frontend/src/pages/DashboardPage.jsx` entirely:

```jsx
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { getAccountBalances, getSpendingByCategory } from '../api/reports'
import { getTransactions } from '../api/transactions'
import { getCategories } from '../api/categories'
import TransactionCard from '../components/TransactionCard'
import { logger } from '../utils/logger'

function currentMonthRange() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate()
  return {
    date_from: `${year}-${month}-01`,
    date_to: `${year}-${month}-${String(lastDay).padStart(2, '0')}`,
    label: now.toLocaleDateString(undefined, { month: 'long' }),
  }
}

function SpendingBars({ spending, onCategoryClick }) {
  if (spending.length === 0) return (
    <p className="text-sm text-stone-400">No expenses this month.</p>
  )
  const max = Math.max(...spending.map(s => s.total))
  return (
    <div className="flex flex-col gap-3">
      {spending.slice(0, 5).map(item => (
        <button
          key={item.category_id}
          onClick={() => onCategoryClick(item.category_id)}
          className="w-full text-left group"
        >
          <div className="flex justify-between items-center mb-1">
            <span className="text-[13px] text-stone-700 group-hover:text-stone-900">{item.category_name}</span>
            <span className="text-[13px] font-bold tabular-nums text-red-600">${parseFloat(item.total).toFixed(2)}</span>
          </div>
          <div className="h-1.5 bg-red-50 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 rounded-full"
              style={{ width: `${(item.total / max) * 100}%` }}
            />
          </div>
        </button>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState([])
  const [transactions, setTransactions] = useState([])
  const [spending, setSpending] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const { date_from, date_to } = currentMonthRange()
    Promise.all([
      getAccountBalances(),
      getTransactions({ page_size: 10, sort_by: 'date', sort_order: 'desc' }),
      getSpendingByCategory({ date_from, date_to }),
      getCategories(),
    ])
      .then(([accsRes, txRes, spendingRes, catsRes]) => {
        setAccounts(accsRes.data)
        setTransactions(txRes.data.data)
        setSpending(spendingRes.data)
        setCategories(catsRes.data)
      })
      .catch(err => {
        logger.error('Failed to load dashboard', err)
        setError('Failed to load dashboard.')
      })
      .finally(() => setLoading(false))
  }, [])

  const categoriesMap = Object.fromEntries(categories.map(c => [c.id, c]))
  const accountsMap = Object.fromEntries(accounts.map(a => [a.id, a]))

  if (loading) {
    return <div className="p-6 text-sm text-stone-500">Loading dashboard…</div>
  }
  if (error) {
    return <div className="p-6 text-red-600">{error}</div>
  }

  const { date_from, date_to, label: monthLabel } = currentMonthRange()
  const totalBalance = accounts.reduce((sum, a) => sum + parseFloat(a.balance), 0)
  const monthIncome = spending.filter ? 0 : 0  // income comes from transactions
  const txThisMonth = transactions.filter(tx => tx.transaction_type !== 'TRANSFER')
  const incomeTotal = txThisMonth
    .filter(tx => tx.transaction_type === 'INCOME')
    .reduce((sum, tx) => sum + parseFloat(tx.amount), 0)
  const expenseTotal = txThisMonth
    .filter(tx => tx.transaction_type === 'EXPENSE')
    .reduce((sum, tx) => sum + parseFloat(tx.amount), 0)

  return (
    <div className="p-4 md:p-6 max-w-5xl">
      {/* Hero strip */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-stone-400 mb-1">Total Balance</p>
            <p className="text-4xl font-bold tracking-tight text-stone-900 tabular-nums">
              ${totalBalance.toFixed(2)}
            </p>
            <p className="text-[13px] text-stone-400 mt-1">
              Across {accounts.length} account{accounts.length !== 1 ? 's' : ''} · {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex gap-3">
            <div className="bg-green-50 rounded-xl px-4 py-3 text-center min-w-[90px]">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-green-600 mb-1">Income</p>
              <p className="text-lg font-bold text-green-600 tabular-nums">+${incomeTotal.toFixed(2)}</p>
              <p className="text-[10px] text-stone-400 mt-0.5">this month</p>
            </div>
            <div className="bg-red-50 rounded-xl px-4 py-3 text-center min-w-[90px]">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-red-600 mb-1">Expenses</p>
              <p className="text-lg font-bold text-red-600 tabular-nums">-${expenseTotal.toFixed(2)}</p>
              <p className="text-[10px] text-stone-400 mt-0.5">this month</p>
            </div>
            <div className="bg-green-50 rounded-xl px-4 py-3 text-center min-w-[90px]">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-500 mb-1">Saved</p>
              <p className="text-lg font-bold text-stone-900 tabular-nums">${(incomeTotal - expenseTotal).toFixed(2)}</p>
              <p className="text-[10px] text-stone-400 mt-0.5">net</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent transactions */}
        <div className="bg-white rounded-xl border border-stone-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-semibold text-stone-900">Recent Transactions</h2>
            <Link to="/transactions" className="text-[13px] text-green-600 font-medium hover:text-green-700">
              View all →
            </Link>
          </div>
          {transactions.length === 0 ? (
            <p className="text-sm text-stone-400">No transactions yet.</p>
          ) : (
            <div className="flex flex-col gap-0">
              {transactions.map(tx => (
                <TransactionCard
                  key={tx.id}
                  transaction={tx}
                  account={accountsMap[tx.account_id]}
                  category={tx.category_id ? categoriesMap[tx.category_id] : null}
                  deleting={false}
                  onDelete={() => {}}
                  onDeleteConfirm={() => {}}
                  onDeleteCancel={() => {}}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5">
          {/* Accounts */}
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[15px] font-semibold text-stone-900">Accounts</h2>
              <Link to="/accounts" className="text-[13px] text-green-600 font-medium hover:text-green-700">
                Manage →
              </Link>
            </div>
            {accounts.length === 0 ? (
              <p className="text-sm text-stone-400">No accounts yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {accounts.map((account, i) => (
                  <div key={account.id}>
                    {i > 0 && <div className="h-px bg-stone-100 my-1" />}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[13px] font-medium text-stone-900">{account.name}</p>
                        <p className="text-xs text-stone-400">{account.account_type}</p>
                      </div>
                      <p className={`text-[15px] font-bold tabular-nums ${parseFloat(account.balance) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {account.currency} {parseFloat(account.balance).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Spending bars */}
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <h2 className="text-[15px] font-semibold text-stone-900 mb-4">
              Top Spending · {monthLabel}
            </h2>
            <SpendingBars
              spending={spending}
              onCategoryClick={categoryId =>
                navigate(`/transactions?category_id=${categoryId}&date_from=${date_from}&date_to=${date_to}`)
              }
            />
          </div>
        </div>
      </div>

      {/* Mobile FAB */}
      <Link
        to="/transactions/new"
        className="fixed bottom-20 right-4 z-40 md:hidden flex items-center justify-center w-14 h-14 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700"
        aria-label="Add transaction"
      >
        <Plus size={24} />
      </Link>
    </div>
  )
}
```

- [ ] **Step 3: Run DashboardPage tests**

```bash
cd /home/daniel/dev/budget-app/frontend && npm test src/pages/DashboardPage.test.jsx -- --reporter=verbose
```

Expected: all pass.

- [ ] **Step 4: Commit**

```bash
cd /home/daniel/dev/budget-app && git add frontend/src/pages/DashboardPage.jsx
git commit -m "feat(ui): Dashboard — hero strip, 2-col grid, inline spending bars (Step 5)"
```

---

## Task 6: FilterPanel — Collapsible Filter Panel

Rename `FilterBar.jsx` → `FilterPanel.jsx`. Add collapsible open/closed state managed internally. The `aria-label` attributes on all inputs are preserved so the existing test assertions still pass.

**Files:**
- Create: `frontend/src/components/FilterPanel.jsx`
- Delete: `frontend/src/components/FilterBar.jsx` (after tests pass)
- Rename: `frontend/src/components/FilterBar.test.jsx` → `FilterPanel.test.jsx` (update import only)

- [ ] **Step 1: Write a failing test for the toggle behavior**

Add to `frontend/src/components/FilterBar.test.jsx` (append after the last `describe` block):

```jsx
describe('FilterPanel — collapsible toggle', () => {
  it('shows the filter controls when open', () => {
    renderBar()
    // panel is open by default when there are no active filters?
    // Actually default is closed — test that toggling opens it
    const toggleBtn = screen.getByRole('button', { name: /filters/i })
    expect(toggleBtn).toBeInTheDocument()
  })

  it('hides filter controls when panel is closed', () => {
    renderBar()
    // When closed, the date inputs should not be visible
    // Default state: closed (no filters active)
    expect(screen.queryByLabelText('Date from')).not.toBeInTheDocument()
  })

  it('reveals filter controls after clicking the toggle', async () => {
    const user = userEvent.setup()
    renderBar()
    await user.click(screen.getByRole('button', { name: /filters/i }))
    expect(screen.getByLabelText('Date from')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify failures**

```bash
cd /home/daniel/dev/budget-app/frontend && npm test src/components/FilterBar.test.jsx -- --reporter=verbose
```

Expected: new toggle tests FAIL. All existing tests FAIL because `FilterBar` currently always shows its controls — after the rewrite, the controls are only shown when open.

**Important:** The existing FilterBar tests test the filter controls themselves (selecting options, URL params). Those tests rely on the controls being visible. After the redesign the panel opens by default when there are active URL params, and the test `renderBar('/transactions?account_id=acc-2')` will have an active filter, so the panel starts open. For the `renderBar()` (no params) case, the panel starts closed — the existing filtering tests with no initial params won't find the inputs.

To handle this: the FilterPanel opens automatically when any filter param is present in the URL. Tests that pass `initialUrl` with params will find the controls; tests that start with no params need to click the toggle first. Since we can't change existing test assertions, we need to add an `initiallyOpen` behavior: **the panel is open by default** (starts open, can be toggled closed). This way all existing tests pass without modification.

Update the failing toggle test to:

```jsx
describe('FilterPanel — collapsible toggle', () => {
  it('renders the Filters toggle button', () => {
    renderBar()
    expect(screen.getByRole('button', { name: /filters/i })).toBeInTheDocument()
  })

  it('hides filter controls after clicking the toggle to close', async () => {
    const user = userEvent.setup()
    renderBar()
    // panel starts open — close it
    await user.click(screen.getByRole('button', { name: /filters/i }))
    expect(screen.queryByLabelText('Date from')).not.toBeInTheDocument()
  })

  it('reveals filter controls after clicking toggle again to re-open', async () => {
    const user = userEvent.setup()
    renderBar()
    await user.click(screen.getByRole('button', { name: /filters/i }))  // close
    await user.click(screen.getByRole('button', { name: /filters/i }))  // reopen
    expect(screen.getByLabelText('Date from')).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Create FilterPanel.jsx**

Create `frontend/src/components/FilterPanel.jsx`:

```jsx
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal } from 'lucide-react'

const TYPES = [
  { value: '', label: 'All types' },
  { value: 'INCOME', label: 'Income' },
  { value: 'EXPENSE', label: 'Expense' },
  { value: 'TRANSFER', label: 'Transfer' },
]

const inputClass =
  'w-full border border-stone-200 rounded-lg px-3 py-2 text-[13px] bg-stone-50 text-stone-900 focus:outline-none focus:ring-2 focus:ring-green-500'

const labelClass = 'block text-[11px] font-semibold uppercase tracking-wide text-stone-500 mb-1'

export default function FilterPanel({ accounts, categories }) {
  const [open, setOpen] = useState(true)
  const [searchParams, setSearchParams] = useSearchParams()

  const dateFrom   = searchParams.get('date_from') ?? ''
  const dateTo     = searchParams.get('date_to') ?? ''
  const accountId  = searchParams.get('account_id') ?? ''
  const categoryId = searchParams.get('category_id') ?? ''
  const txType     = searchParams.get('transaction_type') ?? ''

  const activeCount = [dateFrom, dateTo, accountId, categoryId, txType].filter(Boolean).length

  function updateParam(key, value) {
    const next = new URLSearchParams(searchParams)
    if (value) { next.set(key, value) } else { next.delete(key) }
    next.delete('page')
    setSearchParams(next)
  }

  function clearFilters() {
    setSearchParams({})
  }

  return (
    <div className="mb-4">
      {/* Toggle row */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => setOpen(o => !o)}
          aria-label="Filters"
          className="flex items-center gap-2 border border-stone-200 bg-white rounded-lg px-3 py-1.5 text-[13px] text-stone-600 hover:bg-stone-50 transition-colors"
        >
          <SlidersHorizontal size={14} />
          Filters
          {activeCount > 0 && (
            <span className="bg-green-600 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
              {activeCount}
            </span>
          )}
        </button>
        {activeCount > 0 && (
          <button onClick={clearFilters} className="text-[12px] text-red-600 font-medium hover:text-red-800">
            ✕ Clear filters
          </button>
        )}
      </div>

      {/* Panel */}
      {open && (
        <div className="bg-white border border-stone-200 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className={labelClass}>From</label>
            <input type="date" value={dateFrom} onChange={e => updateParam('date_from', e.target.value)}
              aria-label="Date from" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>To</label>
            <input type="date" value={dateTo} onChange={e => updateParam('date_to', e.target.value)}
              aria-label="Date to" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Account</label>
            <select value={accountId} onChange={e => updateParam('account_id', e.target.value)}
              aria-label="Account filter" className={inputClass}>
              <option value="">All accounts</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Category</label>
            <select value={categoryId} onChange={e => updateParam('category_id', e.target.value)}
              aria-label="Category filter" className={inputClass}>
              <option value="">All categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Type</label>
            <select value={txType} onChange={e => updateParam('transaction_type', e.target.value)}
              aria-label="Type filter" className={inputClass}>
              {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Copy FilterBar.test.jsx to FilterPanel.test.jsx with updated import**

```bash
cp /home/daniel/dev/budget-app/frontend/src/components/FilterBar.test.jsx \
   /home/daniel/dev/budget-app/frontend/src/components/FilterPanel.test.jsx
```

Then edit `FilterPanel.test.jsx` — change line 5 from:
```jsx
import FilterBar from './FilterBar'
```
to:
```jsx
import FilterPanel from './FilterPanel'
```

And change all uses of `<FilterBar` to `<FilterPanel` in the render calls (two places in the file):
```jsx
<FilterPanel accounts={accounts} categories={categories} />
```

Also update the describe block names from `'FilterBar —'` to `'FilterPanel —'`.

Then append the toggle tests from Step 2 above to the end of `FilterPanel.test.jsx`.

- [ ] **Step 5: Run FilterPanel tests**

```bash
cd /home/daniel/dev/budget-app/frontend && npm test src/components/FilterPanel.test.jsx -- --reporter=verbose
```

Expected: all pass — filtering behavior tests pass (panel starts open), toggle tests pass.

- [ ] **Step 6: Delete FilterBar.jsx and FilterBar.test.jsx**

```bash
rm /home/daniel/dev/budget-app/frontend/src/components/FilterBar.jsx
rm /home/daniel/dev/budget-app/frontend/src/components/FilterBar.test.jsx
```

- [ ] **Step 7: Run all tests**

```bash
cd /home/daniel/dev/budget-app/frontend && npm test
```

Expected: all pass. (TransactionsPage still imports FilterBar — it will fail until Task 7. If that breaks the test run, fix the import now: change `import FilterBar from '../components/FilterBar'` to `import FilterPanel from '../components/FilterPanel'` in TransactionsPage.jsx without changing anything else yet.)

- [ ] **Step 8: Commit**

```bash
cd /home/daniel/dev/budget-app && git add frontend/src/components/FilterPanel.jsx frontend/src/components/FilterPanel.test.jsx
git rm frontend/src/components/FilterBar.jsx frontend/src/components/FilterBar.test.jsx
git commit -m "feat(ui): FilterPanel — collapsible filter panel replaces FilterBar (Step 6)"
```

---

## Task 7: TransactionsPage — Toggle State + FilterPanel + Table Styles

**Files:**
- Modify: `frontend/src/pages/TransactionsPage.jsx`

- [ ] **Step 1: Read the current TransactionsPage.jsx to understand all the existing logic to preserve**

```bash
cat /home/daniel/dev/budget-app/frontend/src/pages/TransactionsPage.jsx
```

Note: preserve all existing state, useEffect, filtering logic, pagination, and delete flow exactly. Only change: replace `FilterBar` import with `FilterPanel`, and update all Tailwind classes.

- [ ] **Step 2: Update import and restyle TransactionsPage.jsx**

In `frontend/src/pages/TransactionsPage.jsx`:

a) Replace:
```jsx
import FilterBar from '../components/FilterBar'
```
with:
```jsx
import FilterPanel from '../components/FilterPanel'
```

b) Replace the page wrapper opening div and title section. Find:
```jsx
<div className="p-4 max-w-5xl">
  <div className="flex items-center justify-between mb-4">
    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Transactions</h1>
    <Link
      to="/transactions/new"
      className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
    >
      <Plus size={16} />
      Add
    </Link>
  </div>
  <FilterBar accounts={accounts} categories={categories} />
```
Replace with:
```jsx
<div className="p-4 md:p-6 max-w-5xl">
  <div className="flex items-center justify-between mb-4">
    <h1 className="text-2xl font-bold tracking-tight text-stone-900">Transactions</h1>
  </div>
  <FilterPanel accounts={accounts} categories={categories} />
```

c) Update the desktop table container. Find:
```jsx
<div className="hidden md:block overflow-x-auto">
  <table className="w-full text-sm">
    <thead>
      <tr className="border-b border-gray-200 dark:border-gray-700 text-left">
        <th className="py-2 px-4 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Date</th>
        <th className="py-2 px-4 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Label</th>
        <th className="py-2 px-4 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Category</th>
        <th className="py-2 px-4 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Account</th>
        <th className="py-2 px-4 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 text-right">Amount</th>
        <th className="py-2 px-4"></th>
      </tr>
    </thead>
```
Replace with:
```jsx
<div className="hidden md:block overflow-x-auto">
  <table className="w-full text-sm bg-white rounded-xl border border-stone-200 overflow-hidden">
    <thead>
      <tr className="border-b border-stone-200 bg-stone-50 text-left">
        <th className="py-2 px-4 text-[10px] font-semibold uppercase tracking-widest text-stone-500">Date</th>
        <th className="py-2 px-4 text-[10px] font-semibold uppercase tracking-widest text-stone-500">Description</th>
        <th className="py-2 px-4 text-[10px] font-semibold uppercase tracking-widest text-stone-500">Category</th>
        <th className="py-2 px-4 text-[10px] font-semibold uppercase tracking-widest text-stone-500">Account</th>
        <th className="py-2 px-4 text-[10px] font-semibold uppercase tracking-widest text-stone-500 text-right">Amount</th>
        <th className="py-2 px-4"></th>
      </tr>
    </thead>
```

d) Update the loading state text. Find:
```jsx
<div className="p-6 text-sm text-gray-500 dark:text-gray-400">Loading transactions…</div>
```
Replace with:
```jsx
<div className="p-6 text-sm text-stone-500">Loading transactions…</div>
```

e) Update the empty state. Find any `text-gray-` classes in the empty state and replace with `text-stone-`.

f) Update the mobile FAB. Find:
```jsx
className="fixed bottom-20 right-4 z-40 md:hidden flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700"
```
Replace with:
```jsx
className="fixed bottom-20 right-4 z-40 md:hidden flex items-center justify-center w-14 h-14 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700"
```

g) Update pagination button styles. Find `border-gray-300` and `text-gray-` in the pagination section and replace with `border-stone-200` and `text-stone-`.

- [ ] **Step 3: Run TransactionsPage tests**

```bash
cd /home/daniel/dev/budget-app/frontend && npm test src/pages/TransactionsPage.test.jsx -- --reporter=verbose
```

Expected: all pass.

- [ ] **Step 4: Commit**

```bash
cd /home/daniel/dev/budget-app && git add frontend/src/pages/TransactionsPage.jsx
git commit -m "feat(ui): TransactionsPage — FilterPanel integration, stone palette, table restyle (Step 7)"
```

---

## Task 8: TransactionForm — Pill Toggle + Large Amount Display

**Files:**
- Modify: `frontend/src/components/TransactionForm.jsx`

The form logic, validation, and submit handler are unchanged. Only the visual markup changes.

- [ ] **Step 1: Run existing TransactionForm tests**

```bash
cd /home/daniel/dev/budget-app/frontend && npm test src/components/TransactionForm.test.jsx -- --reporter=verbose
```

Expected: all pass (before touching the file).

- [ ] **Step 2: Rewrite TransactionForm.jsx**

Replace `frontend/src/components/TransactionForm.jsx` entirely:

```jsx
import { useState } from 'react'
import CategoryPicker from './CategoryPicker'

const TYPES = [
  { value: 'INCOME',   label: 'Income'   },
  { value: 'EXPENSE',  label: 'Expense'  },
  { value: 'TRANSFER', label: 'Transfer' },
]

function todayString() {
  return new Date().toISOString().slice(0, 10)
}

const inputClass =
  'w-full border border-stone-200 rounded-lg px-3 py-2.5 text-[13px] bg-stone-50 text-stone-900 focus:outline-none focus:ring-2 focus:ring-green-500'

const labelClass = 'block text-[11px] font-semibold uppercase tracking-wide text-stone-500 mb-1'

function amountColor(type) {
  if (type === 'INCOME') return 'text-green-600'
  if (type === 'EXPENSE') return 'text-red-600'
  return 'text-stone-700'
}

function activeTypeColor(type) {
  if (type === 'INCOME') return 'text-green-600'
  if (type === 'EXPENSE') return 'text-red-600'
  return 'text-stone-700'
}

export default function TransactionForm({ transaction, accounts, categories, onSave }) {
  const editing = Boolean(transaction)
  const [type,               setType]               = useState(transaction?.transaction_type ?? 'EXPENSE')
  const [accountId,          setAccountId]          = useState(transaction?.account_id ?? (accounts[0]?.id ?? ''))
  const [amount,             setAmount]             = useState(transaction?.amount != null ? String(transaction.amount) : '')
  const [label,              setLabel]              = useState(transaction?.label ?? '')
  const [categoryId,         setCategoryId]         = useState(transaction?.category_id ?? null)
  const [date,               setDate]               = useState(transaction?.date ? transaction.date.slice(0, 10) : todayString())
  const [notes,              setNotes]              = useState(transaction?.notes ?? '')
  const [transferToAccountId, setTransferToAccountId] = useState(transaction?.transfer_to_account_id ?? '')

  const [labelError,  setLabelError]  = useState('')
  const [amountError, setAmountError] = useState('')
  const [apiError,    setApiError]    = useState('')
  const [saving,      setSaving]      = useState(false)

  function validate() {
    let valid = true
    if (!label.trim()) { setLabelError('Label is required'); valid = false }
    const parsed = parseFloat(amount)
    if (!amount || isNaN(parsed) || parsed <= 0) { setAmountError('Amount must be greater than 0'); valid = false }
    return valid
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setApiError('')
    setSaving(true)
    try {
      await onSave({
        transaction_type: type,
        account_id: accountId,
        amount: parseFloat(amount),
        label: label.trim(),
        ...(categoryId ? { category_id: categoryId } : {}),
        date: `${date}T00:00:00Z`,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
        ...(type === 'TRANSFER' && transferToAccountId ? { transfer_to_account_id: transferToAccountId } : {}),
      })
    } catch (err) {
      setApiError(err.response?.data?.error ?? err.message)
    } finally {
      setSaving(false)
    }
  }

  const selectedAccount = accounts.find(a => a.id === accountId)
  const destinationAccounts = accounts.filter(a => a.id !== accountId)

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {apiError && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{apiError}</p>
      )}

      {/* Type pill toggle */}
      <div>
        <label className={labelClass}>Type</label>
        <div className="bg-green-50 rounded-full p-1 flex" role="group" aria-label="Transaction type">
          {TYPES.map(t => (
            <button
              key={t.value}
              type="button"
              disabled={editing}
              onClick={() => { setType(t.value); setTransferToAccountId('') }}
              aria-pressed={type === t.value}
              className={`flex-1 py-2 text-[13px] rounded-full transition-all ${
                type === t.value
                  ? `bg-white shadow-sm font-semibold ${activeTypeColor(t.value)}`
                  : 'text-stone-500 hover:text-stone-700 disabled:opacity-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Large amount display */}
      <div className="text-center py-2">
        <label className={labelClass}>Amount</label>
        <div className="flex items-center justify-center gap-1 mt-1">
          <span className="text-2xl font-light text-stone-400">
            {selectedAccount?.currency ?? 'USD'}
          </span>
          <input
            type="number"
            value={amount}
            onChange={e => { setAmount(e.target.value); setAmountError('') }}
            min="0.01"
            step="0.01"
            placeholder="0.00"
            className={`text-4xl font-bold tracking-tight tabular-nums border-b-2 border-stone-200 focus:border-green-500 focus:outline-none bg-transparent text-center w-40 ${amountColor(type)}`}
          />
        </div>
        {amountError && <p className="mt-1 text-xs text-red-600">{amountError}</p>}
      </div>

      {/* Account */}
      <div>
        <label className={labelClass}>
          Account <span className="text-red-500">*</span>
        </label>
        <select
          value={accountId}
          disabled={editing}
          onChange={e => { setAccountId(e.target.value); if (transferToAccountId === e.target.value) setTransferToAccountId('') }}
          className={inputClass + ' disabled:opacity-60'}
        >
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>

      {type === 'TRANSFER' && (
        <div>
          <label htmlFor="transfer-to-account" className={labelClass}>
            Transfer To <span className="text-red-500">*</span>
          </label>
          <select
            id="transfer-to-account"
            value={transferToAccountId}
            disabled={editing}
            onChange={e => setTransferToAccountId(e.target.value)}
            className={inputClass + ' disabled:opacity-60'}
          >
            <option value="">— Select destination account —</option>
            {destinationAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
      )}

      {/* Label + Category in a grid */}
      <div>
        <label className={labelClass}>
          Description <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={label}
          onChange={e => { setLabel(e.target.value); setLabelError('') }}
          placeholder="e.g. Grocery shopping"
          className={inputClass}
        />
        {labelError && <p className="mt-1 text-xs text-red-600">{labelError}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Category</label>
          <CategoryPicker categories={categories} value={categoryId} onChange={setCategoryId} />
        </div>
        <div>
          <label className={labelClass}>Date <span className="text-red-500">*</span></label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>
          Notes <span className="text-stone-400 font-normal normal-case tracking-normal">(optional)</span>
        </label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          placeholder="Optional details…"
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full py-3 text-[13px] font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
    </form>
  )
}
```

- [ ] **Step 3: Run TransactionForm tests**

```bash
cd /home/daniel/dev/budget-app/frontend && npm test src/components/TransactionForm.test.jsx -- --reporter=verbose
```

Expected: all pass. The form logic (validation, submit, aria-pressed) is unchanged.

- [ ] **Step 4: Update AddTransactionPage.jsx and EditTransactionPage.jsx wrappers**

Both pages are thin wrappers around `TransactionForm`. Update their page-level div and heading classes:

In `frontend/src/pages/AddTransactionPage.jsx` and `frontend/src/pages/EditTransactionPage.jsx`, find any `bg-gray-*`, `dark:*`, or `text-gray-*` classes and replace with stone equivalents. The typical change is the outer wrapper:
```jsx
// Before
<div className="p-4 max-w-lg">
// After
<div className="p-4 md:p-6 max-w-lg">
```
And heading:
```jsx
// Before
className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6"
// After
className="text-2xl font-bold tracking-tight text-stone-900 mb-6"
```

- [ ] **Step 5: Run Add/Edit Transaction page tests**

```bash
cd /home/daniel/dev/budget-app/frontend && npm test src/pages/AddTransactionPage.test.jsx src/pages/EditTransactionPage.test.jsx -- --reporter=verbose
```

Expected: all pass.

- [ ] **Step 6: Commit**

```bash
cd /home/daniel/dev/budget-app && git add frontend/src/components/TransactionForm.jsx frontend/src/pages/AddTransactionPage.jsx frontend/src/pages/EditTransactionPage.jsx
git commit -m "feat(ui): TransactionForm — pill type toggle, large amount display, stone inputs (Step 8)"
```

---

## Task 9: ReportsPage — Tabs + Re-colored Charts

**Files:**
- Modify: `frontend/src/pages/ReportsPage.jsx`

**Critical constraint:** The existing tests expect all three sections' content to be simultaneously findable in the DOM. Tabs are implemented using `hidden` CSS class (not conditional rendering), so all content remains in the DOM — only visually toggled.

- [ ] **Step 1: Write a failing test for tab switching**

Append to `frontend/src/pages/ReportsPage.test.jsx`:

```jsx
describe('ReportsPage — tab navigation', () => {
  it('renders tab buttons for all three sections', async () => {
    renderPage()
    await screen.findByRole('heading', { name: 'Reports' })
    expect(screen.getByRole('button', { name: /spending by category/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /monthly summary/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /account balances/i })).toBeInTheDocument()
  })

  it('spending section is visible by default', async () => {
    renderPage()
    await screen.findByRole('heading', { name: 'Reports' })
    const spendingSection = screen.getByTestId('tab-spending')
    expect(spendingSection).not.toHaveClass('hidden')
  })

  it('monthly section is hidden by default', async () => {
    renderPage()
    await screen.findByRole('heading', { name: 'Reports' })
    const monthlySection = screen.getByTestId('tab-monthly')
    expect(monthlySection).toHaveClass('hidden')
  })

  it('clicking Monthly Summary tab shows monthly section', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByRole('heading', { name: 'Reports' })
    await user.click(screen.getByRole('button', { name: /monthly summary/i }))
    expect(screen.getByTestId('tab-monthly')).not.toHaveClass('hidden')
    expect(screen.getByTestId('tab-spending')).toHaveClass('hidden')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /home/daniel/dev/budget-app/frontend && npm test src/pages/ReportsPage.test.jsx -- --reporter=verbose
```

Expected: tab navigation tests FAIL (no tab buttons or data-testid attributes yet). All other tests still PASS.

- [ ] **Step 3: Rewrite ReportsPage.jsx**

Read the full current file first:
```bash
cat /home/daniel/dev/budget-app/frontend/src/pages/ReportsPage.jsx
```

Then replace it entirely. Preserve ALL existing state variables (`dateFrom`, `dateTo`, `year`, `spending`, `monthlySummary`, `accounts`, `loadingSpending`, `loadingMonthly`, `loadingAccounts`, `errorSpending`, `errorMonthly`, `errorAccounts`), ALL `useEffect` hooks (unchanged), and ALL API calls. Only the JSX return changes:

```jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { getAccountBalances, getSpendingByCategory, getMonthlySummary } from '../api/reports'
import { logger } from '../utils/logger'

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function currentMonthRange() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate()
  return {
    date_from: `${year}-${month}-01`,
    date_to: `${year}-${month}-${String(lastDay).padStart(2, '0')}`,
  }
}

const YEAR_OPTIONS = (() => {
  const current = new Date().getFullYear()
  return [current - 2, current - 1, current, current + 1].map(String)
})()

const SPENDING_COLORS = ['#dc2626','#f87171','#fca5a5','#fecaca','#fee2e2']

const TYPE_LABELS = { CHECKING: 'Checking', SAVINGS: 'Savings', CREDIT_CARD: 'Credit Card' }
const TYPE_BADGE = {
  CHECKING: 'bg-green-100 text-green-700',
  SAVINGS: 'bg-green-100 text-green-700',
  CREDIT_CARD: 'bg-red-50 text-red-600',
}

const inputClass = 'border border-stone-200 rounded-lg px-3 py-2 text-[13px] bg-stone-50 text-stone-900 focus:outline-none focus:ring-2 focus:ring-green-500'
const labelClass = 'block text-[11px] font-semibold uppercase tracking-wide text-stone-500 mb-1'

export default function ReportsPage() {
  const navigate = useNavigate()
  const { date_from: defaultFrom, date_to: defaultTo } = currentMonthRange()

  const [activeTab, setActiveTab]           = useState('spending')
  const [dateFrom, setDateFrom]             = useState(defaultFrom)
  const [dateTo, setDateTo]                 = useState(defaultTo)
  const [year, setYear]                     = useState(String(new Date().getFullYear()))
  const [spending, setSpending]             = useState([])
  const [monthlySummary, setMonthlySummary] = useState([])
  const [accounts, setAccounts]             = useState([])
  const [loadingSpending, setLoadingSpending]   = useState(true)
  const [loadingMonthly, setLoadingMonthly]     = useState(true)
  const [loadingAccounts, setLoadingAccounts]   = useState(true)
  const [errorSpending, setErrorSpending]       = useState('')
  const [errorMonthly, setErrorMonthly]         = useState('')
  const [errorAccounts, setErrorAccounts]       = useState('')

  useEffect(() => {
    setLoadingSpending(true)
    setErrorSpending('')
    getSpendingByCategory({ date_from: dateFrom, date_to: dateTo })
      .then(res => setSpending(res.data))
      .catch(err => { logger.error('Failed to load spending', err); setErrorSpending('Failed to load spending data.') })
      .finally(() => setLoadingSpending(false))
  }, [dateFrom, dateTo])

  useEffect(() => {
    setLoadingMonthly(true)
    setErrorMonthly('')
    getMonthlySummary({ year })
      .then(res => setMonthlySummary(res.data))
      .catch(err => { logger.error('Failed to load monthly summary', err); setErrorMonthly('Failed to load monthly summary.') })
      .finally(() => setLoadingMonthly(false))
  }, [year])

  useEffect(() => {
    setLoadingAccounts(true)
    setErrorAccounts('')
    getAccountBalances()
      .then(res => setAccounts(res.data))
      .catch(err => { logger.error('Failed to load account balances', err); setErrorAccounts('Failed to load account balances.') })
      .finally(() => setLoadingAccounts(false))
  }, [])

  const tabs = [
    { id: 'spending',  label: 'Spending by Category' },
    { id: 'monthly',   label: 'Monthly Summary'      },
    { id: 'accounts',  label: 'Account Balances'     },
  ]

  return (
    <div className="p-4 md:p-6 max-w-5xl">
      <h1 className="text-2xl font-bold tracking-tight text-stone-900 mb-5">Reports</h1>

      {/* Tab bar */}
      <div className="bg-white border border-stone-200 rounded-xl p-1 flex w-fit mb-5 gap-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-[12px] font-medium rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-green-600 text-white font-semibold'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Spending by Category */}
      <div data-testid="tab-spending" className={activeTab !== 'spending' ? 'hidden' : ''}>
        {loadingSpending && <p className="text-sm text-stone-500">Loading spending data…</p>}
        {errorSpending && <p className="text-sm text-red-600">{errorSpending}</p>}
        {!loadingSpending && !errorSpending && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-stone-200 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div>
                  <label htmlFor="spending-from" className={labelClass}>From</label>
                  <input id="spending-from" type="date" value={dateFrom}
                    onChange={e => setDateFrom(e.target.value)}
                    aria-label="From" className={inputClass} />
                </div>
                <span className="text-stone-400 mt-4">→</span>
                <div>
                  <label htmlFor="spending-to" className={labelClass}>To</label>
                  <input id="spending-to" type="date" value={dateTo}
                    onChange={e => setDateTo(e.target.value)}
                    aria-label="To" className={inputClass} />
                </div>
              </div>
              {spending.length === 0 ? (
                <p className="text-sm text-stone-400">No expenses in this period.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {spending.map((item, i) => (
                    <div key={item.category_id}>
                      <div className="flex justify-between mb-1">
                        <span className="text-[13px] text-stone-700 font-medium">{item.category_name}</span>
                        <span className="text-[13px] font-bold text-red-600 tabular-nums">${parseFloat(item.total).toFixed(2)}</span>
                      </div>
                      <div className="h-2 bg-red-50 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{
                          width: `${(item.total / spending[0].total) * 100}%`,
                          background: SPENDING_COLORS[i % SPENDING_COLORS.length],
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-white rounded-xl border border-stone-200 p-5">
              {spending.length > 0 && (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={spending}
                      dataKey="total"
                      nameKey="category_name"
                      cx="50%" cy="50%"
                      outerRadius={90}
                      onClick={entry => navigate(
                        `/transactions?category_id=${entry.category_id}&date_from=${dateFrom}&date_to=${dateTo}`
                      )}
                      style={{ cursor: 'pointer' }}
                    >
                      {spending.map((entry, i) => (
                        <Cell key={entry.category_id} fill={SPENDING_COLORS[i % SPENDING_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`$${parseFloat(value).toFixed(2)}`, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Monthly Summary */}
      <div data-testid="tab-monthly" className={activeTab !== 'monthly' ? 'hidden' : ''}>
        {loadingMonthly && <p className="text-sm text-stone-500">Loading monthly summary…</p>}
        {errorMonthly && <p className="text-sm text-red-600">{errorMonthly}</p>}
        {!loadingMonthly && !errorMonthly && (
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <div className="flex items-center gap-3 mb-4">
              <label htmlFor="year-select" className={labelClass}>Year</label>
              <select id="year-select" value={year} onChange={e => setYear(e.target.value)}
                aria-label="Year" className={inputClass}>
                {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlySummary.map(m => ({ ...m, month: MONTH_NAMES[m.month - 1] }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#78716c' }} />
                <YAxis tick={{ fontSize: 12, fill: '#78716c' }} />
                <Tooltip formatter={v => `$${parseFloat(v).toFixed(2)}`} />
                <Legend />
                <Bar dataKey="income" name="Income" fill="#16a34a" />
                <Bar dataKey="expenses" name="Expenses" fill="#dc2626" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Account Balances */}
      <div data-testid="tab-accounts" className={activeTab !== 'accounts' ? 'hidden' : ''}>
        {loadingAccounts && <p className="text-sm text-stone-500">Loading account balances…</p>}
        {errorAccounts && <p className="text-sm text-red-600">{errorAccounts}</p>}
        {!loadingAccounts && !errorAccounts && (
          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            {accounts.length === 0 ? (
              <p className="p-5 text-sm text-stone-400">No accounts yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50">
                    <th className="py-3 px-5 text-left text-[10px] font-semibold uppercase tracking-widest text-stone-500">Account</th>
                    <th className="py-3 px-5 text-left text-[10px] font-semibold uppercase tracking-widest text-stone-500">Type</th>
                    <th className="py-3 px-5 text-right text-[10px] font-semibold uppercase tracking-widest text-stone-500">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map(account => {
                    const bal = parseFloat(account.balance)
                    return (
                      <tr key={account.id} className="border-b border-stone-100 last:border-0">
                        <td className="py-3 px-5 font-medium text-stone-900">{account.name}</td>
                        <td className="py-3 px-5">
                          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${TYPE_BADGE[account.account_type] ?? 'bg-stone-100 text-stone-500'}`}>
                            {TYPE_LABELS[account.account_type] ?? account.account_type}
                          </span>
                        </td>
                        <td className={`py-3 px-5 text-right font-bold tabular-nums ${bal < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {account.currency} {bal.toFixed(2)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run ReportsPage tests**

```bash
cd /home/daniel/dev/budget-app/frontend && npm test src/pages/ReportsPage.test.jsx -- --reporter=verbose
```

Expected: all tests pass including the new tab navigation tests.

**If `getByLabelText('From')` / `getByLabelText('To')` fail:** The existing tests use `aria-label="From"` and `aria-label="To"` on the date inputs. The new markup uses `aria-label="From"` and `aria-label="To"` — verify these match exactly.

- [ ] **Step 5: Commit**

```bash
cd /home/daniel/dev/budget-app && git add frontend/src/pages/ReportsPage.jsx frontend/src/pages/ReportsPage.test.jsx
git commit -m "feat(ui): ReportsPage — tabs, re-colored charts, stone palette (Step 9)"
```

---

## Task 10: AccountsPage — 2-Column Grid

**Files:**
- Modify: `frontend/src/pages/AccountsPage.jsx`

- [ ] **Step 1: Run existing AccountsPage tests**

```bash
cd /home/daniel/dev/budget-app/frontend && npm test src/pages/AccountsPage.test.jsx -- --reporter=verbose
```

Expected: all pass.

- [ ] **Step 2: Update AccountsPage.jsx**

Read the full file then apply these targeted changes:

a) Replace the outer `<ul>` / `<li>` list wrapping `AccountCard` with a 2-column grid. Find:
```jsx
<ul className="space-y-3">
  {accounts.map(account => (
    <li key={account.id} className="flex items-center gap-2">
      <div className="flex-1">
        <AccountCard account={account} />
      </div>
```
Replace with:
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {accounts.map(account => (
    <div key={account.id} className="flex items-center gap-2">
      <div className="flex-1">
        <AccountCard account={account} />
      </div>
```

b) Update the closing tags accordingly (`</li>` → `</div>`, `</ul>` → `</div>`).

c) Update the page header button. Find:
```jsx
className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
```
Replace with:
```jsx
className="flex items-center gap-1.5 px-4 py-2 border border-green-600 text-green-600 text-sm font-semibold rounded-lg hover:bg-green-50 transition-colors"
```

d) Update loading and error text styles. Replace `text-gray-500 dark:text-gray-400` → `text-stone-500` and `text-gray-900 dark:text-gray-100` → `text-stone-900` throughout.

e) Wrap the whole page in consistent padding:
```jsx
<div className="p-4 md:p-6 max-w-4xl">
```

- [ ] **Step 3: Run AccountsPage tests**

```bash
cd /home/daniel/dev/budget-app/frontend && npm test src/pages/AccountsPage.test.jsx -- --reporter=verbose
```

Expected: all pass.

- [ ] **Step 4: Commit**

```bash
cd /home/daniel/dev/budget-app && git add frontend/src/pages/AccountsPage.jsx
git commit -m "feat(ui): AccountsPage — 2-col grid (Step 10)"
```

---

## Task 11: CategoriesPage — 2-Column Grid + Icon Tiles

**Files:**
- Modify: `frontend/src/pages/CategoriesPage.jsx`

- [ ] **Step 1: Run existing CategoriesPage tests**

```bash
cd /home/daniel/dev/budget-app/frontend && npm test src/pages/CategoriesPage.test.jsx -- --reporter=verbose
```

Expected: all pass.

- [ ] **Step 2: Update CategoriesPage.jsx**

Read the full file then apply these targeted changes:

a) Replace the outer list with a 2-column grid and updated card layout. Find the `<ul>` wrapping the category items and replace the list structure with:

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
  {categories.map(cat => (
    <div key={cat.id} className="bg-white rounded-xl border border-stone-200 p-4 flex items-center gap-3">
      {/* Emoji icon tile */}
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
        style={{ background: (cat.color ?? '#6b7280') + '1f' }}
      >
        {cat.icon ?? '📁'}
      </div>
      {/* Name + color swatch */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[14px] font-semibold text-stone-900 truncate">{cat.name}</p>
          {cat.is_default && (
            <span className="text-[10px] font-semibold bg-stone-100 text-stone-400 px-2 py-0.5 rounded-full">Default</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="inline-block w-3 h-3 rounded-full shrink-0" style={{ background: cat.color ?? '#6b7280' }} />
          <span className="text-[11px] text-stone-400 font-mono">{cat.color ?? ''}</span>
        </div>
      </div>
      {/* Actions — only for custom categories */}
      {!cat.is_default && (
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => { setEditing(cat); setShowForm(true) }}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
            aria-label={`Edit ${cat.name}`}
          >
            <Pencil size={14} />
          </button>
          {deleteId === cat.id ? (
            <span className="flex items-center gap-1 text-sm">
              <button onClick={() => handleDelete(cat.id)} className="text-red-600 font-medium text-xs">Yes</button>
              <button onClick={() => setDeleteId(null)} className="text-stone-500 text-xs">No</button>
            </span>
          ) : (
            <button
              onClick={() => setDeleteId(cat.id)}
              className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-stone-100"
              aria-label={`Delete ${cat.name}`}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  ))}
</div>
```

b) Update the page header button style:
```jsx
className="flex items-center gap-1.5 px-4 py-2 border border-green-600 text-green-600 text-sm font-semibold rounded-lg hover:bg-green-50 transition-colors"
```

c) Wrap in `<div className="p-4 md:p-6 max-w-4xl">`.

d) Replace all remaining `text-gray-` / `dark:` classes with stone equivalents.

- [ ] **Step 3: Run CategoriesPage tests**

```bash
cd /home/daniel/dev/budget-app/frontend && npm test src/pages/CategoriesPage.test.jsx -- --reporter=verbose
```

Expected: all pass.

- [ ] **Step 4: Commit**

```bash
cd /home/daniel/dev/budget-app && git add frontend/src/pages/CategoriesPage.jsx
git commit -m "feat(ui): CategoriesPage — 2-col grid, emoji icon tiles (Step 11)"
```

---

## Task 12: AccountForm + CategoryForm — Modal Styles

**Files:**
- Modify: `frontend/src/components/AccountForm.jsx`
- Modify: `frontend/src/components/CategoryForm.jsx`

- [ ] **Step 1: Run existing form tests**

```bash
cd /home/daniel/dev/budget-app/frontend && npm test src/components/AccountForm.test.jsx src/components/CategoryForm.test.jsx -- --reporter=verbose
```

Expected: all pass.

- [ ] **Step 2: Update AccountForm.jsx input/button styles**

In `frontend/src/components/AccountForm.jsx`, make these replacements throughout:

Replace all occurrences of the input class string:
```jsx
'border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500'
```
With:
```jsx
'w-full border border-stone-200 rounded-lg px-3 py-2.5 text-[13px] bg-stone-50 text-stone-900 focus:outline-none focus:ring-2 focus:ring-green-500'
```

Replace the modal overlay:
```jsx
className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
```
Keep as-is (this is fine).

Replace the modal container classes. Find `bg-white dark:bg-gray-800 rounded-lg shadow-xl` and replace with `bg-white rounded-2xl shadow-xl`.

Replace the Save button:
```jsx
className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
```
With:
```jsx
className="px-4 py-2.5 bg-green-600 text-white text-[13px] font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50"
```

Replace the Cancel button `text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600` with `text-stone-600 border border-stone-200`.

Replace all `text-sm font-medium text-gray-700 dark:text-gray-300` label classes with `text-[11px] font-semibold uppercase tracking-wide text-stone-500`.

Replace `text-xs text-red-600` error classes with `text-[11px] text-red-600`.

Replace modal title `text-lg font-semibold text-gray-900 dark:text-gray-100` with `text-lg font-bold text-stone-900`.

- [ ] **Step 3: Update CategoryForm.jsx with the same substitutions**

Apply the same input/button/label/modal class replacements as Step 2 to `frontend/src/components/CategoryForm.jsx`.

- [ ] **Step 4: Run all form tests**

```bash
cd /home/daniel/dev/budget-app/frontend && npm test src/components/AccountForm.test.jsx src/components/CategoryForm.test.jsx -- --reporter=verbose
```

Expected: all pass.

- [ ] **Step 5: Run the full test suite**

```bash
cd /home/daniel/dev/budget-app/frontend && npm test
```

Expected: all tests pass. This is the final verification before committing.

- [ ] **Step 6: Commit**

```bash
cd /home/daniel/dev/budget-app && git add frontend/src/components/AccountForm.jsx frontend/src/components/CategoryForm.jsx
git commit -m "feat(ui): AccountForm + CategoryForm — stone inputs, green buttons, rounded modals (Step 12)"
```

---

## Final Check

After all 12 tasks complete:

```bash
cd /home/daniel/dev/budget-app/frontend && npm test
```

All tests should pass. Start the app locally and verify visually:

```bash
cd /home/daniel/dev/budget-app && bash dev.sh
```

Open `http://localhost:5173` (or the port Vite reports).
