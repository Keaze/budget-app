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

const TYPE_LABELS = { CHECKING: 'Checking', SAVINGS: 'Savings Acct', CREDIT_CARD: 'Credit Card' }
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

  const displayCurrency = accounts[0]?.currency ?? '$'

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
                  {(() => {
                    const maxSpending = Math.max(...spending.map(s => s.total))
                    return spending.map((item, i) => (
                      <div key={item.category_id}>
                        <div className="flex justify-between mb-1">
                          <span className="text-[13px] text-stone-700 font-medium">{item.category_name}</span>
                          <span className="text-[13px] font-bold text-red-600 tabular-nums">{displayCurrency}{parseFloat(item.total).toFixed(2)}</span>
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
                    <Tooltip formatter={(value, name) => [`${displayCurrency}${parseFloat(value).toFixed(2)}`, name]} />
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
                <Tooltip formatter={v => `${displayCurrency}${parseFloat(v).toFixed(2)}`} />
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
