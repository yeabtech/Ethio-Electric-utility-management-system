//src/app/customer/dashboard/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, ShieldCheck, XCircle, Clock, Zap, Home, Wrench, FileText, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { UserButton } from '@clerk/nextjs'
import CustomerSidebar from './components/CustomerSidebar'
import HomePage from './components/home_page'
import NewConnectionPage from '../services/new-connection/page'
import RepairsPage from '../services/repairs/page'
import Image from 'next/image'
import '@/app/globals.css'

type Verification = {
  status: 'pending' | 'approved' | 'rejected' | 'not_verified'
  rejectionReason?: string | null
  createdAt: string
}

const SERVICE_CARDS = [
  {
    title: 'New Connections',
    description: 'Apply for new electricity connections',
    icon: <Zap className="w-6 h-6" />,
    path: '/customer/services/new-connection'
  },
  {
    title: 'Meter Services',
    description: 'Meter installation, replacement, and issues',
    icon: <Home className="w-6 h-6" />,
    path: '/customer/services/meter'
  },
  {
    title: 'Repairs & Maintenance',
    description: 'Report electrical issues and request repairs',
    icon: <Wrench className="w-6 h-6" />,
    path: '/customer/services/repairs'
  },
  {
    title: 'Billing Support',
    description: 'Bill disputes, payment plans, and queries',
    icon: <FileText className="w-6 h-6" />,
    path: '/customer/services/billing'
  }
]

export default function CustomerDashboard() {
  const { user } = useUser()
  const router = useRouter()
  const [verification, setVerification] = useState<Verification | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [pendingReceipts, setPendingReceipts] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState('home')

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/customer/verification-status')
        const data = await res.json()
        setVerification(data)
      } catch (error) {
        console.error('Failed to fetch verification status:', error)
      } finally {
        setLoading(false)
      }
    }

    const fetchPendingReceipts = async () => {
      try {
        const res = await fetch('/api/customer/pending-receipts')
        const data = await res.json()
        if (typeof data.count === 'number') {
          setPendingReceipts(data.count)
        }
      } catch (error) {
        console.error('Failed to fetch pending receipts:', error)
      }
    }

    if (user) {
      fetchStatus()
      fetchPendingReceipts()
    }
  }, [user])

  const renderContent = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage verification={verification} loading={loading} />
      case 'new-connection':
        return <NewConnectionPage />
      case 'repairs':
        return <RepairsPage />
      default:
        return <HomePage verification={verification} loading={loading} />
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0b1c26] text-white">
      <CustomerSidebar
        verification={verification}
        pendingReceipts={pendingReceipts}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-auto bg-[var(--background)]">
        {/* Topbar */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <button className="md:hidden text-[var(--text)]" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu className="h-6 w-6" /> 
          </button>
          <div className="flex items-center justify-center flex-grow">
            <Image src="/mainlogo.png" alt="EEUMS Logo" width={40} height={40} className="mr-2" />
            <h1 className="text-xl font-bold text-[var(--text)]">EEUMS</h1>
          </div>
          <div className="w-6"></div> {/* This empty div helps balance the layout */}
        </div>

        {renderContent()}
      </div>
    </div>
  )
}
