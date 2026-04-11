import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test/renderWithProviders'
import AddTransactionPage from './AddTransactionPage'

vi.mock('../api/accounts', () => ({ getAccounts: vi.fn() }))
vi.mock('../api/categories', () => ({ getCategories: vi.fn() }))
vi.mock('../api/transactions', () => ({ createTransaction: vi.fn() }))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

import { getAccounts } from '../api/accounts'
import { getCategories } from '../api/categories'
import { createTransaction } from '../api/transactions'

const account = { id: 'acc-1', name: 'Main Checking', currency: 'USD' }
const category = { id: 'cat-1', name: 'Groceries', color: '#22c55e', icon: '🛒' }

beforeEach(() => {
  vi.clearAllMocks()
  getAccounts.mockResolvedValue({ data: [account] })
  getCategories.mockResolvedValue({ data: [category] })
  mockNavigate.mockReset()
})

describe('AddTransactionPage', () => {
  it('shows loading state initially', () => {
    getAccounts.mockReturnValue(new Promise(() => {}))
    getCategories.mockReturnValue(new Promise(() => {}))
    renderWithProviders(<AddTransactionPage />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('renders the form after loading', async () => {
    renderWithProviders(<AddTransactionPage />)
    expect(await screen.findByText('Add Transaction')).toBeInTheDocument()
  })

  it('shows error when data fails to load', async () => {
    getAccounts.mockRejectedValue(new Error('Network error'))
    renderWithProviders(<AddTransactionPage />)
    expect(await screen.findByText('Failed to load data.')).toBeInTheDocument()
  })

  it('navigates to /transactions after successful save', async () => {
    const user = userEvent.setup()
    createTransaction.mockResolvedValue({ data: {} })
    renderWithProviders(<AddTransactionPage />)
    await screen.findByText('Add Transaction')
    await user.type(screen.getByPlaceholderText(/grocery/i), 'Coffee')
    await user.type(screen.getByPlaceholderText('0.00'), '5')
    await user.click(screen.getByRole('button', { name: /^save$/i }))
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/transactions'))
  })
})
