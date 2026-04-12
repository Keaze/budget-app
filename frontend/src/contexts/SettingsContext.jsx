import { createContext, useContext, useState } from 'react'
import i18n from '../i18n'

const LANG_KEY = 'budget_language'
const DECIMAL_KEY = 'budget_decimal_sep'

const SettingsContext = createContext(null)

export function SettingsProvider({ children, i18n: i18nInstance = i18n }) {
  const [language, setLanguageState] = useState(
    () => localStorage.getItem(LANG_KEY) ?? 'en'
  )
  const [decimalSep, setDecimalSepState] = useState(
    () => localStorage.getItem(DECIMAL_KEY) ?? '.'
  )

  function setLanguage(lang) {
    setLanguageState(lang)
    localStorage.setItem(LANG_KEY, lang)
    i18nInstance.changeLanguage(lang)
  }

  function setDecimalSep(sep) {
    setDecimalSepState(sep)
    localStorage.setItem(DECIMAL_KEY, sep)
  }

  return (
    <SettingsContext.Provider value={{ language, decimalSep, setLanguage, setDecimalSep }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
