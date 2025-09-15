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
    if (!payload || !payload.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { userId, points, action, reason } = await request.json()
    
    if (!userId || points === undefined || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['add', 'subtract'].includes(action)) {
      return NextResponse.json({ error: 'Action must be add or subtract' }, { status: 400 })
    }

    const db = await getDb()
    
    // Get target user
    const user = await db.collection('users').findOne({ _id: userId as any })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Calculate new points
    const pointChange = action === 'add' ? Math.abs(points) : -Math.abs(points)
    const newPoints = Math.max(0, user.points + pointChange) // Don't allow negative points

    // Update user points
    await db.collection('users').updateOne(
      { _id: userId as any },
      {
        $set: {
          points: newPoints,
          updatedAt: new Date()
        }
      }
    )

    // Log the admin action
    await db.collection('gamblelog').insertOne({
      _id: new Date().getTime().toString() as any,
      userId: userId,
      game: 'admin_action',
      points_spent: action === 'subtract' ? Math.abs(points) : 0,
      outcome: action === 'add' ? 'points_added' : 'points_deducted',
      details: {
        adminId: payload.userId,
        adminUsername: payload.username,
        action,
        pointChange,
        reason: reason || 'Admin adjustment',
        oldPoints: user.points,
        newPoints
      },
      timestamp: new Date()
    })

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        username: user.username,
        oldPoints: user.points,
        newPoints,
        pointChange
      },
      message: `${action === 'add' ? 'Added' : 'Deducted'} ${Math.abs(points)} points ${action === 'add' ? 'to' : 'from'} ${user.username}`
    })

  } catch (error) {
    console.error('Admin point management error:', error)
    return NextResponse.json({ error: 'Failed to update points' }, { status: 500 })
  }
}
