import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test/renderWithProviders'
import TransactionForm from './TransactionForm'

const accounts = [
  { id: 'acc-1', name: 'Main Checking', currency: 'USD' },
  { id: 'acc-2', name: 'Savings', currency: 'USD' },
]
const categories = [
  { id: 'cat-1', name: 'Groceries', color: '#22c55e', icon: '🛒' },
]

function renderForm(props = {}) {
  return renderWithProviders(
    <TransactionForm
      accounts={props.accounts ?? accounts}
      categories={props.categories ?? categories}
      onSave={props.onSave ?? vi.fn()}
      transaction={props.transaction}
    />
  )
}

describe('TransactionForm — validation', () => {
  it('shows label error when label is empty on submit', async () => {
    renderForm()
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(await screen.findByText('Label is required')).toBeInTheDocument()
  })

  it('shows amount error when amount is zero', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.type(screen.getByPlaceholderText(/grocery/i), 'Test')
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(await screen.findByText('Amount must be greater than 0')).toBeInTheDocument()
  })

  it('shows amount error when amount is negative', async () => {
    const user = userEvent.setup()
    renderForm()
    const amountInput = screen.getByPlaceholderText('0.00')
    await user.type(amountInput, '-5')
    await user.type(screen.getByPlaceholderText(/grocery/i), 'Test')
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(await screen.findByText('Amount must be greater than 0')).toBeInTheDocument()
  })
})

describe('TransactionForm — type selection', () => {
  it('renders Income, Expense, Transfer tabs', () => {
    renderForm()
    expect(screen.getByRole('button', { name: /income/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /expense/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /transfer/i })).toBeInTheDocument()
  })

  it('shows transfer destination field when Transfer is selected', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.click(screen.getByRole('button', { name: /transfer/i }))
    expect(screen.getByLabelText(/transfer to/i)).toBeInTheDocument()
  })

  it('hides transfer destination for non-transfer types', () => {
    renderForm()
    expect(screen.queryByLabelText(/transfer to/i)).not.toBeInTheDocument()
  })
})

describe('TransactionForm — submit', () => {
  it('calls onSave with correct data on valid submit', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue()
    renderForm({ onSave })
    const amountInput = screen.getByPlaceholderText('0.00')
    await user.type(amountInput, '42.50')
    await user.type(screen.getByPlaceholderText(/grocery/i), 'Weekly shop')
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }))
    await waitFor(() => expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 42.50, label: 'Weekly shop' })
    ))
  })

  it('shows API error when onSave throws', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockRejectedValue({ response: { data: { error: 'Server error' } } })
    renderForm({ onSave })
    await user.type(screen.getByPlaceholderText('0.00'), '10')
    await user.type(screen.getByPlaceholderText(/grocery/i), 'Test')
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }))
    expect(await screen.findByText('Server error')).toBeInTheDocument()
  })
})

describe('TransactionForm — edit mode', () => {
  it('disables type buttons when editing', () => {
    const transaction = {
      id: 'tx-1',
      transaction_type: 'EXPENSE',
      account_id: 'acc-1',
      amount: '50.00',
      label: 'Test',
      date: '2026-01-01T00:00:00Z',
      category_id: null,
    }
    renderForm({ transaction })
    expect(screen.getByRole('button', { name: /income/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /expense/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /transfer/i })).toBeDisabled()
  })
})
