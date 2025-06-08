'use client'
import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, CheckCircle2, Clock, Wrench } from 'lucide-react'
import "@/app/globals.css"

type Task = {
  id: string
  status: 'assigned' | 'in_progress' | 'completed' | 'cancelled'
  scheduledAt: string
  service?: {
    serviceType: string
    metadata: {
      plotNumber?: string
      voltageLevel?: string
      estimatedCost: {
        tax: number
        total: number
        baseCost: number
        voltageRate: number
      }
      estimatedLoad: string
    }
  }
  customer?: {
    email?: string
    verification: Array<{
      firstName: string
      lastName: string
      subCity: string
      woreda: string
      kebele: string
      homeNumber: string
      mobileNumber: string
    }>
  }
  receipt: {
    grandTotal: number
  }
  customerName: string
}

export default function TechnicianTasksPage() {
  const { user } = useUser()
  const [tasks, setTasks] = useState<Task[]>([])
  const [currentTask, setCurrentTask] = useState<Task | null>(null)
  const [report, setReport] = useState('')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch(`/api/technician/tasks/${user?.id}`)
        const data = await response.json()
        setTasks(data)

        const inProgressTask = data.find((t: Task) => t.status === 'in_progress')
        if (inProgressTask) setCurrentTask(inProgressTask)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    if (user) fetchTasks()
  }, [user])

  const handleStartTask = async (taskId: string) => {
    setUpdating(true)
    try {
      const response = await fetch(`/api/technician/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in_progress' })
      })

      if (!response.ok) throw new Error('Failed to start task')

      const updatedTask = await response.json()
      setCurrentTask(updatedTask)
      setTasks(tasks.map(t => t.id === taskId ? updatedTask : t))
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        setError(message)
    } finally {
      setUpdating(false)
    }
  }

  const handleCompleteTask = async () => {
    if (!currentTask || !report) {
      setError('Please write a report before completing')
      return
    }

    setUpdating(true)
    try {
      const response = await fetch(`/api/technician/tasks/${currentTask.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'completed',
          report 
        })
      })

      if (!response.ok) throw new Error('Failed to complete task')

      const updatedTask = await response.json()
      setCurrentTask(null)
      setTasks(tasks.map(t => t.id === currentTask.id ? updatedTask : t))
      setReport('')
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        setError(message)
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 /></div>
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">My Tasks</h1>

      {error && (
        <Alert variant="warning">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Current Task */}
      {currentTask && (
        <Card className="border-primary">
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle>Current Task</CardTitle>
              <Badge variant="default">In Progress</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Service Type</p>
                <p className="font-medium">
                  {currentTask.service ? currentTask.service.serviceType : 'Service type not available'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Scheduled Date</p>
                <p className="font-medium">
                  {new Date(currentTask.scheduledAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500">Customer</p>
              <p className="font-medium">{currentTask.customerName}</p>
              <p className="text-sm">
                  Email : {currentTask.customer?.email || 'Email not available'}
              </p>
              <p className="text-sm">
                   Phone: {currentTask.customer?.verification[0]?.mobileNumber || 'Mobile number not available'}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Location</p>
              <p className="font-medium">
                 kebele: {currentTask.customer?.verification[0]?.kebele}, House: {currentTask.customer?.verification[0]?.homeNumber}
              </p>
              <p className="text-sm">
                 subCity:{currentTask.customer?.verification[0]?.subCity}, Woreda: {currentTask.customer?.verification[0]?.woreda}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Work Report</p>
              <Textarea
                value={report}
                onChange={(e) => setReport(e.target.value)}
                placeholder="Describe work done, materials used, issues encountered..."
                className="mt-1"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button onClick={handleCompleteTask} disabled={updating}>
              {updating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Mark as Completed
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Assigned Tasks */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Assigned Tasks</h2>
        {tasks.filter(t => t.status === 'assigned').length === 0 ? (
          <Alert variant='warning'>
            <Clock className="h-4 w-4" />
            <AlertTitle>No tasks assigned</AlertTitle>
            <AlertDescription>
              You'll see new tasks here when they're assigned to you.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.filter(t => t.status === 'assigned').map(task => (
              <Card key={task.id}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {task.service ? task.service.serviceType : 'Service type not available'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-500">Customer</p>
                    <p className="font-medium">{task.customerName}</p>
                    <p className="text-sm">
                      {task.customer?.email || 'Email not available'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Scheduled Date</p>
                    <p className="font-medium">
                      {new Date(task.scheduledAt).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={() => handleStartTask(task.id)} disabled={updating}>
                    {updating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Start Task
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
