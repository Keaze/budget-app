import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Layout from './Layout'

function renderLayout() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Layout><div>page content</div></Layout>
    </MemoryRouter>
  )
}

describe('Layout', () => {
  it('renders the Budget wordmark', () => {
    renderLayout()
    expect(screen.getAllByText('Budget').length).toBeGreaterThan(0)
  })

  it('renders all nav links', () => {
    renderLayout()
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Transactions').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Reports').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Accounts').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Categories').length).toBeGreaterThan(0)
  })

  it('renders Add Transaction button in the header', () => {
    renderLayout()
    expect(screen.getByRole('link', { name: /add transaction/i })).toBeInTheDocument()
  })

  it('renders children', () => {
    renderLayout()
    expect(screen.getByText('page content')).toBeInTheDocument()
  })
})
