// Thin wrapper so we can swap implementations easily.
// On serverless/Netlify, prefer 'bcryptjs' (pure JS).
import bcrypt from 'bcryptjs';

export async function hashPassword(plain: string, saltRounds = 10) {
  return await bcrypt.hash(plain, saltRounds);
}

export async function verifyPassword(plain: string, hashed: string) {
  return await bcrypt.compare(plain, hashed);
}
