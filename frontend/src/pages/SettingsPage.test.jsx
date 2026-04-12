import { describe, it, expect, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test/renderWithProviders'
import SettingsPage from './SettingsPage'

beforeEach(() => {
  localStorage.clear()
})

describe('SettingsPage', () => {
  it('renders the settings heading', () => {
    renderWithProviders(<SettingsPage />)
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('renders language section', () => {
    renderWithProviders(<SettingsPage />)
    expect(screen.getByText('Language')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'English' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Deutsch' })).toBeInTheDocument()
  })

  it('renders decimal separator section', () => {
    renderWithProviders(<SettingsPage />)
    expect(screen.getByText('Decimal Separator')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /1,234\.56/ })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /1\.234,56/ })).toBeInTheDocument()
  })

  it('English button is active by default', () => {
    renderWithProviders(<SettingsPage />)
    expect(screen.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Deutsch' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('dot radio is selected by default', () => {
    renderWithProviders(<SettingsPage />)
    expect(screen.getByRole('radio', { name: /1,234\.56/ })).toBeChecked()
    expect(screen.getByRole('radio', { name: /1\.234,56/ })).not.toBeChecked()
  })

  it('switching to Deutsch updates active button', async () => {
    const user = userEvent.setup()
    renderWithProviders(<SettingsPage />)
    await user.click(screen.getByRole('button', { name: 'Deutsch' }))
    expect(screen.getByRole('button', { name: 'Deutsch' })).toHaveAttribute('aria-pressed', 'true')
    expect(localStorage.getItem('budget_language')).toBe('de')
  })

  it('switching to comma separator updates radio', async () => {
    const user = userEvent.setup()
    renderWithProviders(<SettingsPage />)
    await user.click(screen.getByRole('radio', { name: /1\.234,56/ }))
    expect(screen.getByRole('radio', { name: /1\.234,56/ })).toBeChecked()
    expect(localStorage.getItem('budget_decimal_sep')).toBe(',')
  })
})
