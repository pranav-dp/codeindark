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

    const db = await getDb()
    
    // Get user's current lifelines
    const user = await db.collection('users').findOne({ _id: payload.userId as any })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get lifeline details from lifelines collection
    const lifelineDetails = await db.collection('lifelines').find({ isActive: true }).toArray()
    
    // Merge user's remaining uses with lifeline details
    const userLifelines = user.lifelines.map((userLifeline: any) => {
      const details = lifelineDetails.find(l => l._id === userLifeline.lifelineId)
      return {
        id: userLifeline.lifelineId,
        name: userLifeline.name,
        description: details?.description || '',
        cost: details?.point_cost || 0,
        maxUses: details?.max_uses || 0,
        remainingUses: userLifeline.remaining_uses,
        canUse: userLifeline.remaining_uses > 0 && user.points >= (details?.point_cost || 0)
      }
    })

    return NextResponse.json({
      lifelines: userLifelines,
      userPoints: user.points
    })

  } catch (error) {
    console.error('Lifelines fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch lifelines' }, { status: 500 })
  }
}
