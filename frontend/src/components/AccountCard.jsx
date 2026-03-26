import { useNavigate } from 'react-router-dom'

const TYPE_LABELS = {
  CHECKING: 'Checking',
  SAVINGS: 'Savings',
  CREDIT_CARD: 'Credit Card',
}

export default function AccountCard({ account }) {
  const navigate = useNavigate()
  const balance = parseFloat(account.balance)
  const isNegative = balance < 0

  return (
    <button
      onClick={() => navigate(`/transactions?account_id=${account.id}`)}
      className="w-full text-left px-4 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">{account.name}</p>
          <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full">
            {TYPE_LABELS[account.account_type] ?? account.account_type}
          </span>
        </div>
        <p className={`text-lg font-semibold tabular-nums ${isNegative ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
          {account.currency} {balance.toFixed(2)}
        </p>
      </div>
    </button>
  )
}
