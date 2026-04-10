import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test/renderWithProviders'
import CategoryForm from './CategoryForm'

describe('CategoryForm', () => {
  const onSave = vi.fn()
  const onClose = vi.fn()

  beforeEach(() => {
    onSave.mockReset()
    onClose.mockReset()
  })

  it('renders "New Category" title when no category prop', () => {
    renderWithProviders(<CategoryForm onSave={onSave} onClose={onClose} />)
    expect(screen.getByText('New Category')).toBeInTheDocument()
  })

  it('renders "Edit Category" title when category prop is provided', () => {
    renderWithProviders(<CategoryForm category={{ id: '1', name: 'Food', icon: '🍔', color: '#ff0000' }} onSave={onSave} onClose={onClose} />)
    expect(screen.getByText('Edit Category')).toBeInTheDocument()
  })

  it('pre-fills name when editing', () => {
    renderWithProviders(<CategoryForm category={{ id: '1', name: 'Food', icon: '', color: '#aabbcc' }} onSave={onSave} onClose={onClose} />)
    expect(screen.getByDisplayValue('Food')).toBeInTheDocument()
  })

  it('shows validation error when name is empty on submit', async () => {
    renderWithProviders(<CategoryForm onSave={onSave} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(await screen.findByText('Name is required')).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('calls onSave with trimmed name', async () => {
    const user = userEvent.setup()
    onSave.mockResolvedValue()
    renderWithProviders(<CategoryForm onSave={onSave} onClose={onClose} />)
    await user.type(screen.getByPlaceholderText('e.g. Groceries'), '  Food  ')
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Food' })
    ))
  })

  it('calls onClose when Cancel is clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CategoryForm onSave={onSave} onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when X button is clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CategoryForm onSave={onSave} onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('shows API error when onSave throws', async () => {
    const user = userEvent.setup()
    onSave.mockRejectedValue(new Error('Already exists'))
    renderWithProviders(<CategoryForm onSave={onSave} onClose={onClose} />)
    await user.type(screen.getByPlaceholderText('e.g. Groceries'), 'Food')
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(await screen.findByText('Already exists')).toBeInTheDocument()
  })
})
