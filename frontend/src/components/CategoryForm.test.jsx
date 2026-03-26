import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CategoryForm from './CategoryForm'

describe('CategoryForm', () => {
  const onSave = vi.fn()
  const onClose = vi.fn()

  beforeEach(() => {
    onSave.mockReset()
    onClose.mockReset()
  })

  it('renders "New Category" title when no category prop', () => {
    render(<CategoryForm onSave={onSave} onClose={onClose} />)
    expect(screen.getByText('New Category')).toBeInTheDocument()
  })

  it('renders "Edit Category" title when category prop is provided', () => {
    render(<CategoryForm category={{ id: '1', name: 'Food', icon: '🍕', color: '#ff0000' }} onSave={onSave} onClose={onClose} />)
    expect(screen.getByText('Edit Category')).toBeInTheDocument()
  })

  it('pre-fills fields when editing an existing category', () => {
    render(<CategoryForm category={{ id: '1', name: 'Food', icon: '🍕', color: '#ff0000' }} onSave={onSave} onClose={onClose} />)
    expect(screen.getByDisplayValue('Food')).toBeInTheDocument()
    expect(screen.getByDisplayValue('🍕')).toBeInTheDocument()
  })

  it('shows validation error when name is empty on submit', async () => {
    render(<CategoryForm onSave={onSave} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(await screen.findByText('Name is required')).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('shows validation error when name is only whitespace', async () => {
    const user = userEvent.setup()
    render(<CategoryForm onSave={onSave} onClose={onClose} />)
    await user.type(screen.getByPlaceholderText('e.g. Groceries'), '   ')
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(await screen.findByText('Name is required')).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('clears name error when user starts typing', async () => {
    const user = userEvent.setup()
    render(<CategoryForm onSave={onSave} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(await screen.findByText('Name is required')).toBeInTheDocument()
    await user.type(screen.getByPlaceholderText('e.g. Groceries'), 'G')
    expect(screen.queryByText('Name is required')).not.toBeInTheDocument()
  })

  it('calls onSave with trimmed name when form is valid', async () => {
    const user = userEvent.setup()
    onSave.mockResolvedValue()
    render(<CategoryForm onSave={onSave} onClose={onClose} />)
    await user.type(screen.getByPlaceholderText('e.g. Groceries'), '  Groceries  ')
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Groceries' })
    ))
  })

  it('includes icon in save payload when provided', async () => {
    const user = userEvent.setup()
    onSave.mockResolvedValue()
    render(<CategoryForm onSave={onSave} onClose={onClose} />)
    await user.type(screen.getByPlaceholderText('e.g. Groceries'), 'Food')
    await user.type(screen.getByPlaceholderText('🛒'), '🍕')
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Food', icon: '🍕' })
    ))
  })

  it('does not include icon when icon field is empty', async () => {
    const user = userEvent.setup()
    onSave.mockResolvedValue()
    render(<CategoryForm onSave={onSave} onClose={onClose} />)
    await user.type(screen.getByPlaceholderText('e.g. Groceries'), 'Food')
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => {
      const payload = onSave.mock.calls[0][0]
      expect(payload).not.toHaveProperty('icon')
    })
  })

  it('calls onClose when Cancel button is clicked', async () => {
    const user = userEvent.setup()
    render(<CategoryForm onSave={onSave} onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when X button is clicked', async () => {
    const user = userEvent.setup()
    render(<CategoryForm onSave={onSave} onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('shows API error message when onSave throws', async () => {
    const user = userEvent.setup()
    onSave.mockRejectedValue(new Error('Name already taken'))
    render(<CategoryForm onSave={onSave} onClose={onClose} />)
    await user.type(screen.getByPlaceholderText('e.g. Groceries'), 'Food')
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(await screen.findByText('Name already taken')).toBeInTheDocument()
  })

  it('disables Save button while saving', async () => {
    let resolve
    onSave.mockReturnValue(new Promise(r => { resolve = r }))
    const user = userEvent.setup()
    render(<CategoryForm onSave={onSave} onClose={onClose} />)
    await user.type(screen.getByPlaceholderText('e.g. Groceries'), 'Food')
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled())
    resolve()
  })
})
