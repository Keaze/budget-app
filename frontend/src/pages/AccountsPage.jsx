import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getAccounts, createAccount, updateAccount, deleteAccount } from '../api/accounts'
import AccountCard from '../components/AccountCard'
import AccountForm from '../components/AccountForm'
import ErrorToast from '../components/ErrorToast'
import { logger } from '../utils/logger'

export default function AccountsPage() {
  const { t } = useTranslation()
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  useEffect(() => {
    fetchAccounts()
  }, [])

  async function fetchAccounts() {
    try {
      const res = await getAccounts()
      setAccounts(res.data)
    } catch (err) {
      logger.error('Failed to load accounts', err)
      setError(t('accounts.errorLoad'))
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(data) {
    if (editing) {
      await updateAccount(editing.id, data)
    } else {
      await createAccount(data)
    }
    setShowForm(false)
    setEditing(null)
    await fetchAccounts()
  }

  async function handleDelete(id) {
    try {
      await deleteAccount(id)
      setAccounts(accs => accs.filter(a => a.id !== id))
    } catch (err) {
      logger.error('Failed to delete account', err)
      if (err.response?.status === 409) {
        setError(t('accounts.errorDeleteConflict'))
      } else {
        setError(err.response?.data?.error ?? t('accounts.errorDelete'))
      }
    } finally {
      setDeleteId(null)
    }
  }

  if (loading) {
    return <div className="p-6 text-stone-500 text-sm">{t('accounts.loading')}</div>
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-stone-900">{t('accounts.title')}</h1>
        <button
          onClick={() => { setEditing(null); setShowForm(true) }}
          className="flex items-center gap-1.5 px-4 py-2 border border-green-600 text-green-600 text-sm font-semibold rounded-lg hover:bg-green-50 transition-colors"
        >
          <Plus size={16} />
          {t('accounts.addAccount')}
        </button>
      </div>

      <ErrorToast message={error} onDismiss={() => setError(null)} />

      {accounts.length === 0 && (
        <p className="text-sm text-stone-500">{t('accounts.empty')}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {accounts.map(account => (
          <div key={account.id} className="flex items-center gap-2">
            <div className="flex-1">
              <AccountCard account={account} />
            </div>
            {deleteId === account.id ? (
              <span className="flex items-center gap-2 text-sm shrink-0">
                <span className="text-stone-500">{t('common.deletePrompt')}</span>
                <button onClick={() => handleDelete(account.id)} className="text-red-600 hover:text-red-800 font-medium">{t('common.confirmYes')}</button>
                <button onClick={() => setDeleteId(null)} className="text-stone-500 hover:text-stone-700">{t('common.confirmNo')}</button>
              </span>
            ) : (
              <span className="flex items-center gap-1 shrink-0">
                <button onClick={() => { setEditing(account); setShowForm(true) }} className="p-1.5 text-stone-400 hover:text-stone-700 rounded" aria-label="Edit">
                  <Pencil size={15} />
                </button>
                <button onClick={() => setDeleteId(account.id)} className="p-1.5 text-stone-400 hover:text-red-600 rounded" aria-label="Delete">
                  <Trash2 size={15} />
                </button>
              </span>
            )}
          </div>
        ))}
      </div>

      {showForm && (
        <AccountForm
          account={editing}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null) }}
        />
      )}
    </div>
  )
}
