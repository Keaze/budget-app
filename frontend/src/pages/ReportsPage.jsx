import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSettings } from '../contexts/SettingsContext'
import { formatAmount } from '../utils/formatAmount'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { getAccountBalances, getSpendingByCategory, getMonthlySummary } from '../api/reports'
import { logger } from '../utils/logger'

function getMonthAbbr(monthIndex, locale) {
  return new Intl.DateTimeFormat(locale, { month: 'short' }).format(new Date(2000, monthIndex, 1))
}

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

const inputClass = 'border border-stone-200 rounded-lg px-3 py-2 text-[13px] bg-stone-50 text-stone-900 focus:outline-none focus:ring-2 focus:ring-green-500'
const labelClass = 'block text-[11px] font-semibold uppercase tracking-wide text-stone-500 mb-1'

export default function ReportsPage() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const { decimalSep } = useSettings()
  const { date_from: defaultFrom, date_to: defaultTo } = currentMonthRange()

  const TYPE_LABELS = {
    CHECKING: t('accountType.checking'),
    SAVINGS: t('accountType.savings'),
    CREDIT_CARD: t('accountType.creditCard'),
  }
  const TYPE_BADGE = {
    CHECKING: 'bg-green-100 text-green-700',
    SAVINGS: 'bg-green-100 text-green-700',
    CREDIT_CARD: 'bg-red-50 text-red-600',
  }

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
      .catch(err => { logger.error('Failed to load spending', err); setErrorSpending(t('reports.errorSpending')) })
      .finally(() => setLoadingSpending(false))
  }, [dateFrom, dateTo, t])

  useEffect(() => {
    setLoadingMonthly(true)
    setErrorMonthly('')
    getMonthlySummary({ year })
      .then(res => setMonthlySummary(res.data))
      .catch(err => { logger.error('Failed to load monthly summary', err); setErrorMonthly(t('reports.errorMonthly')) })
      .finally(() => setLoadingMonthly(false))
  }, [year, t])

  useEffect(() => {
    setLoadingAccounts(true)
    setErrorAccounts('')
    getAccountBalances()
      .then(res => setAccounts(res.data))
      .catch(err => { logger.error('Failed to load account balances', err); setErrorAccounts(t('reports.errorAccounts')) })
      .finally(() => setLoadingAccounts(false))
  }, [t])

  const displayCurrency = accounts[0]?.currency ?? 'USD'

  const tabs = [
    { id: 'spending',  label: t('reports.tabSpending')  },
    { id: 'monthly',   label: t('reports.tabMonthly')   },
    { id: 'accounts',  label: t('reports.tabAccounts')  },
  ]

  return (
    <div className="p-4 md:p-6 max-w-5xl">
      <h1 className="text-2xl font-bold tracking-tight text-stone-900 mb-5">{t('reports.title')}</h1>

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
        {loadingSpending && <p className="text-sm text-stone-500">{t('reports.loadingSpending')}</p>}
        {errorSpending && <p className="text-sm text-red-600">{errorSpending}</p>}
        {!loadingSpending && !errorSpending && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-stone-200 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div>
                  <label htmlFor="spending-from" className={labelClass}>{t('reports.labelFrom')}</label>
                  <input id="spending-from" type="date" value={dateFrom}
                    onChange={e => setDateFrom(e.target.value)}
                    aria-label={t('reports.labelFrom')} className={inputClass} />
                </div>
                <span className="text-stone-400 mt-4">→</span>
                <div>
                  <label htmlFor="spending-to" className={labelClass}>{t('reports.labelTo')}</label>
                  <input id="spending-to" type="date" value={dateTo}
                    onChange={e => setDateTo(e.target.value)}
                    aria-label={t('reports.labelTo')} className={inputClass} />
                </div>
              </div>
              {spending.length === 0 ? (
                <p className="text-sm text-stone-400">{t('reports.noExpenses')}</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {(() => {
                    const maxSpending = Math.max(...spending.map(s => s.total))
                    return spending.map((item, i) => (
                      <div key={item.category_id}>
                        <div className="flex justify-between mb-1">
                          <span className="text-[13px] text-stone-700 font-medium">{item.category_name}</span>
                          <span className="text-[13px] font-bold text-red-600 tabular-nums">
                            {formatAmount(item.total, displayCurrency, decimalSep)}
                          </span>
                        </div>
                        <div className="h-2 bg-red-50 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            data-testid={`spending-bar-fill-${item.category_id}`}
                            style={{
                              width: `${(item.total / maxSpending) * 100}%`,
                              background: SPENDING_COLORS[i % SPENDING_COLORS.length],
                            }}
                          />
                        </div>
                      </div>
                    ))
                  })()}
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
                    <Tooltip formatter={(value, name) => [formatAmount(value, displayCurrency, decimalSep), name]} />
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
        {loadingMonthly && <p className="text-sm text-stone-500">{t('reports.loadingMonthly')}</p>}
        {errorMonthly && <p className="text-sm text-red-600">{errorMonthly}</p>}
        {!loadingMonthly && !errorMonthly && (
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <div className="flex items-center gap-3 mb-4">
              <label htmlFor="year-select" className={labelClass}>{t('reports.labelYear')}</label>
              <select id="year-select" value={year} onChange={e => setYear(e.target.value)}
                aria-label={t('reports.labelYear')} className={inputClass}>
                {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlySummary.map(m => ({ ...m, month: getMonthAbbr(m.month - 1, i18n.language) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#78716c' }} />
                <YAxis tick={{ fontSize: 12, fill: '#78716c' }} />
                <Tooltip formatter={(v, name) => [formatAmount(v, displayCurrency, decimalSep), name]} />
                <Legend />
                <Bar dataKey="income" name={t('reports.barIncome')} fill="#16a34a" />
                <Bar dataKey="expenses" name={t('reports.barExpenses')} fill="#dc2626" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Account Balances */}
      <div data-testid="tab-accounts" className={activeTab !== 'accounts' ? 'hidden' : ''}>
        {loadingAccounts && <p className="text-sm text-stone-500">{t('reports.loadingAccounts')}</p>}
        {errorAccounts && <p className="text-sm text-red-600">{errorAccounts}</p>}
        {!loadingAccounts && !errorAccounts && (
          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            {accounts.length === 0 ? (
              <p className="p-5 text-sm text-stone-400">{t('reports.noAccounts')}</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50">
                    <th className="py-3 px-5 text-left text-[10px] font-semibold uppercase tracking-widest text-stone-500">{t('reports.colAccount')}</th>
                    <th className="py-3 px-5 text-left text-[10px] font-semibold uppercase tracking-widest text-stone-500">{t('reports.colType')}</th>
                    <th className="py-3 px-5 text-right text-[10px] font-semibold uppercase tracking-widest text-stone-500">{t('reports.colBalance')}</th>
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
                          {formatAmount(bal, account.currency, decimalSep)}
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
