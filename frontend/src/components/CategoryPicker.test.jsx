import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CategoryPicker from './CategoryPicker'

const categories = [
  { id: 'cat-1', name: 'Groceries', icon: '🛒', color: '#22c55e' },
  { id: 'cat-2', name: 'Transport', icon: '🚗', color: '#3b82f6' },
  { id: 'cat-3', name: 'Housing', icon: '', color: '#f59e0b' },
]

describe('CategoryPicker', () => {
  it('renders all category options', () => {
    render(<CategoryPicker categories={categories} value={null} onChange={vi.fn()} />)
    expect(screen.getByRole('option', { name: /Groceries/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Transport/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Housing/i })).toBeInTheDocument()
  })

  it('renders empty/no-category option by default', () => {
    render(<CategoryPicker categories={categories} value={null} onChange={vi.fn()} />)
    expect(screen.getByRole('option', { name: /no category/i })).toBeInTheDocument()
  })

  it('shows selected category value', () => {
    render(<CategoryPicker categories={categories} value="cat-1" onChange={vi.fn()} />)
    expect(screen.getByRole('combobox')).toHaveValue('cat-1')
  })

  it('shows empty value when nothing selected', () => {
    render(<CategoryPicker categories={categories} value={null} onChange={vi.fn()} />)
    expect(screen.getByRole('combobox')).toHaveValue('')
  })

  it('calls onChange with category id when option selected', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<CategoryPicker categories={categories} value={null} onChange={onChange} />)
    await user.selectOptions(screen.getByRole('combobox'), 'cat-2')
    expect(onChange).toHaveBeenCalledWith('cat-2')
  })

  it('calls onChange with null when empty option selected', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<CategoryPicker categories={categories} value="cat-1" onChange={onChange} />)
    await user.selectOptions(screen.getByRole('combobox'), '')
    expect(onChange).toHaveBeenCalledWith(null)
  })

  it('renders icon in option text when icon present', () => {
    render(<CategoryPicker categories={categories} value={null} onChange={vi.fn()} />)
    expect(screen.getByRole('option', { name: /🛒 Groceries/ })).toBeInTheDocument()
  })

  it('accepts custom placeholder', () => {
    render(
      <CategoryPicker
        categories={categories}
        value={null}
        onChange={vi.fn()}
        placeholder="Choose a category"
      />
    )
    expect(screen.getByRole('option', { name: 'Choose a category' })).toBeInTheDocument()
  })
})
