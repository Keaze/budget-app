import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../test/renderWithProviders'
import EditTransactionPage from './EditTransactionPage'

vi.mock('../api/accounts', () => ({ getAccounts: vi.fn() }))
vi.mock('../api/categories', () => ({ getCategories: vi.fn() }))
vi.mock('../api/transactions', () => ({
  getTransaction: vi.fn(),
  updateTransaction: vi.fn(),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate, useParams: () => ({ id: 'tx-1' }) }
})

import { getAccounts } from '../api/accounts'
import { getCategories } from '../api/categories'
import { getTransaction, updateTransaction } from '../api/transactions'

const account = { id: 'acc-1', name: 'Main Checking', currency: 'USD' }
const category = { id: 'cat-1', name: 'Groceries', color: '#22c55e', icon: '🛒' }
const transaction = {
  id: 'tx-1',
  transaction_type: 'EXPENSE',
  account_id: 'acc-1',
  amount: '50.00',
  label: 'Supermarket',
  date: '2026-03-10T00:00:00Z',
  category_id: null,
}

beforeEach(() => {
  vi.clearAllMocks()
  getAccounts.mockResolvedValue({ data: [account] })
  getCategories.mockResolvedValue({ data: [category] })
  mockNavigate.mockReset()
})

describe('EditTransactionPage', () => {
  it('shows loading initially', () => {
    getTransaction.mockReturnValue(new Promise(() => {}))
    renderWithProviders(<EditTransactionPage />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('shows error when transaction fails to load', async () => {
    getTransaction.mockRejectedValue(new Error('Not found'))
    renderWithProviders(<EditTransactionPage />)
    expect(await screen.findByText('Failed to load transaction.')).toBeInTheDocument()
  })

  it('renders the form with "Edit Transaction" heading', async () => {
    getTransaction.mockResolvedValue({ data: transaction })
    renderWithProviders(<EditTransactionPage />)
    expect(await screen.findByText('Edit Transaction')).toBeInTheDocument()
  })

  it('pre-fills the label field', async () => {
    getTransaction.mockResolvedValue({ data: transaction })
    renderWithProviders(<EditTransactionPage />)
    expect(await screen.findByDisplayValue('Supermarket')).toBeInTheDocument()
  })

  it('navigates to /transactions after successful save', async () => {
    getTransaction.mockResolvedValue({ data: transaction })
    updateTransaction.mockResolvedValue({ data: transaction })
    renderWithProviders(<EditTransactionPage />)
    await screen.findByText('Edit Transaction')
    // submit via form button
    const saveBtn = screen.getByRole('button', { name: /^save$/i })
    saveBtn.click()
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/transactions'))
  })
})
