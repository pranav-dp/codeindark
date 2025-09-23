import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'

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

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200) // Max 200 items
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1)
    const skip = (page - 1) * limit

    const db = await getDb()
    
    if (userId) {
      // Get specific user's activity - handle both string and ObjectId formats
      let user
      try {
        // Try as ObjectId first if it looks like one
        if (ObjectId.isValid(userId)) {
          user = await db.collection('users').findOne({ _id: new ObjectId(userId) })
        } else {
          // Use as string ID
          user = await db.collection('users').findOne({ _id: userId as any })
        }
      } catch {
        // Fallback to string search
        user = await db.collection('users').findOne({ _id: userId as any })
      }
      
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      let activity: any[] = []

      // Combine lifeline and gambling history
      const lifelineHistory = (user.history?.lifeline_usage || []).map((item: any) => ({
        ...item,
        type: 'lifeline',
        username: user.username,
        id: `${user._id}_lifeline_${item.timestamp}`
      }))

      const gamblingHistory = (user.history?.gambling || []).map((item: any) => ({
        ...item,
        type: 'gambling',
        username: user.username,
        id: `${user._id}_gambling_${item.timestamp}`
      }))

      activity = [...lifelineHistory, ...gamblingHistory]
      activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      
      const total = activity.length
      activity = activity.slice(skip, skip + limit)

      return NextResponse.json({
        activity,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        user: {
          username: user.username,
          email: user.email,
          points: user.points,
          totalActivity: total
        }
      })
    } else {
      // Get real-time activity from gamblelog (excluding sabotage) and sabotages collection
      const totalGamelogCount = await db.collection('gamblelog').countDocuments({ game: { $ne: 'sabotage' } })
      const sabotageCount = await db.collection('sabotages').countDocuments()
      
      const recentActivity = await db.collection('gamblelog')
        .find({ game: { $ne: 'sabotage' } }) // Exclude sabotage from gamblelog to prevent duplicates
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(Math.floor(limit / 2))
        .toArray()

      const recentSabotages = await db.collection('sabotages')
        .find({})
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(Math.floor(limit / 2))
        .toArray()

      // Combine and sort all activities
      const combinedActivity = [
        ...recentActivity,
        ...recentSabotages.map(s => ({ 
          _id: s._id,
          userId: s.attackerId,
          username: s.attackerUsername,
          game: 'sabotage',
          points_spent: s.pointsSpent,
          outcome: 'sabotaged',
          targetUsername: s.targetUsername,
          sabotage: s.sabotage,
          pointsDeducted: s.pointsDeducted,
          timestamp: s.timestamp
        }))
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit)

      // Get user details for non-sabotage activities (sabotages already have usernames)
      const userIds = [...new Set(recentActivity.map(activity => activity.userId))]
      const users = await db.collection('users')
        .find({ _id: { $in: userIds } })
        .project({ _id: 1, username: 1 })
        .toArray()

      const userMap = users.reduce((map, user) => {
        map[user._id] = user.username
        return map
      }, {} as Record<string, string>)

      const activityWithUsers = combinedActivity.map(activity => ({
        ...activity,
        username: activity.username || userMap[activity.userId] || 'Unknown',
        id: activity._id
      }))

      return NextResponse.json({
        activity: activityWithUsers,
        pagination: {
          page,
          limit,
          total: totalGamelogCount + sabotageCount,
          totalPages: Math.ceil((totalGamelogCount + sabotageCount) / limit)
        },
        totalActivities: totalGamelogCount + sabotageCount
      })
    }

  } catch (error) {
    console.error('Admin activity fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 })
  }
}
