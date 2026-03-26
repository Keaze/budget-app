import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import ReportsPage from './ReportsPage'

// Mock Recharts to avoid SVG/ResizeObserver issues in jsdom
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ data, onClick }) => (
    <div>
      {(data ?? []).map(entry => (
        <button
          key={entry.category_id}
          data-testid={`pie-segment-${entry.category_id}`}
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
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: ({ dataKey, name }) => <div data-testid={`bar-${dataKey}`}>{name}</div>,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
}))

vi.mock('../api/reports', () => ({
  getAccountBalances: vi.fn(),
  getSpendingByCategory: vi.fn(),
  getMonthlySummary: vi.fn(),
}))

import { getAccountBalances, getSpendingByCategory, getMonthlySummary } from '../api/reports'

const mockAccounts = [
  { id: 'acc-1', name: 'Main Checking', account_type: 'CHECKING', currency: 'USD', balance: '1500.00' },
  { id: 'acc-2', name: 'Savings', account_type: 'SAVINGS', currency: 'USD', balance: '3000.00' },
]
const mockSpending = [
  { category_id: 'cat-1', category_name: 'Groceries', color: '#22c55e', total: 120.5 },
  { category_id: 'cat-2', category_name: 'Transport', color: '#3b82f6', total: 45.0 },
]
const mockMonthlySummary = Array.from({ length: 12 }, (_, i) => ({
  month: i + 1,
  income: i === 2 ? 1000 : 0,
  expenses: i === 2 ? 200 : 0,
}))

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/reports']}>
      <Routes>
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/transactions" element={<div>Transactions Page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  getAccountBalances.mockResolvedValue({ data: mockAccounts })
  getSpendingByCategory.mockResolvedValue({ data: mockSpending })
  getMonthlySummary.mockResolvedValue({ data: mockMonthlySummary })
})

describe('ReportsPage — loading states', () => {
  it('shows loading state for spending data', () => {
    getSpendingByCategory.mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(screen.getByText(/loading spending data/i)).toBeInTheDocument()
  })

  it('shows loading state for monthly summary', () => {
    getMonthlySummary.mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(screen.getByText(/loading monthly summary/i)).toBeInTheDocument()
  })

  it('shows loading state for account balances', () => {
    getAccountBalances.mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(screen.getByText(/loading account balances/i)).toBeInTheDocument()
  })
})

describe('ReportsPage — page heading', () => {
  it('shows Reports heading', async () => {
    renderPage()
    expect(await screen.findByRole('heading', { name: 'Reports' })).toBeInTheDocument()
  })
})

describe('ReportsPage — spending by category', () => {
  it('renders pie chart when spending data exists', async () => {
    renderPage()
    await screen.findByRole('heading', { name: 'Reports' })
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
  })

  it('renders pie segments with category names', async () => {
    renderPage()
    await screen.findByRole('heading', { name: 'Reports' })
    expect(screen.getByTestId('pie-segment-cat-1')).toBeInTheDocument()
    expect(screen.getByTestId('pie-segment-cat-2')).toBeInTheDocument()
  })

  it('shows empty state when no spending in period', async () => {
    getSpendingByCategory.mockResolvedValue({ data: [] })
    renderPage()
    await screen.findByRole('heading', { name: 'Reports' })
    expect(screen.getByText(/no expenses in this period/i)).toBeInTheDocument()
  })

  it('calls getSpendingByCategory with current month date range', async () => {
    renderPage()
    await screen.findByRole('heading', { name: 'Reports' })
    expect(getSpendingByCategory).toHaveBeenCalledWith(
      expect.objectContaining({
        date_from: expect.stringMatching(/^\d{4}-\d{2}-01$/),
        date_to: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      })
    )
  })

  it('shows error when spending API fails', async () => {
    getSpendingByCategory.mockRejectedValue(new Error('Network error'))
    renderPage()
    expect(await screen.findByText('Failed to load spending data.')).toBeInTheDocument()
  })

  it('navigates to filtered transactions when pie segment clicked', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByRole('heading', { name: 'Reports' })
    await user.click(screen.getByTestId('pie-segment-cat-1'))
    await waitFor(() =>
      expect(screen.getByText('Transactions Page')).toBeInTheDocument()
    )
  })

  it('re-fetches spending when date-from changes', async () => {
    renderPage()
    await screen.findByRole('heading', { name: 'Reports' })
    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-01-01' } })
    await waitFor(() =>
      expect(getSpendingByCategory).toHaveBeenCalledWith(
        expect.objectContaining({ date_from: '2026-01-01' })
      )
    )
  })

  it('re-fetches spending when date-to changes', async () => {
    renderPage()
    await screen.findByRole('heading', { name: 'Reports' })
    fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-01-31' } })
    await waitFor(() =>
      expect(getSpendingByCategory).toHaveBeenCalledWith(
        expect.objectContaining({ date_to: '2026-01-31' })
      )
    )
  })
})

describe('ReportsPage — monthly summary', () => {
  it('renders bar chart', async () => {
    renderPage()
    await screen.findByRole('heading', { name: 'Reports' })
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
  })

  it('renders income and expenses bars', async () => {
    renderPage()
    await screen.findByRole('heading', { name: 'Reports' })
    expect(screen.getByTestId('bar-income')).toBeInTheDocument()
    expect(screen.getByTestId('bar-expenses')).toBeInTheDocument()
  })

  it('calls getMonthlySummary with current year', async () => {
    renderPage()
    await screen.findByRole('heading', { name: 'Reports' })
    expect(getMonthlySummary).toHaveBeenCalledWith(
      expect.objectContaining({ year: String(new Date().getFullYear()) })
    )
  })

  it('shows error when monthly API fails', async () => {
    getMonthlySummary.mockRejectedValue(new Error('Network error'))
    renderPage()
    expect(await screen.findByText('Failed to load monthly summary.')).toBeInTheDocument()
  })

  it('re-fetches monthly summary when year changes', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByRole('heading', { name: 'Reports' })
    await user.selectOptions(screen.getByLabelText('Year'), '2025')
    await waitFor(() =>
      expect(getMonthlySummary).toHaveBeenCalledWith(
        expect.objectContaining({ year: '2025' })
      )
    )
  })
})

describe('ReportsPage — account balances', () => {
  it('renders account names in balance table', async () => {
    renderPage()
    await screen.findByRole('heading', { name: 'Reports' })
    expect(screen.getByText('Main Checking')).toBeInTheDocument()
    expect(screen.getByText('Savings')).toBeInTheDocument()
  })

  it('renders account balances', async () => {
    renderPage()
    await screen.findByRole('heading', { name: 'Reports' })
    expect(screen.getByText(/1500\.00/)).toBeInTheDocument()
    expect(screen.getByText(/3000\.00/)).toBeInTheDocument()
  })

  it('shows empty state when no accounts', async () => {
    getAccountBalances.mockResolvedValue({ data: [] })
    renderPage()
    await screen.findByRole('heading', { name: 'Reports' })
    expect(screen.getByText(/no accounts yet/i)).toBeInTheDocument()
  })

  it('shows error when accounts API fails', async () => {
    getAccountBalances.mockRejectedValue(new Error('Network error'))
    renderPage()
    expect(await screen.findByText('Failed to load account balances.')).toBeInTheDocument()
  })
})
