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

describe('TransactionForm — initial state', () => {
  it('defaults to Expense type', () => {
    renderForm()
    expect(screen.getByRole('button', { name: 'Expense' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Income' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('defaults date to today', () => {
    renderForm()
    const today = new Date().toISOString().slice(0, 10)
    expect(screen.getByDisplayValue(today)).toBeInTheDocument()
  })

  it('defaults account to first account', () => {
    renderForm()
    expect(screen.getByDisplayValue('Main Checking')).toBeInTheDocument()
  })

  it('does not show Transfer To field initially', () => {
    renderForm()
    expect(screen.queryByLabelText(/transfer to/i)).not.toBeInTheDocument()
  })
})

describe('TransactionForm — type selector', () => {
  it('switches to Income type when Income clicked', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.click(screen.getByRole('button', { name: 'Income' }))
    expect(screen.getByRole('button', { name: 'Income' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Expense' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('hides Transfer To field when switching away from Transfer', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.click(screen.getByRole('button', { name: 'Transfer' }))
    expect(screen.getByLabelText(/transfer to/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Expense' }))
    expect(screen.queryByLabelText(/transfer to/i)).not.toBeInTheDocument()
  })

  it('excludes source account from Transfer To options', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.click(screen.getByRole('button', { name: 'Transfer' }))
    const destSelect = screen.getByLabelText(/transfer to/i)
    const options = Array.from(destSelect.querySelectorAll('option')).map(o => o.textContent)
    expect(options).not.toContain('Main Checking')
    expect(options.some(o => o.includes('Savings'))).toBe(true)
  })
})

describe('TransactionForm — submission', () => {
  it('calls onSave with transfer_to_account_id for Transfer type', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue()
    renderForm({ onSave })
    await user.click(screen.getByRole('button', { name: 'Transfer' }))
    await user.type(screen.getByPlaceholderText('0.00'), '200')
    await user.type(screen.getByPlaceholderText(/grocery/i), 'Move funds')
    await user.selectOptions(screen.getByLabelText(/transfer to/i), 'acc-2')
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }))
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          transaction_type: 'TRANSFER',
          transfer_to_account_id: 'acc-2',
        })
      )
    )
  })

  it('trims label whitespace before submitting', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue()
    renderForm({ onSave })
    await user.type(screen.getByPlaceholderText('0.00'), '10')
    await user.type(screen.getByPlaceholderText(/grocery/i), '  My label  ')
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }))
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ label: 'My label' })
      )
    )
  })
})

describe('TransactionForm — edit mode pre-fill', () => {
  const transaction = {
    id: 'tx-1',
    transaction_type: 'INCOME',
    account_id: 'acc-2',
    amount: 500,
    label: 'Freelance payment',
    category_id: 'cat-1',
    date: '2026-02-15T00:00:00Z',
    notes: 'Project X',
    transfer_to_account_id: null,
  }

  it('pre-fills type from transaction', () => {
    renderForm({ transaction })
    expect(screen.getByRole('button', { name: 'Income' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('pre-fills amount from transaction', () => {
    renderForm({ transaction })
    expect(screen.getByDisplayValue('500')).toBeInTheDocument()
  })

  it('pre-fills label from transaction', () => {
    renderForm({ transaction })
    expect(screen.getByDisplayValue('Freelance payment')).toBeInTheDocument()
  })

  it('pre-fills notes from transaction', () => {
    renderForm({ transaction })
    expect(screen.getByDisplayValue('Project X')).toBeInTheDocument()
  })

  it('pre-fills date from transaction', () => {
    renderForm({ transaction })
    expect(screen.getByDisplayValue('2026-02-15')).toBeInTheDocument()
  })

  it('disables account select in edit mode', () => {
    renderForm({ transaction })
    expect(screen.getByDisplayValue('Savings')).toBeDisabled()
  })
})
