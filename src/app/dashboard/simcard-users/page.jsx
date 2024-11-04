'use client'

import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { useState, useMemo, useEffect } from 'react'
import axios from 'axios'
import Link from 'next/link'
import { FaSearch, FaEye, FaChevronLeft, FaChevronRight, FaPlus } from 'react-icons/fa'
import toast, { Toaster } from 'react-hot-toast'

const fetchSimcardUsers = async (token) => {
  try {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/simcard-users`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      params: {
        per_page: 1000
      }
    })
    return response.data
  } catch (error) {
    toast.error('Failed to fetch SIM card users')
    throw error
  }
}

export default function SimcardUsers() {
  const { data: session } = useSession()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 25
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState('')

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])
  
  const { data: apiData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['simcardUsers'],
    queryFn: () => fetchSimcardUsers(session?.accessToken),
    enabled: !!session?.accessToken,
    onError: (error) => {
      toast.error(`Error: ${error.message}`)
    }
  })

  const filterFields = [
    { value: 'Current_User_Name', label: 'Name' },
    { value: 'Cell_no', label: 'Phone Number' },
    { value: 'SIM_No', label: 'SIM Number' },
    { value: 'Department', label: 'Department' },
    { value: 'Location', label: 'Location' },
  ]

  const filteredUsers = useMemo(() => {
    if (!apiData?.users) return []
    return apiData.users.filter(user => {
      const matchesSearch = !filterType || !searchTerm || 
        (user[filterType] && user[filterType].toString().toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesStatus = !statusFilter || 
        (statusFilter === 'ISD Active' && user.isd === 'Active') ||
        (statusFilter === 'ISD In active' && (user.isd === 'In active' || !user.isd)) ||
        user.Vi_Status === statusFilter;
      
      return matchesSearch && matchesStatus
    })
  }, [apiData?.users, searchTerm, filterType, statusFilter])

  const sortedAndFilteredUsers = useMemo(() => {
    let result = [...filteredUsers]
    
    // Apply sorting
    if (sortBy) {
      result.sort((a, b) => {
        switch (sortBy) {
          case 'name_asc':
            return (a.Current_User_Name || '').localeCompare(b.Current_User_Name || '')
          case 'name_desc':
            return (b.Current_User_Name || '').localeCompare(a.Current_User_Name || '')
          case 'department_asc':
            return (a.Department || '').localeCompare(b.Department || '')
          case 'department_desc':
            return (b.Department || '').localeCompare(a.Department || '')
          case 'cost_asc':
            return (Number(a.Cost) || 0) - (Number(b.Cost) || 0)
          case 'cost_desc':
            return (Number(b.Cost) || 0) - (Number(a.Cost) || 0)
          default:
            return 0
        }
      })
    }
    
    return result
  }, [filteredUsers, sortBy])

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return sortedAndFilteredUsers.slice(startIndex, startIndex + itemsPerPage)
  }, [sortedAndFilteredUsers, currentPage, itemsPerPage])

  const totalPages = Math.ceil(sortedAndFilteredUsers.length / itemsPerPage)

  const handleRefresh = async () => {
    toast.promise(
      refetch(),
      {
        loading: 'Refreshing...',
        success: 'Data refreshed successfully',
        error: 'Failed to refresh data'
      }
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-glpl-red"></div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-red-500 text-xl mb-4">Error fetching simcard users: {error.message}</div>
        <button 
          onClick={handleRefresh}
          className="bg-glpl-red text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="py-6 px-4 md:px-8 lg:px-0 max-w-[1400px] mx-auto">
      <Toaster position="top-right" />
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold font-outfit">SIM Card</h1>
        <div className="flex gap-4">
          <button
            onClick={handleRefresh}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            Refresh
          </button>
          <Link
            href="/dashboard/simcard-users/add"
            className="bg-[#C7092C] hover:bg-[#9A0724] text-white font-bold py-2 px-4 rounded flex items-center"
          >
            <FaPlus className="inline-block mr-2" />
            Add New SIM Card
          </Link>
        </div>
      </div>
      <div className="mb-4 flex items-center space-x-4">
        <select
          className="p-2 border rounded"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">Filter</option>
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
          className="p-2 border rounded bg-white min-w-[150px]"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="In Stock">In Stock</option>
          <option value="Suspended">Suspended</option>
          <option disabled>──────────</option>
          <option value="ISD Active">ISD Active</option>
          <option value="ISD In active">ISD In active</option>
        </select>
        <select
          className="p-2 border rounded bg-white min-w-[150px]"
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="">Sort By</option>
          <option value="name_asc">Name (A-Z)</option>
          <option value="name_desc">Name (Z-A)</option>
          <option value="department_asc">Department (A-Z)</option>
          <option value="department_desc">Department (Z-A)</option>
          <option value="cost_asc">Cost (Low-High)</option>
          <option value="cost_desc">Cost (High-Low)</option>
        </select>
      </div>
      <div className="overflow-x-auto rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-[5%] p-2 border text-center">Sr No</th>
              <th className="w-[15%] p-2 border text-center">Phone Number</th>
              <th className="w-[20%] p-2 border text-center">User Name</th>
              <th className="w-[15%] p-2 border text-center">Location</th>
              <th className="w-[15%] p-2 border text-center">Department</th>
              <th className="w-[10%] p-2 border text-center">Status</th>
              <th className="w-[10%] p-2 border text-center">ISD Status</th>
              <th className="w-[5%] p-2 border text-center">Action</th>
            </tr>
          </thead>
          <tbody className="text-[13px] font-poppins bg-white divide-y divide-gray-200">
            {paginatedUsers.length > 0 ? (
              paginatedUsers.map((user, index) => (
                <tr key={user.Sr_no} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="p-2 border text-center font-poppins">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </td>
                  <td className="p-2 border text-center font-poppins">+91 {user.Cell_no}</td>
                  <td className="p-2 border text-center font-poppins">{user.Current_User_Name}</td>
                  <td className="p-2 border text-center font-poppins">{user.Location || 'N/A'}</td>
                  <td className="p-2 border text-center font-poppins">{user.Department}</td>
                  <td className="p-2 border text-center font-poppins">
                    <span className={`px-4 py-1 rounded-lg text-white ${
                      user.Vi_Status === 'Active' ? 'bg-green-500' :
                      user.Vi_Status === 'Suspended' ? 'bg-red-500' :
                      user.Vi_Status === 'In Stock' ? 'bg-blue-500' :
                      'bg-yellow-500'
                    }`}>
                      {user.Vi_Status || 'N/A'}
                    </span>
                  </td>
                  <td className="p-2 border text-center font-poppins">
                    <span className={`px-4 py-1 rounded-lg ${
                      user.isd === 'Active' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
                    }`}>
                      {user.isd || 'In active'}
                    </span>
                  </td>
                  <td className="p-2 border text-center">
                    <Link href={`/dashboard/simcard-users/${user.Sr_no}`}>
                      <FaEye className="mx-auto text-blue-500 hover:text-blue-700 cursor-pointer" />
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="p-2 text-center border">No SIM card users found.</td>
              </tr>
            )}
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