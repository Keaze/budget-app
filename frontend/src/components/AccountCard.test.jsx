import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import AccountCard from './AccountCard'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

const checkingAccount = {
  id: 'abc-1',
  name: 'Main Checking',
  account_type: 'CHECKING',
  currency: 'USD',
  balance: '1000.00',
}

const savingsAccount = {
  id: 'abc-2',
  name: 'Emergency Fund',
  account_type: 'SAVINGS',
  currency: 'USD',
  balance: '5000.50',
}

const creditCardAccount = {
  id: 'abc-3',
  name: 'Visa Card',
  account_type: 'CREDIT_CARD',
  currency: 'EUR',
  balance: '-250.75',
}

function renderCard(account) {
  return render(
    <MemoryRouter>
      <AccountCard account={account} />
    </MemoryRouter>
  )
}

beforeEach(() => {
  mockNavigate.mockReset()
})

describe('AccountCard — display', () => {
  it('renders account name', () => {
    renderCard(checkingAccount)
    expect(screen.getByText('Main Checking')).toBeInTheDocument()
  })

  it('renders "Checking" badge for CHECKING type', () => {
    renderCard(checkingAccount)
    expect(screen.getByText('Checking')).toBeInTheDocument()
  })

  it('renders "Savings" badge for SAVINGS type', () => {
    renderCard(savingsAccount)
    expect(screen.getByText('Savings')).toBeInTheDocument()
  })

  it('renders "Credit Card" badge for CREDIT_CARD type', () => {
    renderCard(creditCardAccount)
    expect(screen.getByText('Credit Card')).toBeInTheDocument()
  })

  it('renders balance with currency', () => {
    renderCard(checkingAccount)
    expect(screen.getByText(/USD.*1000\.00/)).toBeInTheDocument()
  })

  it('shows balance in green when positive', () => {
    renderCard(checkingAccount)
    const balance = screen.getByText(/1000\.00/)
    expect(balance.className).toMatch(/text-green-600/)
  })

  it('shows balance in red when negative', () => {
    renderCard(creditCardAccount)
    const balance = screen.getByText(/-250\.75/)
    expect(balance.className).toMatch(/text-red-600/)
  })
})

describe('AccountCard — navigation', () => {
  it('navigates to transactions page filtered by account on click', async () => {
    const user = userEvent.setup()
    renderCard(checkingAccount)
    await user.click(screen.getByRole('button'))
    expect(mockNavigate).toHaveBeenCalledWith('/transactions?account_id=abc-1')
  })
})
