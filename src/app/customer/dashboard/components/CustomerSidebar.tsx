'use client'

import { useRouter } from 'next/navigation'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ShieldCheck, XCircle, Clock, Zap, Home, Wrench, FileText, X, Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserButton } from '@clerk/nextjs'
import { useTheme } from '@/app/context/ThemeContext'

type Verification = {
  status: 'pending' | 'approved' | 'rejected' | 'not_verified'
  rejectionReason?: string | null
  createdAt: string
}

const SERVICE_CARDS = [
  {
    title: 'New Connections',
    description: 'Apply for new electricity connections',
    icon: <Zap className="w-6 h-6" style={{ color: '#FFD93D' }} />,
    path: 'new-connection'
  },
  {
    title: 'Repairs & Maintenance',
    description: 'Report electrical issues and request repairs',
    icon: <Wrench className="w-6 h-6" style={{ color: '#FF6B6B' }} />,
    path: 'repairs'
  },
  {
    title: 'Request Response',
    description: 'View your request responses',
    icon: <FileText className="w-6 h-6" style={{ color: '#4ECDC4' }} />,
    path: 'request-response'
  }
]

interface CustomerSidebarProps {
  verification: Verification | null
  pendingReceipts: number
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  currentPage: string
  setCurrentPage: (page: string) => void
}

