import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import TransactionCard from './TransactionCard'

const account = { id: 'acc-1', name: 'Main Checking' }
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
const transferTx = { ...expenseTx, id: 'tx-3', transaction_type: 'TRANSFER', amount: 200, label: 'Savings transfer' }

function renderCard(props = {}) {
  const onDelete = props.onDelete ?? vi.fn()
  const onDeleteConfirm = props.onDeleteConfirm ?? vi.fn()
  const onDeleteCancel = props.onDeleteCancel ?? vi.fn()
  return render(
    <MemoryRouter>
      <TransactionCard
        transaction={props.transaction ?? expenseTx}
        account={account}
        category={category}
        deleting={props.deleting ?? false}
        onDelete={onDelete}
        onDeleteConfirm={onDeleteConfirm}
        onDeleteCancel={onDeleteCancel}
      />
    </MemoryRouter>
  )
}

describe('TransactionCard — display', () => {
  it('renders the label', () => {
    renderCard()
    expect(screen.getByText('Weekly shop')).toBeInTheDocument()
  })

  it('renders the account name', () => {
    renderCard()
    expect(screen.getByText('Main Checking')).toBeInTheDocument()
  })

  it('renders the category badge', () => {
    renderCard()
    expect(screen.getByText('Groceries')).toBeInTheDocument()
  })

  it('renders the amount with 2 decimal places', () => {
    renderCard()
    expect(screen.getByText('-42.50')).toBeInTheDocument()
  })

  it('prefixes INCOME amount with +', () => {
    renderCard({ transaction: incomeTx })
    expect(screen.getByText('+1000.00')).toBeInTheDocument()
  })

  it('prefixes EXPENSE amount with -', () => {
    renderCard()
    expect(screen.getByText('-42.50')).toBeInTheDocument()
  })

  it('shows TRANSFER amount without sign', () => {
    renderCard({ transaction: transferTx })
    expect(screen.getByText('200.00')).toBeInTheDocument()
  })

  it('renders edit link pointing to correct route', () => {
    renderCard()
    const link = screen.getByRole('link', { name: /edit/i })
    expect(link).toHaveAttribute('href', '/transactions/tx-1/edit')
  })

  it('renders delete button', () => {
    renderCard()
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
  })

  it('renders without category when category is null', () => {
    render(
      <MemoryRouter>
        <TransactionCard
          transaction={expenseTx}
          account={account}
          category={null}
          deleting={false}
          onDelete={vi.fn()}
          onDeleteConfirm={vi.fn()}
          onDeleteCancel={vi.fn()}
        />
      </MemoryRouter>
    )
    expect(screen.queryByText('Groceries')).not.toBeInTheDocument()
  })
})

describe('TransactionCard — delete flow', () => {
  it('calls onDelete with id when delete button clicked', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    renderCard({ onDelete })
    await user.click(screen.getByRole('button', { name: /delete/i }))
    expect(onDelete).toHaveBeenCalledWith('tx-1')
  })

  it('shows confirmation when deleting is true', () => {
    renderCard({ deleting: true })
    expect(screen.getByText('Delete?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /yes/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /no/i })).toBeInTheDocument()
  })

  it('hides edit/delete buttons when deleting', () => {
    renderCard({ deleting: true })
    expect(screen.queryByRole('link', { name: /edit/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument()
  })

  it('calls onDeleteConfirm with id when Yes clicked', async () => {
    const user = userEvent.setup()
    const onDeleteConfirm = vi.fn()
    renderCard({ deleting: true, onDeleteConfirm })
    await user.click(screen.getByRole('button', { name: /yes/i }))
    expect(onDeleteConfirm).toHaveBeenCalledWith('tx-1')
  })

  it('calls onDeleteCancel when No clicked', async () => {
    const user = userEvent.setup()
    const onDeleteCancel = vi.fn()
    renderCard({ deleting: true, onDeleteCancel })
    await user.click(screen.getByRole('button', { name: /no/i }))
    expect(onDeleteCancel).toHaveBeenCalled()
  })
})

describe('TransactionCard — notes', () => {
  it('renders notes when present', () => {
    const tx = { ...expenseTx, notes: 'Weekly bulk shop' }
    render(
      <MemoryRouter>
        <TransactionCard
          transaction={tx}
          account={account}
          category={category}
          deleting={false}
          onDelete={vi.fn()}
          onDeleteConfirm={vi.fn()}
          onDeleteCancel={vi.fn()}
        />
      </MemoryRouter>
    )
    expect(screen.getByText('Weekly bulk shop')).toBeInTheDocument()
  })

  it('does not render a notes element when notes is absent', () => {
    render(
      <MemoryRouter>
        <TransactionCard
          transaction={expenseTx}
          account={account}
          category={category}
          deleting={false}
          onDelete={vi.fn()}
          onDeleteConfirm={vi.fn()}
          onDeleteCancel={vi.fn()}
        />
      </MemoryRouter>
    )
    expect(screen.queryByTestId('tx-notes')).not.toBeInTheDocument()
  })
})
