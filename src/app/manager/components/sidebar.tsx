'use client'
import { UserButton } from '@clerk/nextjs';
import React, { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { 
  LayoutDashboard, Users, Settings, ChevronLeft, ChevronRight, Menu,
  BarChart2, Bell, LifeBuoy, FileText, Building2, UserCog, UserPlus, Newspaper
} from 'lucide-react'

const menuItems = [
  { label: 'Dashboard', icon: LayoutDashboard, color: '#4ECDC4' },
  { label: 'Employees', icon: Users, color: '#45B7D1' },
  { label: 'Register Employee', icon: UserPlus, color: '#FF6B6B' },
  { label: 'CSO Management', icon: UserCog, color: '#96CEB4' },
  { label: 'Service Management', icon: FileText, color: '#FFD93D' },
  { label: 'Office Management', icon: Building2, color: '#6C5CE7' },
  { label: 'News', icon: Newspaper, color: '#FF8B94' },
  { label: 'Analytics', icon: BarChart2, color: '#FF8B94' },
  { label: 'Notifications', icon: Bell, color: '#FF9F1C' },
  { label: 'Support', icon: LifeBuoy, color: '#00B4D8' },
  { label: 'Settings', icon: Settings, color: '#7209B7' }
]

interface SidebarProps {
  onPageChange: (page: string) => void;
}

const Sidebar = ({ onPageChange }: SidebarProps) => {
  const [activeItem, setActiveItem] = useState<string>('Dashboard')
  const [isOpen, setIsOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const { user } = useUser()

  // Handle window resize
  useEffect(() => {
    const checkMobile = () => {
      const isMobileView = window.innerWidth < 768
      setIsMobile(isMobileView)
      if (!isMobileView) {
        setIsOpen(true)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const toggleSidebar = () => {
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
        ${isMobile ? 'w-72' : 'w-72'} rounded-r-[60px]`}>
        
        {/* Header */}
        <div className="p-6 bg-[#1A4150] shadow-sm relative">
          {/* Only show toggle button on mobile */}
          {isMobile && (
            <button
              onClick={toggleSidebar}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-200 transition-colors"
            >
              {isOpen ? <ChevronLeft className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
            </button>
          )}
          
          <div className="flex justify-center items-center mb-8 mt-6">
            <div className="transform scale-[2.5]"> 
              <UserButton 
                afterSignOutUrl="/"
              />
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-2xl font-bold text-white">Manager</h1>
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
                    text-white ${activeItem === label ? 'font-semibold border-l-4 border-[#4ECDC4] bg-[#285366]' : 'font-normal border-l-4 border-transparent'} hover:bg-[#285366] active:bg-[#285366]`}
                >
                  <Icon className={`w-5 h-5 text-white`} />
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
