import { useState } from 'react'
import { X } from 'lucide-react'

const ACCOUNT_TYPES = [
  { value: 'CHECKING', label: 'Checking' },
  { value: 'SAVINGS', label: 'Savings' },
  { value: 'CREDIT_CARD', label: 'Credit Card' },
]

export default function AccountForm({ account, onSave, onClose }) {
  const [name, setName] = useState(account?.name ?? '')
  const [accountType, setAccountType] = useState(account?.account_type ?? 'CHECKING')
  const [currency, setCurrency] = useState(account?.currency ?? 'USD')
  const [initialBalance, setInitialBalance] = useState(
    account?.initial_balance != null ? String(account.initial_balance) : '0'
  )
  const [nameError, setNameError] = useState('')
  const [apiError, setApiError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) {
      setNameError('Name is required')
      return
    }
    setNameError('')
    setApiError('')
    setSaving(true)
    try {
      await onSave({
        name: name.trim(),
        account_type: accountType,
        currency: currency.trim() || 'USD',
        initial_balance: parseFloat(initialBalance) || 0,
      })
    } catch (err) {
      setApiError(err.response?.data?.error ?? err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200">
          <h2 className="text-lg font-bold text-stone-900">
            {account ? 'Edit Account' : 'New Account'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-stone-100 text-stone-500"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {apiError && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{apiError}</p>
          )}

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-stone-500 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setNameError('') }}
              className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-[13px] bg-stone-50 text-stone-900 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g. Main Checking"
            />
            {nameError && <p className="mt-1 text-xs text-red-600">{nameError}</p>}
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-stone-500 mb-1">Type</label>
            <select
              value={accountType}
              onChange={e => setAccountType(e.target.value)}
              className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-[13px] bg-stone-50 text-stone-900 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {ACCOUNT_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-stone-500 mb-1">Currency</label>
            <input
              type="text"
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-[13px] bg-stone-50 text-stone-900 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="USD"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-stone-500 mb-1">Initial Balance</label>
            <input
              type="number"
              value={initialBalance}
              onChange={e => setInitialBalance(e.target.value)}
              step="0.01"
              className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-[13px] bg-stone-50 text-stone-900 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-stone-600 border border-stone-200 rounded-md hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2.5 bg-green-600 text-white text-[13px] font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
