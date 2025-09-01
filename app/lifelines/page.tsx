'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Zap, Users, Eye, HelpCircle, RotateCcw } from 'lucide-react'

interface Lifeline {
  id: string
  name: string
  description: string
  cost: number
  maxUses: number
  remainingUses: number
  canUse: boolean
}

const lifelineIcons: { [key: string]: any } = {
  'Skip Question': RotateCcw,
  'Ask Expert': Users,
  '50-50': Eye,
  'Hint': HelpCircle,
  'Retry': RotateCcw
}

export default function LifelinesPage() {
  const { user, loading, refreshUser } = useAuth()
  const router = useRouter()
  const [lifelines, setLifelines] = useState<Lifeline[]>([])
  const [userPoints, setUserPoints] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [usingLifeline, setUsingLifeline] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchLifelines()
    }
  }, [user])

  const fetchLifelines = async () => {
    try {
      const response = await fetch('/api/lifelines', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setLifelines(data.lifelines)
        setUserPoints(data.userPoints)
      }
    } catch (error) {
      console.error('Failed to fetch lifelines:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const useLifeline = async (lifelineId: string) => {
    setUsingLifeline(lifelineId)
    
    try {
      const response = await fetch('/api/lifelines/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ lifelineId })
      })

      if (response.ok) {
        const data = await response.json()
        setUserPoints(data.newPoints)
        await refreshUser()
        await fetchLifelines()
        
        // Show success message (you can add toast here)
        alert(data.message)
      } else {
        const errorData = await response.json()
        alert(errorData.error)
      }
    } catch (error) {
      console.error('Failed to use lifeline:', error)
      alert('Failed to use lifeline')
    } finally {
      setUsingLifeline(null)
    }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => router.push('/dashboard')}
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">Lifelines</h1>
              <p className="text-white/70">Use your points to get help</p>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 px-6 py-3">
            <div className="text-center">
              <p className="text-white/80 text-sm">Your Points</p>
              <p className="text-2xl font-bold text-white">{userPoints}</p>
            </div>
          </div>
        </div>

        {/* Lifelines Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lifelines.map((lifeline) => {
            const IconComponent = lifelineIcons[lifeline.name] || Zap
            const isUsing = usingLifeline === lifeline.id
            
            return (
              <div
                key={lifeline.id}
                className={`bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6 transition-all duration-300 ${
                  lifeline.canUse ? 'hover:bg-white/15 hover:border-white/30' : 'opacity-60'
                }`}
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{lifeline.name}</h3>
                    <p className="text-white/60 text-sm">{lifeline.cost} points</p>
                  </div>
                </div>

                <p className="text-white/70 text-sm mb-4">{lifeline.description}</p>

                <div className="flex items-center justify-between mb-4">
                  <span className="text-white/60 text-sm">
                    Uses: {lifeline.remainingUses}/{lifeline.maxUses}
                  </span>
                  <div className="w-16 h-2 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-400 to-blue-500 transition-all duration-300"
                      style={{ width: `${(lifeline.remainingUses / lifeline.maxUses) * 100}%` }}
                    />
                  </div>
                </div>

                <Button
                  onClick={() => useLifeline(lifeline.id)}
                  disabled={!lifeline.canUse || isUsing}
                  className={`w-full h-11 rounded-xl font-medium transition-all duration-200 ${
                    lifeline.canUse
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
                      : 'bg-white/10 text-white/50 cursor-not-allowed'
                  }`}
                >
                  {isUsing ? 'Using...' : lifeline.canUse ? 'Use Lifeline' : 
                   lifeline.remainingUses === 0 ? 'No Uses Left' : 'Not Enough Points'}
                </Button>
              </div>
            )
          })}
        </div>

        {lifelines.length === 0 && (
          <div className="text-center py-12">
            <p className="text-white/60">No lifelines available</p>
          </div>
        )}
      </div>
    </div>
  )
}
