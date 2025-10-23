// lib/bcrypt.ts
// Pure-JS bcrypt wrapper for serverless environments.
import bcryptjs from 'bcryptjs';

export async function hashPassword(plain: string, saltRounds = 10) {
  return bcryptjs.hash(plain, saltRounds);
}

export async function verifyPassword(plain: string, hashed: string) {
  return bcryptjs.compare(plain, hashed);
}
