'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Target, Shield, Flame, Timer, Zap } from 'lucide-react'

interface SabotageOption {
  id: string
  name: string
  description: string
  cost: number
  duration: number
  pointsDeducted: number
  timerReduction: number
}

interface User {
  id: string
  username: string
  points: number
}

const sabotageIcons: { [key: string]: any } = {
  'Freeze Frame': Shield,
  'Lifelinophobia': Shield,
  'Point burn': Flame,
  'Time drain': Timer
}

export default function SabotagePage() {
  const { user, loading, refreshUser } = useAuth()
  const router = useRouter()
  const [sabotageOptions, setSabotageOptions] = useState<SabotageOption[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [selectedSabotage, setSelectedSabotage] = useState<string>('')
  const [selectedTarget, setSelectedTarget] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSabotaging, setIsSabotaging] = useState(false)

  useEffect(() => {
    if (loading) return
    
    if (!user) {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchSabotageOptions()
    }
  }, [user])

  const fetchSabotageOptions = async () => {
    try {
      const response = await fetch('/api/sabotage', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setSabotageOptions(data.sabotageOptions)
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Failed to fetch sabotage options:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const executeSabotage = async () => {
    if (!selectedSabotage || !selectedTarget) return

    setIsSabotaging(true)
    
    try {
      const response = await fetch('/api/sabotage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          targetUserId: selectedTarget,
          sabotageId: selectedSabotage
        })
      })

      if (response.ok) {
        const data = await response.json()
        alert(data.message)
        await refreshUser()
        setSelectedSabotage('')
        setSelectedTarget('')
      } else {
        const errorData = await response.json()
        alert(errorData.error)
      }
    } catch (error) {
      console.error('Failed to execute sabotage:', error)
      alert('Failed to execute sabotage')
    } finally {
      setIsSabotaging(false)
    }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!user) return null

  const selectedSabotageDetails = sabotageOptions.find(s => s.id === selectedSabotage)
  const selectedTargetDetails = users.find(u => u.id === selectedTarget)

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => router.push('/dashboard')}
              variant="glass"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">🎯 Sabotage</h1>
              <p className="text-white/70">Use AGAINST powerups on other players</p>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 px-6 py-3">
            <div className="text-center">
              <p className="text-white/80 text-sm">Your Points</p>
              <p className="text-2xl font-bold text-white">{user.points}</p>
            </div>
          </div>
        </div>

        {/* Sabotage Form */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 mb-8">
          <h3 className="text-xl font-bold text-white mb-6">Execute Sabotage</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Target Selection */}
            <div>
              <label className="text-white/80 text-sm mb-2 block">Target Player:</label>
              <Select value={selectedTarget} onValueChange={setSelectedTarget}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Select target..." />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-white/20">
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id} className="text-white hover:bg-white/10">
                      {u.username} ({u.points} pts)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sabotage Selection */}
            <div>
              <label className="text-white/80 text-sm mb-2 block">Sabotage Type:</label>
              <Select value={selectedSabotage} onValueChange={setSelectedSabotage}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Select sabotage..." />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-white/20">
                  {sabotageOptions.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-white hover:bg-white/10">
                      {s.name} (-{s.cost}pts)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preview */}
          {selectedSabotageDetails && selectedTargetDetails && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6">
              <h4 className="text-red-400 font-semibold mb-2">Sabotage Preview:</h4>
              <p className="text-white/80 text-sm">
                You will spend <span className="text-red-400 font-semibold">{selectedSabotageDetails.cost} points</span> to sabotage{' '}
                <span className="text-white font-semibold">{selectedTargetDetails.username}</span> with{' '}
                <span className="text-red-400 font-semibold">{selectedSabotageDetails.name}</span>
              </p>
              <p className="text-white/60 text-xs mt-1">{selectedSabotageDetails.description}</p>
              {selectedSabotageDetails.pointsDeducted > 0 && (
                <p className="text-red-400 text-xs mt-1">
                  Target will lose {selectedSabotageDetails.pointsDeducted} additional points
                </p>
              )}
            </div>
          )}

          <Button 
            onClick={executeSabotage}
            disabled={!selectedSabotage || !selectedTarget || isSabotaging || (user.points < (selectedSabotageDetails?.cost || 0))}
            className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/30 h-12 font-bold"
          >
            {isSabotaging ? 'Executing Sabotage...' : 'Execute Sabotage'}
          </Button>
        </div>

        {/* Available Sabotages */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sabotageOptions.map((sabotage) => {
            const IconComponent = sabotageIcons[sabotage.name] || Target
            
            return (
              <div
                key={sabotage.id}
                className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center">
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{sabotage.name}</h3>
                    <p className="text-red-400 text-sm">{sabotage.cost} points</p>
                  </div>
                </div>

                <p className="text-white/70 text-sm mb-2">{sabotage.description}</p>
                
                {sabotage.duration > 0 && (
                  <p className="text-orange-400 text-xs mb-2">Duration: {sabotage.duration}s</p>
                )}
                
                {sabotage.pointsDeducted > 0 && (
                  <p className="text-red-400 text-xs mb-2">Deducts {sabotage.pointsDeducted} points from target</p>
                )}
                
                {sabotage.timerReduction > 0 && (
                  <p className="text-yellow-400 text-xs">Reduces timer by {sabotage.timerReduction}s</p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
