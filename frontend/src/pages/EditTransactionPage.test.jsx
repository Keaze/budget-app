import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import EditTransactionPage from './EditTransactionPage'

vi.mock('../api/accounts', () => ({
  getAccounts: vi.fn(),
}))
vi.mock('../api/categories', () => ({
  getCategories: vi.fn(),
}))
vi.mock('../api/transactions', () => ({
  getTransaction: vi.fn(),
  updateTransaction: vi.fn(),
}))

import { getAccounts } from '../api/accounts'
import { getCategories } from '../api/categories'
import { getTransaction, updateTransaction } from '../api/transactions'

const mockAccounts = [
  { id: 'acc-1', name: 'Main Checking' },
  { id: 'acc-2', name: 'Savings' },
]
const mockCategories = [
  { id: 'cat-1', name: 'Groceries', icon: '', color: '#22c55e' },
]
const mockTransaction = {
  id: 'tx-1',
  transaction_type: 'EXPENSE',
  account_id: 'acc-1',
  amount: 99.99,
  label: 'Electricity bill',
  category_id: 'cat-1',
  date: '2026-03-10T00:00:00Z',
  notes: 'March bill',
  transfer_to_account_id: null,
}

function renderPage(txId = 'tx-1') {
  return render(
    <MemoryRouter initialEntries={[`/transactions/${txId}/edit`]}>
      <Routes>
        <Route path="/transactions/:id/edit" element={<EditTransactionPage />} />
        <Route path="/transactions" element={<div>Transactions Page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('EditTransactionPage — loading and display', () => {
  it('shows loading state initially', () => {
    getTransaction.mockReturnValue(new Promise(() => {}))
    getAccounts.mockReturnValue(new Promise(() => {}))
    getCategories.mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('shows error when API fails', async () => {
    getTransaction.mockRejectedValue(new Error('Not found'))
    getAccounts.mockResolvedValue({ data: mockAccounts })
    getCategories.mockResolvedValue({ data: mockCategories })
    renderPage()
    expect(await screen.findByText('Failed to load transaction.')).toBeInTheDocument()
  })

  it('shows Edit Transaction heading', async () => {
    getTransaction.mockResolvedValue({ data: mockTransaction })
    getAccounts.mockResolvedValue({ data: mockAccounts })
    getCategories.mockResolvedValue({ data: mockCategories })
    renderPage()
    expect(await screen.findByText('Edit Transaction')).toBeInTheDocument()
  })
})

describe('EditTransactionPage — pre-fill', () => {
  beforeEach(() => {
    getTransaction.mockResolvedValue({ data: mockTransaction })
    getAccounts.mockResolvedValue({ data: mockAccounts })
    getCategories.mockResolvedValue({ data: mockCategories })
  })

  it('pre-fills label from transaction', async () => {
    renderPage()
    expect(await screen.findByDisplayValue('Electricity bill')).toBeInTheDocument()
  })

  it('pre-fills amount from transaction', async () => {
    renderPage()
    expect(await screen.findByDisplayValue('99.99')).toBeInTheDocument()
  })

  it('pre-fills notes from transaction', async () => {
    renderPage()
    expect(await screen.findByDisplayValue('March bill')).toBeInTheDocument()
  })

  it('pre-fills date from transaction', async () => {
    renderPage()
    expect(await screen.findByDisplayValue('2026-03-10')).toBeInTheDocument()
  })

  it('type buttons are disabled in edit mode', async () => {
    renderPage()
    await screen.findByText('Edit Transaction')
    expect(screen.getByRole('button', { name: 'Expense' })).toBeDisabled()
  })
})

describe('EditTransactionPage — edit flow', () => {
  beforeEach(() => {
    getTransaction.mockResolvedValue({ data: mockTransaction })
    getAccounts.mockResolvedValue({ data: mockAccounts })
    getCategories.mockResolvedValue({ data: mockCategories })
  })

  it('navigates to /transactions after successful save', async () => {
    const user = userEvent.setup()
    updateTransaction.mockResolvedValue({ data: mockTransaction })
    renderPage()
    await screen.findByDisplayValue('Electricity bill')
    const labelInput = screen.getByDisplayValue('Electricity bill')
    await user.clear(labelInput)
    await user.type(labelInput, 'Updated bill')
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => expect(screen.getByText('Transactions Page')).toBeInTheDocument())
  })

  it('calls updateTransaction with PATCH-appropriate fields only', async () => {
    const user = userEvent.setup()
    updateTransaction.mockResolvedValue({ data: mockTransaction })
    renderPage()
    await screen.findByDisplayValue('Electricity bill')
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() =>
      expect(updateTransaction).toHaveBeenCalledWith(
        'tx-1',
        expect.objectContaining({ label: 'Electricity bill', amount: 99.99 })
      )
    )
    // Ensure no account_id or transaction_type sent in PATCH
    const callArg = updateTransaction.mock.calls[0][1]
    expect(callArg).not.toHaveProperty('account_id')
    expect(callArg).not.toHaveProperty('transaction_type')
  })

  it('shows API error when update fails', async () => {
    updateTransaction.mockRejectedValue(new Error('Update failed'))
    renderPage()
    await screen.findByDisplayValue('Electricity bill')
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(await screen.findByText('Update failed')).toBeInTheDocument()
  })
})
