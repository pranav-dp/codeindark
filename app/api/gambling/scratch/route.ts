import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'

const SCRATCH_COST = 20

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

    // Rate limiting: 20 scratches per minute
    const rateLimitResult = rateLimit(`scratch_${payload.userId}`, 20, 60000)
    if (!rateLimitResult.success) {
      return NextResponse.json({ 
        error: 'Rate limit exceeded. Try again later.',
        resetTime: rateLimitResult.resetTime
      }, { status: 429 })
    }

    const { position } = await request.json()
    if (position < 0 || position > 8) {
      return NextResponse.json({ error: 'Invalid position' }, { status: 400 })
    }

    const db = await getDb()
    const user = await db.collection('users').findOne({ _id: payload.userId as any })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.points < SCRATCH_COST) {
      return NextResponse.json({ error: 'Insufficient points' }, { status: 400 })
    }

    // Generate 3x3 grid (60% penalty, 40% powerup chance)
    const grid = Array(9).fill(null).map(() => Math.random() < 0.4 ? 'powerup' : 'penalty')
    const result = grid[position]
    
    let powerups: any[] = []
    if (result === 'powerup') {
      // Get available FOR powerups
      powerups = await db.collection('lifelines').find({ 
        type: 'FOR', 
        isActive: true 
      }).toArray()
    }

    // Deduct points
    const newPoints = user.points - SCRATCH_COST

    await db.collection('users').updateOne(
      { _id: payload.userId as any },
      {
        $set: {
          points: newPoints,
          updatedAt: new Date()
        },
        $push: {
          'history.gambling': {
            game: 'scratch_strike',
            points_spent: SCRATCH_COST,
            outcome: result,
            position,
            timestamp: new Date()
          } as any
        }
      }
    )

    // Log in gamblelog
    await db.collection('gamblelog').insertOne({
      _id: new Date().getTime().toString() as any,
      userId: payload.userId,
      game: 'scratch_strike',
      points_spent: SCRATCH_COST,
      outcome: result,
      details: {
        position,
        grid
      },
      timestamp: new Date()
    })

    return NextResponse.json({
      success: true,
      result,
      position,
      grid,
      powerups: result === 'powerup' ? powerups : [],
      newPoints,
      remaining: rateLimitResult.remaining,
      message: result === 'powerup' ? 'You found a powerup!' : 'Better luck next time!'
    })

  } catch (error) {
    console.error('Scratch Strike error:', error)
    return NextResponse.json({ error: 'Scratch Strike failed' }, { status: 500 })
  }
}
