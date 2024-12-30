'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { ChevronDown } from 'lucide-react'
import WebApp from '@twa-dev/sdk'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import toast from 'react-hot-toast'

const Navbar = dynamic(() => import('@/components/Navbar'), { ssr: false })

const MINING_DURATION = 8 * 60 * 60 * 1000 // 8 hours in milliseconds
const UPDATE_INTERVAL = 1000 // Update every second

const initialUserData = {
  id: null,
  username: null,
  coins: 0,
  level: 1,
  isMining: false,
  miningEndTime: null
}

export default function Game() {
  const [userData, setUserData] = useState(initialUserData)
  const [isMining, setIsMining] = useState(false)
  const [miningTimeLeft, setMiningTimeLeft] = useState(0)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const intervalRef = useRef(null)
  const router = useRouter()

  const initializeApp = async () => {
    try {
      setIsLoading(true)
      const WebAppInstance = await WebApp
      
      if (!WebAppInstance.initDataUnsafe || !WebAppInstance.initDataUnsafe.user) {
        throw new Error('Web App not properly initialized')
      }
      
      const user = WebAppInstance.initDataUnsafe.user
      const userData = await fetchUserData(user.id)
      
      if (userData) {
        setUserData(userData)
        if (userData.isMining) {
          const endTime = new Date(userData.miningEndTime).getTime()
          const now = Date.now()
          const timeLeft = Math.max(0, endTime - now)
          setMiningTimeLeft(timeLeft)
          setIsMining(true)
          startMiningInterval(endTime)
        }
      }
      
      setIsInitialized(true)
    } catch (error) {
      console.error('Initialization error:', error)
      setError('Failed to initialize. Please ensure you\'re using the Telegram app.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    initializeApp()

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const formatNumber = (num) => {
    if (typeof num !== 'number') return '0.0'
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
      useGrouping: true
    })
  }

  const fetchUserData = async (userId) => {
    try {
      const response = await fetch(`/api/user/${userId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch user data')
      }
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching user data:', error)
      toast.error('Failed to load user data')
      return null
    }
  }

  const startMining = async () => {
    try {
      const response = await fetch('/api/start-mining', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId: userData.id }),
      })
      const data = await response.json()
      
      if (response.ok) {
        setUserData(prevData => ({
          ...prevData,
          coins: data.coins,
          level: data.level,
          isMining: data.isMining,
          miningEndTime: data.endTime,
        }))
        setIsMining(true)
        setMiningTimeLeft(MINING_DURATION)
        startMiningInterval(new Date(data.endTime).getTime())
        toast.success('Mining started successfully!')
      } else {
        toast.error(data.message || 'Failed to start mining')
      }
    } catch (error) {
      console.error('Error starting mining:', error)
      toast.error('Failed to start mining')
    }
  }

  const updateMining = async () => {
    if (!userData.id) return

    try {
      const response = await fetch('/api/update-mining', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId: userData.id }),
      })
      const data = await response.json()
      
      if (response.ok) {
        setUserData(prevData => ({
          ...prevData,
          coins: data.currentCoins,
          isMining: data.isMining,
        }))

        if (!data.isMining) {
          stopMiningInterval()
          toast.success('Mining completed!')
        }
      }
    } catch (error) {
      console.error('Error updating mining:', error)
    }
  }

  const startMiningInterval = (endTime) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    intervalRef.current = setInterval(() => {
      const now = Date.now()
      const timeLeft = Math.max(0, endTime - now)
      setMiningTimeLeft(timeLeft)
      if (timeLeft > 0) {
        updateMining()
      } else {
        stopMiningInterval()
      }
    }, UPDATE_INTERVAL)
  }

  const stopMiningInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsMining(false)
    setMiningTimeLeft(0)
  }

  const handleVisibilityChange = () => {
    if (!document.hidden && userData?.id && userData.isMining) {
      updateMining()
    }
  }

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [userData])

  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const handleUpgrade = () => {
    router.push('/upgrade')
  }

  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#010A43]">
        <div className="text-white text-xl flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#010A43]">
        <p className="text-white text-xl text-center">{error}</p>
      </div>
    )
  }

  return (
    <div className="bg-[#010A43] text-white min-h-screen flex flex-col">
      <div className="flex-grow overflow-y-auto px-4 py-6 flex flex-col items-center justify-start">
        <div className="w-full max-w-xs sm:max-w-sm">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <span className="text-xl sm:text-2xl font-semibold mr-1">Bear</span>
              <span className="text-xl sm:text-2xl">🐻</span>
              <ChevronDown className="w-4 h-4 ml-1" />
            </div>
            <button 
              onClick={handleUpgrade}
              className="bg-gradient-to-r from-orange-500 to-orange-600 px-3 py-1 rounded-full text-xs sm:text-sm font-medium"
            >
              Upgrade
            </button>
          </div>

          {/* User Info */}
          <div className="flex items-center space-x-3 mb-6">
            <Image src="/logo2.png" alt="User avatar" width={36} height={36} className="rounded-full" />
            <span className="text-xs sm:text-sm text-gray-300">{userData?.username || userData?.id || 'Unknown User'}</span>
          </div>

          {/* Mining Counter */}
          <div className="flex items-center justify-center space-x-3 mb-6">
            <span className="text-2xl sm:text-3xl">🐻</span>
            <span className="text-2xl sm:text-3xl font-bold">{formatNumber(userData?.coins || 0)}</span>
          </div>

          {/* Level Info */}
          <div className="mb-6">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-full px-4 py-1 text-center">
              <span className="text-xs sm:text-sm">Mining Level: {userData?.level || 1}</span>
            </div>
          </div>

          {/* Mining Area */}
          <div className="relative w-48 h-48 sm:w-56 sm:h-56 mx-auto mb-6">
            <motion.div 
              className="w-full h-full rounded-full bg-[#1B1464] flex items-center justify-center"
              animate={{ scale: isMining ? [1, 1.1, 1] : 1 }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Image src="/bearlogo.png" alt="Mining bear" layout="fill" objectFit="contain" className="p-6" />
            </motion.div>
          </div>

          {/* Mining Button */}
          <button
            onClick={startMining}
            disabled={isMining}
            className={`w-full py-2 sm:py-3 rounded-full text-base sm:text-lg font-semibold ${
              isMining 
                ? 'bg-gradient-to-r from-gray-500 to-gray-700 cursor-not-allowed'
                : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:opacity-90 active:scale-95 transition-all duration-200'
            }`}
          >
            {isMining ? 'Mining in Progress' : 'Start Mining'}
          </button>
        </div>
      </div>

      {/* Timer */}
      {isMining && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed bottom-20 left-4 right-4 bg-[#2B0537] border border-[#FF0307] rounded-xl px-4 py-2 text-center shadow-lg"
          >
            <span className="text-base sm:text-lg">Mining in progress: {formatTime(miningTimeLeft)}</span>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Navbar */}
      <div className="mt-auto">
        <Navbar />
      </div>
    </div>
  )
}