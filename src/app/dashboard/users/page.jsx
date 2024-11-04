'use client'

import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { useState, useMemo, useEffect } from 'react'
import axios from 'axios'
import Link from 'next/link'
import { FaSearch, FaEye, FaChevronLeft, FaChevronRight, FaPlus } from 'react-icons/fa'

const fetchUsers = async (token) => {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.data
}

export default function Users() {
  const { data: session } = useSession()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])
  
  const { data: users, isLoading, isError, error } = useQuery({
    queryKey: ['users'],
    queryFn: () => fetchUsers(session?.accessToken),
    enabled: !!session?.accessToken,
  })

  const filterFields = [
    { value: 'UserName', label: 'Username' },
    { value: 'Department', label: 'Department' },
    { value: 'Location', label: 'Location' },
  ]

  const filteredUsers = useMemo(() => {
    if (!users) return []
    return users.filter(user => {
      const matchesSearch = !filterType || !searchTerm || 
        (user[filterType] && user[filterType].toLowerCase().includes(searchTerm.toLowerCase()))
      return matchesSearch
    })
  }, [users, searchTerm, filterType])

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredUsers, currentPage])

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)

  if (isLoading) return <div>Loading...</div>
  if (isError) return <div>Error fetching users: {error.message}</div>

  return (
    <div className="py-6 px-4 md:px-8 lg:px-0 max-w-[1400px] mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold font-outfit">Users</h1>
        <Link
          href="/dashboard/users/add"
          className="bg-[#C7092C] hover:bg-[#9A0724] text-white font-bold py-2 px-4 rounded flex items-center"
        >
          <FaPlus className="inline-block mr-2" />
          Add New User
        </Link>
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
      </div>
      <div className="overflow-x-auto rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-[5%] p-2 border text-center">Sr No</th>
              <th className="w-[15%] p-2 border text-center">Username</th>
              <th className="w-[15%] p-2 border text-center">Department</th>
              <th className="w-[12%] p-2 border text-center">Location</th>
              <th className="w-[15%] p-2 border text-center">Assigned Asset</th>
              <th className="w-[10%] p-2 border text-center">Status</th>
              <th className="w-[5%] p-2 border text-center">Action</th>
            </tr>
          </thead>
          <tbody className="text-[13px] font-poppins bg-white divide-y divide-gray-200">
            {paginatedUsers.length > 0 ? (
              paginatedUsers.map((user, index) => (
                <tr key={user.UserId} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="p-2 border text-center font-poppins">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                  <td className="p-2 border text-center font-poppins">{user.UserName}</td>
                  <td className="p-2 border text-center font-poppins">{user.Department}</td>
                  <td className="p-2 border text-center font-poppins">{user.Location}</td>
                  <td className="p-2 border text-center font-poppins">{user.AssetHostName || 'None'}</td>
                  <td className="p-2 border text-center font-poppins">
                    <span className={`px-4 py-1 rounded-lg text-white ${
                      user.Status === 'Active User' ? 'bg-green-500' :
                      user.Status === 'Resigned' ? 'bg-red-500' :
                      'bg-yellow-500'
                    }`}>
                      {user.Status || 'N/A'}
                    </span>
                  </td>
                  <td className="p-2 border text-center">
                    <Link href={`/dashboard/users/${user.UserId}`}>
                      <FaEye className="mx-auto text-blue-500 hover:text-blue-700 cursor-pointer" />
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="p-2 text-center border">No users found.</td>
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
