'use client'

import { useEffect, useState } from 'react'
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import WebApp from '@twa-dev/sdk'
import { ArrowLeft } from 'lucide-react'
import Navbar from './Navbar'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

const upgradeOptions = [
  { name: 'Boost Your Speed', icon: '⏱️', type: 'Speed' },
  { name: 'Extend Mining Time', icon: '⌛', type: 'MiningTime' },
  { name: 'Ultra Boost', icon: '🚀', type: 'UltraBoost' },
]

const speedUpgrades = [
  { level: 1, speed: 0.005, mineAmount: 0.02, cost: 5 },
  { level: 2, speed: 0.01, mineAmount: 0.04, cost: 10 },
  { level: 3, speed: 0.05, mineAmount: 0.2, cost: 15 },
  { level: 4, speed: 0.1, mineAmount: 0.4, cost: 20 },
  { level: 5, speed: 0.25, mineAmount: 1, cost: 40 },
  { level: 6, speed: 0.4, mineAmount: 1.6, cost: 60 },
  { level: 7, speed: 0.6, mineAmount: 2.4, cost: 80 },
  { level: 8, speed: 0.8, mineAmount: 3.2, cost: 100 },
  { level: 9, speed: 1, mineAmount: 4, cost: 170 },
]

const miningTimeUpgrades = [
  { level: 0, time: 8, cost: 2 },
  { level: 1, time: 6, cost: 5 },
  { level: 2, time: 8, cost: 10 },
  { level: 3, time: 12, cost: 25 },
  { level: 4, time: 24, cost: 0 },
]

const ultraBoostUpgrades = [
  { level: 0, speed: 0.005, mineAmount: 0.02, claimTime: 4, cost: 500 },
  { level: 1, speed: 0.0625, mineAmount: 1.5, claimTime: 24, cost: 0 },
]

