'use client'

import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { useState, useMemo, useEffect } from 'react'
import axios from 'axios'
import { FaSearch, FaChevronLeft, FaChevronRight } from 'react-icons/fa'

const fetchLogs = async (token) => {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/logs`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.data
}

export default function Logs() {
  const { data: session } = useSession()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('')
  const [moduleFilter, setModuleFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const { data: logs = [], isLoading, isError } = useQuery({
    queryKey: ['logs'],
    queryFn: () => fetchLogs(session?.accessToken),
    enabled: !!session?.accessToken,
  })

  const filterFields = [
    { value: 'action_by', label: 'User' },
    { value: 'record_id', label: 'Record ID' },
    { value: 'additional_info', label: 'Description' }
  ]

  const moduleOptions = ['ASSET', 'USER', 'VENDOR', 'INVOICE']
  const actionOptions = ['CREATE', 'UPDATE', 'DELETE']

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = !filterType || !searchTerm || 
        (log[filterType] && log[filterType].toString().toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesModule = !moduleFilter || log.module === moduleFilter
      const matchesAction = !actionFilter || log.action_type === actionFilter
      return matchesSearch && matchesModule && matchesAction
    })
  }, [logs, searchTerm, filterType, moduleFilter, actionFilter])

  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredLogs, currentPage])

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage)

  const getActionColor = (action) => {
    switch(action) {
      case 'CREATE': return 'text-green-600'
      case 'UPDATE': return 'text-blue-600'
      case 'DELETE': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  if (isLoading) return <div>Loading...</div>
  if (isError) return <div>Error fetching logs</div>

  return (
    <div className="py-6 max-w-[1400px] mx-auto">
      <h1 className="text-2xl font-bold mb-4 font-outfit">Activity Logs</h1>
      
      <div className="mb-4 flex items-center space-x-4">
        <select
          className="p-2 border rounded"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">Filter By</option>
          {filterFields.map(field => (
            <option key={field.value} value={field.value}>{field.label}</option>
          ))}
        </select>

        <div className="relative flex-grow">
          <input
            type="text"
            placeholder={filterType ? `Search by ${filterFields.find(f => f.value === filterType)?.label}...` : "Select a filter..."}
            className="w-full p-2 pl-8 pr-4 border rounded"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={!filterType}
          />
          <FaSearch className="absolute left-2 top-3 text-gray-400" />
        </div>

        <select
          className="p-2 border rounded"
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
        >
          <option value="">All Modules</option>
          {moduleOptions.map(module => (
            <option key={module} value={module}>{module}</option>
          ))}
        </select>

        <select
          className="p-2 border rounded"
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
        >
          <option value="">All Actions</option>
          {actionOptions.map(action => (
            <option key={action} value={action}>{action}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr className="text-sm font-poppins">
              <th className="p-2 border text-center">Time</th>
              <th className="p-2 border text-center">User</th>
              <th className="p-2 border text-center">Module</th>
              <th className="p-2 border text-center">Action</th>
              <th className="p-2 border text-center">Record ID</th>
              <th className="p-2 border text-center">Description</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 text-sm font-poppins">
            {paginatedLogs.map((log) => (
              <tr key={log.log_id}>
                <td className="p-2 border text-center whitespace-nowrap">
                  {new Date(log.action_timestamp).toLocaleString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  })}
                </td>
                <td className="p-2 border text-center">{log.action_by}</td>
                <td className="p-2 border text-center">{log.module}</td>
                <td className={`p-2 border text-center font-semibold ${getActionColor(log.action_type)}`}>
                  {log.action_type}
                </td>
                <td className="p-2 border text-center">{log.record_id}</td>
                <td className="p-2 border text-left">{log.additional_info}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex justify-between items-center">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
          >
            <FaChevronLeft />
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
          >
            <FaChevronRight />
          </button>
        </div>
      )}
    </div>
  )
} 