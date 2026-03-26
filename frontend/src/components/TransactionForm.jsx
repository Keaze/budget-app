import { useState } from 'react'
import CategoryPicker from './CategoryPicker'

const TYPES = [
  { value: 'INCOME', label: 'Income' },
  { value: 'EXPENSE', label: 'Expense' },
  { value: 'TRANSFER', label: 'Transfer' },
]

function todayString() {
  return new Date().toISOString().slice(0, 10)
}

export default function TransactionForm({ transaction, accounts, categories, onSave }) {
  const editing = Boolean(transaction)
  const [type, setType] = useState(transaction?.transaction_type ?? 'EXPENSE')
  const [accountId, setAccountId] = useState(transaction?.account_id ?? (accounts[0]?.id ?? ''))
  const [amount, setAmount] = useState(transaction?.amount != null ? String(transaction.amount) : '')
  const [label, setLabel] = useState(transaction?.label ?? '')
  const [categoryId, setCategoryId] = useState(transaction?.category_id ?? null)
  const [date, setDate] = useState(transaction?.date ? transaction.date.slice(0, 10) : todayString())
  const [notes, setNotes] = useState(transaction?.notes ?? '')
  const [transferToAccountId, setTransferToAccountId] = useState(
    transaction?.transfer_to_account_id ?? ''
  )

  const [labelError, setLabelError] = useState('')
  const [amountError, setAmountError] = useState('')
  const [apiError, setApiError] = useState('')
  const [saving, setSaving] = useState(false)

  function validate() {
    let valid = true
    if (!label.trim()) {
      setLabelError('Label is required')
      valid = false
    }
    const parsed = parseFloat(amount)
    if (!amount || isNaN(parsed) || parsed <= 0) {
      setAmountError('Amount must be greater than 0')
      valid = false
    }
    return valid
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setApiError('')
    setSaving(true)
    try {
      await onSave({
        transaction_type: type,
        account_id: accountId,
        amount: parseFloat(amount),
        label: label.trim(),
        ...(categoryId ? { category_id: categoryId } : {}),
        date: `${date}T00:00:00Z`,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
        ...(type === 'TRANSFER' && transferToAccountId
          ? { transfer_to_account_id: transferToAccountId }
          : {}),
      })
    } catch (err) {
      setApiError(err.response?.data?.error ?? err.message)
    } finally {
      setSaving(false)
    }
  }

  const destinationAccounts = accounts.filter(a => a.id !== accountId)

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {apiError && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{apiError}</p>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Type
        </label>
        <div className="flex gap-1" role="group" aria-label="Transaction type">
          {TYPES.map(t => (
            <button
              key={t.value}
              type="button"
              disabled={editing}
              onClick={() => {
                setType(t.value)
                setTransferToAccountId('')
              }}
              aria-pressed={type === t.value}
              className={`flex-1 py-2 text-sm rounded-md border transition-colors ${
                type === t.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Account <span className="text-red-500">*</span>
        </label>
        <select
          value={accountId}
          disabled={editing}
          onChange={e => {
            setAccountId(e.target.value)
            if (transferToAccountId === e.target.value) setTransferToAccountId('')
          }}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
        >
          {accounts.map(a => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      {type === 'TRANSFER' && (
        <div>
          <label
            htmlFor="transfer-to-account"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Transfer To <span className="text-red-500">*</span>
          </label>
          <select
            id="transfer-to-account"
            value={transferToAccountId}
            disabled={editing}
            onChange={e => setTransferToAccountId(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
          >
            <option value="">— Select destination account —</option>
            {destinationAccounts.map(a => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Amount <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          value={amount}
          onChange={e => {
            setAmount(e.target.value)
            setAmountError('')
          }}
          min="0.01"
          step="0.01"
          placeholder="0.00"
          className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {amountError && <p className="mt-1 text-xs text-red-600">{amountError}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Label <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={label}
          onChange={e => {
            setLabel(e.target.value)
            setLabelError('')
          }}
          placeholder="e.g. Grocery shopping"
          className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {labelError && <p className="mt-1 text-xs text-red-600">{labelError}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Category
        </label>
        <CategoryPicker categories={categories} value={categoryId} onChange={setCategoryId} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Notes <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          placeholder="Optional details..."
          className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  )
}
