import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from '../locales/en.json'

const testI18n = i18n.createInstance()
testI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: { en: { translation: en } },
  interpolation: { escapeValue: false },
})

export default testI18n
