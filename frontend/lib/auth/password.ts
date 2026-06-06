import bcrypt from 'bcryptjs'
import { randomBytes, randomInt } from 'crypto'

const SALT_ROUNDS = 12

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Generate a cryptographically secure random token for email verification or password reset
 */
export function generateToken(): string {
  return randomBytes(48).toString('base64url')
}

/**
 * Generate a cryptographically secure short numeric code for verification
 */
export function generateVerificationCode(): string {
  return randomInt(100000, 999999).toString()
}
