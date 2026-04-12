import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SlidersHorizontal } from 'lucide-react'

const inputClass =
  'w-full border border-stone-200 rounded-lg px-3 py-2 text-[13px] bg-stone-50 text-stone-900 focus:outline-none focus:ring-2 focus:ring-green-500'

const labelClass = 'block text-[11px] font-semibold uppercase tracking-wide text-stone-500 mb-1'

export default function FilterPanel({ accounts, categories }) {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()

  const TYPES = [
    { value: '',         label: t('filter.allTypes') },
    { value: 'INCOME',   label: t('txType.income')  },
    { value: 'EXPENSE',  label: t('txType.expense') },
    { value: 'TRANSFER', label: t('txType.transfer') },
  ]

  const dateFrom   = searchParams.get('date_from') ?? ''
  const dateTo     = searchParams.get('date_to') ?? ''
  const accountId  = searchParams.get('account_id') ?? ''
  const categoryId = searchParams.get('category_id') ?? ''
  const txType     = searchParams.get('transaction_type') ?? ''

  const activeCount = [dateFrom, dateTo, accountId, categoryId, txType].filter(Boolean).length
  const [open, setOpen] = useState(activeCount > 0)

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
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => setOpen(o => !o)}
          aria-label={t('filter.toggle')}
          className="flex items-center gap-2 border border-stone-200 bg-white rounded-lg px-3 py-1.5 text-[13px] text-stone-600 hover:bg-stone-50 transition-colors"
        >
          <SlidersHorizontal size={14} />
          {t('filter.toggle')}
          {activeCount > 0 && (
            <span className="bg-green-600 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
              {activeCount}
            </span>
          )}
        </button>
        {activeCount > 0 && (
          <button onClick={clearFilters} className="text-[12px] text-red-600 font-medium hover:text-red-800">
            {t('filter.clearFilters')}
          </button>
        )}
      </div>

      {open && (
        <div className="bg-white border border-stone-200 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className={labelClass}>{t('filter.labelFrom')}</label>
            <input type="date" value={dateFrom} onChange={e => updateParam('date_from', e.target.value)}
              aria-label={t('filter.labelFrom')} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>{t('filter.labelTo')}</label>
            <input type="date" value={dateTo} onChange={e => updateParam('date_to', e.target.value)}
              aria-label={t('filter.labelTo')} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>{t('filter.labelAccount')}</label>
            <select value={accountId} onChange={e => updateParam('account_id', e.target.value)}
              aria-label={t('filter.labelAccount')} className={inputClass}>
              <option value="">{t('filter.allAccounts')}</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>{t('filter.labelCategory')}</label>
            <select value={categoryId} onChange={e => updateParam('category_id', e.target.value)}
              aria-label={t('filter.labelCategory')} className={inputClass}>
              <option value="">{t('filter.allCategories')}</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>{t('filter.labelType')}</label>
            <select value={txType} onChange={e => updateParam('transaction_type', e.target.value)}
              aria-label={t('filter.labelType')} className={inputClass}>
              {TYPES.map(ty => <option key={ty.value} value={ty.value}>{ty.label}</option>)}
            </select>
          </div>
        </div>
      )}
    </div>
  )
}
