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
    return <div className="p-6 text-gray-500 text-sm">Loading accounts…</div>
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Accounts</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
        >
          <Plus size={16} />
          Add Account
        </button>
      </div>

      <ErrorToast message={error} onDismiss={() => setError(null)} />

      {accounts.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No accounts yet. Create your first account to get started.
        </p>
      )}

      <ul className="space-y-2">
        {accounts.map(account => (
          <li key={account.id} className="flex items-center gap-2">
            <div className="flex-1">
              <AccountCard account={account} />
            </div>
            {deleteId === account.id ? (
              <span className="flex items-center gap-2 text-sm shrink-0">
                <span className="text-gray-500 dark:text-gray-400">Delete?</span>
                <button
                  onClick={() => handleDelete(account.id)}
                  className="text-red-600 hover:text-red-800 font-medium"
                >
                  Yes
                </button>
                <button
                  onClick={() => setDeleteId(null)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  No
                </button>
              </span>
            ) : (
              <span className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => openEdit(account)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded"
                  aria-label="Edit"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => setDeleteId(account.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                  aria-label="Delete"
                >
                  <Trash2 size={15} />
                </button>
              </span>
            )}
          </li>
        ))}
      </ul>

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
