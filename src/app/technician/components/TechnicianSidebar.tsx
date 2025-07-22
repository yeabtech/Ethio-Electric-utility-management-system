"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { Home, Wrench, FileText, Bell, LogOut, X, Menu, CheckCircle2, XCircle } from "lucide-react";
import React from "react";

const menuItems = [
  { label: "Dashboard", icon: Home },
  { label: "Pending Tasks", icon: Wrench },
  { label: "Completed Tasks", icon: CheckCircle2 },
  { label: "Canceled Tasks", icon: XCircle },
  { label: "Reports", icon: FileText },
  { label: "notification", icon: Bell },
];

interface TechnicianSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  onMenuSelect: (label: string) => void;
  activeMenu: string;
}

const TechnicianSidebar: React.FC<TechnicianSidebarProps> = ({ sidebarOpen, setSidebarOpen, onMenuSelect, activeMenu }) => {
  const { user, isLoaded } = useUser();

  // Get technician info from Clerk user data
  const technicianInfo = {
    name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Technician' : 'Loading...',
    role: "Field Technician",
  };

  return (
    <>
      {/* Sticky toggle button for tablet and mobile */}
      <button
        className="fixed top-4 left-4 z-50 p-3 bg-[#1A4150] text-white rounded-lg shadow-lg hover:bg-[#285366] transition-colors duration-200 lg:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle sidebar"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Backdrop for mobile and tablet */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`
          fixed top-0 left-0 h-screen w-64 border-r z-50 shadow-lg flex flex-col transform transition-transform duration-200 ease-in-out
          bg-[#1A4150] rounded-br-[60px]
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
          lg:sticky lg:top-0 lg:shadow-none lg:block
        `}
      >
        {/* Close button (mobile and tablet only) */}
        <div className="flex items-center justify-between lg:justify-center p-4 border-b border-white/10 lg:border-none">
          <div className="flex items-center gap-3">
            <div className="lg:w-16 lg:h-16 w-12 h-12 flex items-center justify-center">
              <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: 'w-full h-full' } }} />
            </div>
            <div>
              <div className="font-bold text-white">{technicianInfo.name}</div>
              <div className="text-xs text-white/80 font-medium">{technicianInfo.role}</div>
            </div>
          </div>
          <button
            className="lg:hidden p-2 rounded hover:bg-white/10"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>
        {/* Menu */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map(({ label, icon: Icon }) => (
              <li key={label}>
                <button
                  className={`group flex items-center gap-3 px-4 py-3 w-full rounded-lg transition-all duration-150
                    text-white font-bold ${activeMenu === label ? 'font-extrabold border-l-4 border-[#4ECDC4] bg-[#285366]' : 'font-bold border-l-4 border-transparent'} hover:bg-[#285366] active:bg-[#285366]`}
                  onClick={() => {
                    onMenuSelect(label);
                    setSidebarOpen(false);
                  }}
                >
                  <Icon className="w-5 h-5 text-white" />
                  <span className="text-sm">{label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default TechnicianSidebar; 