// NOTE: hashPassword and verifyPassword are not Next.js Middleware compatible
// due to argon's use of node:crypto
// typically be run in a server runtime - like Node.js
import argon2 from 'argon2'

/**
 * Hashes the provided password using Argon2.
 *
 * @param password - The plaintext password to hash.
 * @returns A promise that resolves to the hashed password.
 */
export const hashPassword = async (password: string): Promise<string> => {
  try {
    return await argon2.hash(password)
  } catch (error) {
    throw new Error('Error hashing the password')
  }
}

/**
 * Verifies a password against the hashed value.
 *
 * @param password - The plaintext password to verify.
 * @param hashedPassword - The hashed password to verify against.
 * @returns A promise that resolves to a boolean indicating if the password is valid.
 */
export const verifyPassword = async (
  password: string,
  hashedPassword: string | null | undefined
): Promise<boolean> => {
  if (hashedPassword == null) {
    return false
  }
  try {
    return await argon2.verify(hashedPassword, password)
  } catch (error) {
    throw new Error('Error verifying the password')
  }
}