export default function CustomerSidebar({ 
  verification, 
  pendingReceipts, 
  sidebarOpen, 
  setSidebarOpen,
  currentPage,
  setCurrentPage
}: CustomerSidebarProps) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const isVerified = verification?.status === 'approved'

  return (
    <div className={`fixed inset-y-0 left-0 z-30 w-[70%] md:w-72 bg-[var(--sidebar-bg)] backdrop-blur-md backdrop-saturate-150 bg-opacity-100 border-r border-[var(--sidebar-border)] shadow-2xl rounded-r-3xl md:rounded-none transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:inset-0 flex flex-col h-screen overflow-hidden`}>
      {/* Close button at the very top (mobile only) */}
      <div className="flex justify-end md:hidden p-2">
        <button onClick={() => setSidebarOpen(false)} className="text-[var(--sidebar-text)] hover:text-white focus:outline-none">
          <X className="h-6 w-6" />
        </button>
      </div>
      <div className="flex-1 flex flex-col p-3 md:p-4 pt-0 space-y-4 md:space-y-6">
        {/* User Button Section */}
        <div className="flex justify-center py-4 md:py-6">
          <div className="transform scale-[2] md:scale-[2.5]"> 
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
               
                  avatarBox: "w-[40px] h-[40px] border-2 border-[var(--sidebar-text)] rounded-full",
                }
              }}
            />
          </div>
        </div>

      

        {/* Verification Status */}
        <h2 className="text-sm md:text-base font-bold text-[var(--sidebar-text)] tracking-wide mt-1 md:mt-2 mb-1 uppercase">Verification Status</h2>
        {!verification || verification.status === 'not_verified' ? (
          <div className="flex items-center gap-2 py-2 px-3 border border-[var(--sidebar-border)] rounded-lg bg-[var(--sidebar-hover)]/20">
            <ShieldCheck className="h-5 w-5 md:h-6 md:w-6 text-[var(--sidebar-text)]" />
            <span className="text-sm md:text-base text-[var(--sidebar-text)]">Unverified Account</span>
            <Button variant="secondary" size="sm" onClick={() => router.push('/customer/verify')} className="ml-auto bg-[var(--sidebar-hover)] hover:bg-[var(--sidebar-hover)]/80 text-[var(--sidebar-text)] px-3 md:px-4 py-1 rounded-lg text-xs md:text-sm font-semibold shadow-none">Verify Now</Button>
          </div>
        ) : verification.status === 'approved' ? (
          <div className="flex items-center gap-2 py-2 px-3 border border-[var(--sidebar-border)] rounded-lg bg-[var(--sidebar-hover)]/20">
            <ShieldCheck className="h-5 w-5 md:h-6 md:w-6 text-[var(--sidebar-text)]" />
            <span className="text-sm md:text-base text-[var(--sidebar-text)] font-semibold">Verified Account</span>
          </div>
        ) : verification.status === 'rejected' ? (
          <div className="flex items-center gap-2 py-2 px-3 border border-[var(--sidebar-border)] rounded-lg bg-[var(--sidebar-hover)]/20">
            <XCircle className="h-5 w-5 md:h-6 md:w-6 text-[var(--sidebar-text)]" />
            <span className="text-sm md:text-base text-[var(--sidebar-text)]">Verification Failed</span>
            <Button variant="secondary" size="sm" onClick={() => router.push('/customer/verify')} className="ml-auto bg-[var(--sidebar-hover)] hover:bg-[var(--sidebar-hover)]/80 text-[var(--sidebar-text)] px-3 md:px-4 py-1 rounded-lg text-xs md:text-sm font-semibold shadow-none">Try Again</Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 py-2 px-3 border border-[var(--sidebar-border)] rounded-lg bg-[var(--sidebar-hover)]/20">
            <Clock className="h-5 w-5 md:h-6 md:w-6 text-[var(--sidebar-text)]" />
            <span className="text-sm md:text-base text-[var(--sidebar-text)]">Verification in Progress</span>
          </div>
        )}

  {/* Home Button */}
  <Button 
          variant="ghost" 
          className={`w-full flex items-center justify-between px-3 md:px-4 py-2 md:py-3 rounded-xl md:rounded-2xl ${currentPage === 'home' ? 'bg-[var(--sidebar-hover)]' : 'bg-transparent'} hover:bg-[var(--sidebar-hover)] text-[var(--sidebar-text)] border border-transparent shadow-[0_0_10px_rgba(0,0,0,0.2)] transition-all duration-150`}
          onClick={() => {
            setCurrentPage('home')
            setSidebarOpen(false)
          }}
        >
          <div className="flex items-center">
            <Home className="w-6 h-6 mr-3" style={{ color: '#45B7D1' }} />
            <span className="font-medium">Home</span>
          </div>
        </Button>
        {isVerified && (
          <>
            <h2 className="text-base md:text-lg font-semibold text-[var(--sidebar-text)] mt-6 md:mt-8">Services</h2>
            <div className="space-y-2 md:space-y-3 mt-2 md:mt-4">
              {SERVICE_CARDS.map((service, index) => (
                <Button 
                  key={index} 
                  variant="ghost" 
                  className={`w-full flex items-center justify-between px-3 md:px-4 py-2 md:py-3 rounded-xl md:rounded-2xl ${currentPage === service.path ? 'bg-[var(--sidebar-hover)]' : 'bg-transparent'} hover:bg-[var(--sidebar-hover)] text-[var(--sidebar-text)] border border-transparent shadow-[0_0_10px_rgba(0,0,0,0.2)] transition-all duration-150`} 
                  onClick={() => {
                    setSidebarOpen(false);
                    if (service.path === 'new-connection' || service.path === 'repairs' || service.path === 'request-response') {
                      setCurrentPage(service.path);
                    } else {
                      router.push(service.path);
                    }
                  }}
                >
                  <div className="flex items-center">
                    <span className="mr-2 md:mr-3">{service.icon}</span>
                    <span className="text-sm md:text-base font-medium">{service.title}</span>
                  </div>
                </Button>
              ))}
            </div>
            <h2 className="text-base md:text-lg font-semibold text-[var(--sidebar-text)] mt-6 md:mt-8">Payment</h2>
            <div className="space-y-2 mb-2 md:mb-4 mt-2 md:mt-4">
              <Button
                variant="ghost"
                className="w-full flex items-center justify-between px-3 md:px-4 py-2 md:py-3 rounded-xl md:rounded-2xl bg-transparent hover:bg-[var(--sidebar-hover)] text-[var(--sidebar-text)] border border-transparent shadow-[0_0_10px_rgba(0,0,0,0.2)] transition-all duration-150"
                onClick={() => {
                  setSidebarOpen(false)
                  setCurrentPage('pending-receipts')
                }}
              >
                <span className="text-sm md:text-base font-medium">Pending Receipts</span>
                {pendingReceipts > 0 && (
                  <span className="ml-2 bg-[var(--sidebar-hover)] text-[var(--sidebar-text)] rounded-full px-2 md:px-3 py-0.5 text-xs md:text-sm font-bold shadow">{pendingReceipts}</span>
                )}
              </Button>
            </div>
          </>
        )}    

        {/* Theme Toggle */}
        <div className="mt-auto flex justify-center pt-4 md:pt-6">
          <div className="flex bg-[var(--card-bg)] rounded-full p-1 w-40 md:w-48 justify-between">
            <button 
              className={`flex-1 py-2 rounded-full flex items-center justify-center gap-2 ${theme === 'light' ? 'bg-[var(--sidebar-hover)] text-[var(--sidebar-text)]' : 'text-[#7ca7be] hover:text-[var(--sidebar-text)]'}`}
              onClick={() => setTheme('light')}
            >
              <Sun className="w-4 h-4" />
              <span className="font-semibold text-sm md:text-base">Light</span>
            </button>
            <button 
              className={`flex-1 py-2 rounded-full flex items-center justify-center gap-2 ${theme === 'dark' ? 'bg-[var(--sidebar-hover)] text-[var(--sidebar-text)]' : 'text-[#7ca7be] hover:text-[var(--sidebar-text)]'}`}
              onClick={() => setTheme('dark')}
            >
              <Moon className="w-4 h-4" />
              <span className="font-semibold text-sm md:text-base">Dark</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 