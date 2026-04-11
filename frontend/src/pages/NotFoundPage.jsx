import { useTranslation } from 'react-i18next'

export default function NotFoundPage() {
  const { t } = useTranslation()
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">{t('notFound.title')}</h1>
    </div>
  )
}
