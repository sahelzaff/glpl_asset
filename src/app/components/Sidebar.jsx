'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FaChevronLeft, FaChevronRight, FaTachometerAlt, FaUsers, FaBoxes, FaFileInvoice, FaHistory, FaEnvelope, FaUserTie, FaDatabase, FaSimCard } from 'react-icons/fa'

export default function Sidebar({ isCollapsed, setIsCollapsed }) {
  const pathname = usePathname()
  const [activeDropdown, setActiveDropdown] = useState(null)

  const menuItems = [
    {
      title: 'Dashboard',
      icon: <FaTachometerAlt />,
      path: '/dashboard',
    },
    {
      title: 'Users',
      icon: <FaUsers />,
      path: '/dashboard/users',
    },
    {
      title: 'SIM Cards',
      icon: <FaSimCard />,
      path: '/dashboard/simcard-users',
    },
    {
      title: 'Assets',
      icon: <FaBoxes />,
      path: '/dashboard/assets',
    },
    {
      title: 'Vendors',
      icon: <FaUserTie />,
      path: '/dashboard/vendors',
    },
    {
      title: 'Invoices',
      icon: <FaFileInvoice />,
      path: '/dashboard/invoices',
    },
    {
      title: 'Emails',
      icon: <FaEnvelope />,
      path: '/dashboard/emails',
    },
    {
      title: 'Logs',
      icon: <FaHistory />,
      path: '/dashboard/logs',
    },
    {
      title: 'Backup',
      icon: <FaDatabase />,
      path: '/dashboard/backup',
    },
  ]

  const isActive = (path) => {
    return pathname === path
  }

  return (
    <div
      className={`bg-gray-800 text-white h-screen fixed top-16 left-0 transition-all duration-300 z-40 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute right-0 top-4 transform translate-x-1/2 bg-gray-800 text-white p-2 rounded-full"
      >
        {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
      </button>

      <nav className="mt-8">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`flex items-center py-3 px-4 text-sm ${
              isActive(item.path)
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            {!isCollapsed && <span className="ml-4">{item.title}</span>}
          </Link>
        ))}
      </nav>
    </div>
  )
}
