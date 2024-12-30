// components/SplashScreen.jsx
'use client'

import { useEffect, useState } from 'react'
import Image from "next/image"
import { motion } from "framer-motion"
import WebApp from '@twa-dev/sdk'
import toast from 'react-hot-toast'

export default function SplashScreen({ onStartEarning }) {
  const [userData, setUserData] = useState(null)
  const [isNewUser, setIsNewUser] = useState(true)
  const [lastEarnedCoins, setLastEarnedCoins] = useState(0)
  const [referralStatus, setReferralStatus] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isMining, setIsMining] = useState(false)

  const formatNumber = (num) => {
    if (typeof num !== 'number') return '0.0'
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
      useGrouping: true
    })
  }

  useEffect(() => {
    const initWebApp = async () => {
      try {
        const WebAppInstance = await WebApp
        if (!WebAppInstance.initDataUnsafe || !WebAppInstance.initDataUnsafe.user) {
          throw new Error('Web App not properly initialized')
        }
        const user = WebAppInstance.initDataUnsafe.user
        setUserData(user)
        await checkUserAndFetchData(user, WebAppInstance)
      } catch (error) {
        console.error('Error initializing Web App:', error)
        setError('Failed to initialize. Please ensure you\'re using the Telegram app.')
        toast.error('Failed to initialize')
      } finally {
        setIsLoading(false)
      }
    }

    initWebApp()
  }, [])

  const checkUserAndFetchData = async (user, WebAppInstance) => {
    try {
      const startParam = WebAppInstance.initDataUnsafe.start_param
      const response = await fetch(`/api/checkUser`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          referrerId: startParam,
          ...user
        }),
      })

      if (!response.ok) {
        throw new Error('Server responded with an error')
      }

      const data = await response.json()
      setIsNewUser(data.isNewUser)
      setLastEarnedCoins(data.coins)
      setReferralStatus(data.referralStatus)
      setIsMining(data.isMining || false)

      if (data.referralStatus === 'referred') {
        toast.success('You\'ve been referred and earned 100 Bear\'s!')
      }

      if (data.isMining) {
        toast.success('Resuming your mining session...')
        setTimeout(() => onStartEarning(), 1500)
      }
    } catch (error) {
      console.error('Error fetching or saving user data:', error)
      setError('Failed to load user data. Please try again later.')
      toast.error('Failed to load user data')
      setIsNewUser(true)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.3
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        type: "spring",
        stiffness: 100
      }
    }
  }

  const getWelcomeMessage = () => {
    if (isNewUser) {
      return referralStatus === 'referred' ? "Welcome to Bear! You've been referred!" : "Welcome to Bear!"
    } else {
      const name = userData?.first_name || 'Bear fan'
      return `Welcome back, ${name}!`
    }
  }

  if (isLoading) {
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#010A43] p-4 sm:p-8">
      <motion.div 
        className="max-w-md w-full space-y-8 text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.h1 
          className="text-3xl sm:text-4xl font-bold text-white mb-4"
          variants={itemVariants}
        >
          {getWelcomeMessage()}
        </motion.h1>
        
        <motion.div 
          className="relative w-32 h-32 sm:w-48 sm:h-48 mx-auto mb-6"
          variants={itemVariants}
        >
          <Image
            src="/logo.png"
            alt="Bear Bot"
            layout="fill"
            objectFit="cover"
          />
        </motion.div>
        
        <motion.p 
          className="text-lg sm:text-xl text-white mb-8"
          variants={itemVariants}
        >
          {isNewUser 
            ? referralStatus === 'referred'
              ? `You've been referred and earned ${formatNumber(100)} Bear's! Start tapping to earn more!`
              : "Welcome to the future where you can earn Bear by tap and hold!" 
            : `You have ${formatNumber(lastEarnedCoins)} Bear. ${isMining ? 'Your mining session is active!' : 'Ready to earn more?'}`}
        </motion.p>
        
        <motion.div variants={itemVariants}>
          <button
            onClick={onStartEarning}
            className="w-full py-2 sm:py-3 text-base sm:text-lg font-semibold bg-[#2B0537] border border-[#FF0307] text-white rounded-lg transition-all duration-200 hover:bg-[#3B1547] active:scale-95"
          >
            {isMining ? 'Resume Mining' : 'Start Earning Bear !!!'}
          </button>
        </motion.div>
      </motion.div>
    </div>
  )
}