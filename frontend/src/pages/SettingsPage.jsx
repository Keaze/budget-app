import { useTranslation } from 'react-i18next'
import { useSettings } from '../contexts/SettingsContext'

export default function SettingsPage() {
  const { t } = useTranslation()
  const { language, decimalSep, setLanguage, setDecimalSep } = useSettings()

  return (
    <div className="p-4 md:p-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-stone-900 mb-6">{t('settings.title')}</h1>

      <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500 mb-2">
            {t('settings.language')}
          </p>
          <div className="flex gap-2">
            {[
              { value: 'en', label: 'English' },
              { value: 'de', label: 'Deutsch' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setLanguage(opt.value)}
                aria-pressed={language === opt.value}
                className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                  language === opt.value
                    ? 'bg-green-600 text-white border-green-600'
                    : 'text-stone-600 border-stone-200 hover:bg-stone-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500 mb-2">
            {t('settings.decimalSeparator')}
          </p>
          <div className="flex flex-col gap-2">
            {[
              { value: '.', label: '. (1,234.56)' },
              { value: ',', label: ', (1.234,56)' },
            ].map(opt => (
              <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="decimalSep"
                  value={opt.value}
                  checked={decimalSep === opt.value}
                  onChange={() => setDecimalSep(opt.value)}
                  className="accent-green-600"
                />
                <span className="text-sm text-stone-700 font-mono">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
