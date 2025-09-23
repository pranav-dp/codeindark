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

    const { searchParams } = new URL(request.url)
    const since = searchParams.get('since') // timestamp to check for new sabotages

    const db = await getDb()
    
    let query: any = { targetId: payload.userId }
    if (since) {
      query.timestamp = { $gt: new Date(since) }
    }

    // Get recent sabotages against this user
    const recentSabotages = await db.collection('sabotages')
      .find(query)
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray()

    return NextResponse.json({
      sabotages: recentSabotages.map(s => ({
        id: s._id,
        attackerUsername: s.attackerUsername,
        sabotage: s.sabotage,
        pointsDeducted: s.pointsDeducted,
        duration: s.duration,
        timestamp: s.timestamp
      }))
    })

  } catch (error) {
    console.error('Sabotage notifications fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}
