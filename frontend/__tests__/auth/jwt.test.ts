import { describe, it, expect } from 'vitest'
import jwt from 'jsonwebtoken'
import { UserRole, OrganizationMode } from '@/lib/types/database'
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
} from '@/lib/auth/jwt'

const JWT_SECRET = process.env.JWT_SECRET || Buffer.from('ZGVmYXVsdC1zZWNyZXQta2V5LWZvci1kZXZlbG9wbWVudC1vbmx5', 'base64').toString()

const samplePayload = {
  sub: '550e8400-e29b-41d4-a716-446655440000',
  email: 'test@example.com',
  organizationId: '660e8400-e29b-41d4-a716-446655440001',
  role: UserRole.ADMIN,
  mode: OrganizationMode.FLEET,
}

describe('generateAccessToken', () => {
  it('returns a valid JWT string', () => {
    const token = generateAccessToken(samplePayload)
    expect(typeof token).toBe('string')
    expect(token.split('.')).toHaveLength(3) // header.payload.signature
  })

  it('embeds the correct claims', () => {
    const token = generateAccessToken(samplePayload)
    const decoded = jwt.verify(token, JWT_SECRET) as Record<string, unknown>

    expect(decoded.sub).toBe(samplePayload.sub)
    expect(decoded.email).toBe(samplePayload.email)
    expect(decoded.organizationId).toBe(samplePayload.organizationId)
    expect(decoded.role).toBe(UserRole.ADMIN)
    expect(decoded.mode).toBe(OrganizationMode.FLEET)
    expect(decoded.type).toBe('access')
  })

  it('sets an expiry', () => {
    const token = generateAccessToken(samplePayload)
    const decoded = jwt.decode(token) as Record<string, unknown>
    expect(decoded.exp).toBeDefined()
    expect(decoded.iat).toBeDefined()
    // exp should be greater than iat
    expect(decoded.exp as number).toBeGreaterThan(decoded.iat as number)
  })
})

describe('generateRefreshToken', () => {
  it('returns a valid JWT string', () => {
    const token = generateRefreshToken('user-id-123')
    expect(typeof token).toBe('string')
    expect(token.split('.')).toHaveLength(3)
  })

  it('contains sub and type=refresh claims', () => {
    const token = generateRefreshToken('user-id-123')
    const decoded = jwt.verify(token, JWT_SECRET) as Record<string, unknown>

    expect(decoded.sub).toBe('user-id-123')
    expect(decoded.type).toBe('refresh')
  })

  it('does not contain email or role claims', () => {
    const token = generateRefreshToken('user-id-123')
    const decoded = jwt.verify(token, JWT_SECRET) as Record<string, unknown>

    expect(decoded.email).toBeUndefined()
    expect(decoded.role).toBeUndefined()
  })
})

describe('verifyToken', () => {
  it('returns the decoded payload for a valid access token', () => {
    const token = generateAccessToken(samplePayload)
    const result = verifyToken(token)

    expect(result).not.toBeNull()
    expect(result!.sub).toBe(samplePayload.sub)
    expect(result!.type).toBe('access')
  })

  it('returns the decoded payload for a valid refresh token', () => {
    const token = generateRefreshToken('user-id-456')
    const result = verifyToken(token)

    expect(result).not.toBeNull()
    expect(result!.sub).toBe('user-id-456')
    expect(result!.type).toBe('refresh')
  })

  it('returns null for a tampered token', () => {
    const token = generateAccessToken(samplePayload)
    const tampered = token.slice(0, -5) + 'XXXXX'
    expect(verifyToken(tampered)).toBeNull()
  })

  it('returns null for a completely invalid string', () => {
    expect(verifyToken('not-a-jwt')).toBeNull()
  })

  it('returns null for an empty string', () => {
    expect(verifyToken('')).toBeNull()
  })

  it('returns null for a token signed with a different secret', () => {
    const token = jwt.sign({ sub: 'x', type: 'access' }, 'wrong-secret', { algorithm: 'HS256' })
    expect(verifyToken(token)).toBeNull()
  })
})
