import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const payload = verifyToken(token)
    
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const db = await getDb()
    let user = await db.collection('users').findOne({ _id: payload.userId })

    // Fallback: try finding by username if ID doesn't match
    if (!user) {
      user = await db.collection('users').findOne({ username: payload.username })
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'Account disabled' }, { status: 401 })
    }

    return NextResponse.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        points: user.points,
        isAdmin: user.isAdmin || false,
        lifelines: user.lifelines
      }
    })

  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}
