import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAccounts } from '../api/accounts'
import { getCategories } from '../api/categories'
import { createTransaction } from '../api/transactions'
import TransactionForm from '../components/TransactionForm'

export default function AddTransactionPage() {
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getAccounts(), getCategories()])
      .then(([accsRes, catsRes]) => {
        setAccounts(accsRes.data)
        setCategories(catsRes.data)
      })
      .catch(() => setError('Failed to load data.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(data) {
    await createTransaction(data)
    navigate('/transactions')
  }

  if (loading) return <div className="p-4 text-stone-500">Loading...</div>
  if (error) return <div className="p-4 text-red-600">{error}</div>

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold tracking-tight text-stone-900 mb-6">Add Transaction</h1>
      <TransactionForm
        accounts={accounts}
        categories={categories}
        onSave={handleSave}
      />
    </div>
  )
}
