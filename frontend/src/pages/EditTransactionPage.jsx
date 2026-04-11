import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getAccounts } from '../api/accounts'
import { getCategories } from '../api/categories'
import { getTransaction, updateTransaction } from '../api/transactions'
import TransactionForm from '../components/TransactionForm'

export default function EditTransactionPage() {
  const { t } = useTranslation()
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
      .catch(() => setError(t('editTransaction.errorLoad')))
      .finally(() => setLoading(false))
  }, [id])

  async function handleSave({ category_id, label, notes, amount, date }) {
    await updateTransaction(id, { category_id, label, notes, amount, date })
    navigate('/transactions')
  }

  if (loading) return <div className="p-4 text-stone-500">{t('common.loading')}</div>
  if (error) return <div className="p-4 text-red-600">{error}</div>

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold tracking-tight text-stone-900 mb-6">{t('editTransaction.title')}</h1>
      <TransactionForm transaction={transaction} accounts={accounts} categories={categories} onSave={handleSave} />
    </div>
  )
}
