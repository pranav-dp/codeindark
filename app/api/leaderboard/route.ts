import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    const db = await getDb()
    
    // Get top users by points (exclude admins)
    const topUsers = await db.collection('users')
      .find({ 
        isActive: true,
        isAdmin: { $ne: true }
      })
      .sort({ points: -1 })
      .limit(limit)
      .project({
        _id: 1,
        username: 1,
        points: 1,
        createdAt: 1,
        'history.lifeline_usage': 1,
        'history.gambling': 1
      })
      .toArray()

    // Calculate additional stats for each user
    const leaderboard = topUsers.map((user, index) => {
      const lifelinesUsed = user.history?.lifeline_usage?.length || 0
      const gamesPlayed = user.history?.gambling?.length || 0
      const totalSpent = [
        ...(user.history?.lifeline_usage || []),
        ...(user.history?.gambling || [])
      ].reduce((sum, item) => sum + (item.points_spent || item.points_bet || 0), 0)

      return {
        rank: index + 1,
        username: user.username,
        points: user.points,
        lifelinesUsed,
        gamesPlayed,
        totalSpent,
        joinedAt: user.createdAt
      }
    })

    return NextResponse.json({
      leaderboard,
      totalUsers: await db.collection('users').countDocuments({ 
        isActive: true,
        isAdmin: { $ne: true }
      })
    })

  } catch (error) {
    console.error('Leaderboard fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
  }
}
