import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function ErrorToast({ message, onDismiss }) {
  const { t } = useTranslation()
  if (!message) return null
  return (
    <div
      role="alert"
      className="fixed bottom-4 right-4 z-50 flex items-center gap-3 bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg max-w-sm"
    >
      <span className="text-sm flex-1">{message}</span>
      <button
        onClick={onDismiss}
        aria-label={t('common.dismiss')}
        className="flex-shrink-0 hover:opacity-80"
      >
        <X size={16} />
      </button>
    </div>
  )
}
