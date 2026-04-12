import { describe, it, expect } from 'vitest'
import { formatAmount } from './formatAmount'

describe('formatAmount', () => {
  describe('with dot decimal separator (default)', () => {
    it('formats USD with $ symbol and grouping', () => {
      expect(formatAmount(1000, 'USD', '.')).toBe('$1,000.00')
    })

    it('formats EUR with € symbol', () => {
      expect(formatAmount(1000, 'EUR', '.')).toBe('€1,000.00')
    })

    it('formats GBP with £ symbol', () => {
      expect(formatAmount(1000, 'GBP', '.')).toBe('£1,000.00')
    })

    it('formats negative USD correctly', () => {
      expect(formatAmount(-250.75, 'USD', '.')).toBe('-$250.75')
    })

    it('formats zero', () => {
      expect(formatAmount(0, 'USD', '.')).toBe('$0.00')
    })

    it('accepts string input', () => {
      expect(formatAmount('42.5', 'USD', '.')).toBe('$42.50')
    })
  })

  describe('with comma decimal separator', () => {
    it('swaps decimal and grouping separators for USD', () => {
      expect(formatAmount(1000, 'USD', ',')).toBe('$1.000,00')
    })

    it('swaps decimal and grouping separators for EUR', () => {
      expect(formatAmount(1000, 'EUR', ',')).toBe('€1.000,00')
    })

    it('handles negative with comma separator', () => {
      expect(formatAmount(-250.75, 'USD', ',')).toBe('-$250,75')
    })

    it('handles small amounts without grouping', () => {
      expect(formatAmount(42.5, 'USD', ',')).toBe('$42,50')
    })
  })
})
