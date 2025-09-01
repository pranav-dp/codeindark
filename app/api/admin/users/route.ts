import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'

// Check admin status from token
const isAdmin = (payload: any) => {
  return payload.isAdmin === true
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || !isAdmin(payload)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const db = await getDb()
    
    // Get all users with stats
    const users = await db.collection('users').find({})
      .sort({ createdAt: -1 })
      .toArray()

    const usersWithStats = users.map(user => ({
      id: user._id,
      username: user.username,
      email: user.email,
      points: user.points,
      isActive: user.isActive,
      isAdmin: user.isAdmin || false,
      createdAt: user.createdAt,
      lifelinesUsed: user.history?.lifeline_usage?.length || 0,
      gamesPlayed: user.history?.gambling?.length || 0,
      totalSpent: [
        ...(user.history?.lifeline_usage || []),
        ...(user.history?.gambling || [])
      ].reduce((sum, item) => sum + (item.points_spent || item.points_bet || 0), 0),
      totalWon: (user.history?.gambling || []).reduce((sum: number, item: any) => sum + (item.points_won || 0), 0)
    }))

    return NextResponse.json({ users: usersWithStats })

  } catch (error) {
    console.error('Admin users fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || !isAdmin(payload)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { userId, action, value } = await request.json()
    
    if (!userId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const db = await getDb()
    let updateQuery: any = {}

    switch (action) {
      case 'updatePoints':
        updateQuery = { points: parseInt(value) }
        break
      case 'toggleActive':
        updateQuery = { isActive: value }
        break
      case 'resetLifelines':
        // Get all lifelines and reset user's lifelines
        const lifelines = await db.collection('lifelines').find().toArray()
        const resetLifelines = lifelines.map(l => ({
          lifelineId: l._id,
          name: l.name,
          remaining_uses: l.max_uses
        }))
        updateQuery = { lifelines: resetLifelines }
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    updateQuery.updatedAt = new Date()

    await db.collection('users').updateOne(
      { _id: userId },
      { $set: updateQuery }
    )

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Admin user update error:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
