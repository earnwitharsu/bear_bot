'use client'

import React from 'react'
import dynamic from 'next/dynamic'

const Navbar = dynamic(() => import('@/components/Navbar'), { ssr: false })
const Referral = dynamic(() => import('@/components/Referral'), { ssr: false })

function Page() {
  return (
    <div className='bg-[#010A43] text-white min-h-screen'>
      <Referral />
      <Navbar />
    </div>
  )
}

export default Page