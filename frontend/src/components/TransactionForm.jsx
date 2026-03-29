import { useState } from 'react'
import CategoryPicker from './CategoryPicker'

const TYPES = [
  { value: 'INCOME',   label: 'Income'   },
  { value: 'EXPENSE',  label: 'Expense'  },
  { value: 'TRANSFER', label: 'Transfer' },
]

function todayString() {
  return new Date().toISOString().slice(0, 10)
}

const inputClass =
  'w-full border border-stone-200 rounded-lg px-3 py-2.5 text-[13px] bg-stone-50 text-stone-900 focus:outline-none focus:ring-2 focus:ring-green-500'

const labelClass = 'block text-[11px] font-semibold uppercase tracking-wide text-stone-500 mb-1'

function amountColor(type) {
  if (type === 'INCOME') return 'text-green-600'
  if (type === 'EXPENSE') return 'text-red-600'
  return 'text-stone-700'
}

function activeTypeColor(type) {
  if (type === 'INCOME') return 'text-green-600'
  if (type === 'EXPENSE') return 'text-red-600'
  return 'text-stone-700'
}

export default function TransactionForm({ transaction, accounts, categories, onSave }) {
  const editing = Boolean(transaction)
  const [type,               setType]               = useState(transaction?.transaction_type ?? 'EXPENSE')
  const [accountId,          setAccountId]          = useState(transaction?.account_id ?? (accounts[0]?.id ?? ''))
  const [amount,             setAmount]             = useState(transaction?.amount != null ? String(transaction.amount) : '')
  const [label,              setLabel]              = useState(transaction?.label ?? '')
  const [categoryId,         setCategoryId]         = useState(transaction?.category_id ?? null)
  const [date,               setDate]               = useState(transaction?.date ? transaction.date.slice(0, 10) : todayString())
  const [notes,              setNotes]              = useState(transaction?.notes ?? '')
  const [transferToAccountId, setTransferToAccountId] = useState(transaction?.transfer_to_account_id ?? '')

  const [labelError,  setLabelError]  = useState('')
  const [amountError, setAmountError] = useState('')
  const [apiError,    setApiError]    = useState('')
  const [saving,      setSaving]      = useState(false)

  function validate() {
    let valid = true
    if (!label.trim()) { setLabelError('Label is required'); valid = false }
    const parsed = parseFloat(amount)
    if (!amount || isNaN(parsed) || parsed <= 0) { setAmountError('Amount must be greater than 0'); valid = false }
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
        ...(type === 'TRANSFER' && transferToAccountId ? { transfer_to_account_id: transferToAccountId } : {}),
      })
    } catch (err) {
      setApiError(err.response?.data?.error ?? err.message)
    } finally {
      setSaving(false)
    }
  }

  const selectedAccount = accounts.find(a => a.id === accountId)
  const destinationAccounts = accounts.filter(a => a.id !== accountId)

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {apiError && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{apiError}</p>
      )}

      {/* Type pill toggle */}
      <div>
        <label className={labelClass}>Type</label>
        <div className="bg-green-50 rounded-full p-1 flex" role="group" aria-label="Transaction type">
          {TYPES.map(t => (
            <button
              key={t.value}
              type="button"
              disabled={editing}
              onClick={() => { setType(t.value); setTransferToAccountId('') }}
              aria-pressed={type === t.value}
              className={`flex-1 py-2 text-[13px] rounded-full transition-all ${
                type === t.value
                  ? `bg-white shadow-sm font-semibold ${activeTypeColor(t.value)}`
                  : 'text-stone-500 hover:text-stone-700 disabled:opacity-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Large amount display */}
      <div className="text-center py-2">
        <label className={labelClass}>Amount</label>
        <div className="flex items-center justify-center gap-1 mt-1">
          <span className="text-2xl font-light text-stone-400">
            {selectedAccount?.currency ?? 'USD'}
          </span>
          <input
            type="number"
            value={amount}
            onChange={e => { setAmount(e.target.value); setAmountError('') }}
            min="0.01"
            step="0.01"
            placeholder="0.00"
            className={`text-4xl font-bold tracking-tight tabular-nums border-b-2 border-stone-200 focus:border-green-500 focus:outline-none bg-transparent text-center w-40 ${amountColor(type)}`}
          />
        </div>
        {amountError && <p className="mt-1 text-xs text-red-600">{amountError}</p>}
      </div>

      {/* Account */}
      <div>
        <label className={labelClass}>
          Account <span className="text-red-500">*</span>
        </label>
        <select
          value={accountId}
          disabled={editing}
          onChange={e => { setAccountId(e.target.value); if (transferToAccountId === e.target.value) setTransferToAccountId('') }}
          className={inputClass + ' disabled:opacity-60'}
        >
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>

      {type === 'TRANSFER' && (
        <div>
          <label htmlFor="transfer-to-account" className={labelClass}>
            Transfer To <span className="text-red-500">*</span>
          </label>
          <select
            id="transfer-to-account"
            value={transferToAccountId}
            disabled={editing}
            onChange={e => setTransferToAccountId(e.target.value)}
            className={inputClass + ' disabled:opacity-60'}
          >
            <option value="">— Select destination account —</option>
            {destinationAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
      )}

      {/* Label + Category in a grid */}
      <div>
        <label className={labelClass}>
          Description <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={label}
          onChange={e => { setLabel(e.target.value); setLabelError('') }}
          placeholder="e.g. Grocery shopping"
          className={inputClass}
        />
        {labelError && <p className="mt-1 text-xs text-red-600">{labelError}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Category</label>
          <CategoryPicker categories={categories} value={categoryId} onChange={setCategoryId} />
        </div>
        <div>
          <label className={labelClass}>Date <span className="text-red-500">*</span></label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>
          Notes <span className="text-stone-400 font-normal normal-case tracking-normal">(optional)</span>
        </label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          placeholder="Optional details…"
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full py-3 text-[13px] font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
    </form>
  )
}
