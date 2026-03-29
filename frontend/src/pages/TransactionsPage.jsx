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
    <div className="p-4 md:p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">Transactions</h1>
      </div>

      <FilterPanel accounts={accounts} categories={categories} />

      <ErrorToast message={error} onDismiss={() => setError('')} />

      {loading ? (
        <div className="py-8 text-center text-stone-500 text-sm">
          Loading transactions…
        </div>
      ) : txData.data.length === 0 ? (
        <div className="py-8 text-center text-stone-500 text-sm">
          No transactions found. Try adjusting your filters or{' '}
          <Link to="/transactions/new" className="text-green-600 hover:underline">
            add a new transaction
          </Link>
          .
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm bg-white rounded-xl border border-stone-200 overflow-hidden">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 text-left">
                  <th className="py-2 px-4 text-[10px] font-semibold uppercase tracking-widest text-stone-500">Date</th>
                  <th className="py-2 px-4 text-[10px] font-semibold uppercase tracking-widest text-stone-500">Description</th>
                  <th className="py-2 px-4 text-[10px] font-semibold uppercase tracking-widest text-stone-500">Category</th>
                  <th className="py-2 px-4 text-[10px] font-semibold uppercase tracking-widest text-stone-500">Account</th>
                  <th className="py-2 px-4 text-[10px] font-semibold uppercase tracking-widest text-stone-500 text-right">Amount</th>
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
              className="px-3 py-1.5 border border-stone-200 rounded-md text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:text-stone-400"
            >
              Previous
            </button>
            <span className="text-stone-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1.5 border border-stone-200 rounded-md text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:text-stone-400"
            >
              Next
            </button>
          </div>
        </>
      )}

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
