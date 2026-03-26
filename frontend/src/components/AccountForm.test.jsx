import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AccountForm from './AccountForm'

describe('AccountForm', () => {
  const onSave = vi.fn()
  const onClose = vi.fn()

  beforeEach(() => {
    onSave.mockReset()
    onClose.mockReset()
  })

  it('renders "New Account" title when no account prop', () => {
    render(<AccountForm onSave={onSave} onClose={onClose} />)
    expect(screen.getByText('New Account')).toBeInTheDocument()
  })

  it('renders "Edit Account" title when account prop is provided', () => {
    render(<AccountForm account={{ id: '1', name: 'Checking', account_type: 'CHECKING', currency: 'USD', initial_balance: 0 }} onSave={onSave} onClose={onClose} />)
    expect(screen.getByText('Edit Account')).toBeInTheDocument()
  })

  it('pre-fills name when editing', () => {
    render(<AccountForm account={{ id: '1', name: 'My Account', account_type: 'SAVINGS', currency: 'EUR', initial_balance: 500 }} onSave={onSave} onClose={onClose} />)
    expect(screen.getByDisplayValue('My Account')).toBeInTheDocument()
  })

  it('pre-fills account type when editing', () => {
    render(<AccountForm account={{ id: '1', name: 'X', account_type: 'SAVINGS', currency: 'USD', initial_balance: 0 }} onSave={onSave} onClose={onClose} />)
    expect(screen.getByDisplayValue('Savings')).toBeInTheDocument()
  })

  it('defaults to CHECKING type for new account', () => {
    render(<AccountForm onSave={onSave} onClose={onClose} />)
    expect(screen.getByDisplayValue('Checking')).toBeInTheDocument()
  })

  it('defaults currency to USD for new account', () => {
    render(<AccountForm onSave={onSave} onClose={onClose} />)
    expect(screen.getByDisplayValue('USD')).toBeInTheDocument()
  })

  it('shows validation error when name is empty on submit', async () => {
    render(<AccountForm onSave={onSave} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(await screen.findByText('Name is required')).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('shows validation error when name is only whitespace', async () => {
    const user = userEvent.setup()
    render(<AccountForm onSave={onSave} onClose={onClose} />)
    await user.type(screen.getByPlaceholderText('e.g. Main Checking'), '   ')
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(await screen.findByText('Name is required')).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('clears name error when user starts typing', async () => {
    const user = userEvent.setup()
    render(<AccountForm onSave={onSave} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(await screen.findByText('Name is required')).toBeInTheDocument()
    await user.type(screen.getByPlaceholderText('e.g. Main Checking'), 'X')
    expect(screen.queryByText('Name is required')).not.toBeInTheDocument()
  })

  it('calls onSave with trimmed name and defaults', async () => {
    const user = userEvent.setup()
    onSave.mockResolvedValue()
    render(<AccountForm onSave={onSave} onClose={onClose} />)
    await user.type(screen.getByPlaceholderText('e.g. Main Checking'), '  My Bank  ')
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'My Bank', account_type: 'CHECKING', currency: 'USD' })
    ))
  })

  it('calls onSave with selected account type', async () => {
    const user = userEvent.setup()
    onSave.mockResolvedValue()
    render(<AccountForm onSave={onSave} onClose={onClose} />)
    await user.type(screen.getByPlaceholderText('e.g. Main Checking'), 'Savings')
    await user.selectOptions(screen.getByRole('combobox'), 'SAVINGS')
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ account_type: 'SAVINGS' })
    ))
  })

  it('calls onClose when Cancel is clicked', async () => {
    const user = userEvent.setup()
    render(<AccountForm onSave={onSave} onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when X button is clicked', async () => {
    const user = userEvent.setup()
    render(<AccountForm onSave={onSave} onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('shows API error message when onSave throws', async () => {
    const user = userEvent.setup()
    onSave.mockRejectedValue(new Error('Name already taken'))
    render(<AccountForm onSave={onSave} onClose={onClose} />)
    await user.type(screen.getByPlaceholderText('e.g. Main Checking'), 'Test')
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(await screen.findByText('Name already taken')).toBeInTheDocument()
  })

  it('disables Save button while saving', async () => {
    let resolve
    onSave.mockReturnValue(new Promise(r => { resolve = r }))
    const user = userEvent.setup()
    render(<AccountForm onSave={onSave} onClose={onClose} />)
    await user.type(screen.getByPlaceholderText('e.g. Main Checking'), 'Test')
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled())
    resolve()
  })
})
