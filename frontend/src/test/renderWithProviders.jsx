import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { SettingsProvider } from '../contexts/SettingsContext'
import testI18n from './i18n'

/**
 * Render a component wrapped in all required providers:
 *  - I18nextProvider (English, synchronous)
 *  - SettingsProvider (defaults: lang=en, decimalSep=.)
 *  - MemoryRouter
 *
 * @param {React.ReactElement} ui
 * @param {{ route?: string }} options
 */
export function renderWithProviders(ui, { route = '/' } = {}) {
  return render(
    <I18nextProvider i18n={testI18n}>
      <SettingsProvider i18n={testI18n}>
        <MemoryRouter initialEntries={[route]}>
          {ui}
        </MemoryRouter>
      </SettingsProvider>
    </I18nextProvider>
  )
}
