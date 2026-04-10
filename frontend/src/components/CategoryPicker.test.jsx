import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test/renderWithProviders'
import CategoryPicker from './CategoryPicker'

const categories = [
  { id: 'cat-1', name: 'Groceries', color: '#22c55e', icon: '🛒' },
  { id: 'cat-2', name: 'Transport', color: '#3b82f6', icon: '🚗' },
]

function renderPicker(props = {}) {
  return renderWithProviders(
    <CategoryPicker
      categories={props.categories ?? categories}
      value={props.value ?? null}
      onChange={props.onChange ?? vi.fn()}
    />
  )
}

describe('CategoryPicker', () => {
  it('renders category options', () => {
    renderPicker()
    expect(screen.getByRole('option', { name: /groceries/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /transport/i })).toBeInTheDocument()
  })

  it('renders empty/no-category option', () => {
    renderPicker()
    expect(screen.getByRole('option', { name: /no category/i })).toBeInTheDocument()
  })

  it('calls onChange with category id when selected', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderPicker({ onChange })
    await user.selectOptions(screen.getByRole('combobox'), 'cat-1')
    expect(onChange).toHaveBeenCalledWith('cat-1')
  })

  it('calls onChange with null when empty option selected', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderPicker({ value: 'cat-1', onChange })
    await user.selectOptions(screen.getByRole('combobox'), '')
    expect(onChange).toHaveBeenCalledWith(null)
  })
})
