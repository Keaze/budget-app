import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useSettings } from '../contexts/SettingsContext'
import { formatAmount } from '../utils/formatAmount'
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
    monthIndex: now.getMonth(),
  }
}

function SpendingBars({ spending, onCategoryClick, currency, decimalSep }) {
  const { t } = useTranslation()
  if (spending.length === 0) return (
    <p className="text-sm text-stone-400">{t('dashboard.noExpenses')}</p>
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
            <span className="text-[13px] font-bold tabular-nums text-red-600">
              {formatAmount(item.total, currency, decimalSep)}
            </span>
          </div>
          <div className="h-1.5 bg-red-50 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 rounded-full" style={{ width: `${(item.total / max) * 100}%` }} />
          </div>
        </button>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const { decimalSep } = useSettings()
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
        setError(t('dashboard.errorLoad'))
      })
      .finally(() => setLoading(false))
  }, [])

  const categoriesMap = Object.fromEntries(categories.map(c => [c.id, c]))
  const accountsMap = Object.fromEntries(accounts.map(a => [a.id, a]))

  if (loading) {
    return <div className="p-6 text-sm text-stone-500">{t('dashboard.loading')}</div>
  }
  if (error) {
    return <div className="p-6 text-red-600">{error}</div>
  }

  const { date_from, date_to, monthIndex } = currentMonthRange()
  const monthLabel = new Intl.DateTimeFormat(i18n.language, { month: 'long' }).format(new Date(2000, monthIndex, 1))
  const displayCurrency = accounts.length > 0 ? accounts[0].currency : 'USD'
  const totalBalance = accounts.reduce((sum, a) => sum + parseFloat(a.balance), 0)
  const txThisMonth = transactions.filter(tx => tx.transaction_type !== 'TRANSFER')
  const incomeTotal = txThisMonth.filter(tx => tx.transaction_type === 'INCOME').reduce((sum, tx) => sum + parseFloat(tx.amount), 0)
  const expenseTotal = txThisMonth.filter(tx => tx.transaction_type === 'EXPENSE').reduce((sum, tx) => sum + parseFloat(tx.amount), 0)
  const todayFormatted = new Date().toLocaleDateString(i18n.language, { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="p-4 md:p-6 max-w-5xl">
      <h1 className="sr-only">{t('nav.dashboard')}</h1>
      <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-stone-400 mb-1">{t('dashboard.totalBalance')}</p>
            <p className="text-4xl font-bold tracking-tight text-stone-900 tabular-nums" data-testid="hero-total-balance">
              {formatAmount(totalBalance, displayCurrency, decimalSep)}
            </p>
            <p className="text-[13px] text-stone-400 mt-1">
              {t('dashboard.acrossAccounts', { count: accounts.length })} · {todayFormatted}
            </p>
          </div>
          <div className="flex gap-3">
            <div className="bg-green-50 rounded-xl px-4 py-3 text-center min-w-[90px]">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-green-600 mb-1">{t('dashboard.income')}</p>
              <p className="text-lg font-bold text-green-600 tabular-nums">+{formatAmount(incomeTotal, displayCurrency, decimalSep)}</p>
              <p className="text-[10px] text-stone-400 mt-0.5">{t('dashboard.thisMonth')}</p>
            </div>
            <div className="bg-red-50 rounded-xl px-4 py-3 text-center min-w-[90px]">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-red-600 mb-1">{t('dashboard.expenses')}</p>
              <p className="text-lg font-bold text-red-600 tabular-nums">-{formatAmount(expenseTotal, displayCurrency, decimalSep)}</p>
              <p className="text-[10px] text-stone-400 mt-0.5">{t('dashboard.thisMonth')}</p>
            </div>
            <div className="bg-green-50 rounded-xl px-4 py-3 text-center min-w-[90px]">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-500 mb-1">{t('dashboard.saved')}</p>
              <p className="text-lg font-bold text-stone-900 tabular-nums">{formatAmount(incomeTotal - expenseTotal, displayCurrency, decimalSep)}</p>
              <p className="text-[10px] text-stone-400 mt-0.5">{t('dashboard.net')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-stone-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-semibold text-stone-900">{t('dashboard.recentTransactions')}</h2>
            <Link to="/transactions" className="text-[13px] text-green-600 font-medium hover:text-green-700">
              {t('dashboard.viewAll')}
            </Link>
          </div>
          {transactions.length === 0 ? (
            <p className="text-sm text-stone-400">{t('dashboard.noTransactions')}</p>
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

        <div className="flex flex-col gap-5">
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[15px] font-semibold text-stone-900">{t('dashboard.accounts')}</h2>
              <Link to="/accounts" className="text-[13px] text-green-600 font-medium hover:text-green-700">
                {t('dashboard.manage')}
              </Link>
            </div>
            {accounts.length === 0 ? (
              <p className="text-sm text-stone-400">{t('dashboard.noAccounts')}</p>
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
                        {formatAmount(parseFloat(account.balance), account.currency, decimalSep)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <h2 className="text-[15px] font-semibold text-stone-900 mb-3">{t('dashboard.topSpending', { month: monthLabel })}</h2>
            <SpendingBars
              spending={spending}
              currency={displayCurrency}
              decimalSep={decimalSep}
              onCategoryClick={categoryId =>
                navigate(`/transactions?category_id=${categoryId}&date_from=${date_from}&date_to=${date_to}`)
              }
            />
          </div>
        </div>
      </div>

      <Link
        to="/transactions/new"
        className="fixed bottom-20 right-4 z-40 md:hidden flex items-center justify-center w-14 h-14 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700"
        aria-label={t('addTransaction.title')}
      >
        <Plus size={24} />
      </Link>
    </div>
  )
}
