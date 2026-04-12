import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import de from './locales/de.json'

const getInitialLanguage = () => {
  try {
    return localStorage.getItem('budget_language') ?? 'en'
  } catch {
    return 'en'
  }
}

i18n.use(initReactI18next).init({
  lng: getInitialLanguage(),
  fallbackLng: 'en',
  resources: {
    en: { translation: en },
    de: { translation: de },
  },
  interpolation: { escapeValue: false },
})

export default i18n
