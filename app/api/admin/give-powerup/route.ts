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
    const powerup = await db.collection('lifelines').findOne({ _id: powerupId, type: 'FOR' })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!powerup) {
      return NextResponse.json({ error: 'Invalid FOR powerup' }, { status: 404 })
    }

    // Check if user already has this powerup
    const existingPowerupIndex = user.lifelines.findIndex((l: any) => l.lifelineId === powerupId)
    
    if (existingPowerupIndex !== -1) {
      // Add 1 use to existing powerup
      await db.collection('users').updateOne(
        { _id: userId as any, 'lifelines.lifelineId': powerupId },
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
        { _id: userId as any },
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

    // Log the admin action
    await db.collection('gamblelog').insertOne({
      _id: new Date().getTime().toString() as any,
      userId: userId,
      game: 'admin_gift',
      points_spent: 0,
      outcome: 'powerup_given',
      details: {
        adminId: payload.userId,
        adminUsername: payload.username,
        powerupName: powerup.name,
        powerupId,
        type: 'FOR'
      },
      timestamp: new Date()
    })

    return NextResponse.json({
      success: true,
      message: `${powerup.name} given to ${user.username}!`,
      powerup: {
        id: powerupId,
        name: powerup.name
      },
      user: {
        id: userId,
        username: user.username
      }
    })

  } catch (error) {
    console.error('Admin give powerup error:', error)
    return NextResponse.json({ error: 'Failed to give powerup' }, { status: 500 })
  }
}
