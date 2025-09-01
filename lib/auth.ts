import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

const JWT_SECRET = process.env.JWT_SECRET!

export interface UserPayload {
  userId: string
  email: string
  username: string
}

export function generateToken(user: UserPayload, rememberMe = false): string {
  return jwt.sign(
    user,
    JWT_SECRET,
    { expiresIn: rememberMe ? '30d' : '24h' }
  )
}

export function verifyToken(token: string): UserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload
  } catch {
    return null
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS || '12'))
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
