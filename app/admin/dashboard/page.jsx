'use client'

import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { ChartCard } from '@/components/dashboard/ChartCard'
import { TaskForm } from '@/components/dashboard/TaskForm'
import { TaskCard } from '@/components/dashboard/TaskCard'
import { UserTable } from '@/components/dashboard/UserTable'
import { LoadingSpinner } from '@/components/dashboard/LoadingSpinner'
import { Users, Activity, Coins } from 'lucide-react'

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState([])
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeMiners: 0,
    totalCoins: 0,
    usersByLevel: [],
    users: []
  })
  const [editingTask, setEditingTask] = useState(null)

  useEffect(() => {
    fetchInitialData()
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchInitialData = async () => {
    setLoading(true)
    try {
      await Promise.all([fetchTasks(), fetchStats()])
    } catch (error) {
      console.error('Error fetching initial data:', error)
      toast.error('Error loading dashboard data')
    }
    setLoading(false)
  }

  const fetchStats = async () => {
    try {
      const [statsResponse, usersResponse] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/stats/users')
      ])
      
      if (!statsResponse.ok) throw new Error('Failed to fetch stats')
      if (!usersResponse.ok) throw new Error('Failed to fetch users')
      
      const statsData = await statsResponse.json()
      const usersData = await usersResponse.json()
      
      setStats({
        ...statsData,
        users: usersData
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
      toast.error('Error fetching statistics')
    }
  }

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/saveTask')
      if (!response.ok) throw new Error('Failed to fetch tasks')
      const data = await response.json()
      setTasks(data)
    } catch (error) {
      console.error('Error fetching tasks:', error)
      toast.error('Error fetching tasks')
    }
  }

  const handleTaskSubmit = async (taskData) => {
    try {
      if (editingTask) {
        const response = await fetch(`/api/saveTask/${editingTask._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(taskData),
        })

        if (!response.ok) throw new Error('Failed to update task')
        const updatedTask = await response.json()
        setTasks(tasks.map(task => task._id === updatedTask._id ? updatedTask : task))
        setEditingTask(null)
        toast.success('Task updated successfully')
      } else {
        const response = await fetch('/api/saveTask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(taskData),
        })

        if (!response.ok) throw new Error('Failed to create task')
        const newTask = await response.json()
        setTasks([...tasks, newTask])
        toast.success('Task created successfully')
      }
    } catch (error) {
      console.error('Error saving task:', error)
      toast.error('Error saving task')
    }
  }

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) return

    try {
      const response = await fetch(`/api/saveTask/${taskId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete task')
      setTasks(tasks.filter(task => task._id !== taskId))
      toast.success('Task deleted successfully')
    } catch (error) {
      console.error('Error deleting task:', error)
      toast.error('Error deleting task')
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 md:p-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatsCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          icon={Users}
        />
        <StatsCard
          title="Active Miners"
          value={stats.activeMiners.toLocaleString()}
          icon={Activity}
        />
        <StatsCard
          title="Total Coins"
          value={stats.totalCoins.toLocaleString()}
          icon={Coins}
        />
      </div>

      <ChartCard
        title="User Level Distribution"
        data={stats.usersByLevel.map(level => ({
          level: `Level ${level._id}`,
          users: level.count
        }))}
        className="mb-6"
      />

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Users</h2>
        <UserTable users={stats.users} />
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">
          {editingTask ? 'Edit Task' : 'Create New Task'}
        </h2>
        <TaskForm
          task={editingTask}
          onSubmit={handleTaskSubmit}
          onCancel={editingTask ? () => setEditingTask(null) : undefined}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tasks.map((task) => (
          <TaskCard
            key={task._id}
            task={task}
            onEdit={setEditingTask}
            onDelete={handleDeleteTask}
          />
        ))}
      </div>
    </div>
  )
}