export default function UpgradeScreen() {
  const [userData, setUserData] = useState(null)
  const [userLevels, setUserLevels] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentScreen, setCurrentScreen] = useState('main')
  const [isUpgrading, setIsUpgrading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const initWebApp = async () => {
      try {
        const WebAppInstance = await WebApp
        if (!WebAppInstance.initDataUnsafe || !WebAppInstance.initDataUnsafe.user) {
          throw new Error('Web App not properly initialized')
        }
        const user = WebAppInstance.initDataUnsafe.user
        setUserData(user)
        await fetchUserLevels(user.id)
      } catch (error) {
        console.error('Error initializing Web App:', error)
        setError('Failed to initialize. Please ensure you\'re using the Telegram app.')
      } finally {
        setIsLoading(false)
      }
    }

    initWebApp()
  }, [])

  const fetchUserLevels = async (telegramId) => {
    try {
      const response = await fetch(`/api/user/levels?telegramId=${telegramId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch user levels')
      }
      const data = await response.json()
      setUserLevels(data)
      return data
    } catch (error) {
      console.error('Error fetching user levels:', error)
      toast.error('Failed to load user levels')
      return null
    }
  }

  const formatNumber = (num) => {
    if (typeof num !== 'number') return '0.0'
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    })
  }

  const handleUpgrade = async (type) => {
    if (isUpgrading || !userLevels) return

    let upgrades
    let currentLevelField
    switch (type) {
      case 'Speed':
        upgrades = speedUpgrades
        currentLevelField = 'speedLevel'
        break
      case 'MiningTime':
        upgrades = miningTimeUpgrades
        currentLevelField = 'miningTimeLevel'
        break
      case 'UltraBoost':
        if (userLevels.ultraBoostLevel > 0) {
          toast.error('Ultra Boost can only be purchased once!')
          return
        }
        if (userLevels.coins < 500) {
          toast.error('You need 500 coins to purchase Ultra Boost!')
          return
        }
        upgrades = ultraBoostUpgrades
        currentLevelField = 'ultraBoostLevel'
        break
      default:
        setError('Invalid upgrade type')
        return
    }

    const currentLevel = userLevels[currentLevelField] || 0
    const nextUpgrade = upgrades[currentLevel]

    if (!nextUpgrade) {
      toast.error('Maximum level reached')
      return
    }

    if (userLevels.coins < nextUpgrade.cost) {
      toast.error(`Not enough coins! You need ${nextUpgrade.cost} coins.`)
      return
    }

    setIsUpgrading(true)
    try {
      const response = await fetch(`/api/upgrade-${type.toLowerCase()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userData.id }),
      })
      
      if (!response.ok) {
        throw new Error('Upgrade failed')
      }
      
      // Fetch fresh data after upgrade
      const freshData = await fetchUserLevels(userData.id)
      if (freshData) {
        setUserLevels(freshData)
        toast.success('Upgrade successful! 🎉')
      }
    } catch (error) {
      console.error('Error during upgrade:', error)
      toast.error('Upgrade failed. Please try again.')
    } finally {
      setIsUpgrading(false)
    }
  }

  const handleGoBack = () => {
    if (currentScreen === 'main') {
      router.push('/game')
    } else {
      setCurrentScreen('main')
    }
  }

  const renderUpgradeInfo = (type) => {
    if (!userLevels) return null

    let upgrades
    let currentLevelField
    let speedField
    let timeField
    switch (type) {
      case 'Speed':
        upgrades = speedUpgrades
        currentLevelField = 'speedLevel'
        speedField = 'speed'
        break
      case 'MiningTime':
        upgrades = miningTimeUpgrades
        currentLevelField = 'miningTimeLevel'
        timeField = 'time'
        break
      case 'UltraBoost':
        upgrades = ultraBoostUpgrades
        currentLevelField = 'ultraBoostLevel'
        speedField = 'speed'
        timeField = 'claimTime'
        break
      default:
        return <p>Invalid upgrade type</p>
    }

    const currentLevel = userLevels[currentLevelField] || 0
    const isMaxLevel = currentLevel >= upgrades.length - 1
    const currentUpgrade = upgrades[currentLevel]
    const nextUpgrade = upgrades[currentLevel + 1]
    const isUltraBoostPurchased = type === 'UltraBoost' && currentLevel > 0

    return (
      <div className="space-y-4">
        <div className="bg-[#2B0537] border border-[#FF0307] p-4 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">
              Current Level: {isMaxLevel ? 'MAX' : currentLevel}
            </h3>
            {(isMaxLevel || isUltraBoostPurchased) && (
              <span className="text-yellow-500 text-sm font-medium px-2 py-1 bg-yellow-500/10 rounded">
                {isUltraBoostPurchased ? 'PURCHASED' : 'MAXED'}
              </span>
            )}
          </div>
          <div className="space-y-1 text-sm text-gray-300">
            {speedField && (
              <p>Speed: {formatNumber(currentUpgrade[speedField])} Bear/Hour</p>
            )}
            {timeField && (
              <p>Claim Every: {currentUpgrade[timeField]} Hours</p>
            )}
            {type === 'UltraBoost' && (
              <p>Mine Amount: {formatNumber(currentUpgrade.mineAmount)} Bear/Claim</p>
            )}
          </div>
        </div>

        {!isMaxLevel && !isUltraBoostPurchased && nextUpgrade && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#2B0537] border border-[#FF0307] p-4 rounded-xl"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Next Level: {currentLevel + 1}</h3>
              <div className="flex items-center text-sm">
                <span className="mr-1">🐻</span>
                <span className="font-medium">{formatNumber(nextUpgrade.cost)}</span>
              </div>
            </div>
            <div className="space-y-1 text-sm text-gray-300">
              {speedField && (
                <p>Speed: {formatNumber(nextUpgrade[speedField])} Bear/Hour</p>
              )}
              {timeField && (
                <p>Claim Every: {nextUpgrade[timeField]} Hours</p>
              )}
              {type === 'UltraBoost' && (
                <p>Mine Amount: {formatNumber(nextUpgrade.mineAmount)} Bear/Claim</p>
              )}
            </div>
          </motion.div>
        )}

        {!isMaxLevel && !isUltraBoostPurchased && (
          <motion.button
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 p-4 rounded-full text-lg font-semibold disabled:opacity-50"
            onClick={() => handleUpgrade(type)}
            disabled={isUpgrading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isUpgrading ? 'Upgrading...' : 'Upgrade'}
          </motion.button>
        )}
      </div>
    )
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
    <div className="min-h-screen bg-[#010A43] text-white flex flex-col">
      <div className="flex-grow overflow-y-auto p-4">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={handleGoBack}
              className="mr-4 p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <Image
              src="/logo.png"
              alt="User avatar"
              width={32}
              height={32}
              className="rounded-full mr-2"
            />
            <span>{userData?.username || userData?.first_name || 'User'}</span>
          </div>
          <div className="flex items-center">
            <span className="mr-1">🐻</span>
            <span className="text-xl font-bold">{formatNumber(userLevels?.coins || 0)}</span>
          </div>
        </div>

        {/* Main Screen */}
        <AnimatePresence mode="wait">
          {currentScreen === 'main' ? (
            <motion.div
              key="main"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              
              {upgradeOptions.map((option) => {
                const isMaxed = option.type === 'UltraBoost'
                  ? userLevels?.ultraBoostLevel > 0
                  : userLevels?.[`${option.type.toLowerCase()}Level`] >= 
                    (option.type === 'Speed' ? speedUpgrades.length - 1 :
                     miningTimeUpgrades.length - 1)

                return (
                  <motion.button
                    key={option.name}
                    className="w-full bg-[#2B0537] border border-[#FF0307] p-4 rounded-xl flex items-center justify-between"
                    onClick={() => setCurrentScreen(option.type)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{option.icon}</span>
                      <span className="text-lg">{option.name}</span>
                    </div>
                    {isMaxed && (
                      <span className="text-yellow-500 text-sm font-medium px-2 py-1 bg-yellow-500/10 rounded">
                        {option.type === 'UltraBoost' ? 'PURCHASED' : 'MAX'}
                      </span>
                    )}
                  </motion.button>
                )
              })}
            </motion.div>
          ) : (
            <motion.div
              key={currentScreen}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <h2 className="text-2xl font-bold mb-4">
                {currentScreen === 'Speed' ? 'Speed Upgrade' :
                 currentScreen === 'MiningTime' ? 'Mining Time Upgrade' :
                 'Ultra Boost Upgrade'}
              </h2>
              {renderUpgradeInfo(currentScreen)}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navbar */}
      <div className="mt-auto">
        <Navbar />
      </div>
    </div>
  )
}