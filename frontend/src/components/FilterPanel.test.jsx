import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test/renderWithProviders'
import FilterPanel from './FilterPanel'

const accounts = [
  { id: 'acc-1', name: 'Main Checking' },
  { id: 'acc-2', name: 'Savings' },
]
const categories = [
  { id: 'cat-1', name: 'Groceries' },
]

function renderPanel(route = '/transactions') {
  return renderWithProviders(<FilterPanel accounts={accounts} categories={categories} />, { route })
}

describe('FilterPanel', () => {
  it('renders Filters toggle button', () => {
    renderPanel()
    expect(screen.getByRole('button', { name: /filters/i })).toBeInTheDocument()
  })

  it('panel is collapsed by default when no active filters', () => {
    renderPanel()
    expect(screen.queryByLabelText(/date from/i)).not.toBeInTheDocument()
  })

  it('opens panel when toggle is clicked', async () => {
    const user = userEvent.setup()
    renderPanel()
    await user.click(screen.getByRole('button', { name: /filters/i }))
    expect(screen.getByLabelText('From')).toBeInTheDocument()
  })

  it('shows account options when open', async () => {
    const user = userEvent.setup()
    renderPanel()
    await user.click(screen.getByRole('button', { name: /filters/i }))
    expect(screen.getByRole('option', { name: 'Main Checking' })).toBeInTheDocument()
  })

  it('shows "All accounts" default option when open', async () => {
    const user = userEvent.setup()
    renderPanel()
    await user.click(screen.getByRole('button', { name: /filters/i }))
    expect(screen.getByRole('option', { name: 'All accounts' })).toBeInTheDocument()
  })

  it('shows clear filters button when filters are active', () => {
    renderWithProviders(
      <FilterPanel accounts={accounts} categories={categories} />,
      { route: '/transactions?account_id=acc-1' }
    )
    expect(screen.getByText(/clear filters/i)).toBeInTheDocument()
  })
})
