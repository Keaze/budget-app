import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ErrorToast from './ErrorToast'

describe('ErrorToast', () => {
  it('renders message when provided', () => {
    render(<ErrorToast message="Something went wrong" onDismiss={vi.fn()} />)
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('renders nothing when message is empty string', () => {
    const { container } = render(<ErrorToast message="" onDismiss={vi.fn()} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when message is null', () => {
    const { container } = render(<ErrorToast message={null} onDismiss={vi.fn()} />)
    expect(container.firstChild).toBeNull()
  })

  it('has role=alert for accessibility', () => {
    render(<ErrorToast message="Error occurred" onDismiss={vi.fn()} />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('calls onDismiss when dismiss button clicked', async () => {
    const user = userEvent.setup()
    const onDismiss = vi.fn()
    render(<ErrorToast message="Error" onDismiss={onDismiss} />)
    await user.click(screen.getByRole('button', { name: /dismiss/i }))
    expect(onDismiss).toHaveBeenCalledOnce()
  })
})
