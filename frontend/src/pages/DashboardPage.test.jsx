import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../test/renderWithProviders'
import DashboardPage from './DashboardPage'

vi.mock('../api/reports', () => ({
  getAccountBalances: vi.fn(),
  getSpendingByCategory: vi.fn(),
}))
vi.mock('../api/transactions', () => ({ getTransactions: vi.fn() }))
vi.mock('../api/categories', () => ({ getCategories: vi.fn() }))

import { getAccountBalances, getSpendingByCategory } from '../api/reports'
import { getTransactions } from '../api/transactions'
import { getCategories } from '../api/categories'

const account = { id: 'acc-1', name: 'Main Checking', account_type: 'CHECKING', currency: 'USD', balance: '1000.00' }

function renderPage() {
  return renderWithProviders(<DashboardPage />)
}

beforeEach(() => {
  vi.clearAllMocks()
  getCategories.mockResolvedValue({ data: [] })
})

describe('DashboardPage — loading', () => {
  it('shows loading state initially', () => {
    getAccountBalances.mockReturnValue(new Promise(() => {}))
    getTransactions.mockReturnValue(new Promise(() => {}))
    getSpendingByCategory.mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(screen.getByText(/loading dashboard/i)).toBeInTheDocument()
  })
})

describe('DashboardPage — content', () => {
  beforeEach(() => {
    getAccountBalances.mockResolvedValue({ data: [account] })
    getTransactions.mockResolvedValue({ data: { data: [], page: 1, page_size: 10, total: 0 } })
    getSpendingByCategory.mockResolvedValue({ data: [] })
  })

  it('renders total balance with currency symbol', async () => {
    renderPage()
    expect(await screen.findByTestId('hero-total-balance')).toHaveTextContent('$1,000.00')
  })

  it('renders account name in accounts section', async () => {
    renderPage()
    await screen.findByTestId('hero-total-balance')
    expect(screen.getByText('Main Checking')).toBeInTheDocument()
  })

  it('shows no expenses message when spending is empty', async () => {
    renderPage()
    await screen.findByTestId('hero-total-balance')
    expect(screen.getByText('No expenses this month.')).toBeInTheDocument()
  })

  it('shows no transactions message when list is empty', async () => {
    renderPage()
    await screen.findByTestId('hero-total-balance')
    expect(screen.getByText('No transactions yet.')).toBeInTheDocument()
  })
})

describe('DashboardPage — error', () => {
  it('shows error message when API fails', async () => {
    getAccountBalances.mockRejectedValue(new Error('Network error'))
    getTransactions.mockRejectedValue(new Error('Network error'))
    getSpendingByCategory.mockRejectedValue(new Error('Network error'))
    renderPage()
    expect(await screen.findByText('Failed to load dashboard.')).toBeInTheDocument()
  })
})
