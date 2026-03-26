import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { getAccountBalances, getSpendingByCategory } from '../api/reports'
import { getTransactions } from '../api/transactions'
import { getCategories } from '../api/categories'
import AccountCard from '../components/AccountCard'
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
  }
}

function MiniSpendingChart({ data, onSegmentClick }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="total"
          nameKey="category_name"
          cx="50%"
          cy="50%"
          outerRadius={80}
          onClick={entry => onSegmentClick(entry.category_id)}
          style={{ cursor: 'pointer' }}
        >
          {data.map(entry => (
            <Cell key={entry.category_id} fill={entry.color || '#94a3b8'} />
          ))}
        </Pie>
        <Tooltip formatter={(value, name) => [`$${parseFloat(value).toFixed(2)}`, name]} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
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

  const accountsMap = Object.fromEntries(accounts.map(a => [a.id, a]))
  const categoriesMap = Object.fromEntries(categories.map(c => [c.id, c]))

  if (loading) {
    return <div className="p-6 text-sm text-gray-500 dark:text-gray-400">Loading dashboard…</div>
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>
  }

  const { date_from, date_to } = currentMonthRange()

  return (
    <div className="p-4 max-w-6xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: balances + recent transactions */}
        <div className="lg:col-span-2 space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
              Account Balances
            </h2>
            {accounts.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No accounts yet.</p>
            ) : (
              <ul className="space-y-2">
                {accounts.map(account => (
                  <li key={account.id}>
                    <AccountCard account={account} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Recent Transactions
              </h2>
              <Link to="/transactions" className="text-sm text-blue-600 hover:underline">
                View all
              </Link>
            </div>
            {transactions.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No transactions yet.</p>
            ) : (
              <div>
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
          </section>
        </div>

        {/* Right: mini spending chart */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
            Spending This Month
          </h2>
          {spending.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No expenses this month.</p>
          ) : (
            <MiniSpendingChart
              data={spending}
              onSegmentClick={categoryId =>
                navigate(
                  `/transactions?category_id=${categoryId}&date_from=${date_from}&date_to=${date_to}`
                )
              }
            />
          )}
        </div>
      </div>
    </div>
  )
}
