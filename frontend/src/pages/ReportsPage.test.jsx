import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test/renderWithProviders'
import ReportsPage from './ReportsPage'

vi.mock('../api/reports', () => ({
  getAccountBalances: vi.fn(),
  getSpendingByCategory: vi.fn(),
  getMonthlySummary: vi.fn(),
}))

import { getAccountBalances, getSpendingByCategory, getMonthlySummary } from '../api/reports'

const account = { id: 'acc-1', name: 'Main Checking', account_type: 'CHECKING', currency: 'USD', balance: '1500.00' }
const spendingItem = { category_id: 'cat-1', category_name: 'Groceries', total: 200 }

function renderPage() {
  return renderWithProviders(<ReportsPage />)
}

beforeEach(() => {
  vi.clearAllMocks()
  getAccountBalances.mockResolvedValue({ data: [] })
  getSpendingByCategory.mockResolvedValue({ data: [] })
  getMonthlySummary.mockResolvedValue({ data: [] })
})

describe('ReportsPage — tabs', () => {
  it('renders tab buttons', async () => {
    renderPage()
    expect(await screen.findByRole('button', { name: /spending by category/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /monthly summary/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /account balances/i })).toBeInTheDocument()
  })

  it('switches to monthly summary tab', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(await screen.findByRole('button', { name: /monthly summary/i }))
    expect(screen.getByTestId('tab-monthly')).not.toHaveClass('hidden')
    expect(screen.getByTestId('tab-spending')).toHaveClass('hidden')
  })
})

describe('ReportsPage — spending tab', () => {
  it('shows no expenses message when empty', async () => {
    renderPage()
    expect(await screen.findByText('No expenses in this period.')).toBeInTheDocument()
  })

  it('shows category name and formatted amount', async () => {
    getSpendingByCategory.mockResolvedValue({ data: [spendingItem] })
    renderPage()
    expect(await screen.findByText('Groceries')).toBeInTheDocument()
    expect(screen.getByText('$200.00')).toBeInTheDocument()
  })
})

describe('ReportsPage — accounts tab', () => {
  it('shows account name and balance with currency symbol', async () => {
    const user = userEvent.setup()
    getAccountBalances.mockResolvedValue({ data: [account] })
    renderPage()
    await user.click(await screen.findByRole('button', { name: /account balances/i }))
    await screen.findByText('Main Checking')
    expect(screen.getByText('$1,500.00')).toBeInTheDocument()
  })

  it('shows Checking badge', async () => {
    const user = userEvent.setup()
    getAccountBalances.mockResolvedValue({ data: [account] })
    renderPage()
    await user.click(await screen.findByRole('button', { name: /account balances/i }))
    expect(await screen.findByText('Checking')).toBeInTheDocument()
  })
})

describe('ReportsPage — error states', () => {
  it('shows spending error', async () => {
    getSpendingByCategory.mockRejectedValue(new Error('Network'))
    renderPage()
    expect(await screen.findByText('Failed to load spending data.')).toBeInTheDocument()
  })
})
