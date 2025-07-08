'use client'
import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { DataTable } from '@/components/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import "@/app/globals.css"
import { Card, CardContent } from '@/components/ui/card'
import { useMemo, useRef } from 'react'

type ApproveService = {
  id: string
  serviceType: string
  user: {
    verification: {
      firstName: string
      lastName: string
      subCity: string
      woreda: string
      kebele: string
      homeNumber: string
    }[]
  }
  receipt: {
    grandTotal: number
  }
}

type Technician = {
  id: string
  user: {
    id: string
    email: string
    verification: {
      firstName: string
      lastName: string
    }[]
    clerkUserId?: string
  }
  status: 'available' | 'assigned' | 'on_leave'
}

export default function AssignTasksPage() {
  const { user } = useUser()
  const router = useRouter()
  const [services, setServices] = useState<ApproveService[]>([])
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [selectedTechnicians, setSelectedTechnicians] = useState<{ [serviceId: string]: string }>({})
  const [selectedDates, setSelectedDates] = useState<{ [serviceId: string]: Date | undefined }>({})
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)
  const [error, setError] = useState('')
  const [canceledTasks, setCanceledTasks] = useState<any[]>([])
  const [loadingCanceled, setLoadingCanceled] = useState(true)
  const [clerkNames, setClerkNames] = useState<{ [clerkUserId: string]: string }>({})
  const [openReportTaskId, setOpenReportTaskId] = useState<string | null>(null)
  const [reportData, setReportData] = useState<{ [taskId: string]: any }>({})
  const [loadingReport, setLoadingReport] = useState<string | null>(null)
  const [reportError, setReportError] = useState<string>('')
  const [reassigningTaskId, setReassigningTaskId] = useState<string | null>(null)
  const [reassignError, setReassignError] = useState<string>('')
  const [selectedReassignTech, setSelectedReassignTech] = useState<{ [taskId: string]: string }>({})

  useEffect(() => {
    const fetchData = async () => {
      try {
        const csoRes = await fetch(`/api/employee-info?userId=${user?.id}`)
        const csoData = await csoRes.json()
        console.log('CSO Data:', csoData)

        const servicesRes = await fetch(
          `/api/cso/services/approved?subCity=${csoData.subCity}&woreda=${csoData.woreda}`
        )
        const servicesData = await servicesRes.json()
        setServices(servicesData)

        const techRes = await fetch(
          `/api/technicians?subCity=${csoData.subCity}&woreda=${csoData.woreda}&status=available`
        )
        const techData = await techRes.json()
        console.log('Technician API params:', csoData.subCity, csoData.woreda)
        console.log('Technician API response:', techData)
        setTechnicians(techData)

        // Fetch all tasks for this subcity/woreda and filter for cancelled
        setLoadingCanceled(true)
        const allTasksRes = await fetch(`/api/cso/tasks?subCity=${csoData.subCity}&woreda=${csoData.woreda}`)
        const allTasksData = await allTasksRes.json()
        const cancelled = (allTasksData || []).filter((task: any) => task.status === 'cancelled')
        setCanceledTasks(cancelled)

        // Fetch Clerk names for all technicians, customers in canceled tasks
        const fetchClerkNames = async () => {
          const names: { [clerkUserId: string]: string } = {}
          // Technicians in assign dropdown
          await Promise.all(
            techData.map(async (tech: Technician) => {
              if (tech.user.clerkUserId) {
                try {
                  const res = await fetch(`/api/get-clerk-user?clerkUserId=${tech.user.clerkUserId}`)
                  if (res.ok) {
                    const data = await res.json()
                    names[tech.user.clerkUserId] = `${data.firstName} ${data.lastName}`
                  }
                } catch {}
              }
            })
          )
          // Customers and technicians in canceled tasks
          await Promise.all(
            cancelled.flatMap((task: any) => [
              (async () => {
                const clerkUserId = task.customer?.clerkUserId
                if (clerkUserId && !names[clerkUserId]) {
                  try {
                    const res = await fetch(`/api/get-clerk-user?clerkUserId=${clerkUserId}`)
                    if (res.ok) {
                      const data = await res.json()
                      names[clerkUserId] = `${data.firstName} ${data.lastName}`
                    }
                  } catch {}
                }
              })(),
              (async () => {
                const clerkUserId = task.technician?.user?.clerkUserId
                if (clerkUserId && !names[clerkUserId]) {
                  try {
                    const res = await fetch(`/api/get-clerk-user?clerkUserId=${clerkUserId}`)
                    if (res.ok) {
                      const data = await res.json()
                      names[clerkUserId] = `${data.firstName} ${data.lastName}`
                    }
                  } catch {}
                }
              })()
            ])
          )
          setClerkNames(names)
        }
        if (techData.length > 0 || cancelled.length > 0) fetchClerkNames()
      } catch (err) {
        setError("An error occurred while fetching data.")
      } finally {
        setLoading(false)
        setLoadingCanceled(false)
      }
    }

    if (user) fetchData()
  }, [user])

  const handleAssignTask = async (serviceId: string) => {
    const selectedTechnician = selectedTechnicians[serviceId]
    const selectedDate = selectedDates[serviceId]
    if (!selectedTechnician || !selectedDate) {
      setError('Please select technician and schedule date')
      return
    }

    setAssigning(true)
    try {
      const response = await fetch('/api/cso/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId,
          technicianId: selectedTechnician,
          scheduledAt: selectedDate,
          assignedById: user?.id
        })
      })

      if (!response.ok) throw new Error(await response.text())

      setServices(services.filter(s => s.id !== serviceId))
      setTechnicians(technicians.map(t =>
        t.id === selectedTechnician ? { ...t, status: 'assigned' } : t
      ))
      setSelectedTechnicians(prev => {
        const copy = { ...prev }
        delete copy[serviceId]
        return copy
      })
      setSelectedDates(prev => {
        const copy = { ...prev }
        delete copy[serviceId]
        return copy
      })
      setError('')
      router.refresh()
    } catch (err) {
      setError("An error occurred while assigning the task.")
    } finally {
      setAssigning(false)
    }
  }

  const handleViewReport = async (taskId: string) => {
    if (openReportTaskId === taskId) {
      setOpenReportTaskId(null)
      setReportError('')
      return
    }
    setOpenReportTaskId(taskId)
    setReportError('')
    if (!reportData[taskId]) {
      setLoadingReport(taskId)
      try {
        const res = await fetch(`/api/report/task/${taskId}`)
        if (!res.ok) throw new Error(await res.text())
        const data = await res.json()
        setReportData(prev => ({ ...prev, [taskId]: data }))
      } catch (err) {
        setReportError('Failed to load report.')
      } finally {
        setLoadingReport(null)
      }
    }
  }

  const handleReassign = async (taskId: string) => {
    const technicianId = selectedReassignTech[taskId]
    if (!technicianId) {
      setReassignError('Please select a technician to re-assign.')
      return
    }
    setReassigningTaskId(taskId)
    setReassignError('')
    try {
      const res = await fetch(`/api/cso/tasks/${taskId}/reassign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ technicianId })
      })
      if (!res.ok) throw new Error(await res.text())
      // Refresh canceled tasks list
      setCanceledTasks(prev => prev.filter(t => t.id !== taskId))
      setOpenReportTaskId(null)
      setSelectedReassignTech(prev => { const copy = { ...prev }; delete copy[taskId]; return copy })
    } catch (err) {
      setReassignError('Failed to re-assign task.')
    } finally {
      setReassigningTaskId(null)
    }
  }

  const columns: ColumnDef<ApproveService>[] = [
    {
      accessorKey: 'serviceType',
      header: 'Service Type'
    },
    {
      accessorKey: 'user',
      header: 'Customer',
      cell: ({ row }) => (
        <div>
          {row.original.user?.verification?.[0]?.firstName && row.original.user?.verification?.[0]?.lastName
            ? `${row.original.user.verification[0].firstName} ${row.original.user.verification[0].lastName}`
            : 'Unknown Customer'}
        </div>
      )
    },
    {
      accessorKey: 'location',
      header: 'Location',
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.user?.verification?.[0]?.kebele && row.original.user?.verification?.[0]?.homeNumber
            ? `${row.original.user.verification[0].kebele}, House ${row.original.user.verification[0].homeNumber}`
            : 'Address not available'}
        </div>
      )
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => (
        <div>{row.original.receipt.grandTotal.toLocaleString()} ETB</div>
      )
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const serviceId = row.original.id
        return (
          <div className="flex space-x-2">
            <Select
              onValueChange={val => setSelectedTechnicians(prev => ({ ...prev, [serviceId]: val }))}
              value={selectedTechnicians[serviceId] || ''}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select technician" />
              </SelectTrigger>
              <SelectContent>
                {technicians.map(tech => (
                  <SelectItem key={tech.id} value={tech.id}>
                    {tech.user.clerkUserId && clerkNames[tech.user.clerkUserId]
                      ? clerkNames[tech.user.clerkUserId]
                      : tech.user.verification?.[0]?.firstName && tech.user.verification?.[0]?.lastName
                        ? `${tech.user.verification[0].firstName} ${tech.user.verification[0].lastName}`
                        : tech.user.email ?? 'Unknown'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDates[serviceId] ? format(selectedDates[serviceId]!, "PPP") : <span>Pick date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDates[serviceId]}
                  onSelect={date => setSelectedDates(prev => ({ ...prev, [serviceId]: date }))}
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>

            <Button 
              variant="outline"
              onClick={() => handleAssignTask(serviceId)}
              disabled={!selectedTechnicians[serviceId] || !selectedDates[serviceId] || assigning}
            >
              Assign
            </Button>
          </div>
        )
      }
    }
  ]

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 /></div>
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Canceled Tasks List */}
      <div>
        <h2 className="text-xl font-bold mb-2">Canceled Tasks List</h2>
        {loadingCanceled ? (
          <div className="flex justify-center p-4"><Loader2 /></div>
        ) : canceledTasks.length === 0 ? (
          <div className="text-gray-500 p-2">No canceled tasks found.</div>
        ) : (
          <div className="space-y-2 mb-6">
            {canceledTasks.map((task, idx) => (
              <Card key={task.id || idx} className="bg-red-50 border-red-200">
                <CardContent className="py-3 px-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <div className="font-semibold text-red-700">{task.serviceType || task.service?.serviceType || 'Service'}</div>
                    <div className="text-sm text-gray-700">
                      Customer: {task.customer?.clerkUserId && clerkNames[task.customer.clerkUserId]
                        ? clerkNames[task.customer.clerkUserId]
                        : task.customer?.verification?.firstName && task.customer?.verification?.lastName
                          ? `${task.customer.verification.firstName} ${task.customer.verification.lastName}`
                          : task.customer?.email || 'Unknown'}
                    </div>
                    <div className="text-sm text-gray-700">
                      Scheduled: {task.scheduledAt ? new Date(task.scheduledAt).toLocaleDateString() : 'N/A'}
                    </div>
                    <div className="text-sm text-gray-700">
                      Technician: {task.technician?.user?.clerkUserId && clerkNames[task.technician.user.clerkUserId]
                        ? clerkNames[task.technician.user.clerkUserId]
                        : task.technician?.user?.verification?.firstName && task.technician?.user?.verification?.lastName
                          ? `${task.technician.user.verification.firstName} ${task.technician.user.verification.lastName}`
                          : (task.technician?.user?.email || 'Unknown')}
                    </div>
                    {task.rejectionReason && (
                      <div className="text-sm text-gray-700">Reason: {task.rejectionReason}</div>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => handleViewReport(task.id)}
                    >
                      {openReportTaskId === task.id ? 'Hide Report' : 'View Report'}
                    </Button>
                    {openReportTaskId === task.id && (
                      <div className="mt-2">
                        {loadingReport === task.id ? (
                          <div className="flex items-center gap-2 text-gray-500"><Loader2 className="animate-spin h-4 w-4" /> Loading report...</div>
                        ) : reportError ? (
                          <div className="text-red-500">{reportError}</div>
                        ) : reportData[task.id] ? (
                          <Card className="bg-gray-50 border-gray-200">
                            <CardContent className="py-3 px-4">
                              <div className="font-bold mb-2">Report</div>
                              <div className="text-sm text-gray-800">
                                {Array.isArray(reportData[task.id].data) && reportData[task.id].data.length > 0
                                  ? reportData[task.id].data[0].fieldValue
                                  : <span className="text-gray-400">No report data found.</span>}
                              </div>
                            </CardContent>
                          </Card>
                        ) : null}
                      </div>
                    )}
                    {/* Technician dropdown and Re-Assign button */}
                    <div className="flex items-center gap-2 mt-2">
                      <Select
                        onValueChange={val => setSelectedReassignTech(prev => ({ ...prev, [task.id]: val }))}
                        value={selectedReassignTech[task.id] || ''}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select technician" />
                        </SelectTrigger>
                        <SelectContent>
                          {technicians.filter(t => t.status === 'available').map(tech => (
                            <SelectItem key={tech.id} value={tech.id}>
                              {tech.user.clerkUserId && clerkNames[tech.user.clerkUserId]
                                ? clerkNames[tech.user.clerkUserId]
                                : tech.user.verification?.[0]?.firstName && tech.user.verification?.[0]?.lastName
                                  ? `${tech.user.verification[0].firstName} ${tech.user.verification[0].lastName}`
                                  : tech.user.email ?? 'Unknown'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="default"
                        size="sm"
                        disabled={!selectedReassignTech[task.id] || reassigningTaskId === task.id}
                        onClick={() => handleReassign(task.id)}
                      >
                        {reassigningTaskId === task.id ? <Loader2 className="animate-spin h-4 w-4" /> : 'Re-Assign'}
                      </Button>
                    </div>
                    {reassignError && (
                      <div className="text-red-500 text-xs mt-1">{reassignError}</div>
                    )}
                  </div>
                  <div className="text-xs text-red-600 font-bold">CANCELED</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      {/* Main Assign Table */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Assign Technician Tasks</h1>
        <div className="text-sm text-gray-500">
          {technicians.filter(t => t.status === 'available').length} technicians available
        </div>
      </div>

      {error && (
        <div className="text-red-500 p-2 bg-red-50 rounded">{error}</div>
      )}

      <DataTable
        columns={columns}
        data={services}
      />
    </div>
  )
}
