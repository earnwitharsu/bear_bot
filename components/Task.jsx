'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import WebApp from '@twa-dev/sdk'
import { Toaster, toast } from 'react-hot-toast'

const LoadingSpinner = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="flex flex-col items-center justify-center gap-4"
  >
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full"
    />
    <motion.p
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity }}
      className="text-lg font-medium text-purple-300"
    >
      Loading referrals...
    </motion.p>
  </motion.div>
)

const TaskCard = React.memo(({ task, onTaskClick, isCompleted, isActive, timer, buttonStyle, buttonText }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3 }}
    className="bg-gradient-to-r from-[#2B0537] to-[#1F0428] border border-[#FF0307]/30 rounded-xl overflow-hidden mb-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-[#FF0307]/50"
  >
    <div className="flex items-center justify-between p-3">
      <div className="flex items-center space-x-3">
        <div className="text-2xl transform hover:scale-110 transition-transform duration-200">
          {task.icon === 'video' ? '🎥' : '📢'}
        </div>
        <div className="flex flex-col">
          <span className="text-white font-medium text-base">{task.title}</span>
          <span className="text-gray-400 text-xs">Tap to complete</span>
        </div>
      </div>
      <button
        onClick={() => onTaskClick(task._id, task.url)}
        disabled={isCompleted}
        className={`${buttonStyle} text-white px-4 py-1.5 rounded-full text-sm font-medium disabled:opacity-50 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg`}
      >
        {buttonText}
      </button>
    </div>
  </motion.div>
))

TaskCard.displayName = 'TaskCard'

