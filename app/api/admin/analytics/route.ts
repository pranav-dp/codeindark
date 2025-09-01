import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'

const isAdmin = (payload: any) => {
  return payload.isAdmin === true
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || !isAdmin(payload)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const db = await getDb()
    
    // Get all users for analytics
    const users = await db.collection('users').find({}).toArray()
    const gambleLogs = await db.collection('gamblelog').find({}).toArray()
    const lifelines = await db.collection('lifelines').find({}).toArray()

    // Calculate system stats
    const totalUsers = users.length
    const activeUsers = users.filter(u => u.isActive).length
    const totalPoints = users.reduce((sum, u) => sum + u.points, 0)
    
    // Lifeline usage stats
    const lifelineUsage = lifelines.map(lifeline => {
      const usageCount = users.reduce((count, user) => {
        return count + (user.history?.lifeline_usage?.filter((usage: any) => 
          usage.lifelineId === lifeline._id
        ).length || 0)
      }, 0)
      
      return {
        name: lifeline.name,
        totalUses: usageCount,
        cost: lifeline.point_cost
      }
    })

    // Gambling stats
    const slotGames = gambleLogs.filter(log => log.game === 'slot_machine').length
    const diceGames = gambleLogs.filter(log => log.game === 'dice_roll').length
    const totalGamblingSpent = gambleLogs.reduce((sum, log) => sum + log.points_spent, 0)
    
    // Win/loss ratios
    const gamblingOutcomes = {
      wins: gambleLogs.filter(log => log.outcome === 'win' || log.outcome === 'big_win').length,
      losses: gambleLogs.filter(log => log.outcome === 'lose').length,
      total: gambleLogs.length
    }

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const recentUsers = users.filter(u => new Date(u.createdAt) > sevenDaysAgo).length
    const recentGames = gambleLogs.filter(log => new Date(log.timestamp) > sevenDaysAgo).length

    // Top spenders
    const topSpenders = users
      .map(user => ({
        username: user.username,
        totalSpent: [
          ...(user.history?.lifeline_usage || []),
          ...(user.history?.gambling || [])
        ].reduce((sum, item) => sum + (item.points_spent || item.points_bet || 0), 0)
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5)

    return NextResponse.json({
      overview: {
        totalUsers,
        activeUsers,
        totalPoints,
        recentUsers,
        recentGames
      },
      lifelines: {
        usage: lifelineUsage,
        totalLifelines: lifelines.length
      },
      gambling: {
        slotGames,
        diceGames,
        totalSpent: totalGamblingSpent,
        outcomes: gamblingOutcomes
      },
      topSpenders
    })

  } catch (error) {
    console.error('Admin analytics error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
