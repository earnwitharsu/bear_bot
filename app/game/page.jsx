'use client'

import React from 'react'
import dynamic from 'next/dynamic'

const Game = dynamic(() => import('@/components/game'), { ssr: false })
const Navbar = dynamic(() => import('@/components/Navbar'), { ssr: false })

function Page() {
  return (
    <div className='bg-[#010A43] text-white min-h-screen'>
      <Game />
      <Navbar />
    </div>
  )
}

export default Page