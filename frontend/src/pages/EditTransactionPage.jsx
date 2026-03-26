import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getAccounts } from '../api/accounts'
import { getCategories } from '../api/categories'
import { getTransaction, updateTransaction } from '../api/transactions'
import TransactionForm from '../components/TransactionForm'

export default function EditTransactionPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [transaction, setTransaction] = useState(null)
  const [accounts, setAccounts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getTransaction(id), getAccounts(), getCategories()])
      .then(([txRes, accsRes, catsRes]) => {
        setTransaction(txRes.data)
        setAccounts(accsRes.data)
        setCategories(catsRes.data)
      })
      .catch(() => setError('Failed to load transaction.'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleSave({ category_id, label, notes, amount, date }) {
    await updateTransaction(id, { category_id, label, notes, amount, date })
    navigate('/transactions')
  }

  if (loading) return <div className="p-4 text-gray-600 dark:text-gray-400">Loading...</div>
  if (error) return <div className="p-4 text-red-600">{error}</div>

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Edit Transaction</h1>
      <TransactionForm
        transaction={transaction}
        accounts={accounts}
        categories={categories}
        onSave={handleSave}
      />
    </div>
  )
}
