import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { getAccountBalances, getSpendingByCategory, getMonthlySummary } from '../api/reports'
import { logger } from '../utils/logger'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

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

export default function ReportsPage() {
  const navigate = useNavigate()
  const { date_from: defaultFrom, date_to: defaultTo } = currentMonthRange()

  const [dateFrom, setDateFrom] = useState(defaultFrom)
  const [dateTo, setDateTo] = useState(defaultTo)
  const [year, setYear] = useState(String(new Date().getFullYear()))

  const [spending, setSpending] = useState([])
  const [monthlySummary, setMonthlySummary] = useState([])
  const [accounts, setAccounts] = useState([])

  const [loadingSpending, setLoadingSpending] = useState(true)
  const [loadingMonthly, setLoadingMonthly] = useState(true)
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  const [errorSpending, setErrorSpending] = useState('')
  const [errorMonthly, setErrorMonthly] = useState('')
  const [errorAccounts, setErrorAccounts] = useState('')

  useEffect(() => {
    setLoadingSpending(true)
    setErrorSpending('')
    getSpendingByCategory({ date_from: dateFrom, date_to: dateTo })
      .then(res => setSpending(res.data))
      .catch(err => {
        logger.error('Failed to load spending', err)
        setErrorSpending('Failed to load spending data.')
      })
      .finally(() => setLoadingSpending(false))
  }, [dateFrom, dateTo])

  useEffect(() => {
    setLoadingMonthly(true)
    setErrorMonthly('')
    getMonthlySummary({ year })
      .then(res => setMonthlySummary(res.data))
      .catch(err => {
        logger.error('Failed to load monthly summary', err)
        setErrorMonthly('Failed to load monthly summary.')
      })
      .finally(() => setLoadingMonthly(false))
  }, [year])

  useEffect(() => {
    setLoadingAccounts(true)
    setErrorAccounts('')
    getAccountBalances()
      .then(res => setAccounts(res.data))
      .catch(err => {
        logger.error('Failed to load account balances', err)
        setErrorAccounts('Failed to load account balances.')
      })
      .finally(() => setLoadingAccounts(false))
  }, [])

  const monthlyChartData = monthlySummary.map(m => ({
    month: MONTH_NAMES[m.month - 1],
    income: parseFloat(m.income) || 0,
    expenses: parseFloat(m.expenses) || 0,
  }))

  return (
    <div className="p-4 max-w-6xl space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Reports</h1>

      {/* Spending by Category */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
          Spending by Category
        </h2>
        <div className="flex gap-3 mb-4 flex-wrap">
          <div>
            <label
              htmlFor="date-from"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              From
            </label>
            <input
              id="date-from"
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label
              htmlFor="date-to"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              To
            </label>
            <input
              id="date-to"
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>
        {loadingSpending ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading spending data…</p>
        ) : errorSpending ? (
          <p className="text-sm text-red-600">{errorSpending}</p>
        ) : spending.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No expenses in this period.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={spending}
                dataKey="total"
                nameKey="category_name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                onClick={entry =>
                  navigate(
                    `/transactions?category_id=${entry.category_id}&date_from=${dateFrom}&date_to=${dateTo}`
                  )
                }
                style={{ cursor: 'pointer' }}
              >
                {spending.map(entry => (
                  <Cell key={entry.category_id} fill={entry.color || '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [`$${parseFloat(value).toFixed(2)}`, name]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </section>

      {/* Monthly Summary */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
          Monthly Summary
        </h2>
        <div className="mb-4">
          <label
            htmlFor="year-select"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Year
          </label>
          <select
            id="year-select"
            value={year}
            onChange={e => setYear(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            {YEAR_OPTIONS.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        {loadingMonthly ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading monthly summary…</p>
        ) : errorMonthly ? (
          <p className="text-sm text-red-600">{errorMonthly}</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={value => `$${parseFloat(value).toFixed(2)}`} />
              <Legend />
              <Bar dataKey="income" name="Income" fill="#22c55e" />
              <Bar dataKey="expenses" name="Expenses" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>

      {/* Account Balances */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
          Account Balances
        </h2>
        {loadingAccounts ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading account balances…</p>
        ) : errorAccounts ? (
          <p className="text-sm text-red-600">{errorAccounts}</p>
        ) : accounts.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No accounts yet.</p>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <th className="pb-2 pr-4 font-medium">Account</th>
                <th className="pb-2 pr-4 font-medium">Type</th>
                <th className="pb-2 font-medium text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map(account => (
                <tr key={account.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-2 pr-4 text-gray-900 dark:text-gray-100">{account.name}</td>
                  <td className="py-2 pr-4 text-gray-500 dark:text-gray-400">{account.account_type}</td>
                  <td
                    className={`py-2 text-right font-mono ${
                      parseFloat(account.balance) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    ${parseFloat(account.balance).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
