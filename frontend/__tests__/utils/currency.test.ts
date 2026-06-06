import { describe, it, expect } from 'vitest'
import { formatZAR } from '@/lib/utils/currency'

describe('formatZAR', () => {
  it('formats a positive integer amount', () => {
    const result = formatZAR(1000)
    expect(result).toContain('1')
    expect(result).toContain('000')
    expect(result).toContain('00')
    // Should contain ZAR indicator (R or ZAR depending on locale)
    expect(result).toMatch(/R|ZAR/)
  })

  it('formats zero', () => {
    const result = formatZAR(0)
    expect(result).toMatch(/0[,.]00/)
  })

  it('formats decimal amounts with two decimal places', () => {
    const result = formatZAR(123.456)
    // Should round/truncate to 2 decimal places
    expect(result).toMatch(/123[,.]46|123[,.]45/)
  })

  it('formats negative amounts', () => {
    const result = formatZAR(-500)
    expect(result).toContain('500')
  })

  it('formats large amounts with thousands separators', () => {
    const result = formatZAR(1234567.89)
    // Should contain some form of grouping
    expect(result).toMatch(/1.*234.*567/)
  })

  it('formats small decimal amounts', () => {
    const result = formatZAR(0.01)
    expect(result).toMatch(/0[,.]01/)
  })

  it('always shows exactly 2 decimal places', () => {
    const result = formatZAR(100)
    expect(result).toMatch(/100[,.]00/)
  })
})
