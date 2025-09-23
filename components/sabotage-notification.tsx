'use client'

import { useState, useEffect } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface SabotageNotification {
  id: string
  attackerUsername: string
  sabotage: string
  pointsDeducted: number
  duration: number
  timestamp: string
}

interface SabotageNotificationProps {
  userId: string
}

export default function SabotageNotificationComponent({ userId }: SabotageNotificationProps) {
  const [notifications, setNotifications] = useState<SabotageNotification[]>([])
  const [lastCheckTime, setLastCheckTime] = useState<number>(Date.now())

  useEffect(() => {
    if (!userId) return

    const checkForSabotages = async () => {
      try {
        const response = await fetch(`/api/sabotage/notifications?since=${new Date(lastCheckTime).toISOString()}`, {
          credentials: 'include'
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.sabotages.length > 0) {
            // Add new notifications to the front of the array
            setNotifications(prev => [...data.sabotages, ...prev])
            setLastCheckTime(Date.now())
          }
        }
      } catch (error) {
        console.error('Failed to check sabotage notifications:', error)
      }
    }

    // Check immediately on mount
    checkForSabotages()

    // Then check every 2 seconds for real-time updates
    const interval = setInterval(checkForSabotages, 2000)
    return () => clearInterval(interval)
  }, [userId, lastCheckTime])

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <AnimatePresence>
        {notifications.map((notification, index) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, scale: 0.5, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: index * 20 }}
            exit={{ opacity: 0, scale: 0.5, y: -50 }}
            className="bg-red-500/30 backdrop-blur-xl border-2 border-red-500/50 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl pointer-events-auto"
            style={{ zIndex: 1000 - index }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-red-500/50 rounded-2xl flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-red-300" />
                </div>
                <div className="flex-1">
                  <h4 className="text-red-300 font-bold text-xl mb-2">You've been sabotaged!</h4>
                  <p className="text-white text-lg mb-2">
                    <span className="font-bold">{notification.attackerUsername}</span> used{' '}
                    <span className="text-red-200 font-semibold">{notification.sabotage}</span> on you
                  </p>
                  {notification.pointsDeducted > 0 && (
                    <p className="text-red-200 text-base font-semibold">
                      -{notification.pointsDeducted} points deducted
                    </p>
                  )}
                  {notification.duration > 0 && (
                    <p className="text-orange-200 text-sm mt-1">
                      Effect lasts {notification.duration} seconds
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => dismissNotification(notification.id)}
                className="text-white/80 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
