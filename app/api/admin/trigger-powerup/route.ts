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

    const { userId, powerupId } = await request.json()
    
    if (!userId || !powerupId) {
      return NextResponse.json({ error: 'Missing userId or powerupId' }, { status: 400 })
    }

    const db = await getDb()
    
    // Get target user and powerup
    const user = await db.collection('users').findOne({ _id: userId as any })
    const powerup = await db.collection('lifelines').findOne({ _id: powerupId })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!powerup || powerup.type !== 'AGAINST' || !powerup.admin_only) {
      return NextResponse.json({ error: 'Invalid AGAINST powerup' }, { status: 404 })
    }

    // Check if user has enough points
    if (user.points < powerup.point_cost) {
      return NextResponse.json({ error: 'User has insufficient points' }, { status: 400 })
    }

    // Calculate point deductions
    let totalPointsDeducted = powerup.point_cost
    if (powerup.points_deducted) {
      totalPointsDeducted += powerup.points_deducted
    }

    const newPoints = Math.max(0, user.points - totalPointsDeducted)

    // Update user points
    await db.collection('users').updateOne(
      { _id: userId as any },
      {
        $set: {
          points: newPoints,
          updatedAt: new Date()
        },
        $push: {
          'history.lifeline_usage': {
            lifelineId: powerupId,
            name: powerup.name,
            points_spent: totalPointsDeducted,
            timestamp: new Date(),
            admin_triggered: true
          }
        }
      }
    )

    // Log the admin action
    await db.collection('gamblelog').insertOne({
      _id: new Date().getTime().toString() as any,
      userId: userId,
      game: 'admin_powerup',
      points_spent: totalPointsDeducted,
      outcome: 'triggered',
      details: {
        adminId: payload.userId,
        adminUsername: payload.username,
        powerupName: powerup.name,
        powerupId,
        type: powerup.type,
        duration: powerup.duration_seconds,
        timer_reduction: powerup.timer_reduction || 0,
        points_deducted: powerup.points_deducted || 0
      },
      timestamp: new Date()
    })

    return NextResponse.json({
      success: true,
      powerup: {
        id: powerupId,
        name: powerup.name,
        type: powerup.type,
        duration: powerup.duration_seconds,
        timer_reduction: powerup.timer_reduction || 0
      },
      user: {
        id: userId,
        username: user.username,
        oldPoints: user.points,
        newPoints,
        pointsDeducted: totalPointsDeducted
      },
      message: `${powerup.name} triggered on ${user.username}`
    })

  } catch (error) {
    console.error('Admin powerup trigger error:', error)
    return NextResponse.json({ error: 'Failed to trigger powerup' }, { status: 500 })
  }
}
