import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SettingsProvider, useSettings } from './SettingsContext'

beforeEach(() => {
  localStorage.clear()
})

function TestConsumer() {
  const { language, decimalSep, setLanguage, setDecimalSep } = useSettings()
  return (
    <div>
      <span data-testid="lang">{language}</span>
      <span data-testid="sep">{decimalSep}</span>
      <button onClick={() => setLanguage('de')}>set-de</button>
      <button onClick={() => setDecimalSep(',')}>set-comma</button>
    </div>
  )
}

describe('SettingsContext', () => {
  it('defaults to en language and dot separator', () => {
    render(<SettingsProvider><TestConsumer /></SettingsProvider>)
    expect(screen.getByTestId('lang').textContent).toBe('en')
    expect(screen.getByTestId('sep').textContent).toBe('.')
  })

  it('reads initial values from localStorage', () => {
    localStorage.setItem('budget_language', 'de')
    localStorage.setItem('budget_decimal_sep', ',')
    render(<SettingsProvider><TestConsumer /></SettingsProvider>)
    expect(screen.getByTestId('lang').textContent).toBe('de')
    expect(screen.getByTestId('sep').textContent).toBe(',')
  })

  it('persists language change to localStorage', async () => {
    const user = userEvent.setup()
    render(<SettingsProvider><TestConsumer /></SettingsProvider>)
    await user.click(screen.getByText('set-de'))
    expect(localStorage.getItem('budget_language')).toBe('de')
    expect(screen.getByTestId('lang').textContent).toBe('de')
  })

  it('persists decimal separator change to localStorage', async () => {
    const user = userEvent.setup()
    render(<SettingsProvider><TestConsumer /></SettingsProvider>)
    await user.click(screen.getByText('set-comma'))
    expect(localStorage.getItem('budget_decimal_sep')).toBe(',')
    expect(screen.getByTestId('sep').textContent).toBe(',')
  })

  it('throws if useSettings is called outside provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<TestConsumer />)).toThrow()
    spy.mockRestore()
  })
})
