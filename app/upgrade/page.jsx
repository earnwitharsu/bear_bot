import dynamic from 'next/dynamic'

const UpgradeScreen = dynamic(() => import('@/components/UpgradeScreen'), { ssr: false })

export default function UpgradePage() {
  return <UpgradeScreen />
}