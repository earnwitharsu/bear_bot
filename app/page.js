'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import components with ssr option set to false
const Game = dynamic(() => import("@/components/game"), { ssr: false })
const Navbar = dynamic(() => import("@/components/Navbar"), { ssr: false })
const SplashScreen = dynamic(() => import("@/components/Splash"), { ssr: false })

export default function Home() {
  const [showSplash, setShowSplash] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const [isWebAppReady, setIsWebAppReady] = useState(false)

  useEffect(() => {
    setIsMounted(true)

    const initWebApp = async () => {
      try {
        const WebApp = (await import('@twa-dev/sdk')).default
        if (WebApp.initDataUnsafe && WebApp.initDataUnsafe.user) {
          setIsWebAppReady(true)
        } else {
          console.error('Web App not properly initialized')
        }
      } catch (error) {
        console.error('Error initializing Web App:', error)
      }
    }

    initWebApp()

    // Disable right-click
    document.addEventListener('contextmenu', (e) => e.preventDefault());

    // Prevent showing URL in status bar
    const links = document.querySelectorAll('a');
    links.forEach((link) => {
      link.addEventListener('mouseover', (e) => {
        e.preventDefault();
        window.status = '';
        return true;
      });
    });
  }, [])

  const handleStartEarning = () => {
    setShowSplash(false)
  }

  if (!isMounted || !isWebAppReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#010A43]">
        <p className="text-white text-xl">Loading...</p>
      </div>
    )
  }

  if (showSplash) {
    return <SplashScreen onStartEarning={handleStartEarning} />
  }

  return (
    <div className="min-h-screen bg-[#010A43] text-white">
      <Game />
      <Navbar />
    </div>
  )
}