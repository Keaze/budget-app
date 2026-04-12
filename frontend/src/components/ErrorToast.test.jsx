import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test/renderWithProviders'
import ErrorToast from './ErrorToast'

describe('ErrorToast', () => {
  it('renders nothing when message is null', () => {
    const { container } = renderWithProviders(<ErrorToast message={null} onDismiss={vi.fn()} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders the error message', () => {
    renderWithProviders(<ErrorToast message="Something went wrong" onDismiss={vi.fn()} />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('calls onDismiss when dismiss button is clicked', async () => {
    const user = userEvent.setup()
    const onDismiss = vi.fn()
    renderWithProviders(<ErrorToast message="Error" onDismiss={onDismiss} />)
    await user.click(screen.getByRole('button', { name: /dismiss/i }))
    expect(onDismiss).toHaveBeenCalledOnce()
  })
})
