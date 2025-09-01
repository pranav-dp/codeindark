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

    const { lifelineId } = await request.json()
    if (!lifelineId) {
      return NextResponse.json({ error: 'Lifeline ID required' }, { status: 400 })
    }

    const db = await getDb()
    
    // Get user and lifeline details
    const user = await db.collection('users').findOne({ _id: payload.userId as any })
    const lifeline = await db.collection('lifelines').findOne({ _id: lifelineId })

    if (!user || !lifeline) {
      return NextResponse.json({ error: 'User or lifeline not found' }, { status: 404 })
    }

    // Find user's lifeline
    const userLifeline = user.lifelines.find((l: any) => l.lifelineId === lifelineId)
    if (!userLifeline) {
      return NextResponse.json({ error: 'Lifeline not available to user' }, { status: 400 })
    }

    // Check if user can use lifeline
    if (userLifeline.remaining_uses <= 0) {
      return NextResponse.json({ error: 'No remaining uses for this lifeline' }, { status: 400 })
    }

    if (user.points < lifeline.point_cost) {
      return NextResponse.json({ error: 'Insufficient points' }, { status: 400 })
    }

    // Update user: deduct points, reduce remaining uses, add to history
    const newPoints = user.points - lifeline.point_cost
    const updatedLifelines = user.lifelines.map((l: any) => 
      l.lifelineId === lifelineId 
        ? { ...l, remaining_uses: l.remaining_uses - 1 }
        : l
    )

    const historyEntry = {
      lifelineId,
      name: lifeline.name,
      points_spent: lifeline.point_cost,
      timestamp: new Date()
    }

    await db.collection('users').updateOne(
      { _id: payload.userId as any },
      {
        $set: {
          points: newPoints,
          lifelines: updatedLifelines,
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
      game: 'lifeline',
      points_spent: lifeline.point_cost,
      outcome: 'used',
      details: {
        lifelineName: lifeline.name,
        lifelineId
      },
      timestamp: new Date()
    })

    return NextResponse.json({
      success: true,
      newPoints,
      message: `${lifeline.name} used successfully!`,
      remainingUses: userLifeline.remaining_uses - 1
    })

  } catch (error) {
    console.error('Use lifeline error:', error)
    return NextResponse.json({ error: 'Failed to use lifeline' }, { status: 500 })
  }
}
