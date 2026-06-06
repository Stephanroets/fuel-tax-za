import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock fetch globally before importing the module
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Mock localStorage
const storage: Record<string, string> = {}
vi.stubGlobal('localStorage', {
  getItem: vi.fn((key: string) => storage[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { storage[key] = value }),
  removeItem: vi.fn((key: string) => { delete storage[key] }),
})

// Mock window
vi.stubGlobal('window', { location: { href: '' } })

import { api, API_URL } from '@/lib/api/client'

function jsonResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: new Headers({ 'content-type': 'application/json' }),
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  } as unknown as Response
}

describe('api client', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    Object.keys(storage).forEach(k => delete storage[k])
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('api.get sends GET request and returns data', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ items: [1, 2, 3] }))

    const result = await api.get('/vehicles')
    expect(mockFetch).toHaveBeenCalledWith(
      `${API_URL}/vehicles`,
      expect.objectContaining({ method: 'GET' }),
    )
    expect(result.data).toEqual({ items: [1, 2, 3] })
  })

  it('api.post sends POST request with body', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ id: '1' }))

    const body = { name: 'Test' }
    await api.post('/vehicles', body)

    expect(mockFetch).toHaveBeenCalledWith(
      `${API_URL}/vehicles`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(body),
      }),
    )
  })

  it('api.patch sends PATCH request', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ updated: true }))

    await api.patch('/vehicles/1', { name: 'Updated' })

    expect(mockFetch).toHaveBeenCalledWith(
      `${API_URL}/vehicles/1`,
      expect.objectContaining({ method: 'PATCH' }),
    )
  })

  it('api.put sends PUT request', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ replaced: true }))

    await api.put('/vehicles/1', { name: 'Replaced' })

    expect(mockFetch).toHaveBeenCalledWith(
      `${API_URL}/vehicles/1`,
      expect.objectContaining({ method: 'PUT' }),
    )
  })

  it('api.delete sends DELETE request', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ deleted: true }))

    await api.delete('/vehicles/1')

    expect(mockFetch).toHaveBeenCalledWith(
      `${API_URL}/vehicles/1`,
      expect.objectContaining({ method: 'DELETE' }),
    )
  })

  it('includes Authorization header when token exists', async () => {
    storage['jwt_token'] = 'test-token-123'
    mockFetch.mockResolvedValueOnce(jsonResponse({ ok: true }))

    await api.get('/auth/me')

    const callHeaders = mockFetch.mock.calls[0][1].headers
    expect(callHeaders['Authorization']).toBe('Bearer test-token-123')
  })

  it('does not include Authorization when no token', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ ok: true }))

    await api.get('/public')

    const callHeaders = mockFetch.mock.calls[0][1].headers
    expect(callHeaders['Authorization']).toBeUndefined()
  })

  it('throws on non-OK response', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ error: 'not found' }, 404))

    await expect(api.get('/missing')).rejects.toThrow()
  })

  it('throws on non-JSON response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'text/html' }),
      text: () => Promise.resolve('<html></html>'),
    } as unknown as Response)

    await expect(api.get('/bad')).rejects.toThrow('Expected JSON')
  })
})

describe('API_URL', () => {
  it('defaults to localhost:8080', () => {
    expect(API_URL).toBe('http://localhost:8080/api/v1')
  })
})
