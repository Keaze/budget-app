import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { SettingsProvider } from '../contexts/SettingsContext'
import testI18n from '../test/i18n'
import TransactionsPage from './TransactionsPage'

vi.mock('../api/accounts', () => ({ getAccounts: vi.fn() }))
vi.mock('../api/categories', () => ({ getCategories: vi.fn() }))
vi.mock('../api/transactions', () => ({
  getTransactions: vi.fn(),
  deleteTransaction: vi.fn(),
}))

import { getAccounts } from '../api/accounts'
import { getCategories } from '../api/categories'
import { getTransactions, deleteTransaction } from '../api/transactions'

const mockAccounts = [
  { id: 'acc-1', name: 'Checking' },
  { id: 'acc-2', name: 'Savings' },
]
const mockCategories = [{ id: 'cat-1', name: 'Groceries', color: '#22c55e' }]
const tx1 = {
  id: 'tx-1',
  transaction_type: 'EXPENSE',
  amount: 42.5,
  label: 'Weekly shop',
  date: '2026-03-10T00:00:00Z',
  account_id: 'acc-1',
  category_id: 'cat-1',
}
const tx2 = {
  id: 'tx-2',
  transaction_type: 'INCOME',
  amount: 1000,
  label: 'Salary',
  date: '2026-03-01T00:00:00Z',
  account_id: 'acc-1',
  category_id: null,
}

function mockTxResponse(transactions, { page = 1, total = null } = {}) {
  return {
    data: {
      data: transactions,
      page,
      page_size: 50,
      total: total ?? transactions.length,
    },
  }
}

function renderPage(initialUrl = '/transactions') {
  return render(
    <I18nextProvider i18n={testI18n}>
      <SettingsProvider>
        <MemoryRouter initialEntries={[initialUrl]}>
          <Routes>
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/transactions/new" element={<div>Add Transaction</div>} />
            <Route path="/transactions/:id/edit" element={<div>Edit Transaction</div>} />
          </Routes>
        </MemoryRouter>
      </SettingsProvider>
    </I18nextProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  getAccounts.mockResolvedValue({ data: mockAccounts })
  getCategories.mockResolvedValue({ data: mockCategories })
})

