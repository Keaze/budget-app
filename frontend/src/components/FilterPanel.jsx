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
