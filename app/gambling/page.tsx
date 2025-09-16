'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ArrowLeft, Coins, Zap, Skull } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { ScratchCard } from 'next-scratchcard'

interface Powerup {
  _id: string
  name: string
  description: string
  point_cost: number
}

export default function GamblingPage() {
  const { user, loading, refreshUser } = useAuth()
  const router = useRouter()
  const [userPoints, setUserPoints] = useState(0)
  
  // Slot machine state
  const [slotSpinning, setSlotSpinning] = useState(false)
  const [slotResult, setSlotResult] = useState(['🍒', '🍒', '🍒'])
  const [slotMessage, setSlotMessage] = useState('')
  
  // Scratch Strike state
  const [selectedCard, setSelectedCard] = useState<number | null>(null)
  const [scratchResult, setScratchResult] = useState<string | null>(null)
  const [availablePowerups, setAvailablePowerups] = useState<Powerup[]>([])
  const [selectedPowerup, setSelectedPowerup] = useState<string>('')
  const [showPowerupModal, setShowPowerupModal] = useState(false)
  const [scratchMessage, setScratchMessage] = useState('')
  const [gameGrid, setGameGrid] = useState<string[]>([])

  useEffect(() => {
    if (loading) return
    
    if (!user) {
      router.push('/')
    } else {
      setUserPoints(user.points)
    }
  }, [user, loading, router])

  const playSlots = async () => {
    if (userPoints < 10) {
      alert('You need at least 10 points to play!')
      return
    }

    setSlotSpinning(true)
    setSlotMessage('')
    
    // Animate spinning
    const spinDuration = 2000
    const spinInterval = setInterval(() => {
      setSlotResult([
        ['🍒', '🍋', '🍊', '🍇', '⭐', '💎'][Math.floor(Math.random() * 6)],
        ['🍒', '🍋', '🍊', '🍇', '⭐', '💎'][Math.floor(Math.random() * 6)],
        ['🍒', '🍋', '🍊', '🍇', '⭐', '💎'][Math.floor(Math.random() * 6)]
      ])
    }, 100)

    setTimeout(async () => {
      clearInterval(spinInterval)
      
      try {
        const response = await fetch('/api/gambling/slot', {
          method: 'POST',
          credentials: 'include'
        })

        if (response.ok) {
          const data = await response.json()
          setSlotResult(data.result)
          setUserPoints(data.newPoints)
          setSlotMessage(data.message)
          await refreshUser()
        } else {
          const errorData = await response.json()
          alert(errorData.error)
        }
      } catch (error) {
        console.error('Slot machine error:', error)
        alert('Failed to play slot machine')
      } finally {
        setSlotSpinning(false)
      }
    }, spinDuration)
  }

  const selectCard = async (position: number) => {
    if (userPoints < 20) {
      alert('You need at least 20 points to play!')
      return
    }

    try {
      const response = await fetch('/api/gambling/scratch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ position })
      })

      if (response.ok) {
        const data = await response.json()
        
        setSelectedCard(position)
        setScratchResult(data.result)
        setGameGrid(data.grid)
        setUserPoints(data.newPoints)
        // Don't set message here - wait for scratch completion
        
        if (data.result === 'powerup' && data.powerups.length > 0) {
          setAvailablePowerups(data.powerups)
        }
        
        await refreshUser()
      } else {
        const errorData = await response.json()
        alert(errorData.error)
      }
    } catch (error) {
      console.error('Scratch Strike error:', error)
      alert('Failed to scratch card')
    }
  }

  const handleScratchComplete = () => {
    // Show message only after scratching is complete
    if (scratchResult === 'powerup') {
      setScratchMessage('You found a powerup!')
      if (availablePowerups.length > 0) {
        setShowPowerupModal(true)
      }
    } else {
      setScratchMessage('Better luck next time!')
    }
  }

  const claimPowerup = async () => {
    if (!selectedPowerup) return

    try {
      const response = await fetch('/api/gambling/scratch/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ powerupId: selectedPowerup })
      })

      if (response.ok) {
        const data = await response.json()
        alert(data.message)
        setShowPowerupModal(false)
        setSelectedPowerup('')
        setSelectedCard(null)
        setScratchResult(null)
        await refreshUser()
      } else {
        const errorData = await response.json()
        alert(errorData.error)
      }
    } catch (error) {
      console.error('Powerup claim error:', error)
      alert('Failed to claim powerup')
    }
  }

  const resetScratchGame = () => {
    setSelectedCard(null)
    setScratchResult(null)
    setScratchMessage('')
    setGameGrid([])
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-6xl mx-auto">
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
              <h1 className="text-3xl font-bold text-white">🎰 Casino</h1>
              <p className="text-white/70">Try your luck and win big!</p>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 px-6 py-3">
            <div className="text-center">
              <p className="text-white/80 text-sm">Your Points</p>
              <p className="text-2xl font-bold text-white">{userPoints}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Slot Machine */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">🎰 Slot Machine</h2>
              <p className="text-white/70">10 points per spin</p>
            </div>

            <div className="bg-black/30 rounded-2xl p-6 mb-6">
              <div className="flex justify-center space-x-4 mb-4">
                {slotResult.map((symbol, index) => (
                  <motion.div
                    key={index}
                    className="w-20 h-20 bg-white rounded-xl flex items-center justify-center text-3xl"
                    animate={slotSpinning ? { rotateY: 360 } : {}}
                    transition={{ duration: 0.1, repeat: slotSpinning ? Infinity : 0 }}
                  >
                    {symbol}
                  </motion.div>
                ))}
              </div>
              
              {slotMessage && (
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center text-white font-semibold"
                >
                  {slotMessage}
                </motion.p>
              )}
            </div>

            <Button
              onClick={playSlots}
              disabled={slotSpinning || userPoints < 10}
              variant="gradient-yellow"
              size="lg"
              className="w-full h-12 font-bold text-lg"
            >
              {slotSpinning ? 'Spinning...' : 'Spin (10 pts)'}
            </Button>
          </div>

          {/* Scratch Strike */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">⚡ Scratch Strike</h2>
              <p className="text-white/70">20 points per scratch</p>
            </div>

            <div className="bg-black/30 rounded-2xl p-6 mb-6">
              {selectedCard === null ? (
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {Array(9).fill(null).map((_, index) => (
                    <motion.div
                      key={index}
                      className="aspect-square rounded-xl cursor-pointer bg-gradient-to-br from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 shadow-lg shadow-purple-500/50 flex items-center justify-center text-white text-2xl font-bold"
                      onClick={() => selectCard(index)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      ?
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="rounded-2xl overflow-hidden mb-4">
                    <ScratchCard
                      width={256}
                      height={256}
                      finishPercent={55}
                      brushSize={60}
                      onComplete={handleScratchComplete}
                    >
                      <div 
                        className="flex items-center justify-center"
                        style={{
                          width: '256px',
                          height: '256px',
                          background: 'linear-gradient(135deg, #8b5cf6 0%, #000000 100%)',
                          borderRadius: '16px'
                        }}
                      >
                        <div className="text-8xl">
                          {scratchResult === 'powerup' ? '⚡' : '💀'}
                        </div>
                      </div>
                    </ScratchCard>
                  </div>
                </div>
              )}
              
              {scratchMessage && (
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center text-white font-semibold mb-4"
                >
                  {scratchMessage}
                </motion.p>
              )}
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={resetScratchGame}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
              >
                Reset Game
              </Button>
            </div>
          </div>
        </div>

        {/* Powerup Selection Modal */}
        <Dialog open={showPowerupModal} onOpenChange={setShowPowerupModal}>
          <DialogContent className="bg-white/10 backdrop-blur-xl border-white/20 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-white text-center">
                🎉 Choose Your Powerup!
              </DialogTitle>
            </DialogHeader>
            
            <div className="py-4">
              <Select value={selectedPowerup} onValueChange={setSelectedPowerup}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Select a powerup..." />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-white/20">
                  {availablePowerups.map((powerup) => (
                    <SelectItem key={powerup._id} value={powerup._id} className="text-white hover:bg-white/10">
                      {powerup.name} - {powerup.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="flex space-x-3">
              <Button
                onClick={() => setShowPowerupModal(false)}
                variant="secondary"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={claimPowerup}
                disabled={!selectedPowerup}
                variant="gradient"
                className="flex-1"
              >
                Claim Powerup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
