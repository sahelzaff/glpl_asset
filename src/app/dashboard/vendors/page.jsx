'use client'

import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { useState, useMemo, useEffect } from 'react'
import axios from 'axios'
import Link from 'next/link'
import { FaSearch, FaEdit, FaEye, FaChevronLeft, FaChevronRight, FaPlus } from 'react-icons/fa'

const fetchVendors = async (token) => {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/vendors`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.data
}

// Helper function to convert bit to status string
const getStatusString = (status) => {
  if (status === true || status === 1) return 'Active'
  if (status === false || status === 0) return 'Inactive'
  return 'Blacklisted'
}

// Helper function to get status color
const getStatusColor = (status) => {
  switch(getStatusString(status)) {
    case 'Active':
      return 'bg-green-500'
    case 'Inactive':
      return 'bg-red-500'
    case 'Blacklisted':
      return 'bg-yellow-500'
    default:
      return 'bg-gray-500'
  }
}

export default function Vendors() {
  const { data: session } = useSession()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15


  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const { data: vendors = [], isLoading, isError, error } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => fetchVendors(session?.accessToken),
    enabled: !!session?.accessToken,
  })

  const filterFields = [
    { value: 'vendor_name', label: 'Vendor Name' },
    { value: 'category', label: 'Category' },
    { value: 'location', label: 'Location' },
    { value: 'contact_person', label: 'Contact Person' },
  ]

  const filteredVendors = useMemo(() => {
    if (!vendors) return []
    return vendors.filter(vendor => {
      const matchesSearch = !filterType || !searchTerm || 
        (vendor[filterType] && vendor[filterType].toString().toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesStatus = !statusFilter || getStatusString(vendor.active_status) === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [vendors, searchTerm, filterType, statusFilter])

  const paginatedVendors = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredVendors.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredVendors, currentPage])

  const totalPages = Math.ceil(filteredVendors.length / itemsPerPage)

  if (isLoading) return <div>Loading...</div>
  if (isError) return <div>Error fetching vendors: {error.message}</div>

  return (
    <div className="py-4  max-w-[1400px] mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold font-outfit">Vendors</h1>
        <Link
          href="/dashboard/vendors/add"
          className="bg-[#C7092C] hover:bg-[#9A0724] text-white font-bold py-2 px-4 rounded flex items-center"
        >
          <FaPlus className="inline-block mr-2" />
          Add New Vendor
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
        <select
          className="p-2 border rounded"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Blacklisted">Blacklisted</option>
        </select>
      </div>
      <div className="overflow-x-auto rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-[5%] p-2 border text-center">Sr No</th>
              <th className="w-[15%] p-2 border text-center">Vendor Name</th>
              <th className="w-[12%] p-2 border text-center">Category</th>
              <th className="w-[10%] p-2 border text-center">Location</th>
              <th className="w-[15%] p-2 border text-center">Contact Person</th>
              <th className="w-[12%] p-2 border text-center">Contact Phone</th>
              <th className="w-[10%] p-2 border text-center">Status</th>
              <th className="w-[5%] p-2 border text-center">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 font-poppins text-[13px]">
            {paginatedVendors.map((vendor, index) => (
              <tr key={vendor.vendorid} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                <td className="p-2 border text-center">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                <td className="p-2 border text-center">{vendor.vendor_name}</td>
                <td className="p-2 border text-center">{vendor.category}</td>
                <td className="p-2 border text-center">{vendor.location}</td>
                <td className="p-2 border text-center">{vendor.contact_person}</td>
                <td className="p-2 border text-center">+91 {vendor.contact_phone}</td>
                <td className="p-2 border text-center">
                  <span className={`px-4 py-1 rounded-lg  text-white ${getStatusColor(vendor.active_status)}`}>
                    {getStatusString(vendor.active_status)}
                  </span>
                </td>
                <td className="p-2 border text-center flex justify-center space-x-2">
                  <Link href={`/dashboard/vendors/view/${vendor.vendor_id}`}>
                    <FaEye className="text-blue-500 hover:text-blue-700 cursor-pointer" />
                  </Link>
                 
                </td>
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