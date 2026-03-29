import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { getAccounts } from '../api/accounts'
import { getCategories } from '../api/categories'
import { getTransactions, deleteTransaction } from '../api/transactions'
import FilterPanel from '../components/FilterPanel'
import TransactionRow from '../components/TransactionRow'
import TransactionCard from '../components/TransactionCard'
import ErrorToast from '../components/ErrorToast'
import { logger } from '../utils/logger'

export default function TransactionsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [accounts, setAccounts] = useState([])
  const [categories, setCategories] = useState([])
  const [txData, setTxData] = useState({ data: [], page: 1, page_size: 50, total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteId, setDeleteId] = useState(null)

  const paramsKey = searchParams.toString()

  useEffect(() => {
    Promise.all([getAccounts(), getCategories()])
      .then(([accsRes, catsRes]) => {
        setAccounts(accsRes.data)
        setCategories(catsRes.data)
      })
      .catch(err => {
        logger.error('Failed to load accounts/categories', err)
      })
  }, [])

  useEffect(() => {
    setLoading(true)
    setError('')
    const params = Object.fromEntries([...searchParams].filter(([, v]) => v))
    getTransactions(params)
      .then(res => setTxData(res.data))
      .catch(err => {
        logger.error('Failed to load transactions', err)
        setError('Failed to load transactions.')
      })
      .finally(() => setLoading(false))
  }, [paramsKey])

  const accountsMap = Object.fromEntries(accounts.map(a => [a.id, a]))
  const categoriesMap = Object.fromEntries(categories.map(c => [c.id, c]))

  const page = parseInt(searchParams.get('page') ?? '1', 10)
  const totalPages = txData.total > 0 ? Math.ceil(txData.total / txData.page_size) : 1

  function setPage(p) {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(p))
    setSearchParams(next)
  }

  async function handleDeleteConfirm(id) {
    try {
      await deleteTransaction(id)
      setTxData(prev => ({
        ...prev,
        data: prev.data.filter(t => t.id !== id),
        total: Math.max(0, prev.total - 1),
      }))
    } catch (err) {
      logger.error('Failed to delete transaction', err)
      setError(err.response?.data?.error ?? 'Failed to delete transaction.')
    } finally {
      setDeleteId(null)
    }
  }

  return (
    <div className="p-4 max-w-5xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Transactions</h1>
        <Link
          to="/transactions/new"
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
        >
          <Plus size={16} />
          Add
        </Link>
      </div>

      <FilterPanel accounts={accounts} categories={categories} />

      <ErrorToast message={error} onDismiss={() => setError('')} />

      {loading ? (
        <div className="py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
          Loading transactions…
        </div>
      ) : txData.data.length === 0 ? (
        <div className="py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
          No transactions found. Try adjusting your filters or{' '}
          <Link to="/transactions/new" className="text-blue-600 hover:underline">
            add a new transaction
          </Link>
          .
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  <th className="py-2 px-4">Date</th>
                  <th className="py-2 px-4">Label</th>
                  <th className="py-2 px-4">Category</th>
                  <th className="py-2 px-4">Account</th>
                  <th className="py-2 px-4 text-right">Amount</th>
                  <th className="py-2 px-4" />
                </tr>
              </thead>
              <tbody>
                {txData.data.map(tx => (
                  <TransactionRow
                    key={tx.id}
                    transaction={tx}
                    account={accountsMap[tx.account_id]}
                    category={tx.category_id ? categoriesMap[tx.category_id] : null}
                    deleting={deleteId === tx.id}
                    onDelete={setDeleteId}
                    onDeleteConfirm={handleDeleteConfirm}
                    onDeleteCancel={() => setDeleteId(null)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden">
            {txData.data.map(tx => (
              <TransactionCard
                key={tx.id}
                transaction={tx}
                account={accountsMap[tx.account_id]}
                category={tx.category_id ? categoriesMap[tx.category_id] : null}
                deleting={deleteId === tx.id}
                onDelete={setDeleteId}
                onDeleteConfirm={handleDeleteConfirm}
                onDeleteCancel={() => setDeleteId(null)}
              />
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-4 mt-6 text-sm">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-gray-600 dark:text-gray-400">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* Mobile FAB */}
      <Link
        to="/transactions/new"
        className="fixed bottom-20 right-4 z-40 md:hidden flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700"
        aria-label="Add transaction"
      >
        <Plus size={24} />
      </Link>
    </div>
  )
}
