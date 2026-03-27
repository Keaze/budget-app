import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CategoriesPage from './CategoriesPage'

vi.mock('../api/categories', () => ({
  getCategories: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
}))

import { getCategories, createCategory, updateCategory, deleteCategory } from '../api/categories'

const defaultCategory = { id: '1', name: 'Food', icon: '🍕', color: '#ff0000', is_default: true }
const customCategory = { id: '2', name: 'Custom', icon: null, color: null, is_default: false }

function renderPage() {
  return render(<CategoriesPage />)
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('CategoriesPage — loading and display', () => {
  it('shows loading state initially', () => {
    getCategories.mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(screen.getByText(/loading categories/i)).toBeInTheDocument()
  })

  it('renders category list after load', async () => {
    getCategories.mockResolvedValue({ data: [defaultCategory, customCategory] })
    renderPage()
    expect(await screen.findByText('Food')).toBeInTheDocument()
    expect(screen.getByText('Custom')).toBeInTheDocument()
  })

  it('shows error message when API fails', async () => {
    getCategories.mockRejectedValue(new Error('Network error'))
    renderPage()
    expect(await screen.findByText('Failed to load categories.')).toBeInTheDocument()
  })

  it('shows empty state when no categories', async () => {
    getCategories.mockResolvedValue({ data: [] })
    renderPage()
    expect(await screen.findByText(/no categories yet/i)).toBeInTheDocument()
  })

  it('shows Default badge for default categories', async () => {
    getCategories.mockResolvedValue({ data: [defaultCategory] })
    renderPage()
    await screen.findByText('Food')
    expect(screen.getByText('Default')).toBeInTheDocument()
  })

  it('does not show edit/delete buttons for default categories', async () => {
    getCategories.mockResolvedValue({ data: [defaultCategory] })
    renderPage()
    await screen.findByText('Food')
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument()
  })

  it('shows edit/delete buttons for custom categories', async () => {
    getCategories.mockResolvedValue({ data: [customCategory] })
    renderPage()
    await screen.findByText('Custom')
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
  })
})

describe('CategoriesPage — create flow', () => {
  it('opens form when Add Category is clicked', async () => {
    const user = userEvent.setup()
    getCategories.mockResolvedValue({ data: [] })
    renderPage()
    await screen.findByRole('button', { name: /add category/i })
    await user.click(screen.getByRole('button', { name: /add category/i }))
    expect(screen.getByText('New Category')).toBeInTheDocument()
  })

  it('adds new category to list after successful create', async () => {
    const user = userEvent.setup()
    const newCat = { id: '3', name: 'Transport', icon: '🚗', color: '#00ff00', is_default: false }
    getCategories.mockResolvedValue({ data: [] })
    createCategory.mockResolvedValue({ data: newCat })
    renderPage()
    await screen.findByRole('button', { name: /add category/i })
    await user.click(screen.getByRole('button', { name: /add category/i }))
    const nameInput = screen.getByPlaceholderText('e.g. Groceries')
    await user.type(nameInput, 'Transport')
    await user.click(screen.getByRole('button', { name: /^save$/i }))
    await waitFor(() => expect(screen.getByText('Transport')).toBeInTheDocument())
    expect(screen.queryByText('New Category')).not.toBeInTheDocument()
  })

  it('closes form after successful create', async () => {
    const user = userEvent.setup()
    const newCat = { id: '3', name: 'Transport', icon: null, color: null, is_default: false }
    getCategories.mockResolvedValue({ data: [] })
    createCategory.mockResolvedValue({ data: newCat })
    renderPage()
    await screen.findByRole('button', { name: /add category/i })
    await user.click(screen.getByRole('button', { name: /add category/i }))
    await user.type(screen.getByPlaceholderText('e.g. Groceries'), 'Transport')
    await user.click(screen.getByRole('button', { name: /^save$/i }))
    await waitFor(() => expect(screen.queryByText('New Category')).not.toBeInTheDocument())
  })
})

describe('CategoriesPage — edit flow', () => {
  it('opens form pre-filled when Edit is clicked', async () => {
    const user = userEvent.setup()
    getCategories.mockResolvedValue({ data: [customCategory] })
    renderPage()
    await screen.findByText('Custom')
    await user.click(screen.getByRole('button', { name: /edit/i }))
    expect(screen.getByText('Edit Category')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Custom')).toBeInTheDocument()
  })

  it('updates category in list after successful edit', async () => {
    const user = userEvent.setup()
    const updated = { ...customCategory, name: 'Updated' }
    getCategories.mockResolvedValue({ data: [customCategory] })
    updateCategory.mockResolvedValue({ data: updated })
    renderPage()
    await screen.findByText('Custom')
    await user.click(screen.getByRole('button', { name: /edit/i }))
    const nameInput = screen.getByDisplayValue('Custom')
    await user.clear(nameInput)
    await user.type(nameInput, 'Updated')
    await user.click(screen.getByRole('button', { name: /^save$/i }))
    await waitFor(() => expect(screen.getByText('Updated')).toBeInTheDocument())
    expect(screen.queryByText('Custom')).not.toBeInTheDocument()
  })
})

describe('CategoriesPage — delete flow', () => {
  it('shows confirmation prompt when Delete is clicked', async () => {
    const user = userEvent.setup()
    getCategories.mockResolvedValue({ data: [customCategory] })
    renderPage()
    await screen.findByText('Custom')
    await user.click(screen.getByRole('button', { name: /delete/i }))
    expect(screen.getByText('Delete?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /yes/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /no/i })).toBeInTheDocument()
  })

  it('removes category from list after confirming delete', async () => {
    const user = userEvent.setup()
    getCategories.mockResolvedValue({ data: [customCategory] })
    deleteCategory.mockResolvedValue({})
    renderPage()
    await screen.findByText('Custom')
    await user.click(screen.getByRole('button', { name: /delete/i }))
    await user.click(screen.getByRole('button', { name: /yes/i }))
    await waitFor(() => expect(screen.queryByText('Custom')).not.toBeInTheDocument())
  })

  it('cancels delete when No is clicked', async () => {
    const user = userEvent.setup()
    getCategories.mockResolvedValue({ data: [customCategory] })
    renderPage()
    await screen.findByText('Custom')
    await user.click(screen.getByRole('button', { name: /delete/i }))
    await user.click(screen.getByRole('button', { name: /no/i }))
    expect(screen.getByText('Custom')).toBeInTheDocument()
    expect(screen.queryByText('Delete?')).not.toBeInTheDocument()
  })

  it('shows error message when delete fails', async () => {
    const user = userEvent.setup()
    getCategories.mockResolvedValue({ data: [customCategory] })
    deleteCategory.mockRejectedValue({ response: { data: { error: 'Cannot delete' } } })
    renderPage()
    await screen.findByText('Custom')
    await user.click(screen.getByRole('button', { name: /delete/i }))
    await user.click(screen.getByRole('button', { name: /yes/i }))
    expect(await screen.findByText('Cannot delete')).toBeInTheDocument()
  })
})
