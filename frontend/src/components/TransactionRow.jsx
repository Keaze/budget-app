import { Link } from 'react-router-dom'
import { Pencil, Trash2 } from 'lucide-react'

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function amountClass(type) {
  if (type === 'INCOME') return 'text-green-600 dark:text-green-400'
  if (type === 'EXPENSE') return 'text-red-600 dark:text-red-400'
  return 'text-gray-500 dark:text-gray-400'
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
  const { id, transaction_type, amount, label, date } = transaction

  return (
    <tr className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
      <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
        {formatDate(date)}
      </td>
      <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100 font-medium max-w-[200px] truncate">
        {label}
      </td>
      <td className="py-3 px-4 text-sm">
        {category ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs">
            <span
              className="inline-block w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: category.color ?? 'transparent' }}
            />
            {category.name}
          </span>
        ) : (
          <span className="text-gray-400 text-xs">—</span>
        )}
      </td>
      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
        {account?.name ?? '—'}
      </td>
      <td className={`py-3 px-4 text-sm font-semibold tabular-nums text-right ${amountClass(transaction_type)}`}>
        {amountPrefix(transaction_type)}{parseFloat(amount).toFixed(2)}
      </td>
      <td className="py-3 px-4 text-right">
        {deleting ? (
          <span className="flex items-center justify-end gap-2 text-sm">
            <span className="text-gray-500 dark:text-gray-400">Delete?</span>
            <button
              onClick={() => onDeleteConfirm(id)}
              className="text-red-600 hover:text-red-800 font-medium"
            >
              Yes
            </button>
            <button
              onClick={onDeleteCancel}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              No
            </button>
          </span>
        ) : (
          <span className="flex items-center justify-end gap-1">
            <Link
              to={`/transactions/${id}/edit`}
              className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded"
              aria-label="Edit"
            >
              <Pencil size={14} />
            </Link>
            <button
              onClick={() => onDelete(id)}
              className="p-1 text-gray-400 hover:text-red-600 rounded"
              aria-label="Delete"
            >
              <Trash2 size={14} />
            </button>
          </span>
        )}
      </td>
    </tr>
  )
}
