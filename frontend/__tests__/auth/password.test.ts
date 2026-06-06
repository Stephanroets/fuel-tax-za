import { describe, it, expect } from 'vitest'
import {
  hashPassword,
  verifyPassword,
  generateToken,
  generateVerificationCode,
} from '@/lib/auth/password'

describe('hashPassword / verifyPassword', () => {
  it('hashes a password and verifies it correctly', async () => {
    const password = 'SecurePass123!'
    const hash = await hashPassword(password)

    expect(hash).not.toBe(password)
    expect(hash).toMatch(/^\$2[aby]?\$/)  // bcrypt hash prefix

    const isValid = await verifyPassword(password, hash)
    expect(isValid).toBe(true)
  })

  it('rejects wrong password', async () => {
    const hash = await hashPassword('CorrectPassword1')
    const isValid = await verifyPassword('WrongPassword2', hash)
    expect(isValid).toBe(false)
  })

  it('produces different hashes for the same password (salted)', async () => {
    const password = 'SamePassword1'
    const hash1 = await hashPassword(password)
    const hash2 = await hashPassword(password)
    expect(hash1).not.toBe(hash2)
  })
})

describe('generateToken', () => {
  it('returns a 64-character alphanumeric string', () => {
    const token = generateToken()
    expect(token).toHaveLength(64)
    expect(token).toMatch(/^[A-Za-z0-9]+$/)
  })

  it('generates unique tokens', () => {
    const tokens = new Set(Array.from({ length: 100 }, () => generateToken()))
    expect(tokens.size).toBe(100)
  })
})

describe('generateVerificationCode', () => {
  it('returns a 6-digit numeric string', () => {
    const code = generateVerificationCode()
    expect(code).toMatch(/^\d{6}$/)
  })

  it('generates codes in valid range (100000-999999)', () => {
    for (let i = 0; i < 100; i++) {
      const code = generateVerificationCode()
      const num = parseInt(code, 10)
      expect(num).toBeGreaterThanOrEqual(100000)
      expect(num).toBeLessThanOrEqual(999999)
    }
  })
})
