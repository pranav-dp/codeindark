'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Zap, Users, Eye, HelpCircle, RotateCcw } from 'lucide-react'

const lifelineIcons: { [key: string]: any } = {
  'Skip Question': RotateCcw,
  'Ask Expert': Users,
  '50-50': Eye,
  'Hint': HelpCircle,
  'Retry': RotateCcw
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Welcome back, {user.username}!</h1>
            <p className="text-white/70">Ready to play and earn points?</p>
          </div>
          <div className="flex space-x-3">
            {user.isAdmin && (
              <Button 
                onClick={() => router.push('/admin')}
                variant="outline"
                className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30"
              >
                Admin
              </Button>
            )}
            <Button 
              onClick={() => router.push('/leaderboard')}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              Leaderboard
            </Button>
            <Button 
              onClick={() => router.push('/history')}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              History
            </Button>
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              Logout
            </Button>
          </div>
        </div>

        {/* Points Display */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6 mb-8">
          <div className="text-center">
            <h2 className="text-xl text-white/80 mb-2">Your Points</h2>
            <div className="text-5xl font-bold text-white mb-2">{user.points}</div>
            <p className="text-white/60">Use points for lifelines or try your luck gambling!</p>
          </div>
        </div>

        {/* Lifelines Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white">Your Lifelines</h3>
            <Button 
              onClick={() => router.push('/lifelines')}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            >
              View All Lifelines
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {user.lifelines.slice(0, 3).map((lifeline) => {
              const IconComponent = lifelineIcons[lifeline.name] || Zap
              return (
                <div key={lifeline.lifelineId} className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-white">{lifeline.name}</h4>
                  </div>
                  <p className="text-white/70 mb-4">Remaining: {lifeline.remaining_uses} uses</p>
                  <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-400 to-blue-500"
                      style={{ width: `${(lifeline.remaining_uses / 3) * 100}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div 
            onClick={() => router.push('/gambling')}
            className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 text-center cursor-pointer hover:bg-white/15 transition-all duration-300"
          >
            <h3 className="text-xl font-bold text-white mb-4">🎰 Slot Machine</h3>
            <p className="text-white/70 mb-4">Try your luck! 10 points per spin</p>
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
              Play Now
            </Button>
          </div>
          
          <div 
            onClick={() => router.push('/gambling')}
            className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 text-center cursor-pointer hover:bg-white/15 transition-all duration-300"
          >
            <h3 className="text-xl font-bold text-white mb-4">🎲 Dice Roll</h3>
            <p className="text-white/70 mb-4">Bet your points for big wins!</p>
            <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white">
              Roll Dice
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
