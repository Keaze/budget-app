import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
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

function SpendingChart({ spending, onCategoryClick }) {
  if (spending.length === 0) return (
    <p className="text-sm text-stone-400">No expenses this month.</p>
  )
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={spending}
          dataKey="total"
          nameKey="category_name"
          cx="50%"
          cy="50%"
          outerRadius={80}
          onClick={(entry) => onCategoryClick(entry.category_id)}
        >
          {spending.map(entry => (
            <Cell key={entry.category_id} fill={entry.color || '#22c55e'} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => `$${parseFloat(value).toFixed(2)}`} />
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
      <h1 className="sr-only">Dashboard</h1>
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
            <SpendingChart
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
