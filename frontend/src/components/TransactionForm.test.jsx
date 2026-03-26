import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TransactionForm from './TransactionForm'

const accounts = [
  { id: 'acc-1', name: 'Main Checking' },
  { id: 'acc-2', name: 'Savings' },
]

const categories = [
  { id: 'cat-1', name: 'Groceries', icon: '🛒', color: '#22c55e' },
  { id: 'cat-2', name: 'Transport', icon: '', color: '#3b82f6' },
]

function renderForm(props = {}) {
  const onSave = props.onSave ?? vi.fn()
  return {
    onSave,
    ...render(
      <TransactionForm
        accounts={accounts}
        categories={categories}
        onSave={onSave}
        {...props}
      />
    ),
  }
}

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

  it('shows Transfer To field when Transfer type selected', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.click(screen.getByRole('button', { name: 'Transfer' }))
    expect(screen.getByLabelText(/transfer to/i)).toBeInTheDocument()
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
    expect(destSelect).toBeInTheDocument()
    const options = Array.from(destSelect.querySelectorAll('option')).map(o => o.textContent)
    expect(options).not.toContain('Main Checking')
    expect(options.some(o => o.includes('Savings'))).toBe(true)
  })
})

describe('TransactionForm — validation', () => {
  it('shows label error when submitted with empty label', async () => {
    renderForm()
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(await screen.findByText('Label is required')).toBeInTheDocument()
  })

  it('shows amount error when submitted with no amount', async () => {
    renderForm()
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(await screen.findByText('Amount must be greater than 0')).toBeInTheDocument()
  })

  it('shows amount error when amount is zero', async () => {
    renderForm()
    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '0' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(await screen.findByText('Amount must be greater than 0')).toBeInTheDocument()
  })

  it('does not call onSave when validation fails', async () => {
    const { onSave } = renderForm()
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    await screen.findByText('Label is required')
    expect(onSave).not.toHaveBeenCalled()
  })

  it('clears label error when user starts typing', async () => {
    const user = userEvent.setup()
    renderForm()
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    await screen.findByText('Label is required')
    await user.type(screen.getByPlaceholderText('e.g. Grocery shopping'), 'X')
    expect(screen.queryByText('Label is required')).not.toBeInTheDocument()
  })

  it('clears amount error when user changes amount', async () => {
    const user = userEvent.setup()
    renderForm()
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    await screen.findByText('Amount must be greater than 0')
    await user.type(screen.getByPlaceholderText('0.00'), '5')
    expect(screen.queryByText('Amount must be greater than 0')).not.toBeInTheDocument()
  })
})

describe('TransactionForm — submission', () => {
  it('calls onSave with correct data for Expense', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue()
    renderForm({ onSave })
    await user.type(screen.getByPlaceholderText('0.00'), '42.50')
    await user.type(screen.getByPlaceholderText('e.g. Grocery shopping'), 'Weekly shop')
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          transaction_type: 'EXPENSE',
          account_id: 'acc-1',
          amount: 42.5,
          label: 'Weekly shop',
        })
      )
    )
  })

  it('calls onSave with Income type when Income selected', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue()
    renderForm({ onSave })
    await user.click(screen.getByRole('button', { name: 'Income' }))
    await user.type(screen.getByPlaceholderText('0.00'), '1000')
    await user.type(screen.getByPlaceholderText('e.g. Grocery shopping'), 'Salary')
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ transaction_type: 'INCOME' })
      )
    )
  })

  it('calls onSave with transfer_to_account_id when Transfer selected', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue()
    renderForm({ onSave })
    await user.click(screen.getByRole('button', { name: 'Transfer' }))
    await user.type(screen.getByPlaceholderText('0.00'), '200')
    await user.type(screen.getByPlaceholderText('e.g. Grocery shopping'), 'Move funds')
    await user.selectOptions(screen.getByLabelText(/transfer to/i), 'acc-2')
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
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
    await user.type(screen.getByPlaceholderText('e.g. Grocery shopping'), '  My label  ')
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ label: 'My label' })
      )
    )
  })

  it('shows API error when onSave throws', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockRejectedValue(new Error('Server error'))
    renderForm({ onSave })
    await user.type(screen.getByPlaceholderText('0.00'), '10')
    await user.type(screen.getByPlaceholderText('e.g. Grocery shopping'), 'Test')
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(await screen.findByText('Server error')).toBeInTheDocument()
  })

  it('disables Save while submitting', async () => {
    let resolve
    const onSave = vi.fn().mockReturnValue(new Promise(r => { resolve = r }))
    const user = userEvent.setup()
    renderForm({ onSave })
    await user.type(screen.getByPlaceholderText('0.00'), '10')
    await user.type(screen.getByPlaceholderText('e.g. Grocery shopping'), 'Test')
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled())
    resolve()
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

  it('disables type buttons in edit mode', () => {
    renderForm({ transaction })
    expect(screen.getByRole('button', { name: 'Income' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Expense' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Transfer' })).toBeDisabled()
  })

  it('disables account select in edit mode', () => {
    renderForm({ transaction })
    expect(screen.getByDisplayValue('Savings')).toBeDisabled()
  })
})
