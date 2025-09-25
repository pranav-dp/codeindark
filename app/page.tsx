'use client'

import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import AuthenticationCard from "@/components/authentication-card"

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Only redirect after loading is complete
    if (loading) return
    
    if (user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('https://persistent.oaistatic.com/burrito-nux/1920.webp')",
            
        }}
      />

      {/* Subtle overlay for better contrast */}
      <div className="absolute inset-0 bg-black/20" />

      <div className="flex-1 flex flex-col items-center justify-center space-y-8 relative z-10">
        <h1 className="text-4xl md:text-5xl font-bold text-white text-center">
          Welcome to Code in the Dark!
        </h1>
        <AuthenticationCard />
      </div>

      <footer className="relative z-10 mb-6">
        <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl px-6 py-3">
          <p className="text-sm text-red/80 text-center">
            Designed and Developed by Code in The Dark Team!
            
          </p>
        </div>
      </footer>
    </div>
  )
}
