import { useSearchParams } from 'react-router-dom'

const TYPES = [
  { value: '', label: 'All types' },
  { value: 'INCOME', label: 'Income' },
  { value: 'EXPENSE', label: 'Expense' },
  { value: 'TRANSFER', label: 'Transfer' },
]

export default function FilterBar({ accounts, categories }) {
  const [searchParams, setSearchParams] = useSearchParams()

  const dateFrom = searchParams.get('date_from') ?? ''
  const dateTo = searchParams.get('date_to') ?? ''
  const accountId = searchParams.get('account_id') ?? ''
  const categoryId = searchParams.get('category_id') ?? ''
  const txType = searchParams.get('transaction_type') ?? ''

  function updateParam(key, value) {
    const next = new URLSearchParams(searchParams)
    if (value) {
      next.set(key, value)
    } else {
      next.delete(key)
    }
    next.delete('page')
    setSearchParams(next)
  }

  function clearFilters() {
    setSearchParams({})
  }

  const inputClass =
    'border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="flex flex-wrap gap-2 mb-4 items-end">
      <div>
        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-0.5">From</label>
        <input
          type="date"
          value={dateFrom}
          onChange={e => updateParam('date_from', e.target.value)}
          aria-label="Date from"
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-0.5">To</label>
        <input
          type="date"
          value={dateTo}
          onChange={e => updateParam('date_to', e.target.value)}
          aria-label="Date to"
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-0.5">Account</label>
        <select
          value={accountId}
          onChange={e => updateParam('account_id', e.target.value)}
          aria-label="Account filter"
          className={inputClass}
        >
          <option value="">All accounts</option>
          {accounts.map(a => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-0.5">Category</label>
        <select
          value={categoryId}
          onChange={e => updateParam('category_id', e.target.value)}
          aria-label="Category filter"
          className={inputClass}
        >
          <option value="">All categories</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-0.5">Type</label>
        <select
          value={txType}
          onChange={e => updateParam('transaction_type', e.target.value)}
          aria-label="Type filter"
          className={inputClass}
        >
          {TYPES.map(t => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={clearFilters}
        className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
      >
        Clear filters
      </button>
    </div>
  )
}
