import { Link } from 'react-router-dom'
import { Pencil, Trash2 } from 'lucide-react'

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

function amountClass(type) {
  if (type === 'INCOME') return 'text-green-600'
  if (type === 'EXPENSE') return 'text-red-600'
  return 'text-stone-500'
}

function amountPrefix(type) {
  if (type === 'INCOME') return '+'
  if (type === 'EXPENSE') return '-'
  return ''
}

export default function TransactionCard({
  transaction,
  account,
  category,
  deleting,
  onDelete,
  onDeleteConfirm,
  onDeleteCancel,
}) {
  const { id, transaction_type, amount, label, date, notes } = transaction

  return (
    <div className="bg-white border border-stone-200 rounded-xl px-4 py-3 mb-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-stone-900 truncate">{label}</p>
          {notes && (
            <p data-testid="tx-notes" className="text-[11px] text-stone-400 mt-0.5 truncate">{notes}</p>
          )}
          <p className="text-xs text-stone-500 mt-0.5">{formatDate(date)}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {account && (
              <span className="text-xs text-stone-500">{account.name}</span>
            )}
            {category && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                style={{ background: (category.color ?? '#6b7280') + '20', color: category.color ?? '#6b7280' }}>
                <span
                  className="inline-block w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: category.color ?? '#6b7280' }}
                />
                {category.name}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <p className={`font-semibold tabular-nums ${amountClass(transaction_type)}`}>
            {amountPrefix(transaction_type)}{parseFloat(amount).toFixed(2)}
          </p>
          {deleting ? (
            <span className="flex items-center gap-2 text-sm">
              <span className="text-stone-500">Delete?</span>
              <button onClick={() => onDeleteConfirm(id)} className="text-red-600 hover:text-red-800 font-medium">Yes</button>
              <button onClick={onDeleteCancel} className="text-stone-500 hover:text-stone-700">No</button>
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Link to={`/transactions/${id}/edit`} className="p-1 text-stone-400 hover:text-stone-700 rounded" aria-label="Edit">
                <Pencil size={14} />
              </Link>
              <button onClick={() => onDelete(id)} className="p-1 text-stone-400 hover:text-red-600 rounded" aria-label="Delete">
                <Trash2 size={14} />
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