export default function Task() {
  const [tasks, setTasks] = useState([])
  const [coins, setCoins] = useState(0)
  const [activeTasks, setActiveTasks] = useState({})
  const [timers, setTimers] = useState({})
  const [isClient, setIsClient] = useState(false)
  const [telegramId, setTelegramId] = useState(null)
  const [completedTasks, setCompletedTasks] = useState([])
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  
  const pendingRequests = useRef(new Set())
  const abortControllers = useRef({})

  const formatNumber = (num) => {
    if (typeof num !== 'number') return '0.0'
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
      useGrouping: true
    })
  }

  const fetchUserTasks = useCallback(async (id) => {
    if (!id) return
    
    const controller = new AbortController()
    try {
      const response = await fetch(`/api/user-tasks?telegramId=${id}`, {
        signal: controller.signal
      })
      if (!response.ok) {
        throw new Error('Failed to fetch user tasks')
      }
      const data = await response.json()
      setTasks(data.tasks || [])
      setCoins(data.userCoins || 0)
      setCompletedTasks(data.tasks?.filter(task => task.completed).map(task => task._id) || [])
      setError(null)
    } catch (error) {
      if (error.name === 'AbortError') return
      console.error('Error fetching user tasks:', error)
      setError('Failed to fetch tasks')
      toast.error('Failed to fetch tasks')
    }
    return () => controller.abort()
  }, [])

  const initWebApp = useCallback(async () => {
    if (isInitialized) return
    
    try {
      const WebAppInstance = await WebApp
      if (WebAppInstance.initDataUnsafe?.user?.id) {
        const userId = WebAppInstance.initDataUnsafe.user.id
        setTelegramId(userId)
        await fetchUserTasks(userId)
      }
      setIsInitialized(true)
    } catch (error) {
      console.error('Error initializing Web App:', error)
      setError('Failed to initialize Web App')
      toast.error('Failed to initialize Web App')
    } finally {
      setIsLoading(false)
    }
  }, [fetchUserTasks, isInitialized])

  useEffect(() => {
    setIsClient(true)
    initWebApp()
  }, [initWebApp])

  const handleTaskCompletion = useCallback(async (taskId) => {
    if (!telegramId || pendingRequests.current.has(taskId)) return
    
    if (abortControllers.current[taskId]) {
      abortControllers.current[taskId].abort()
    }

    const controller = new AbortController()
    abortControllers.current[taskId] = controller
    pendingRequests.current.add(taskId)

    try {
      const response = await fetch('/api/complete-task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskId, telegramId }),
        signal: controller.signal
      })

      if (response.ok) {
        const data = await response.json()
        if (data.user?.coins !== undefined) {
          setCoins(data.user.coins)
        }
        setCompletedTasks(prev => [...prev, taskId])
        setError(null)
        if (data.reward?.amount) {
          toast.success(`Task completed! Earned ${formatNumber(data.reward.amount)} 🐻`)
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to complete task')
      }
    } catch (error) {
      if (error.name === 'AbortError') return
      console.error('Error completing task:', error)
      setError(error.message || 'Failed to complete task')
      toast.error(error.message || 'Failed to complete task')
    } finally {
      pendingRequests.current.delete(taskId)
      delete abortControllers.current[taskId]
      
      setTimers(prev => {
        const newTimers = { ...prev }
        delete newTimers[taskId]
        return newTimers
      })
      setActiveTasks(prev => {
        const newActiveTasks = { ...prev }
        delete newActiveTasks[taskId]
        return newActiveTasks
      })
    }
  }, [telegramId])

  useEffect(() => {
    const intervals = {}

    Object.entries(timers).forEach(([taskId, time]) => {
      if (time > 0) {
        intervals[taskId] = setInterval(() => {
          setTimers(prev => ({
            ...prev,
            [taskId]: prev[taskId] - 1
          }))
        }, 1000)
      } else if (time === 0 && !completedTasks.includes(taskId)) {
        handleTaskCompletion(taskId)
      }
    })

    return () => {
      Object.values(intervals).forEach(interval => clearInterval(interval))
    }
  }, [timers, handleTaskCompletion, completedTasks])

  const handleTaskClick = useCallback((taskId, link) => {
    if (!completedTasks.includes(taskId) && !activeTasks[taskId]) {
      window.open(link, '_blank')
      setActiveTasks(prev => ({
        ...prev,
        [taskId]: true
      }))
      setTimers(prev => ({
        ...prev,
        [taskId]: 30
      }))
      toast.success('Task started! Complete it within 30 seconds.')
    }
  }, [completedTasks, activeTasks])

  const getButtonText = useCallback((taskId) => {
    if (completedTasks.includes(taskId)) {
      return '✓ Completed'
    }
    if (activeTasks[taskId]) {
      return `${timers[taskId]}s`
    }
    return 'Start Task →'
  }, [completedTasks, activeTasks, timers])

  const getButtonStyle = useCallback((taskId) => {
    if (completedTasks.includes(taskId)) {
      return 'bg-green-500 hover:bg-green-600'
    }
    if (activeTasks[taskId]) {
      return 'bg-yellow-500 hover:bg-yellow-600'
    }
    return 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'
  }, [completedTasks, activeTasks])

  if (!isClient || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#010A43] to-[#2B0537]">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#010A43] to-[#0A1854] flex flex-col max-w-md mx-auto">
      <Toaster 
        position="bottom-center" 
        toastOptions={{
          style: {
            background: '#1F0428',
            color: '#fff',
            fontSize: '0.875rem',
          },
        }}
      />
      
      <header className="flex justify-between items-center p-3 text-white sticky top-0 bg-gradient-to-b from-[#010A43] to-transparent">
        <span className="text-xl font-bold flex items-center gap-2">
          Bear <span className="text-2xl">🐻</span>
        </span>
        <button 
          className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          aria-label="Menu"
        >
          <span className="text-xl">⋮</span>
        </button>
      </header>
      
      <div className="text-white p-3">
        <div className="bg-white/5 p-4 rounded-xl backdrop-blur-sm">
          <p className="text-gray-400 text-sm mb-1">Your Balance</p>
          <p className="text-2xl font-bold flex items-center gap-2">
            {formatNumber(coins)} <span className="text-xl">🐻</span>
          </p>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto px-3 pb-16">
        <AnimatePresence>
          {tasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onTaskClick={handleTaskClick}
              isCompleted={completedTasks.includes(task._id)}
              isActive={activeTasks[task._id]}
              timer={timers[task._id]}
              buttonStyle={getButtonStyle(task._id)}
              buttonText={getButtonText(task._id)}
            />
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-16 left-4 right-4 max-w-md mx-auto"
          >
            <div className="bg-red-500/90 backdrop-blur-sm text-white p-3 rounded-xl text-center text-sm shadow-lg">
              {error}
            </div>
          </motion.div>
        )}

        {Object.keys(activeTasks).length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-16 left-4 right-4 max-w-md mx-auto"
          >
            <div className="bg-yellow-500/90 backdrop-blur-sm text-white p-3 rounded-xl text-center text-sm shadow-lg">
              {Object.keys(activeTasks).length} task(s) in progress...
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}