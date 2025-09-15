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
    
    // Get user's current powerups
    const user = await db.collection('users').findOne({ _id: payload.userId as any })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get FOR powerups only (user-accessible)
    const powerupDetails = await db.collection('lifelines').find({ 
      isActive: true, 
      type: 'FOR' 
    }).toArray()
    
    // Merge user's remaining uses with powerup details
    const userPowerups = user.lifelines
      .map((userPowerup: any) => {
        const details = powerupDetails.find(p => p._id === userPowerup.lifelineId)
        if (!details || details.type !== 'FOR') return null // Skip if not FOR type or not found
        
        return {
          id: userPowerup.lifelineId,
          name: userPowerup.name,
          description: details.description || '',
          cost: details.point_cost || 0,
          maxUses: details.max_uses || 0,
          remainingUses: userPowerup.remaining_uses,
          duration: details.duration_seconds || 0,
          type: details.type,
          canUse: userPowerup.remaining_uses > 0 && user.points >= (details.point_cost || 0)
        }
      })
      .filter(Boolean) // Remove null entries

    return NextResponse.json({
      powerups: userPowerups,
      userPoints: user.points
    })

  } catch (error) {
    console.error('Powerups fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch powerups' }, { status: 500 })
  }
}
