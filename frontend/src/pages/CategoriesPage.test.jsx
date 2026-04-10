import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test/renderWithProviders'
import CategoriesPage from './CategoriesPage'

vi.mock('../api/categories', () => ({
  getCategories: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
}))

import { getCategories, createCategory, updateCategory, deleteCategory } from '../api/categories'

const defaultCat = { id: 'd1', name: 'Groceries', icon: '🛒', color: '#22c55e', is_default: true }
const customCat  = { id: 'c1', name: 'Hobbies',   icon: '🎸', color: '#6366f1', is_default: false }

function renderPage() {
  return renderWithProviders(<CategoriesPage />)
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

  it('renders categories after load', async () => {
    getCategories.mockResolvedValue({ data: [defaultCat, customCat] })
    renderPage()
    expect(await screen.findByText('Groceries')).toBeInTheDocument()
    expect(screen.getByText('Hobbies')).toBeInTheDocument()
  })

  it('shows Default badge on default categories', async () => {
    getCategories.mockResolvedValue({ data: [defaultCat] })
    renderPage()
    await screen.findByText('Groceries')
    expect(screen.getByText('Default')).toBeInTheDocument()
  })

  it('shows edit/delete only for custom categories', async () => {
    getCategories.mockResolvedValue({ data: [defaultCat, customCat] })
    renderPage()
    await screen.findByText('Hobbies')
    expect(screen.getByRole('button', { name: /edit hobbies/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /edit groceries/i })).not.toBeInTheDocument()
  })

  it('shows error when API fails', async () => {
    getCategories.mockRejectedValue(new Error('Network error'))
    renderPage()
    expect(await screen.findByText('Failed to load categories.')).toBeInTheDocument()
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
    const newCat = { id: 'c2', name: 'Travel', icon: '✈️', color: '#0ea5e9', is_default: false }
    getCategories.mockResolvedValue({ data: [] })
    createCategory.mockResolvedValue({ data: newCat })
    renderPage()
    await screen.findByRole('button', { name: /add category/i })
    await user.click(screen.getByRole('button', { name: /add category/i }))
    await user.type(screen.getByPlaceholderText('e.g. Groceries'), 'Travel')
    await user.click(screen.getByRole('button', { name: /^save$/i }))
    await waitFor(() => expect(screen.getByText('Travel')).toBeInTheDocument())
  })

  it('closes form after successful create', async () => {
    const user = userEvent.setup()
    const newCat = { id: 'c2', name: 'Travel', icon: '', color: '#0ea5e9', is_default: false }
    getCategories.mockResolvedValue({ data: [] })
    createCategory.mockResolvedValue({ data: newCat })
    renderPage()
    await screen.findByRole('button', { name: /add category/i })
    await user.click(screen.getByRole('button', { name: /add category/i }))
    await user.type(screen.getByPlaceholderText('e.g. Groceries'), 'Travel')
    await user.click(screen.getByRole('button', { name: /^save$/i }))
    await waitFor(() => expect(screen.queryByText('New Category')).not.toBeInTheDocument())
  })
})

describe('CategoriesPage — edit flow', () => {
  it('opens form pre-filled when Edit is clicked', async () => {
    const user = userEvent.setup()
    getCategories.mockResolvedValue({ data: [customCat] })
    renderPage()
    await screen.findByText('Hobbies')
    await user.click(screen.getByRole('button', { name: /edit hobbies/i }))
    expect(screen.getByText('Edit Category')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Hobbies')).toBeInTheDocument()
  })

  it('updates category in list after successful edit', async () => {
    const user = userEvent.setup()
    const updatedCat = { ...customCat, name: 'Music' }
    getCategories.mockResolvedValue({ data: [customCat] })
    updateCategory.mockResolvedValue({ data: updatedCat })
    renderPage()
    await screen.findByText('Hobbies')
    await user.click(screen.getByRole('button', { name: /edit hobbies/i }))
    const nameInput = screen.getByDisplayValue('Hobbies')
    await user.clear(nameInput)
    await user.type(nameInput, 'Music')
    await user.click(screen.getByRole('button', { name: /^save$/i }))
    await waitFor(() => expect(screen.getByText('Music')).toBeInTheDocument())
  })
})

describe('CategoriesPage — delete flow', () => {
  it('shows delete confirmation for custom categories', async () => {
    const user = userEvent.setup()
    getCategories.mockResolvedValue({ data: [customCat] })
    renderPage()
    await screen.findByText('Hobbies')
    await user.click(screen.getByRole('button', { name: /delete hobbies/i }))
    expect(screen.getByText('Delete?')).toBeInTheDocument()
  })

  it('removes category after confirming delete', async () => {
    const user = userEvent.setup()
    getCategories.mockResolvedValue({ data: [customCat] })
    deleteCategory.mockResolvedValue({})
    renderPage()
    await screen.findByText('Hobbies')
    await user.click(screen.getByRole('button', { name: /delete hobbies/i }))
    await user.click(screen.getByRole('button', { name: /^yes$/i }))
    await waitFor(() => expect(screen.queryByText('Hobbies')).not.toBeInTheDocument())
  })

  it('shows forbidden error for default category delete attempt (403)', async () => {
    const user = userEvent.setup()
    getCategories.mockResolvedValue({ data: [customCat] })
    const err = new Error('Forbidden')
    err.response = { status: 403, data: { error: 'Default' } }
    deleteCategory.mockRejectedValue(err)
    renderPage()
    await screen.findByText('Hobbies')
    await user.click(screen.getByRole('button', { name: /delete hobbies/i }))
    await user.click(screen.getByRole('button', { name: /^yes$/i }))
    expect(await screen.findByText('Default categories cannot be modified.')).toBeInTheDocument()
  })
})
