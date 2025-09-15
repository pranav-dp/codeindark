import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { action, seconds, userId } = await request.json()
    
    if (!action || !seconds) {
      return NextResponse.json({ error: 'Missing action or seconds' }, { status: 400 })
    }

    if (!['extend', 'reduce'].includes(action)) {
      return NextResponse.json({ error: 'Action must be extend or reduce' }, { status: 400 })
    }

    // For admin actions (reduce timer), check admin permissions
    if (action === 'reduce' && !payload.isAdmin) {
      return NextResponse.json({ error: 'Admin access required for timer reduction' }, { status: 403 })
    }

    // For user actions (extend timer), use their own ID
    const targetUserId = action === 'extend' ? payload.userId : userId

    const db = await getDb()
    
    // Get target user
    const user = await db.collection('users').findOne({ _id: targetUserId as any })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Log the timer action
    await db.collection('gamblelog').insertOne({
      _id: new Date().getTime().toString() as any,
      userId: targetUserId,
      game: 'timer_control',
      points_spent: 0,
      outcome: action === 'extend' ? 'timer_extended' : 'timer_reduced',
      details: {
        action,
        seconds,
        triggeredBy: payload.userId,
        triggeredByUsername: payload.username,
        isAdmin: payload.isAdmin || false
      },
      timestamp: new Date()
    })

    return NextResponse.json({
      success: true,
      timer: {
        action,
        seconds,
        targetUser: user.username
      },
      message: `Timer ${action}ed by ${seconds} seconds for ${user.username}`
    })

  } catch (error) {
    console.error('Timer control error:', error)
    return NextResponse.json({ error: 'Failed to control timer' }, { status: 500 })
  }
}