describe('TransactionsPage — loading and display', () => {
  it('shows loading state initially', () => {
    getTransactions.mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(screen.getByText(/loading transactions/i)).toBeInTheDocument()
  })

  it('renders transaction labels after load', async () => {
    getTransactions.mockResolvedValue(mockTxResponse([tx1, tx2]))
    renderPage()
    // Both table and card render in jsdom (CSS media queries not applied)
    expect((await screen.findAllByText('Weekly shop')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Salary').length).toBeGreaterThan(0)
  })

  it('shows empty state when no transactions', async () => {
    getTransactions.mockResolvedValue(mockTxResponse([]))
    renderPage()
    expect(await screen.findByText(/no transactions found/i)).toBeInTheDocument()
  })

  it('shows error message when API fails', async () => {
    getTransactions.mockRejectedValue(new Error('Network error'))
    renderPage()
    expect(await screen.findByText('Failed to load transactions.')).toBeInTheDocument()
  })

  it('shows page heading', async () => {
    getTransactions.mockResolvedValue(mockTxResponse([]))
    renderPage()
    expect(await screen.findByRole('heading', { name: 'Transactions' })).toBeInTheDocument()
  })
})

describe('TransactionsPage — URL param filtering', () => {
  it('calls getTransactions with account_id from URL', async () => {
    getTransactions.mockResolvedValue(mockTxResponse([tx1]))
    renderPage('/transactions?account_id=acc-1')
    await screen.findAllByText('Weekly shop')
    expect(getTransactions).toHaveBeenCalledWith(
      expect.objectContaining({ account_id: 'acc-1' })
    )
  })

  it('calls getTransactions with transaction_type from URL', async () => {
    getTransactions.mockResolvedValue(mockTxResponse([tx1]))
    renderPage('/transactions?transaction_type=EXPENSE')
    await screen.findAllByText('Weekly shop')
    expect(getTransactions).toHaveBeenCalledWith(
      expect.objectContaining({ transaction_type: 'EXPENSE' })
    )
  })

  it('calls getTransactions with page from URL', async () => {
    getTransactions.mockResolvedValue(mockTxResponse([tx1], { page: 2, total: 60 }))
    renderPage('/transactions?page=2')
    await screen.findAllByText('Weekly shop')
    expect(getTransactions).toHaveBeenCalledWith(
      expect.objectContaining({ page: '2' })
    )
  })
})

describe('TransactionsPage — delete flow', () => {
  it('shows delete confirmation when delete button clicked', async () => {
    const user = userEvent.setup()
    getTransactions.mockResolvedValue(mockTxResponse([tx1]))
    renderPage()
    await screen.findAllByText('Weekly shop')
    // Multiple delete buttons exist (table + card), click first
    await user.click(screen.getAllByRole('button', { name: /delete/i })[0])
    // Confirmation appears in both table row and card (CSS hides one in browser)
    expect(screen.getAllByText('Delete?').length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: /yes/i }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: /no/i }).length).toBeGreaterThan(0)
  })

  it('removes transaction from list after confirming delete', async () => {
    const user = userEvent.setup()
    getTransactions.mockResolvedValue(mockTxResponse([tx1, tx2]))
    deleteTransaction.mockResolvedValue({})
    renderPage()
    await screen.findAllByText('Weekly shop')
    await user.click(screen.getAllByRole('button', { name: /delete/i })[0])
    await user.click(screen.getAllByRole('button', { name: /yes/i })[0])
    await waitFor(() =>
      expect(screen.queryAllByText('Weekly shop')).toHaveLength(0)
    )
    expect(screen.getAllByText('Salary').length).toBeGreaterThan(0)
  })

  it('cancels delete when No clicked', async () => {
    const user = userEvent.setup()
    getTransactions.mockResolvedValue(mockTxResponse([tx1]))
    renderPage()
    await screen.findAllByText('Weekly shop')
    await user.click(screen.getAllByRole('button', { name: /delete/i })[0])
    await user.click(screen.getAllByRole('button', { name: /no/i })[0])
    expect(screen.getAllByText('Weekly shop').length).toBeGreaterThan(0)
    expect(screen.queryAllByText('Delete?')).toHaveLength(0)
  })

  it('shows error when delete fails', async () => {
    const user = userEvent.setup()
    getTransactions.mockResolvedValue(mockTxResponse([tx1]))
    const err = new Error('Server error')
    err.response = { data: { error: 'Delete failed' } }
    deleteTransaction.mockRejectedValue(err)
    renderPage()
    await screen.findAllByText('Weekly shop')
    await user.click(screen.getAllByRole('button', { name: /delete/i })[0])
    await user.click(screen.getAllByRole('button', { name: /yes/i })[0])
    expect(await screen.findByText('Delete failed')).toBeInTheDocument()
  })
})

describe('TransactionsPage — pagination', () => {
  it('shows pagination controls when there are results', async () => {
    getTransactions.mockResolvedValue(mockTxResponse([tx1], { total: 60 }))
    renderPage()
    await screen.findAllByText('Weekly shop')
    expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
    expect(screen.getByText(/page 1 of 2/i)).toBeInTheDocument()
  })

  it('disables Previous button on first page', async () => {
    getTransactions.mockResolvedValue(mockTxResponse([tx1], { total: 60 }))
    renderPage()
    await screen.findAllByText('Weekly shop')
    expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled()
  })

  it('disables Next button on last page', async () => {
    getTransactions.mockResolvedValue(mockTxResponse([tx1], { page: 2, total: 60 }))
    renderPage('/transactions?page=2')
    await screen.findAllByText('Weekly shop')
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled()
  })

  it('navigates to next page when Next clicked', async () => {
    const user = userEvent.setup()
    getTransactions.mockResolvedValue(mockTxResponse([tx1], { total: 60 }))
    renderPage()
    await screen.findAllByText('Weekly shop')
    await user.click(screen.getByRole('button', { name: /next/i }))
    await waitFor(() =>
      expect(getTransactions).toHaveBeenCalledWith(
        expect.objectContaining({ page: '2' })
      )
    )
  })
})

describe('TransactionsPage — add button', () => {
  it('renders Add link in page header', async () => {
    getTransactions.mockResolvedValue(mockTxResponse([]))
    renderPage()
    await screen.findByRole('heading', { name: 'Transactions' })
    // The header Add link has aria text that includes "Add"
    const links = screen.getAllByRole('link')
    const addLink = links.find(l => l.getAttribute('href') === '/transactions/new')
    expect(addLink).toBeInTheDocument()
  })

  it('renders mobile FAB linking to /transactions/new', async () => {
    getTransactions.mockResolvedValue(mockTxResponse([]))
    renderPage()
    await screen.findByRole('heading', { name: 'Transactions' })
    const fab = screen.getByRole('link', { name: /add transaction/i })
    expect(fab).toHaveAttribute('href', '/transactions/new')
  })
})
