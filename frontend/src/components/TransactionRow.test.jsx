import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test/renderWithProviders'
import TransactionRow from './TransactionRow'

const account = { id: 'acc-1', name: 'Main Checking', currency: 'USD' }
const category = { id: 'cat-1', name: 'Groceries', color: '#22c55e' }

const expenseTx = {
  id: 'tx-1',
  transaction_type: 'EXPENSE',
  amount: 42.5,
  label: 'Weekly shop',
  date: '2026-03-10T00:00:00Z',
  account_id: 'acc-1',
  category_id: 'cat-1',
}

const incomeTx = { ...expenseTx, id: 'tx-2', transaction_type: 'INCOME', amount: 1000, label: 'Salary' }
const transferTx = { ...expenseTx, id: 'tx-3', transaction_type: 'TRANSFER', amount: 200, label: 'Transfer' }

function renderRow(props = {}) {
  return renderWithProviders(
    <table><tbody>
      <TransactionRow
        transaction={props.transaction ?? expenseTx}
        account={account}
        category={category}
        deleting={props.deleting ?? false}
        onDelete={props.onDelete ?? vi.fn()}
        onDeleteConfirm={props.onDeleteConfirm ?? vi.fn()}
        onDeleteCancel={props.onDeleteCancel ?? vi.fn()}
      />
    </tbody></table>
  )
}

describe('TransactionRow — display', () => {
  it('renders the label', () => {
    renderRow()
    expect(screen.getByText('Weekly shop')).toBeInTheDocument()
  })

  it('renders the account name', () => {
    renderRow()
    expect(screen.getByText('Main Checking')).toBeInTheDocument()
  })

  it('renders EXPENSE amount with currency symbol and minus prefix', () => {
    renderRow()
    expect(screen.getByText('-$42.50')).toBeInTheDocument()
  })

  it('renders INCOME amount with + prefix and currency symbol', () => {
    renderRow({ transaction: incomeTx })
    expect(screen.getByText('+$1,000.00')).toBeInTheDocument()
  })

  it('renders TRANSFER amount with currency symbol and no prefix', () => {
    renderRow({ transaction: transferTx })
    expect(screen.getByText('$200.00')).toBeInTheDocument()
  })

  it('renders edit link', () => {
    renderRow()
    expect(screen.getByRole('link', { name: /edit/i })).toHaveAttribute('href', '/transactions/tx-1/edit')
  })

  it('renders delete button', () => {
    renderRow()
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
  })
})

describe('TransactionRow — delete flow', () => {
  it('shows confirmation when deleting is true', () => {
    renderRow({ deleting: true })
    expect(screen.getByText('Delete?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /yes/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /no/i })).toBeInTheDocument()
  })

  it('calls onDeleteConfirm when Yes clicked', async () => {
    const user = userEvent.setup()
    const onDeleteConfirm = vi.fn()
    renderRow({ deleting: true, onDeleteConfirm })
    await user.click(screen.getByRole('button', { name: /yes/i }))
    expect(onDeleteConfirm).toHaveBeenCalledWith('tx-1')
  })

  it('calls onDeleteCancel when No clicked', async () => {
    const user = userEvent.setup()
    const onDeleteCancel = vi.fn()
    renderRow({ deleting: true, onDeleteCancel })
    await user.click(screen.getByRole('button', { name: /no/i }))
    expect(onDeleteCancel).toHaveBeenCalled()
  })
})

describe('TransactionRow — notes', () => {
  it('renders notes when present', () => {
    renderRow({ transaction: { ...expenseTx, notes: 'Bulk purchase' } })
    expect(screen.getByTestId('tx-notes')).toHaveTextContent('Bulk purchase')
  })

  it('does not render notes element when absent', () => {
    renderRow()
    expect(screen.queryByTestId('tx-notes')).not.toBeInTheDocument()
  })
})
