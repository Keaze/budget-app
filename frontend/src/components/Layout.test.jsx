import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../test/renderWithProviders'
import Layout from './Layout'

function renderLayout(route = '/') {
  return renderWithProviders(<Layout><div>content</div></Layout>, { route })
}

describe('Layout', () => {
  it('renders the Budget logo', () => {
    renderLayout()
    expect(screen.getAllByText('Budget').length).toBeGreaterThan(0)
  })

  it('renders all nav items including Settings', () => {
    renderLayout()
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Transactions').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Reports').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Accounts').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Categories').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Settings').length).toBeGreaterThan(0)
  })

  it('renders children', () => {
    renderLayout()
    expect(screen.getByText('content')).toBeInTheDocument()
  })
})
