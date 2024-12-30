'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'

const Navbar = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20">
      <div className="absolute inset-0 bg-gradient-to-r from-[#FFB904] to-[#BF0303] rounded-t-3xl" />
      <div className="relative flex justify-around items-center h-full px-4">
        <NavItem href="/game" icon="/icon-1.png" label="Home" />
        <NavItem href="/task" icon="/icon-2.png" label="Earn" />
        <NavItem href="/referral" icon="/icon-3.png" label="Friends" />
        <NavItem href="/profile" icon="/icon-4.png" label="Wallet" />
      </div>
    </nav>
  )
}

const NavItem = ({ href, icon, label }) => (
  <Link href={href} passHref>
    <motion.div
      whileTap={{ scale: 0.9 }}
      className="flex flex-col items-center justify-center text-white"
    >
      <div className="w-8 h-8 mb-1">
        <Image src={icon} alt={label} width={32} height={32} />
      </div>
      <span className="text-xs font-medium">{label}</span>
    </motion.div>
  </Link>
)

export default Navbar