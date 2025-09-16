'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Zap, Search, Clock, Tag, RotateCcw, Eye } from 'lucide-react'

const powerupIcons: { [key: string]: any } = {
  'Search Sprint': Search,
  'Time Warp (30s)': Clock,
  'Time Warp (60s)': Clock,
  'Time Warp (90s)': Clock,
  'Tag Whisper': Tag,
  'Reincarnation': RotateCcw,
  'Screen Flash': Eye
}

export default function Dashboard() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Only redirect after loading is complete
    if (loading) return
    
    if (!user) {
      router.push('/')
    } else if (user.isAdmin) {
      // Redirect admin directly to admin page
      router.replace('/admin')
    }
  }, [user, loading, router])

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  // Don't render dashboard for admin users - they should be redirected
  if (user && user.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
        <div className="text-white">Redirecting to admin...</div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white text-glow-purple">Welcome back, {user.username}!</h1>
            <p className="text-gray-400">Ready to play and earn points?</p>
          </div>
          <div className="flex space-x-3">
            {user.isAdmin && (
              <Button 
                onClick={() => router.push('/admin')}
                variant="destructive"
                className="shadow-lg shadow-red-500/25"
              >
                Admin
              </Button>
            )}
            <Button 
              onClick={() => router.push('/leaderboard')}
              variant="dark"
            >
              Leaderboard
            </Button>
            <Button 
              onClick={() => router.push('/history')}
              variant="dark"
            >
              History
            </Button>
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Logout
            </Button>
          </div>
        </div>

        {/* Points Display */}
        <Card variant="stats-glow" className="p-8 mb-8 text-center">
          <h2 className="text-xl text-gray-300 mb-4">Your Points</h2>
          <div className="text-6xl font-bold text-white text-glow-purple mb-4">{user.points}</div>
          <p className="text-gray-400">Use points for powerups or try your luck gambling!</p>
        </Card>

        {/* Powerups Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white">⚡ Your Powerups</h3>
            <Button 
              onClick={() => router.push('/lifelines')}
              variant="purple-glow"
            >
              Activate Powerups
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {user.lifelines.slice(0, 9).map((powerup) => {
              const IconComponent = powerupIcons[powerup.name] || Zap
              return (
                <Card key={powerup.lifelineId} variant="dark-glow" className="p-6 hover:border-purple-400/40 transition-all">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center glow-purple">
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-white">{powerup.name}</h4>
                  </div>
                  <p className="text-gray-400 mb-4">Remaining: {powerup.remaining_uses} uses</p>
                  <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-300"
                      style={{ width: `${(powerup.remaining_uses / 3) * 100}%` }}
                    />
                  </div>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card 
            variant="interactive-glow"
            className="p-6 text-center"
            onClick={() => router.push('/gambling')}
          >
            <h3 className="text-xl font-bold text-white mb-4">🎰 Slot Machine</h3>
            <p className="text-gray-400 mb-4">Try your luck! 10 points per spin</p>
            <Button variant="purple-glow">
              Play Now
            </Button>
          </Card>
          
          <Card 
            variant="interactive-glow"
            className="p-6 text-center"
            onClick={() => router.push('/gambling')}
          >
            <h3 className="text-xl font-bold text-white mb-4">⚡ Scratch Strike</h3>
            <p className="text-gray-400 mb-4">Scratch cards for powerups! 20 points per card</p>
            <Button variant="gradient">
              Scratch Now
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
