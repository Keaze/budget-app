import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route, useSearchParams } from 'react-router-dom'
import FilterPanel from './FilterPanel'

const accounts = [
  { id: 'acc-1', name: 'Checking' },
  { id: 'acc-2', name: 'Savings' },
]
const categories = [
  { id: 'cat-1', name: 'Groceries' },
  { id: 'cat-2', name: 'Transport' },
]

// Spy component to read current URL search params in tests
function ParamsSpy({ onParams }) {
  const [params] = useSearchParams()
  onParams(Object.fromEntries(params))
  return null
}

function renderBar(initialUrl = '/transactions') {
  const onParams = vi.fn()
  render(
    <MemoryRouter initialEntries={[initialUrl]}>
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
      </Routes>
    </MemoryRouter>
  )
  return { onParams }
}

describe('FilterPanel — rendering', () => {
  it('renders date from and to inputs', () => {
    renderBar()
    expect(screen.getByLabelText('Date from')).toBeInTheDocument()
    expect(screen.getByLabelText('Date to')).toBeInTheDocument()
  })

  it('renders account filter select', () => {
    renderBar()
    expect(screen.getByLabelText('Account filter')).toBeInTheDocument()
  })

  it('renders category filter select', () => {
    renderBar()
    expect(screen.getByLabelText('Category filter')).toBeInTheDocument()
  })

  it('renders type filter select', () => {
    renderBar()
    expect(screen.getByLabelText('Type filter')).toBeInTheDocument()
  })

  it('renders account options', () => {
    renderBar()
    expect(screen.getByRole('option', { name: 'Checking' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Savings' })).toBeInTheDocument()
  })

  it('renders category options', () => {
    renderBar()
    expect(screen.getByRole('option', { name: 'Groceries' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Transport' })).toBeInTheDocument()
  })

  it('renders Clear filters button', () => {
    renderBar('/transactions?account_id=acc-1')
    expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument()
  })

  it('pre-selects account from URL param', () => {
    renderBar('/transactions?account_id=acc-2')
    expect(screen.getByLabelText('Account filter')).toHaveValue('acc-2')
  })

  it('pre-selects category from URL param', () => {
    renderBar('/transactions?category_id=cat-1')
    expect(screen.getByLabelText('Category filter')).toHaveValue('cat-1')
  })

  it('pre-selects type from URL param', () => {
    renderBar('/transactions?transaction_type=EXPENSE')
    expect(screen.getByLabelText('Type filter')).toHaveValue('EXPENSE')
  })

  it('pre-fills date from from URL param', () => {
    renderBar('/transactions?date_from=2026-01-01')
    expect(screen.getByLabelText('Date from')).toHaveValue('2026-01-01')
  })
})

describe('FilterPanel — filter changes update URL', () => {
  it('sets account_id param when account selected', async () => {
    const user = userEvent.setup()
    const { onParams } = renderBar()
    await user.selectOptions(screen.getByLabelText('Account filter'), 'acc-1')
    const lastCall = onParams.mock.calls[onParams.mock.calls.length - 1][0]
    expect(lastCall.account_id).toBe('acc-1')
  })

  it('removes account_id param when All accounts selected', async () => {
    const user = userEvent.setup()
    const { onParams } = renderBar('/transactions?account_id=acc-1')
    await user.selectOptions(screen.getByLabelText('Account filter'), '')
    const lastCall = onParams.mock.calls[onParams.mock.calls.length - 1][0]
    expect(lastCall.account_id).toBeUndefined()
  })

  it('sets transaction_type param when type selected', async () => {
    const user = userEvent.setup()
    const { onParams } = renderBar()
    await user.selectOptions(screen.getByLabelText('Type filter'), 'INCOME')
    const lastCall = onParams.mock.calls[onParams.mock.calls.length - 1][0]
    expect(lastCall.transaction_type).toBe('INCOME')
  })

  it('sets category_id param when category selected', async () => {
    const user = userEvent.setup()
    const { onParams } = renderBar()
    await user.selectOptions(screen.getByLabelText('Category filter'), 'cat-2')
    const lastCall = onParams.mock.calls[onParams.mock.calls.length - 1][0]
    expect(lastCall.category_id).toBe('cat-2')
  })

  it('resets page to 1 when filter changed', async () => {
    const user = userEvent.setup()
    const { onParams } = renderBar('/transactions?page=3&account_id=acc-1')
    await user.selectOptions(screen.getByLabelText('Account filter'), 'acc-2')
    const lastCall = onParams.mock.calls[onParams.mock.calls.length - 1][0]
    expect(lastCall.page).toBeUndefined()
  })
})

describe('FilterPanel — clear filters', () => {
  it('clears all params when Clear filters clicked', async () => {
    const user = userEvent.setup()
    const { onParams } = renderBar('/transactions?account_id=acc-1&transaction_type=EXPENSE&page=2')
    await user.click(screen.getByRole('button', { name: /clear filters/i }))
    const lastCall = onParams.mock.calls[onParams.mock.calls.length - 1][0]
    expect(lastCall).toEqual({})
  })
})

describe('FilterPanel — collapsible toggle', () => {
  it('renders the Filters toggle button', () => {
    renderBar()
    expect(screen.getByRole('button', { name: /filters/i })).toBeInTheDocument()
  })

  it('hides filter controls after clicking the toggle to close', async () => {
    const user = userEvent.setup()
    renderBar()
    // panel starts open — close it
    await user.click(screen.getByRole('button', { name: /filters/i }))
    expect(screen.queryByLabelText('Date from')).not.toBeInTheDocument()
  })

  it('reveals filter controls after clicking toggle again to re-open', async () => {
    const user = userEvent.setup()
    renderBar()
    await user.click(screen.getByRole('button', { name: /filters/i }))  // close
    await user.click(screen.getByRole('button', { name: /filters/i }))  // reopen
    expect(screen.getByLabelText('Date from')).toBeInTheDocument()
  })
})
