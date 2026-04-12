import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Routes, Route, useSearchParams } from 'react-router-dom'
import { renderWithProviders } from '../test/renderWithProviders'
import FilterPanel from './FilterPanel'

const accounts = [
  { id: 'acc-1', name: 'Checking' },
  { id: 'acc-2', name: 'Savings' },
]
const categories = [
  { id: 'cat-1', name: 'Groceries' },
  { id: 'cat-2', name: 'Transport' },
]

function ParamsSpy({ onParams }) {
  const [params] = useSearchParams()
  onParams(Object.fromEntries(params))
  return null
}

function renderPanel(route = '/transactions') {
  const onParams = vi.fn()
  renderWithProviders(
    <Routes>
      <Route
        path="/transactions"
        element={
          <>
            <FilterPanel accounts={accounts} categories={categories} />
            <ParamsSpy onParams={onParams} />
          </>
        }
      />
    </Routes>,
    { route }
  )
  return { onParams }
}

describe('FilterPanel — rendering', () => {
  it('renders date inputs when open', async () => {
    const user = userEvent.setup()
    renderPanel()
    await user.click(screen.getByRole('button', { name: /filters/i }))
    expect(screen.getByLabelText('From')).toBeInTheDocument()
    expect(screen.getByLabelText('To')).toBeInTheDocument()
  })

  it('renders account filter select when open', async () => {
    const user = userEvent.setup()
    renderPanel()
    await user.click(screen.getByRole('button', { name: /filters/i }))
    expect(screen.getByLabelText('Account')).toBeInTheDocument()
  })

  it('renders category filter select when open', async () => {
    const user = userEvent.setup()
    renderPanel()
    await user.click(screen.getByRole('button', { name: /filters/i }))
    expect(screen.getByLabelText('Category')).toBeInTheDocument()
  })

  it('renders type filter select when open', async () => {
    const user = userEvent.setup()
    renderPanel()
    await user.click(screen.getByRole('button', { name: /filters/i }))
    expect(screen.getByLabelText('Type')).toBeInTheDocument()
  })

  it('renders account options', async () => {
    const user = userEvent.setup()
    renderPanel()
    await user.click(screen.getByRole('button', { name: /filters/i }))
    expect(screen.getByRole('option', { name: 'Checking' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Savings' })).toBeInTheDocument()
  })

  it('renders category options', async () => {
    const user = userEvent.setup()
    renderPanel()
    await user.click(screen.getByRole('button', { name: /filters/i }))
    expect(screen.getByRole('option', { name: 'Groceries' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Transport' })).toBeInTheDocument()
  })

  it('renders Clear filters button when filters are active', () => {
    renderPanel('/transactions?account_id=acc-1')
    expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument()
  })

  // Pre-select tests: panel auto-opens when activeCount > 0
  it('pre-selects account from URL param', () => {
    renderPanel('/transactions?account_id=acc-2')
    expect(screen.getByLabelText('Account')).toHaveValue('acc-2')
  })

  it('pre-selects category from URL param', () => {
    renderPanel('/transactions?category_id=cat-1')
    expect(screen.getByLabelText('Category')).toHaveValue('cat-1')
  })

  it('pre-selects type from URL param', () => {
    renderPanel('/transactions?transaction_type=EXPENSE')
    expect(screen.getByLabelText('Type')).toHaveValue('EXPENSE')
  })

  it('pre-fills date from URL param', () => {
    renderPanel('/transactions?date_from=2026-01-01')
    expect(screen.getByLabelText('From')).toHaveValue('2026-01-01')
  })
})

describe('FilterPanel — filter changes update URL', () => {
  it('sets account_id param when account selected', async () => {
    const user = userEvent.setup()
    const { onParams } = renderPanel()
    await user.click(screen.getByRole('button', { name: /filters/i }))
    await user.selectOptions(screen.getByLabelText('Account'), 'acc-1')
    const lastCall = onParams.mock.calls[onParams.mock.calls.length - 1][0]
    expect(lastCall.account_id).toBe('acc-1')
  })

  it('removes account_id param when All accounts selected', async () => {
    const user = userEvent.setup()
    const { onParams } = renderPanel('/transactions?account_id=acc-1')
    await user.selectOptions(screen.getByLabelText('Account'), '')
    const lastCall = onParams.mock.calls[onParams.mock.calls.length - 1][0]
    expect(lastCall.account_id).toBeUndefined()
  })

  it('sets transaction_type param when type selected', async () => {
    const user = userEvent.setup()
    const { onParams } = renderPanel()
    await user.click(screen.getByRole('button', { name: /filters/i }))
    await user.selectOptions(screen.getByLabelText('Type'), 'INCOME')
    const lastCall = onParams.mock.calls[onParams.mock.calls.length - 1][0]
    expect(lastCall.transaction_type).toBe('INCOME')
  })

  it('sets category_id param when category selected', async () => {
    const user = userEvent.setup()
    const { onParams } = renderPanel()
    await user.click(screen.getByRole('button', { name: /filters/i }))
    await user.selectOptions(screen.getByLabelText('Category'), 'cat-2')
    const lastCall = onParams.mock.calls[onParams.mock.calls.length - 1][0]
    expect(lastCall.category_id).toBe('cat-2')
  })

  it('resets page to 1 when filter changed', async () => {
    const user = userEvent.setup()
    // page=3 is active, so panel starts open
    const { onParams } = renderPanel('/transactions?page=3&account_id=acc-1')
    await user.selectOptions(screen.getByLabelText('Account'), 'acc-2')
    const lastCall = onParams.mock.calls[onParams.mock.calls.length - 1][0]
    expect(lastCall.page).toBeUndefined()
  })
})

describe('FilterPanel — clear filters', () => {
  it('clears all params when Clear filters clicked', async () => {
    const user = userEvent.setup()
    const { onParams } = renderPanel('/transactions?account_id=acc-1&transaction_type=EXPENSE&page=2')
    await user.click(screen.getByRole('button', { name: /clear filters/i }))
    const lastCall = onParams.mock.calls[onParams.mock.calls.length - 1][0]
    expect(lastCall).toEqual({})
  })
})

describe('FilterPanel — collapsible toggle', () => {
  it('renders the Filters toggle button', () => {
    renderPanel()
    expect(screen.getByRole('button', { name: /filters/i })).toBeInTheDocument()
  })

  it('hides filter controls by default when no filters are active', () => {
    renderPanel()
    expect(screen.queryByLabelText('From')).not.toBeInTheDocument()
  })

  it('reveals filter controls after clicking the toggle to open', async () => {
    const user = userEvent.setup()
    renderPanel()
    await user.click(screen.getByRole('button', { name: /filters/i }))
    expect(screen.getByLabelText('From')).toBeInTheDocument()
  })

  it('hides filter controls after clicking the toggle to close', async () => {
    const user = userEvent.setup()
    renderPanel()
    await user.click(screen.getByRole('button', { name: /filters/i }))  // open
    await user.click(screen.getByRole('button', { name: /filters/i }))  // close
    expect(screen.queryByLabelText('From')).not.toBeInTheDocument()
  })
})
