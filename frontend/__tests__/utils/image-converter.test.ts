import { describe, it, expect } from 'vitest'
import {
  generateImageFilename,
  formatFileSize,
  validateImageFile,
} from '@/lib/utils/image-converter'

describe('generateImageFilename', () => {
  it('generates a filename with org/expenseType/id pattern', () => {
    const result = generateImageFilename('org-123', 'fuel', 'exp-456', 'image/avif')
    expect(result).toMatch(/^org-123\/fuel\/exp-456-\d+\.avif$/)
  })

  it('extracts extension from MIME type', () => {
    expect(generateImageFilename('o', 't', 'e', 'image/webp')).toMatch(/\.webp$/)
    expect(generateImageFilename('o', 't', 'e', 'image/png')).toMatch(/\.png$/)
    expect(generateImageFilename('o', 't', 'e', 'image/jpeg')).toMatch(/\.jpeg$/)
  })

  it('includes a timestamp for uniqueness', () => {
    const a = generateImageFilename('o', 't', 'e', 'image/avif')
    const b = generateImageFilename('o', 't', 'e', 'image/avif')
    // Timestamps may or may not differ in same tick, but format should be consistent
    expect(a).toMatch(/e-\d+\.avif$/)
    expect(b).toMatch(/e-\d+\.avif$/)
  })
})

describe('formatFileSize', () => {
  it('formats 0 bytes', () => {
    expect(formatFileSize(0)).toBe('0 B')
  })

  it('formats bytes', () => {
    expect(formatFileSize(500)).toBe('500 B')
  })

  it('formats kilobytes', () => {
    expect(formatFileSize(1024)).toBe('1 KB')
    expect(formatFileSize(1536)).toBe('1.5 KB')
  })

  it('formats megabytes', () => {
    expect(formatFileSize(1048576)).toBe('1 MB')
    expect(formatFileSize(5242880)).toBe('5 MB')
  })

  it('formats gigabytes', () => {
    expect(formatFileSize(1073741824)).toBe('1 GB')
  })

  it('rounds to 1 decimal place', () => {
    // 1.5 KB = 1536 bytes
    expect(formatFileSize(1536)).toBe('1.5 KB')
    // 2.3 MB ≈ 2,411,724 bytes
    expect(formatFileSize(2411724)).toBe('2.3 MB')
  })
})

describe('validateImageFile', () => {
  function createMockFile(type: string, sizeBytes: number): File {
    const buffer = new ArrayBuffer(sizeBytes)
    return new File([buffer], 'test-file', { type })
  }

  it('accepts valid JPEG files', () => {
    const file = createMockFile('image/jpeg', 1000)
    expect(validateImageFile(file)).toEqual({ valid: true })
  })

  it('accepts valid PNG files', () => {
    const file = createMockFile('image/png', 1000)
    expect(validateImageFile(file)).toEqual({ valid: true })
  })

  it('accepts valid WebP files', () => {
    const file = createMockFile('image/webp', 1000)
    expect(validateImageFile(file)).toEqual({ valid: true })
  })

  it('accepts valid HEIC files', () => {
    const file = createMockFile('image/heic', 1000)
    expect(validateImageFile(file)).toEqual({ valid: true })
  })

  it('accepts valid HEIF files', () => {
    const file = createMockFile('image/heif', 1000)
    expect(validateImageFile(file)).toEqual({ valid: true })
  })

  it('rejects unsupported file types', () => {
    const file = createMockFile('application/pdf', 1000)
    const result = validateImageFile(file)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Invalid file type')
  })

  it('rejects GIF files', () => {
    const file = createMockFile('image/gif', 1000)
    const result = validateImageFile(file)
    expect(result.valid).toBe(false)
  })

  it('rejects files larger than 10MB', () => {
    const file = createMockFile('image/jpeg', 11 * 1024 * 1024)
    const result = validateImageFile(file)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('File too large')
  })

  it('accepts files exactly at the 10MB limit', () => {
    const file = createMockFile('image/jpeg', 10 * 1024 * 1024)
    expect(validateImageFile(file)).toEqual({ valid: true })
  })
})
