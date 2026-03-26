import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import DashboardPage from './DashboardPage'

// Mock Recharts to avoid SVG/ResizeObserver issues in jsdom
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ data, onClick }) => (
    <div>
      {(data ?? []).map(entry => (
        <button
          key={entry.category_id}
          data-testid={`segment-${entry.category_id}`}
          onClick={() => onClick?.(entry, 0, {})}
        >
          {entry.category_name}
        </button>
      ))}
    </div>
  ),
  Cell: () => null,
  Tooltip: () => null,
  Legend: () => null,
}))

vi.mock('../api/reports', () => ({
  getAccountBalances: vi.fn(),
  getSpendingByCategory: vi.fn(),
}))
vi.mock('../api/transactions', () => ({
  getTransactions: vi.fn(),
}))
vi.mock('../api/categories', () => ({
  getCategories: vi.fn(),
}))

import { getAccountBalances, getSpendingByCategory } from '../api/reports'
import { getTransactions } from '../api/transactions'
import { getCategories } from '../api/categories'

const mockAccounts = [
  { id: 'acc-1', name: 'Main Checking', account_type: 'CHECKING', currency: 'USD', balance: '1500.00' },
  { id: 'acc-2', name: 'Savings', account_type: 'SAVINGS', currency: 'USD', balance: '3000.00' },
]
const mockCategories = [
  { id: 'cat-1', name: 'Groceries', color: '#22c55e' },
  { id: 'cat-2', name: 'Transport', color: '#3b82f6' },
]
const mockTransactions = [
  {
    id: 'tx-1',
    transaction_type: 'EXPENSE',
    amount: 42.5,
    label: 'Weekly shop',
    date: '2026-03-10T00:00:00Z',
    account_id: 'acc-1',
    category_id: 'cat-1',
  },
  {
    id: 'tx-2',
    transaction_type: 'INCOME',
    amount: 1000,
    label: 'Salary',
    date: '2026-03-01T00:00:00Z',
    account_id: 'acc-1',
    category_id: null,
  },
]
const mockSpending = [
  { category_id: 'cat-1', category_name: 'Groceries', color: '#22c55e', total: 120.5 },
  { category_id: 'cat-2', category_name: 'Transport', color: '#3b82f6', total: 45.0 },
]

function renderPage(initialUrl = '/') {
  return render(
    <MemoryRouter initialEntries={[initialUrl]}>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/transactions" element={<div>Transactions Page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  getAccountBalances.mockResolvedValue({ data: mockAccounts })
  getTransactions.mockResolvedValue({
    data: { data: mockTransactions, page: 1, page_size: 10, total: 2 },
  })
  getSpendingByCategory.mockResolvedValue({ data: mockSpending })
  getCategories.mockResolvedValue({ data: mockCategories })
})

describe('DashboardPage — loading and error', () => {
  it('shows loading state initially', () => {
    getAccountBalances.mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(screen.getByText(/loading dashboard/i)).toBeInTheDocument()
  })

  it('shows error when any API call fails', async () => {
    getAccountBalances.mockRejectedValue(new Error('Network error'))
    renderPage()
    expect(await screen.findByText('Failed to load dashboard.')).toBeInTheDocument()
  })

  it('shows Dashboard heading', async () => {
    renderPage()
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
  })
})

describe('DashboardPage — account balances', () => {
  it('renders account cards with names', async () => {
    renderPage()
    await screen.findByRole('heading', { name: 'Dashboard' })
    expect(screen.getAllByText('Main Checking').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Savings').length).toBeGreaterThan(0)
  })

  it('renders account balances', async () => {
    renderPage()
    await screen.findByRole('heading', { name: 'Dashboard' })
    expect(screen.getByText(/1500\.00/)).toBeInTheDocument()
    expect(screen.getByText(/3000\.00/)).toBeInTheDocument()
  })

  it('shows empty state when no accounts', async () => {
    getAccountBalances.mockResolvedValue({ data: [] })
    renderPage()
    await screen.findByRole('heading', { name: 'Dashboard' })
    expect(screen.getByText(/no accounts yet/i)).toBeInTheDocument()
  })

  it('calls getAccountBalances on mount', async () => {
    renderPage()
    await screen.findByRole('heading', { name: 'Dashboard' })
    expect(getAccountBalances).toHaveBeenCalledOnce()
  })
})

describe('DashboardPage — recent transactions', () => {
  it('renders recent transaction labels', async () => {
    renderPage()
    await screen.findByRole('heading', { name: 'Dashboard' })
    expect(screen.getAllByText('Weekly shop').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Salary').length).toBeGreaterThan(0)
  })

  it('calls getTransactions with page_size=10', async () => {
    renderPage()
    await screen.findByRole('heading', { name: 'Dashboard' })
    expect(getTransactions).toHaveBeenCalledWith(
      expect.objectContaining({ page_size: 10 })
    )
  })

  it('shows View all link to /transactions', async () => {
    renderPage()
    await screen.findByRole('heading', { name: 'Dashboard' })
    const link = screen.getByRole('link', { name: /view all/i })
    expect(link).toHaveAttribute('href', '/transactions')
  })

  it('shows empty state when no transactions', async () => {
    getTransactions.mockResolvedValue({
      data: { data: [], page: 1, page_size: 10, total: 0 },
    })
    renderPage()
    await screen.findByRole('heading', { name: 'Dashboard' })
    expect(screen.getByText(/no transactions yet/i)).toBeInTheDocument()
  })
})

describe('DashboardPage — spending chart', () => {
  it('renders the pie chart when spending data exists', async () => {
    renderPage()
    await screen.findByRole('heading', { name: 'Dashboard' })
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
  })

  it('renders pie segments with category names', async () => {
    renderPage()
    await screen.findByRole('heading', { name: 'Dashboard' })
    expect(screen.getByTestId('segment-cat-1')).toBeInTheDocument()
    expect(screen.getByTestId('segment-cat-2')).toBeInTheDocument()
  })

  it('shows empty state when no spending this month', async () => {
    getSpendingByCategory.mockResolvedValue({ data: [] })
    renderPage()
    await screen.findByRole('heading', { name: 'Dashboard' })
    expect(screen.getByText(/no expenses this month/i)).toBeInTheDocument()
  })

  it('calls getSpendingByCategory with current month date range', async () => {
    renderPage()
    await screen.findByRole('heading', { name: 'Dashboard' })
    expect(getSpendingByCategory).toHaveBeenCalledWith(
      expect.objectContaining({
        date_from: expect.stringMatching(/^\d{4}-\d{2}-01$/),
        date_to: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      })
    )
  })

  it('navigates to filtered transactions when segment clicked', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByRole('heading', { name: 'Dashboard' })
    await user.click(screen.getByTestId('segment-cat-1'))
    await waitFor(() =>
      expect(screen.getByText('Transactions Page')).toBeInTheDocument()
    )
  })
})
