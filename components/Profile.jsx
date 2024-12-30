'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { useTonConnectUI } from '@tonconnect/ui-react'
import { toast } from 'react-hot-toast'

export default function Profile() {
  const [tonConnectUI] = useTonConnectUI()
  const [userData, setUserData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [tonWalletAddress, setTonWalletAddress] = useState(null)
  const [connectionError, setConnectionError] = useState(null)

  const formatNumber = (num) => {
    if (typeof num !== 'number') return '0.0'
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
      useGrouping: true
    })
  }

  const handleWalletConnection = useCallback((address) => {
    setTonWalletAddress(address)
    setConnectionError(null)
    toast.success("Wallet connected successfully!")
  }, [])

  const handleWalletDisconnection = useCallback(() => {
    setTonWalletAddress(null)
    setConnectionError(null)
    toast.success("Wallet disconnected successfully!")
  }, [])

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const WebApp = (await import('@twa-dev/sdk')).default
        if (WebApp.initDataUnsafe && WebApp.initDataUnsafe.user) {
          const user = WebApp.initDataUnsafe.user
          const response = await fetch(`/api/user/${user.id}`)
          const data = await response.json()
          if (response.ok) {
            setUserData(data)
          } else {
            throw new Error(data.message || 'Failed to fetch user data')
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
        toast.error('Failed to fetch user data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()

    const checkWalletConnection = async () => {
      try {
        if (tonConnectUI.account?.address) {
          handleWalletConnection(tonConnectUI.account.address)
        } else {
          handleWalletDisconnection()
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error)
        setConnectionError('Failed to check wallet connection')
        toast.error('Failed to check wallet connection')
      }
    }

    checkWalletConnection()

    const unsubscribe = tonConnectUI.onStatusChange((wallet) => {
      if (wallet) {
        handleWalletConnection(wallet.account.address)
      } else {
        handleWalletDisconnection()
      }
    })

    return () => {
      unsubscribe()
    }
  }, [tonConnectUI, handleWalletConnection, handleWalletDisconnection])

  const handleWalletAction = async () => {
    try {
      if (tonConnectUI.connected) {
        await tonConnectUI.disconnect()
      } else {
        await tonConnectUI.openModal()
      }
    } catch (error) {
      console.error('Wallet action error:', error)
      setConnectionError('Failed to perform wallet action')
      toast.error('Failed to perform wallet  action')
    }
  }

  const formatAddress = (address) => {
    if (!address) return ''
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#010A43] text-white">
        <div className="text-xl font-bold flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#010A43] text-white">
        <div className="text-2xl font-bold">Failed to load user data</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#010A43] p-4">
      <motion.div 
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md flex flex-col items-center"
      >
        <div className="w-26 h-12 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mb-6">
          <span className="text-1xl sm:text-1xl font-extrabold text-white"> BEAR APP 🐻  </span>
        </div>

        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-r from-purple-500 to-purple-400 flex items-center justify-center ring-2 ring-purple-400 mb-3">
          <span className="text-2xl sm:text-3xl font-bold text-white">
            {userData.firstName ? userData.firstName[0] : ''}
            {userData.lastName ? userData.lastName[0] : ''}
          </span>
        </div>

        <h2 className="text-xl font-bold text-white mb-1">
          {userData.firstName} {userData.lastName}
        </h2>
        <p className="text-purple-300 text-sm mb-8">
          {userData.username ? `@${userData.username}` : 'Premium Bot User'}
        </p>

        <div className="w-full grid grid-cols-2 gap-4 mb-8">
          <div className="bg-[#2B0537] border border-[#FF0307] rounded-xl p-4">
            <div className="flex flex-col items-center">
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-5 h-5 relative">
                  <Image src="/logo.png" alt="coins" layout="fill" objectFit="contain" />
                </div>
                <span className="text-purple-300 text-sm">Coins Mined</span>
              </div>
              <p className="text-white font-bold text-lg sm:text-xl">
                {formatNumber(userData?.coins || 0)}
              </p>
            </div>
          </div>
          <div className="bg-[#2B0537] border border-[#FF0307] rounded-xl p-4">
            <div className="flex flex-col items-center">
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-5 h-5 relative">
                  <Image src="/logo.png" alt="level" layout="fill" objectFit="contain" />
                </div>
                <span className="text-purple-300 text-sm">Mining Level</span>
              </div>
              <p className="text-white font-bold text-lg sm:text-xl">{userData.level || '1'}</p>
            </div>
          </div>
        </div>

        <div className="w-full max-w-xs bg-gray-700 rounded-full h-2 mb-4">
          <motion.div
            className="bg-blue-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${((userData.level || 1) / 10) * 100}%` }}
            transition={{ duration: 1, ease: "easeInOut" }}
          />
        </div>
        <p className="text-sm text-gray-300 mb-8">Mining Level: {userData.level || '1'}/10</p>

        <button 
          onClick={handleWalletAction}
          className="w-full max-w-sm bg-[#2B0537] border border-[#FF0307] rounded-xl py-3 px-4 text-white font-medium flex items-center justify-center space-x-2 hover:bg-[#3B1547] transition-colors duration-200"
        >
          <span className="text-sm sm:text-base">
            {tonWalletAddress ? formatAddress(tonWalletAddress) : 'Connect TON Wallet'}
          </span>
          {tonWalletAddress && (
            <div className="w-4 h-4 relative">
              <Image src="/logo.png" alt="copy" layout="fill" objectFit="contain" />
            </div>
          )}
        </button>

        {connectionError && (
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-500 text-sm mt-3"
          >
            {connectionError}
          </motion.p>
        )}

        {!connectionError && tonWalletAddress && (
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-green-400 text-sm mt-3"
          >
            TON Wallet Connected ✓
          </motion.p>
        )}
      </motion.div>
    </div>
  )
}