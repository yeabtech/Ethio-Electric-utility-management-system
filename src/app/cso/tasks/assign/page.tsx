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
    verification: {
      firstName: string
      lastName: string
    }[]
  }
  status: 'available' | 'assigned' | 'on_leave'
}

export default function AssignTasksPage() {
  const { user } = useUser()
  const [services, setServices] = useState<ApproveService[]>([])
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [selectedTechnician, setSelectedTechnician] = useState('')
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const csoRes = await fetch(`/api/employee-info?userId=${user?.id}`)
        const csoData = await csoRes.json()

        const servicesRes = await fetch(
          `/api/cso/services/approved?subCity=${csoData.subCity}&woreda=${csoData.woreda}`
        )
        const servicesData = await servicesRes.json()
        setServices(servicesData)

        const techRes = await fetch(
          `/api/technicians?subCity=${csoData.subCity}&woreda=${csoData.woreda}&status=available`
        )
        const techData = await techRes.json()
        setTechnicians(techData)

      } catch (err) {
        setError("An error occurred while fetching data.")
      } finally {
        setLoading(false)
      }
    }

    if (user) fetchData()
  }, [user])

  const handleAssignTask = async (serviceId: string) => {
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
      setSelectedTechnician('')
      setError('')
    } catch (err) {
      setError("An error occurred while assigning the task.")
    } finally {
      setAssigning(false)
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
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Select onValueChange={setSelectedTechnician} value={selectedTechnician}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select technician" />
            </SelectTrigger>
            <SelectContent>
              {technicians.map(tech => (
                <SelectItem key={tech.id} value={tech.id}>
                  {tech.user.verification?.[0]?.firstName ?? 'Unknown'} {tech.user.verification?.[0]?.lastName ?? ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : <span>Pick date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date()}
              />
            </PopoverContent>
          </Popover>

          <Button 
            variant="outline"
            onClick={() => handleAssignTask(row.original.id)}
            disabled={!selectedTechnician || !selectedDate || assigning}
          >
            Assign
          </Button>
        </div>
      )
    }
  ]

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 /></div>
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
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
