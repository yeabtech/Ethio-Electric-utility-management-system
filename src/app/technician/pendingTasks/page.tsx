'use client'
import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  Loader2, 
  CheckCircle2, 
  Clock, 
  Wrench, 
  User, 
  MapPin, 
  Calendar, 
  Phone, 
  Mail, 
  FileText,
  Play,
  CheckSquare,
  AlertCircle,
  Zap,
  X
} from 'lucide-react'
import "@/app/globals.css"
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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

type CancledTaskModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  task: Task;
};

type ReportField = {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  options?: { value: string; label: string }[];
};

function CancledTaskModal({ open, onClose, onSuccess, task }: CancledTaskModalProps) {
  const { user } = useUser();
  const [template, setTemplate] = useState<any>(null);
  const [fields, setFields] = useState<ReportField[]>([]);
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    const fetchTemplate = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/report/templates/task-report');
        const templates = await res.json();
        // Find the template with the exact title 'CancledTask' (case-insensitive)
        const cancelledTemplate = templates.find((t: any) => t.title.trim().toLowerCase() === 'cancledtask');
        if (cancelledTemplate) {
          setTemplate(cancelledTemplate);
          setFields(cancelledTemplate.fields || []);
        } else {
          setError('No CancledTask report template found.');
        }
      } catch (e) {
        setError('Failed to load report template.');
      } finally {
        setLoading(false);
      }
    };
    fetchTemplate();
  }, [open]);

  const handleChange = (name: string, value: string) => {
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!template || !user) return;
    setLoading(true);
    setError('');
    try {
      // Submit the report
      const dataArr = fields.map((f: ReportField) => ({ fieldName: f.name, fieldValue: form[f.name] || '' }));
      const reportRes = await fetch(`/api/report/task/${task.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: template.id,
          submittedById: user.id,
          data: dataArr,
          attachments: []
        })
      });
      if (!reportRes.ok) throw new Error('Failed to submit cancellation report');
      // Now cancel the task
      const cancelRes = await fetch(`/api/technician/tasks/${task.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' })
      });
      if (!cancelRes.ok) throw new Error('Failed to cancel task');
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <Card className="w-full max-w-lg mx-auto">
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <h2 className="text-xl font-bold mb-2">Cancel Task Report</h2>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            {loading ? (
              <div>Loading...</div>
            ) : fields.length > 0 ? (
              fields.map((field: ReportField) => {
                if (field.type === 'textarea') {
                  return (
                    <div key={field.name}>
                      <label className="block text-sm font-medium mb-1">{field.label}</label>
                      <Textarea
                        value={form[field.name] || ''}
                        onChange={e => handleChange(field.name, e.target.value)}
                        required={field.required}
                        rows={4}
                      />
                    </div>
                  );
                } else if (field.type === 'select') {
                  return (
                    <div key={field.name}>
                      <label className="block text-sm font-medium mb-1">{field.label}</label>
                      <Select
                        value={form[field.name] || ''}
                        onValueChange={(v: string) => handleChange(field.name, v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`Select ${field.label}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options && field.options.map((opt: { value: string; label: string }) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                } else {
                  return (
                    <div key={field.name}>
                      <label className="block text-sm font-medium mb-1">{field.label}</label>
                      <Input
                        value={form[field.name] || ''}
                        onChange={e => handleChange(field.name, e.target.value)}
                        required={field.required}
                        type={field.type || 'text'}
                      />
                    </div>
                  );
                }
              })
            ) : (
              <div>No fields found for this report.</div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading || fields.length === 0}>{loading ? 'Submitting...' : 'Submit & Cancel Task'}</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function TechnicianTasksPage() {
  const { user } = useUser()
  const [tasks, setTasks] = useState<Task[]>([])
  const [currentTask, setCurrentTask] = useState<Task | null>(null)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')
  const [showCancelModal, setShowCancelModal] = useState(false)

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
    if (!currentTask) return

    setUpdating(true)
    try {
      const response = await fetch(`/api/technician/tasks/${currentTask.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'completed'
        })
      })

      if (!response.ok) throw new Error('Failed to complete task')

      const updatedTask = await response.json()
      setCurrentTask(null)
      setTasks(tasks.map(t => t.id === currentTask.id ? updatedTask : t))
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        setError(message)
    } finally {
      setUpdating(false)
    }
  }

  const handleCancelTask = async () => {
    setShowCancelModal(true)
  }

  const handleModalClose = () => {
    setShowCancelModal(false)
  }

  const handleModalSuccess = () => {
    setCurrentTask(null)
    // Optionally, refresh tasks here
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Tasks</h1>
            <p className="text-gray-600">Manage and complete your assigned tasks</p>
          </div>
        </div>

        {error && (
          <Alert variant="error">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Current Task */}
        {currentTask && (
          <Card className="border-0 bg-white shadow-2xl rounded-2xl overflow-hidden relative">
            {/* Paper texture overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white opacity-60 pointer-events-none"></div>
            
            {/* Paper header with subtle texture */}
            <div className="relative p-6 bg-gradient-to-r from-gray-100 to-gray-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Current Task</h2>
                  <p className="text-gray-600">Work in progress</p>
                </div>
                <Badge className="bg-orange-100 text-orange-800 border-orange-200 px-4 py-2 text-sm font-medium shadow-sm">
                  In Progress
                </Badge>
              </div>
            </div>
            
            <CardContent className="relative p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="p-2 bg-gray-100 rounded-lg shadow-sm">
                      <Wrench className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Service Type</p>
                      <p className="font-semibold text-gray-900">
                        {currentTask.service ? currentTask.service.serviceType : 'Service type not available'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="p-2 bg-gray-100 rounded-lg shadow-sm">
                      <Calendar className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Scheduled Date</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(currentTask.scheduledAt).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="p-2 bg-gray-100 rounded-lg shadow-sm">
                      <User className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Customer</p>
                      <p className="font-semibold text-gray-900">{currentTask.customerName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="p-2 bg-gray-100 rounded-lg shadow-sm">
                      <Mail className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Email</p>
                      <p className="font-semibold text-gray-900">
                        {currentTask.customer?.email || 'Email not available'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="p-2 bg-gray-100 rounded-lg shadow-sm">
                  <Phone className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Phone</p>
                  <p className="font-semibold text-gray-900">
                    {currentTask.customer?.verification[0]?.mobileNumber || 'Mobile number not available'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="p-2 bg-gray-100 rounded-lg shadow-sm">
                  <MapPin className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Location</p>
                  <p className="font-semibold text-gray-900">
                    Kebele: {currentTask.customer?.verification[0]?.kebele}, House: {currentTask.customer?.verification[0]?.homeNumber}
                  </p>
                  <p className="text-sm text-gray-600">
                    SubCity: {currentTask.customer?.verification[0]?.subCity}, Woreda: {currentTask.customer?.verification[0]?.woreda}
                  </p>
                </div>
              </div>

              {currentTask.receipt && (
                <div className="flex items-center space-x-3 p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="p-2 bg-gray-100 rounded-lg shadow-sm">
                    <span role="img" aria-label="money">💵</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Amount (ETB)</p>
                    <p className="font-semibold text-gray-900">ETB {currentTask.receipt.grandTotal.toFixed(2)}</p>
                  </div>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="relative p-6 bg-gradient-to-r from-gray-100 to-gray-50 border-t border-gray-200">
              <div className="w-full flex gap-3">
                <Button 
                  onClick={handleCancelTask} 
                  disabled={updating} 
                  variant="outline"
                  className="flex-1 bg-white border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 hover:text-red-700 shadow-md hover:shadow-lg transition-all duration-200 py-3 rounded-xl font-semibold"
                >
                  {updating ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <X className="mr-2 h-5 w-5" />
                  )}
                  Cancel Task
                </Button>
                <Button 
                  onClick={handleCompleteTask} 
                  disabled={updating} 
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 py-3 rounded-xl font-semibold"
                >
                  {updating ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <CheckSquare className="mr-2 h-5 w-5" />
                  )}
                  Mark as Completed
                </Button>
              </div>
            </CardFooter>
          </Card>
        )}

        {/* Assigned Tasks */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Assigned Tasks</h2>
          </div>
          
          {tasks.filter(t => t.status === 'assigned').length === 0 ? (
            <Card className="border-0 bg-white shadow-lg rounded-2xl">
              <CardContent className="p-8 text-center">
                <div className="p-4 bg-blue-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks assigned</h3>
                <p className="text-gray-600">You'll see new tasks here when they're assigned to you.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tasks.filter(t => t.status === 'assigned').map(task => (
                <Card key={task.id} className="border-0 bg-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden group">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-white font-medium text-sm">New Task</span>
                      </div>
                      <Badge className="bg-white/20 text-white border-white/30">
                        Pending
                      </Badge>
                    </div>
                  </div>
                  
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Wrench className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Service Type</p>
                          <p className="font-semibold text-gray-900">
                            {task.service ? task.service.serviceType : 'Service type not available'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <User className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Customer</p>
                          <p className="font-semibold text-gray-900">{task.customerName}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Mail className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="font-medium text-gray-900 text-sm">
                            {task.customer?.email || 'Email not available'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                          <Calendar className="h-4 w-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Scheduled Date</p>
                          <p className="font-medium text-gray-900">
                            {new Date(task.scheduledAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {task.receipt && (
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                          <span role="img" aria-label="money">💵</span>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Amount (ETB)</p>
                          <p className="font-medium text-gray-900 text-sm">ETB {task.receipt.grandTotal.toFixed(2)}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                  
                  <CardFooter className="p-6 bg-gray-50 border-t border-gray-100">
                    <Button 
                      onClick={() => handleStartTask(task.id)} 
                      disabled={updating} 
                      className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200 py-3 rounded-xl font-semibold group-hover:scale-105"
                    >
                      {updating ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="mr-2 h-4 w-4" />
                      )}
                      Start Task
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      {currentTask && (
        <CancledTaskModal
          open={showCancelModal}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
          task={currentTask}
        />
      )}
    </div>
  )
}
