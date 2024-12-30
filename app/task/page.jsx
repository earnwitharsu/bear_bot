'use client'

import React from 'react'
import dynamic from 'next/dynamic'

const Navbar = dynamic(() => import('@/components/Navbar'), { ssr: false })
const Task = dynamic(() => import('@/components/Task'), { ssr: false })

function Page() {
  return (
    <div className='bg-[#010A43] text-white min-h-screen'>
      <Task />
      <Navbar />
    </div>
  )
}

export default Page