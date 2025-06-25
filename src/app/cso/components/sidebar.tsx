'use client'
import { UserButton } from '@clerk/nextjs';
import React, { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { 
  Search, Home, LayoutDashboard, Folder, CheckSquare, BarChart2, 
  Bell, Users, LifeBuoy, Settings, ChevronLeft, ChevronRight, Menu,
  UserCheck
} from 'lucide-react'

const menuItems = [
  { label: 'Dashboard', icon: LayoutDashboard, color: '#4ECDC4' },
  { label: 'Users', icon: Users, color: '#45B7D1' },
  { label: 'verfiy users', icon: UserCheck, color: '#96CEB4' },
  { label: 'services', icon: Folder, color: '#FFD93D' },
  { label: 'Tasks assign', icon: CheckSquare, color: '#6C5CE7' },
  { label: 'Reporting', icon: BarChart2, color: '#FF8B94' },
  { label: 'Notifications', icon: Bell, color: '#FF9F1C' },
  { label: 'Analytics', icon: BarChart2, color: '#2EC4B6' },
  { label: 'Reports', icon: BarChart2, color: '#E71D36' },
  { label: 'Support', icon: LifeBuoy, color: '#00B4D8' }
]

interface SidebarProps {
  onPageChange: (page: string) => void;
}

const Sidebar = ({ onPageChange }: SidebarProps) => {
  const [activeItem, setActiveItem] = useState<string>('Dashboard')
  const [isOpen, setIsOpen] = useState(true) // Default to open
  const [isMobile, setIsMobile] = useState(false)
  const [location, setLocation] = useState<{ subCity: string; woreda: string } | null>(null)
  const { user } = useUser()

  // Handle window resize
  useEffect(() => {
    const checkMobile = () => {
      const isMobileView = window.innerWidth < 768
      setIsMobile(isMobileView)
      // Always keep sidebar open on desktop
      if (!isMobileView) {
        setIsOpen(true)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Fetch employee location
  useEffect(() => {
    const fetchLocation = async () => {
      if (!user?.id) return

      try {
        const response = await fetch(`/api/employee-info?userId=${user.id}`)
        if (!response.ok) throw new Error('Failed to fetch location')
        const data = await response.json()
        setLocation(data)
      } catch (error) {
        console.error('Error fetching location:', error)
      }
    }

    fetchLocation()
  }, [user?.id])

  const toggleSidebar = () => {
    // Only allow toggling on mobile
    if (isMobile) {
      setIsOpen(!isOpen)
    }
  }

  const handleItemClick = (label: string) => {
    setActiveItem(label)
    onPageChange(label)
    if (isMobile) setIsOpen(false)
  }

  return (
    <>
      {/* Menu Button - Only show on mobile when sidebar is closed */}
      {isMobile && !isOpen && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-blue-600 text-white"
        >
          <Menu className="w-6 h-6" />
        </button>
      )}

      {/* Backdrop - Only show on mobile */}
      {isOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-screen bg-[#1A4150] border-r border-gray-200 flex flex-col z-40 transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        ${isMobile ? 'w-72' : 'w-72'}`}>
        
        {/* Header */}
        <div className="p-6 bg-[#357C8F] shadow-sm relative">
          {/* Only show toggle button on mobile */}
          {isMobile && (
            <button
              onClick={toggleSidebar}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-200 transition-colors"
            >
              {isOpen ? <ChevronLeft className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
            </button>
          )}
          
          <div className="flex justify-center items-center mb-8">
            <div className="transform scale-[2.5]"> 
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-[35px] h-[35px] border-2 border-white rounded-full",
                    userButtonPopoverCard: "bg-[#1A4150] border border-[#357C8F]",
                    userButtonPopoverActionButton: "text-white hover:bg-[#357C8F]",
                    userButtonPopoverFooter: "border-t border-[#357C8F]"
                  }
                }}
              />
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-2xl font-bold text-white">CSO</h1>
            {location && (
              <p className="text-sm text-white/80">
                {location.subCity}, Woreda {location.woreda}
              </p>
            )}
          </div>
        </div>
        
        {/* Menu */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {menuItems.map(({ label, icon: Icon }) => (
              <li key={label}>
                <button
                  onClick={() => handleItemClick(label)}
                  className={`group flex items-center gap-3 px-4 py-3 w-full rounded-lg transition-all duration-150
                    ${activeItem === label 
                      ? 'bg-[#357C8F] text-white font-semibold' 
                      : 'text-white/80 hover:bg-[#357C8F] hover:text-white'
                    }`}
                >
                  <Icon className={`w-5 h-5 transition-colors ${activeItem === label ? 'text-white' : 'text-white/80'}`} />
                  <span className="text-sm">{label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  )
}

export default Sidebar
