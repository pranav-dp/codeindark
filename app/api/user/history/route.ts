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
    const type = searchParams.get('type') // 'all', 'lifelines', 'gambling'
    const limit = parseInt(searchParams.get('limit') || '50')

    const db = await getDb()
    
    // Get user's history from user document
    const user = await db.collection('users').findOne({ _id: payload.userId as any })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let history: any[] = []

    if (type === 'lifelines' || type === 'all') {
      const lifelineHistory = (user.history?.lifeline_usage || []).map((item: any) => ({
        ...item,
        type: 'lifeline',
        id: `lifeline_${item.timestamp}`
      }))
      history.push(...lifelineHistory)
    }

    if (type === 'gambling' || type === 'all') {
      const gamblingHistory = (user.history?.gambling || []).map((item: any) => ({
        ...item,
        type: 'gambling',
        id: `gambling_${item.timestamp}`
      }))
      history.push(...gamblingHistory)
    }

    // Sort by timestamp (newest first) and limit
    history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    history = history.slice(0, limit)

    // Get stats
    const stats = {
      totalLifelinesUsed: user.history?.lifeline_usage?.length || 0,
      totalGamblingGames: user.history?.gambling?.length || 0,
      totalPointsSpent: [
        ...(user.history?.lifeline_usage || []),
        ...(user.history?.gambling || [])
      ].reduce((sum, item) => sum + (item.points_spent || item.points_bet || 0), 0),
      totalPointsWon: (user.history?.gambling || []).reduce((sum: number, item: any) => sum + (item.points_won || 0), 0)
    }

    return NextResponse.json({
      history,
      stats,
      currentPoints: user.points
    })

  } catch (error) {
    console.error('History fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
  }
}
