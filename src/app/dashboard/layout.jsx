'use client'

import { useState } from 'react'
import Sidebar from '@/app/components/Sidebar'

export default function DashboardLayout({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(true)

  return (
    <div className="flex h-screen">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main className={`flex-grow p-8 transition-all duration-300 ${
        isCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        {children}
      </main>
    </div>
  )
}
