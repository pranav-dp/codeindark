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
    
    // Get AGAINST powerups for sabotage
    const sabotageOptions = await db.collection('lifelines').find({ 
      type: 'AGAINST',
      isActive: true 
    }).toArray()

    // Get all active users except current user and admins
    const users = await db.collection('users').find({ 
      isActive: true,
      isAdmin: { $ne: true },
      _id: { $ne: payload.userId as any }
    }).project({ 
      _id: 1, 
      username: 1, 
      points: 1 
    }).toArray()

    return NextResponse.json({
      sabotageOptions: sabotageOptions.map(s => ({
        id: s._id,
        name: s.name,
        description: s.description,
        cost: s.point_cost,
        duration: s.duration_seconds,
        pointsDeducted: s.points_deducted || 0,
        timerReduction: s.timer_reduction || 0
      })),
      users: users.map(u => ({
        id: u._id,
        username: u.username,
        points: u.points
      }))
    })

  } catch (error) {
    console.error('Sabotage options fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch sabotage options' }, { status: 500 })
  }
}

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

    const { targetUserId, sabotageId } = await request.json()
    
    if (!targetUserId || !sabotageId) {
      return NextResponse.json({ error: 'Missing targetUserId or sabotageId' }, { status: 400 })
    }

    const db = await getDb()
    
    // Get attacker, target, and sabotage details
    const attacker = await db.collection('users').findOne({ _id: payload.userId as any })
    const target = await db.collection('users').findOne({ _id: targetUserId as any })
    const sabotage = await db.collection('lifelines').findOne({ _id: sabotageId, type: 'AGAINST' })

    if (!attacker || !target || !sabotage) {
      return NextResponse.json({ error: 'User or sabotage not found' }, { status: 404 })
    }

    if (attacker.points < sabotage.point_cost) {
      return NextResponse.json({ error: 'Insufficient points' }, { status: 400 })
    }

    // Calculate point changes
    const attackerNewPoints = attacker.points - sabotage.point_cost
    let targetPointsLost = 0
    if (sabotage.points_deducted) {
      targetPointsLost = sabotage.points_deducted
    }
    const targetNewPoints = Math.max(0, target.points - targetPointsLost)

    // Update both users
    await db.collection('users').updateOne(
      { _id: payload.userId as any },
      {
        $set: { points: attackerNewPoints, updatedAt: new Date() },
        $push: {
          'history.sabotage_sent': {
            targetUserId,
            targetUsername: target.username,
            sabotageId,
            sabotage: sabotage.name,
            pointsSpent: sabotage.point_cost,
            timestamp: new Date()
          } as any
        }
      }
    )

    await db.collection('users').updateOne(
      { _id: targetUserId as any },
      {
        $set: { points: targetNewPoints, updatedAt: new Date() },
        $push: {
          'history.sabotage_received': {
            attackerUserId: payload.userId,
            attackerUsername: attacker.username,
            sabotageId,
            sabotage: sabotage.name,
            pointsLost: targetPointsLost,
            timestamp: new Date()
          } as any
        }
      }
    )

    // Log in sabotages collection
    await db.collection('sabotages').insertOne({
      _id: new Date().getTime().toString() as any,
      attackerId: payload.userId,
      attackerUsername: attacker.username,
      targetId: targetUserId,
      targetUsername: target.username,
      sabotageId,
      sabotage: sabotage.name,
      pointsSpent: sabotage.point_cost,
      pointsDeducted: targetPointsLost,
      duration: sabotage.duration_seconds,
      timerReduction: sabotage.timer_reduction || 0,
      timestamp: new Date()
    })

    // Log in gamblelog for admin monitoring
    await db.collection('gamblelog').insertOne({
      _id: new Date().getTime().toString() as any,
      userId: payload.userId,
      game: 'sabotage',
      points_spent: sabotage.point_cost,
      outcome: 'sabotaged',
      details: {
        targetUserId,
        targetUsername: target.username,
        sabotage: sabotage.name,
        pointsDeducted: targetPointsLost,
        duration: sabotage.duration_seconds
      },
      timestamp: new Date()
    })

    return NextResponse.json({
      success: true,
      message: `Successfully sabotaged ${target.username} with ${sabotage.name}!`,
      attackerNewPoints,
      targetNewPoints,
      sabotage: {
        name: sabotage.name,
        duration: sabotage.duration_seconds,
        pointsDeducted: targetPointsLost
      }
    })

  } catch (error) {
    console.error('Sabotage error:', error)
    return NextResponse.json({ error: 'Failed to execute sabotage' }, { status: 500 })
  }
}
