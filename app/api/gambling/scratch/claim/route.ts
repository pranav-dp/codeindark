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
    const user = await db.collection('users').findOne({ _id: payload.userId as any })
    const powerup = await db.collection('lifelines').findOne({ 
      _id: powerupId, 
      type: 'FOR', 
      isActive: true 
    })

    if (!user || !powerup) {
      return NextResponse.json({ error: 'User or powerup not found' }, { status: 404 })
    }

    // Check if user already has this powerup
    const existingPowerup = user.lifelines.find((l: any) => l.lifelineId === powerupId)
    
    if (existingPowerup) {
      // Add uses to existing powerup (max 1 additional use)
      await db.collection('users').updateOne(
        { _id: payload.userId as any, 'lifelines.lifelineId': powerupId },
        {
          $inc: {
            'lifelines.$.remaining_uses': 1
          },
          $set: {
            updatedAt: new Date()
          }
        }
      )
    } else {
      // Add new powerup to user
      await db.collection('users').updateOne(
        { _id: payload.userId as any },
        {
          $push: {
            lifelines: {
              lifelineId: powerupId,
              name: powerup.name,
              remaining_uses: 1
            } as any
          },
          $set: {
            updatedAt: new Date()
          }
        }
      )
    }

    // Log the powerup claim
    await db.collection('gamblelog').insertOne({
      _id: new Date().getTime().toString() as any,
      userId: payload.userId,
      game: 'scratch_claim',
      points_spent: 0,
      outcome: 'powerup_claimed',
      details: {
        powerupName: powerup.name,
        powerupId
      },
      timestamp: new Date()
    })

    return NextResponse.json({
      success: true,
      powerup: {
        id: powerupId,
        name: powerup.name,
        description: powerup.description
      },
      message: `${powerup.name} added to your account!`
    })

  } catch (error) {
    console.error('Powerup claim error:', error)
    return NextResponse.json({ error: 'Failed to claim powerup' }, { status: 500 })
  }
}
