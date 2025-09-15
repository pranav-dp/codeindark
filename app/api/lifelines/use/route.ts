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

    const { powerupId } = await request.json()
    if (!powerupId) {
      return NextResponse.json({ error: 'Powerup ID required' }, { status: 400 })
    }

    const db = await getDb()
    
    // Get user and powerup details
    const user = await db.collection('users').findOne({ _id: payload.userId as any })
    const powerup = await db.collection('lifelines').findOne({ _id: powerupId })

    if (!user || !powerup) {
      return NextResponse.json({ error: 'User or powerup not found' }, { status: 404 })
    }

    // Only allow FOR type powerups for users
    if (powerup.type !== 'FOR' || !powerup.isActive) {
      return NextResponse.json({ error: 'Powerup not available' }, { status: 400 })
    }

    // Find user's powerup
    const userPowerup = user.lifelines.find((l: any) => l.lifelineId === powerupId)
    if (!userPowerup) {
      return NextResponse.json({ error: 'Powerup not available to user' }, { status: 400 })
    }

    // Check if user can use powerup
    if (userPowerup.remaining_uses <= 0) {
      return NextResponse.json({ error: 'No remaining uses for this powerup' }, { status: 400 })
    }

    if (user.points < powerup.point_cost) {
      return NextResponse.json({ error: 'Insufficient points' }, { status: 400 })
    }

    // Update user: deduct points, reduce remaining uses, add to history
    const newPoints = user.points - powerup.point_cost
    const updatedPowerups = user.lifelines.map((l: any) => 
      l.lifelineId === powerupId 
        ? { ...l, remaining_uses: l.remaining_uses - 1 }
        : l
    )

    const historyEntry = {
      lifelineId: powerupId,
      name: powerup.name,
      points_spent: powerup.point_cost,
      timestamp: new Date()
    }

    await db.collection('users').updateOne(
      { _id: payload.userId as any },
      {
        $set: {
          points: newPoints,
          lifelines: updatedPowerups,
          updatedAt: new Date()
        },
        $push: {
          'history.lifeline_usage': historyEntry as any
        }
      }
    )

    // Log in gamblelog collection
    await db.collection('gamblelog').insertOne({
      _id: new Date().getTime().toString() as any,
      userId: payload.userId,
      game: 'powerup',
      points_spent: powerup.point_cost,
      outcome: 'used',
      details: {
        powerupName: powerup.name,
        powerupId,
        type: powerup.type,
        duration: powerup.duration_seconds
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
        instructions: powerup.special_instructions
      },
      newPoints,
      remainingUses: userPowerup.remaining_uses - 1,
      message: `${powerup.name} activated!`
    })

  } catch (error) {
    console.error('Use powerup error:', error)
    return NextResponse.json({ error: 'Failed to use powerup' }, { status: 500 })
  }
}
