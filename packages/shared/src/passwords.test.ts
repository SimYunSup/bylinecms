import { expect, test } from 'vitest'

import { hashPassword, verifyPassword } from './passwords.js'

test('should hash a password', async () => {
  const password = 'Welcome100!222'
  const hashedPassword = await hashPassword(password)
  expect(hashedPassword.length).toEqual(97)
})

test('should verify a password', async () => {
  const password = 'Welcome100!'
  const hashedPassword = await hashPassword(password)
  const isValid = await verifyPassword(password, hashedPassword)
  expect(isValid).toEqual(true)
})
