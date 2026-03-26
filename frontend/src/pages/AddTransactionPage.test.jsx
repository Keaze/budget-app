import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import AddTransactionPage from './AddTransactionPage'

vi.mock('../api/accounts', () => ({
  getAccounts: vi.fn(),
}))
vi.mock('../api/categories', () => ({
  getCategories: vi.fn(),
}))
vi.mock('../api/transactions', () => ({
  createTransaction: vi.fn(),
}))

import { getAccounts } from '../api/accounts'
import { getCategories } from '../api/categories'
import { createTransaction } from '../api/transactions'

const mockAccounts = [
  { id: 'acc-1', name: 'Main Checking' },
  { id: 'acc-2', name: 'Savings' },
]
const mockCategories = [
  { id: 'cat-1', name: 'Groceries', icon: '', color: '#22c55e' },
]

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/transactions/new']}>
      <Routes>
        <Route path="/transactions/new" element={<AddTransactionPage />} />
        <Route path="/transactions" element={<div>Transactions Page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('AddTransactionPage — loading and display', () => {
  it('shows loading state initially', () => {
    getAccounts.mockReturnValue(new Promise(() => {}))
    getCategories.mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('shows error when API fails', async () => {
    getAccounts.mockRejectedValue(new Error('Network error'))
    getCategories.mockResolvedValue({ data: mockCategories })
    renderPage()
    expect(await screen.findByText('Failed to load data.')).toBeInTheDocument()
  })

  it('renders the form after data loads', async () => {
    getAccounts.mockResolvedValue({ data: mockAccounts })
    getCategories.mockResolvedValue({ data: mockCategories })
    renderPage()
    expect(await screen.findByRole('button', { name: /save/i })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('e.g. Grocery shopping')).toBeInTheDocument()
  })

  it('shows Add Transaction heading', async () => {
    getAccounts.mockResolvedValue({ data: mockAccounts })
    getCategories.mockResolvedValue({ data: mockCategories })
    renderPage()
    expect(await screen.findByText('Add Transaction')).toBeInTheDocument()
  })
})

describe('AddTransactionPage — create flow', () => {
  it('navigates to /transactions on successful save', async () => {
    const user = userEvent.setup()
    getAccounts.mockResolvedValue({ data: mockAccounts })
    getCategories.mockResolvedValue({ data: mockCategories })
    createTransaction.mockResolvedValue({ data: { id: 'tx-new' } })
    renderPage()
    await screen.findByRole('button', { name: /save/i })
    await user.type(screen.getByPlaceholderText('0.00'), '50')
    await user.type(screen.getByPlaceholderText('e.g. Grocery shopping'), 'Lunch')
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => expect(screen.getByText('Transactions Page')).toBeInTheDocument())
  })

  it('calls createTransaction with form data', async () => {
    const user = userEvent.setup()
    getAccounts.mockResolvedValue({ data: mockAccounts })
    getCategories.mockResolvedValue({ data: mockCategories })
    createTransaction.mockResolvedValue({ data: { id: 'tx-new' } })
    renderPage()
    await screen.findByRole('button', { name: /save/i })
    await user.type(screen.getByPlaceholderText('0.00'), '75')
    await user.type(screen.getByPlaceholderText('e.g. Grocery shopping'), 'Dinner')
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() =>
      expect(createTransaction).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 75, label: 'Dinner' })
      )
    )
  })

  it('shows validation error without navigating when label is empty', async () => {
    getAccounts.mockResolvedValue({ data: mockAccounts })
    getCategories.mockResolvedValue({ data: mockCategories })
    renderPage()
    await screen.findByRole('button', { name: /save/i })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(await screen.findByText('Label is required')).toBeInTheDocument()
    expect(createTransaction).not.toHaveBeenCalled()
    expect(screen.queryByText('Transactions Page')).not.toBeInTheDocument()
  })
})
