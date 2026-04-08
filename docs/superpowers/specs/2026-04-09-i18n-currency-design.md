# i18n & Multi-Currency Design
**Date:** 2026-04-09
**Scope:** Frontend only — no backend changes required

---

## Overview

Add German language support (full UI translation) and proper multi-currency display to the budget app. A Settings page lets the user switch language and choose their preferred decimal separator independently.

---

## 1. i18n Architecture

### Library
- Install `i18next` and `react-i18next`
- Initialize in `src/i18n.js` with two resources: `en` and `de`
- `I18nextProvider` wraps the app in `main.jsx`

### Translation files
- `src/locales/en.json` — English strings (flat key-value, no namespaces)
- `src/locales/de.json` — German strings, same keys

### Active language persistence
- Stored in `localStorage` under key `budget_language`
- Read by i18next on init; defaults to `'en'`
- Changing language calls `i18n.changeLanguage(lang)` and persists to `localStorage`

### String extraction
Every component with user-visible text calls `const { t } = useTranslation()` and replaces hardcoded strings with `t('key')`. Covers:
- All page headings, labels, button text, empty states, error messages
- Navigation item labels in `Layout.jsx`
- `TYPE_LABELS` maps (e.g. `CHECKING: 'Checking'`) → `t('accountType.checking')`
- Month abbreviations in `ReportsPage` → derived from `Intl.DateTimeFormat` using the active locale, removing the hardcoded `MONTH_NAMES` array

### Key structure (representative)
```json
{
  "nav.dashboard": "Dashboard",
  "nav.transactions": "Transactions",
  "nav.accounts": "Accounts",
  "nav.categories": "Categories",
  "nav.reports": "Reports",
  "nav.settings": "Settings",
  "account.viewTransactions": "Click to view transactions",
  "accountType.checking": "Checking",
  "accountType.savings": "Savings",
  "accountType.creditCard": "Credit Card",
  "dashboard.noExpenses": "No expenses this month.",
  "common.delete": "Delete",
  "common.confirm": "Yes",
  "common.cancel": "No",
  ...
}
```

---

## 2. Currency Formatting

### Utility
`src/utils/formatAmount.js` exports:

```js
formatAmount(amount, currency, decimalSep) → string
```

Implementation:
1. Use `Intl.NumberFormat` with `style: 'currency'` and the given ISO currency code (e.g. `'EUR'`, `'USD'`, `'GBP'`). This handles symbol placement, grouping, and decimal places correctly per currency.
2. Post-pass: if the user's `decimalSep` preference differs from what `Intl` produced, swap `.` ↔ `,` and adjust the grouping separator to match.

Examples:
- EUR, user prefers `.`: `Intl` → `1.234,56 €` → swapped → `1,234.56 €`
- EUR, user prefers `,`: `Intl` → `1,234.56 €` → swapped → `1.234,56 €`
- USD, user prefers `.`: `$1,234.56` (no swap needed)

### Currency source
- `currency` comes from `account.currency` (already stored in the DB, e.g. `'USD'`, `'EUR'`)
- Components that display amounts but don't receive an account object directly (e.g. `TransactionCard`, `TransactionRow`) receive `currency` as an explicit prop from their parent page
- `decimalSep` comes from `useSettings()` (see Section 3)

### Affected sites
| Component/Page | Change |
|---|---|
| `AccountCard` | Replace `{account.currency} {balance.toFixed(2)}` with `formatAmount` |
| `TransactionCard` | Add `currency` prop; replace `parseFloat(amount).toFixed(2)` |
| `TransactionRow` | Add `currency` prop; replace amount formatting |
| `DashboardPage` | Replace hardcoded `$` in spending bars |
| `ReportsPage` | Replace amount formatting in chart tooltips and balance table |

---

## 3. Settings Page & Global State

### SettingsContext
`src/contexts/SettingsContext.jsx` provides:
- `language`: `'en'` | `'de'`
- `decimalSep`: `'.'` | `','`
- `setLanguage(lang)` — calls `i18n.changeLanguage()`, persists to `localStorage`
- `setDecimalSep(sep)` — persists to `localStorage`

On mount: reads `budget_language` and `budget_decimal_sep` from `localStorage`, defaulting to `'en'` and `'.'`.

`SettingsProvider` wraps the app alongside `I18nextProvider` in `main.jsx`.

### Settings page
Route: `/settings`
File: `src/pages/SettingsPage.jsx`

Controls:
- **Language** — segmented control: `English` / `Deutsch`
- **Decimal separator** — two radio buttons: `. (1,234.56)` / `, (1.234,56)`

No backend call needed — single-user app, `localStorage` is sufficient.

### Navigation
`Layout.jsx` gains a Settings entry (gear icon) in both the sidebar and the bottom tab bar. Total nav items: Dashboard, Transactions, Reports, Accounts, Categories, Settings.

---

## 4. Testing

Existing tests that assert on hardcoded string content are updated to either:
- Wrap the component in the i18n provider with English translations (so strings stay the same in tests), or
- Query by role/testid rather than text where practical

No test assertions are deleted — they are updated to match the new rendered output.

Amount-formatting tests: unit tests for `formatAmount` covering symbol placement, decimal swap, and edge cases (negative amounts, zero).

---

## Out of Scope

- Backend changes — currency is already stored per-account; language/decimal preferences are frontend-only
- Currency conversion — each account displays in its own currency; cross-currency totals are not shown
- More than two languages at this stage
- RTL language support
