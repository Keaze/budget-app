import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSettings } from '../contexts/SettingsContext'
import { formatAmount } from '../utils/formatAmount'

export default function AccountCard({ account }) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { decimalSep } = useSettings()

  const TYPE_LABELS = {
    CHECKING: t('accountType.checking'),
    SAVINGS: t('accountType.savings'),
    CREDIT_CARD: t('accountType.creditCard'),
  }

  const TYPE_BADGE = {
    CHECKING: 'bg-green-100 text-green-700',
    SAVINGS: 'bg-green-100 text-green-700',
    CREDIT_CARD: 'bg-red-50 text-red-600',
  }

  const balance = parseFloat(account.balance)
  const isNegative = balance < 0

  return (
    <button
      onClick={() => navigate(`/transactions?account_id=${account.id}`)}
      className="w-full text-left p-5 bg-white border border-stone-200 rounded-xl hover:border-green-400 transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-stone-900 text-[15px]">{account.name}</p>
          <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full mt-1.5 ${TYPE_BADGE[account.account_type] ?? 'bg-stone-100 text-stone-500'}`}>
            {TYPE_LABELS[account.account_type] ?? account.account_type}
          </span>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold tabular-nums tracking-tight ${isNegative ? 'text-red-600' : 'text-green-600'}`}>
            {formatAmount(balance, account.currency, decimalSep)}
          </p>
          <p className="text-xs text-stone-400 mt-1">{t('account.viewTransactions')}</p>
        </div>
      </div>
    </button>
  )
}
