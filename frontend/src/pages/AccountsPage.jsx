import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { getAccounts, createAccount, updateAccount, deleteAccount } from '../api/accounts'
import AccountCard from '../components/AccountCard'
import AccountForm from '../components/AccountForm'
import ErrorToast from '../components/ErrorToast'
import { logger } from '../utils/logger'

export default function AccountsPage() {
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
      setError('Failed to load accounts.')
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
        setError('This account has transactions and cannot be deleted.')
      } else {
        setError(err.response?.data?.error ?? 'Failed to delete account.')
      }
    } finally {
      setDeleteId(null)
    }
  }

  function openCreate() {
    setEditing(null)
    setShowForm(true)
  }

  function openEdit(account) {
    setEditing(account)
    setShowForm(true)
  }

  if (loading) {
    return <div className="p-6 text-stone-500 text-sm">Loading accounts…</div>
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Accounts</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-4 py-2 border border-green-600 text-green-600 text-sm font-semibold rounded-lg hover:bg-green-50 transition-colors"
        >
          <Plus size={16} />
          Add Account
        </button>
      </div>

      <ErrorToast message={error} onDismiss={() => setError(null)} />

      {accounts.length === 0 && (
        <p className="text-sm text-stone-500">
          No accounts yet. Create your first account to get started.
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {accounts.map(account => (
          <div key={account.id} className="flex items-center gap-2">
            <div className="flex-1">
              <AccountCard account={account} />
            </div>
            {deleteId === account.id ? (
              <span className="flex items-center gap-2 text-sm shrink-0">
                <span className="text-stone-500">Delete?</span>
                <button
                  onClick={() => handleDelete(account.id)}
                  className="text-red-600 hover:text-red-800 font-medium"
                >
                  Yes
                </button>
                <button
                  onClick={() => setDeleteId(null)}
                  className="text-stone-500 hover:text-stone-700"
                >
                  No
                </button>
              </span>
            ) : (
              <span className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => openEdit(account)}
                  className="p-1.5 text-stone-400 hover:text-stone-700 rounded"
                  aria-label="Edit"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => setDeleteId(account.id)}
                  className="p-1.5 text-stone-400 hover:text-red-600 rounded"
                  aria-label="Delete"
                >
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
