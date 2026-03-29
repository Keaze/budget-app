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

export default function TransactionRow({
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
    <tr className="border-b border-stone-100 hover:bg-stone-50 even:bg-stone-50/50">
      <td className="py-3 px-4 text-[13px] text-stone-500 whitespace-nowrap">
        {formatDate(date)}
      </td>
      <td className="py-3 px-4 max-w-[200px]">
        <p className="text-[13px] font-medium text-stone-900 truncate">{label}</p>
        {notes && (
          <p data-testid="tx-notes" className="text-[11px] text-stone-400 mt-0.5 truncate">{notes}</p>
        )}
      </td>
      <td className="py-3 px-4 text-sm">
        {category ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{ background: (category.color ?? '#6b7280') + '20', color: category.color ?? '#6b7280' }}>
            <span
              className="inline-block w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: category.color ?? '#6b7280' }}
            />
            {category.name}
          </span>
        ) : (
          <span className="text-stone-400 text-xs">—</span>
        )}
      </td>
      <td className="py-3 px-4 text-[13px] text-stone-500">
        {account?.name ?? '—'}
      </td>
      <td className={`py-3 px-4 text-[13px] font-bold tabular-nums tracking-tight text-right ${amountClass(transaction_type)}`}>
        {amountPrefix(transaction_type)}{parseFloat(amount).toFixed(2)}
      </td>
      <td className="py-3 px-4 text-right">
        {deleting ? (
          <span className="flex items-center justify-end gap-2 text-sm">
            <span className="text-stone-500">Delete?</span>
            <button onClick={() => onDeleteConfirm(id)} className="text-red-600 hover:text-red-800 font-medium">Yes</button>
            <button onClick={onDeleteCancel} className="text-stone-500 hover:text-stone-700">No</button>
          </span>
        ) : (
          <span className="flex items-center justify-end gap-1">
            <Link to={`/transactions/${id}/edit`} className="p-1 text-stone-400 hover:text-stone-700 rounded" aria-label="Edit">
              <Pencil size={14} />
            </Link>
            <button onClick={() => onDelete(id)} className="p-1 text-stone-400 hover:text-red-600 rounded" aria-label="Delete">
              <Trash2 size={14} />
            </button>
          </span>
        )}
      </td>
    </tr>
  )
}
