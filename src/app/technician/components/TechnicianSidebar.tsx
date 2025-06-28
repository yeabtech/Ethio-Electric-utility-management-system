"use client";

import { UserButton } from "@clerk/nextjs";
import { Home, Wrench, FileText, Settings, LogOut, X, Menu } from "lucide-react";
import React from "react";

const menuItems = [
  { label: "Dashboard", icon: Home },
  { label: "My Tasks", icon: Wrench },
  { label: "Reports", icon: FileText },
  { label: "Settings", icon: Settings },
];

interface TechnicianSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  onMenuSelect: (label: string) => void;
  activeMenu: string;
}

const TechnicianSidebar: React.FC<TechnicianSidebarProps> = ({ sidebarOpen, setSidebarOpen, onMenuSelect, activeMenu }) => {
  // For now, just static technician info. Replace with real data if available.
  const technicianInfo = {
    name: "Technician Name",
    role: "Field Technician",
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`
          fixed top-0 left-0 h-screen w-64 border-r z-50 shadow-lg flex flex-col transform transition-transform duration-200 ease-in-out
          bg-gradient-to-r from-cyan-400 to-blue-400 rounded-xl
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
          md:sticky md:top-0 md:shadow-none md:block
          rounded-r-3xl md:rounded-none
        `}
      >
        {/* Close button (mobile only) */}
        <div className="flex items-center justify-between md:justify-center p-4 border-b border-white/10 md:border-none">
          <div className="flex items-center gap-3">
            <div className="md:w-16 md:h-16 w-12 h-12 flex items-center justify-center">
              <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: 'w-full h-full' } }} />
            </div>
            <div>
              <div className="font-semibold text-black">{technicianInfo.name}</div>
              <div className="text-xs text-black">{technicianInfo.role}</div>
            </div>
          </div>
          <button
            className="md:hidden p-2 rounded hover:bg-white/10"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="w-6 h-6 text-black" />
          </button>
        </div>
        {/* Menu */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-5 md:space-y-7">
            {menuItems.map(({ label, icon: Icon }) => (
              <li key={label} className="relative flex items-center">
                {/* Indicator circle for active menu */}
                {activeMenu === label && (
                  <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-gray-50 shadow-md border border-rose-400 z-10 transition-all duration-200" />
                )}
                <button
                  className={`flex items-center w-full gap-3 md:gap-4 px-3 py-2 md:px-4 md:py-3 rounded-lg text-black font-medium shadow-sm transition-all duration-150
                    text-base md:text-lg
                    hover:bg-white/20 active:scale-95
                    ${activeMenu === label ? 'bg-white/30' : ''}
                  `}
                  style={{ position: 'relative', zIndex: 1 }}
                  onClick={() => {
                    onMenuSelect(label);
                    setSidebarOpen(false);
                  }}
                >
                  <Icon className="w-5 h-5 text-black" />
                  <span className="text-base md:text-lg">{label}</span>
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