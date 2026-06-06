import { describe, it, expect } from 'vitest'
import jwt from 'jsonwebtoken'
import { UserRole, OrganizationMode } from '@/lib/types/database'
import {
  generateTestToken,
  getTestAuthHeader,
} from '@/lib/auth/testing-jwt'

const JWT_SECRET = process.env.JWT_SECRET || Buffer.from('ZGVmYXVsdC1zZWNyZXQta2V5LWZvci1kZXZlbG9wbWVudC1vbmx5', 'base64').toString()

describe('generateTestToken', () => {
  it('generates a valid JWT with the given payload', () => {
    const payload = {
      sub: 'test-user-id',
      email: 'test@example.com',
      organizationId: 'org-123',
      role: UserRole.DRIVER,
      mode: OrganizationMode.SOLO,
    }

    const token = generateTestToken(payload)
    const decoded = jwt.verify(token, JWT_SECRET) as Record<string, unknown>

    expect(decoded.sub).toBe('test-user-id')
    expect(decoded.email).toBe('test@example.com')
    expect(decoded.type).toBe('access')
  })
})

describe('getTestAuthHeader', () => {
  it('returns a Bearer token for a known test user', () => {
    const header = getTestAuthHeader('stefanroetscode@gmail.com')
    expect(header).toMatch(/^Bearer .+/)

    const token = header.replace('Bearer ', '')
    const decoded = jwt.verify(token, JWT_SECRET) as Record<string, unknown>
    expect(decoded.email).toBe('stefanroetscode@gmail.com')
    expect(decoded.role).toBe(UserRole.DRIVER)
  })

  it('returns a Bearer token for the admin test user', () => {
    const header = getTestAuthHeader('admin@example.com')
    expect(header).toMatch(/^Bearer .+/)

    const token = header.replace('Bearer ', '')
    const decoded = jwt.verify(token, JWT_SECRET) as Record<string, unknown>
    expect(decoded.email).toBe('admin@example.com')
    expect(decoded.role).toBe(UserRole.ADMIN)
    expect(decoded.mode).toBe(OrganizationMode.FLEET)
  })

  it('throws for an unknown test user', () => {
    expect(() => getTestAuthHeader('unknown@example.com')).toThrow('Test user unknown@example.com not found')
  })
})
