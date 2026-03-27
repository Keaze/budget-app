import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import AccountsPage from './AccountsPage'

vi.mock('../api/accounts', () => ({
  getAccounts: vi.fn(),
  createAccount: vi.fn(),
  updateAccount: vi.fn(),
  deleteAccount: vi.fn(),
}))

import { getAccounts, createAccount, updateAccount, deleteAccount } from '../api/accounts'

const account1 = { id: '1', name: 'Main Checking', account_type: 'CHECKING', currency: 'USD', balance: '1000.00', initial_balance: 1000 }
const account2 = { id: '2', name: 'Emergency Fund', account_type: 'SAVINGS', currency: 'USD', balance: '500.00', initial_balance: 500 }

function renderPage() {
  return render(
    <MemoryRouter>
      <AccountsPage />
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('AccountsPage — loading and display', () => {
  it('shows loading state initially', () => {
    getAccounts.mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(screen.getByText(/loading accounts/i)).toBeInTheDocument()
  })

  it('renders account list after load', async () => {
    getAccounts.mockResolvedValue({ data: [account1, account2] })
    renderPage()
    expect(await screen.findByText('Main Checking')).toBeInTheDocument()
    expect(screen.getByText('Emergency Fund')).toBeInTheDocument()
  })

  it('shows error message when API fails', async () => {
    getAccounts.mockRejectedValue(new Error('Network error'))
    renderPage()
    expect(await screen.findByText('Failed to load accounts.')).toBeInTheDocument()
  })

  it('shows empty state when no accounts', async () => {
    getAccounts.mockResolvedValue({ data: [] })
    renderPage()
    expect(
      await screen.findByText(/no accounts yet/i)
    ).toBeInTheDocument()
  })

  it('shows account balance', async () => {
    getAccounts.mockResolvedValue({ data: [account1] })
    renderPage()
    await screen.findByText('Main Checking')
    expect(screen.getByText(/1000\.00/)).toBeInTheDocument()
  })

  it('shows edit and delete buttons for each account', async () => {
    getAccounts.mockResolvedValue({ data: [account1] })
    renderPage()
    await screen.findByText('Main Checking')
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
  })
})

describe('AccountsPage — create flow', () => {
  it('opens form when Add Account is clicked', async () => {
    const user = userEvent.setup()
    getAccounts.mockResolvedValue({ data: [] })
    renderPage()
    await screen.findByRole('button', { name: /add account/i })
    await user.click(screen.getByRole('button', { name: /add account/i }))
    expect(screen.getByText('New Account')).toBeInTheDocument()
  })

  it('adds new account to list after successful create', async () => {
    const user = userEvent.setup()
    const newAccount = { id: '3', name: 'Travel Fund', account_type: 'SAVINGS', currency: 'USD', balance: '200.00', initial_balance: 200 }
    getAccounts
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValue({ data: [newAccount] })
    createAccount.mockResolvedValue({ data: newAccount })
    renderPage()
    await screen.findByRole('button', { name: /add account/i })
    await user.click(screen.getByRole('button', { name: /add account/i }))
    await user.type(screen.getByPlaceholderText('e.g. Main Checking'), 'Travel Fund')
    await user.click(screen.getByRole('button', { name: /^save$/i }))
    await waitFor(() => expect(screen.getByText('Travel Fund')).toBeInTheDocument())
    expect(screen.queryByText('New Account')).not.toBeInTheDocument()
  })

  it('closes form after successful create', async () => {
    const user = userEvent.setup()
    const newAccount = { id: '3', name: 'Travel Fund', account_type: 'SAVINGS', currency: 'USD', balance: '0.00', initial_balance: 0 }
    getAccounts
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValue({ data: [newAccount] })
    createAccount.mockResolvedValue({ data: newAccount })
    renderPage()
    await screen.findByRole('button', { name: /add account/i })
    await user.click(screen.getByRole('button', { name: /add account/i }))
    await user.type(screen.getByPlaceholderText('e.g. Main Checking'), 'Travel Fund')
    await user.click(screen.getByRole('button', { name: /^save$/i }))
    await waitFor(() => expect(screen.queryByText('New Account')).not.toBeInTheDocument())
  })
})

describe('AccountsPage — edit flow', () => {
  it('opens form pre-filled when Edit is clicked', async () => {
    const user = userEvent.setup()
    getAccounts.mockResolvedValue({ data: [account1] })
    renderPage()
    await screen.findByText('Main Checking')
    await user.click(screen.getByRole('button', { name: /edit/i }))
    expect(screen.getByText('Edit Account')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Main Checking')).toBeInTheDocument()
  })

  it('updates account in list after successful edit', async () => {
    const user = userEvent.setup()
    const updated = { ...account1, name: 'Primary Checking', balance: '1000.00' }
    getAccounts
      .mockResolvedValueOnce({ data: [account1] })
      .mockResolvedValue({ data: [updated] })
    updateAccount.mockResolvedValue({ data: updated })
    renderPage()
    await screen.findByText('Main Checking')
    await user.click(screen.getByRole('button', { name: /edit/i }))
    const nameInput = screen.getByDisplayValue('Main Checking')
    await user.clear(nameInput)
    await user.type(nameInput, 'Primary Checking')
    await user.click(screen.getByRole('button', { name: /^save$/i }))
    await waitFor(() => expect(screen.getByText('Primary Checking')).toBeInTheDocument())
    expect(screen.queryByText('Main Checking')).not.toBeInTheDocument()
  })
})

describe('AccountsPage — delete flow', () => {
  it('shows confirmation prompt when Delete is clicked', async () => {
    const user = userEvent.setup()
    getAccounts.mockResolvedValue({ data: [account1] })
    renderPage()
    await screen.findByText('Main Checking')
    await user.click(screen.getByRole('button', { name: /delete/i }))
    expect(screen.getByText('Delete?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /yes/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /no/i })).toBeInTheDocument()
  })

  it('removes account from list after confirming delete', async () => {
    const user = userEvent.setup()
    getAccounts.mockResolvedValue({ data: [account1] })
    deleteAccount.mockResolvedValue({})
    renderPage()
    await screen.findByText('Main Checking')
    await user.click(screen.getByRole('button', { name: /delete/i }))
    await user.click(screen.getByRole('button', { name: /yes/i }))
    await waitFor(() => expect(screen.queryByText('Main Checking')).not.toBeInTheDocument())
  })

  it('cancels delete when No is clicked', async () => {
    const user = userEvent.setup()
    getAccounts.mockResolvedValue({ data: [account1] })
    renderPage()
    await screen.findByText('Main Checking')
    await user.click(screen.getByRole('button', { name: /delete/i }))
    await user.click(screen.getByRole('button', { name: /no/i }))
    expect(screen.getByText('Main Checking')).toBeInTheDocument()
    expect(screen.queryByText('Delete?')).not.toBeInTheDocument()
  })

  it('shows friendly error message when deleting account with transactions (409)', async () => {
    const user = userEvent.setup()
    getAccounts.mockResolvedValue({ data: [account1] })
    const err = new Error('Conflict')
    err.response = { status: 409, data: { error: 'Account has transactions' } }
    deleteAccount.mockRejectedValue(err)
    renderPage()
    await screen.findByText('Main Checking')
    await user.click(screen.getByRole('button', { name: /delete/i }))
    await user.click(screen.getByRole('button', { name: /yes/i }))
    expect(await screen.findByText('This account has transactions and cannot be deleted.')).toBeInTheDocument()
  })

  it('shows generic error message on other delete failures', async () => {
    const user = userEvent.setup()
    getAccounts.mockResolvedValue({ data: [account1] })
    const err = new Error('Server error')
    err.response = { status: 500, data: { error: 'Internal server error' } }
    deleteAccount.mockRejectedValue(err)
    renderPage()
    await screen.findByText('Main Checking')
    await user.click(screen.getByRole('button', { name: /delete/i }))
    await user.click(screen.getByRole('button', { name: /yes/i }))
    expect(await screen.findByText('Internal server error')).toBeInTheDocument()
  })
})
