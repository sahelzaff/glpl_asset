'use client'

import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'
import { useState, useMemo } from 'react'
import axios from 'axios'
import Link from 'next/link'
import { FaSearch, FaEdit, FaChevronLeft, FaChevronRight } from 'react-icons/fa'

const fetchAssetsByCategory = async (token, category) => {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/assets/${category.replace(/\s+/g, '')}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.data
}

const getStatusDot = (status) => {
  const statusMap = {
    'Active': 'bg-green-500',
    'In Stock': 'bg-yellow-500',
    'Repairing': 'bg-blue-500',
    'Not Functional': 'bg-red-500'
  }
  return (
    <span className="flex items-center">
      <span className={`w-2 h-2 rounded-full mr-2 ${statusMap[status] || 'bg-gray-500'}`}></span>
      {status || 'Unknown'}
    </span>
  )
}

const getCategoryFields = (category) => {
  switch (category.toLowerCase()) {
    case 'desktop':
      return ['HostName', 'Brand', 'Model', 'SerialNo', 'Location', 'Status', 'CurrentUser']
    case 'laptop':
      return ['HostName', 'Brand', 'Model', 'SerialNo', 'Location', 'Status', 'CurrentUser']
    case 'camera':
      return ['Brand', 'Model', 'SerialNo', 'Location', 'Status', 'IpAddress', 'CurrentUser']
    default:
      return ['Brand', 'Model', 'SerialNo', 'Location', 'Status', 'CurrentUser']
  }
}

export default function CategoryAssets() {
  const { data: session } = useSession()
  const params = useParams()
  const category = params.category

  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15

  const { data: assets, isLoading, isError, error } = useQuery({
    queryKey: ['assets', category],
    queryFn: () => fetchAssetsByCategory(session?.accessToken, category),
    enabled: !!session?.accessToken && !!category,
  })

  const categoryFields = getCategoryFields(category)

  const filteredAssets = useMemo(() => {
    if (!assets) return []
    return assets.filter(asset => {
      const matchesSearch = !filterType || !searchTerm || 
        (asset[filterType] && asset[filterType].toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesStatus = !statusFilter || asset.Status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [assets, searchTerm, filterType, statusFilter])

  const paginatedAssets = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredAssets.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredAssets, currentPage])

  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage)

  if (isLoading) return <div>Loading...</div>
  if (isError) return <div>Error fetching assets: {error.message}</div>

  return (
    <div className="py-6 px-4 md:px-8 lg:px-0 max-w-[1400px] mx-auto">
      <h1 className="text-2xl font-bold mb-4 font-outfit">{decodeURIComponent(category)} Assets</h1>
      <div className="mb-4 flex items-center space-x-4">
        <select
          className="p-2 border rounded"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">Filter</option>
          {categoryFields.map(field => (
            <option key={field} value={field}>{field}</option>
          ))}
        </select>
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder={filterType ? `Search by ${filterType}...` : "Select a filter..."}
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
          <option value="In Stock">In Stock</option>
          <option value="Repairing">Repairing</option>
          <option value="Not Functional">Not Functional</option>
        </select>
      </div>
      <div className="overflow-x-auto rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-[5%] p-2 border text-center">Sr No</th>
              {categoryFields.map(field => (
                <th key={field} className={`p-2 border text-center ${
                  field === 'SerialNo' ? 'w-[15%]' :
                  field === 'Status' ? 'w-[10%]' :
                  field === 'CurrentUser' ? 'w-[12%]' :
                  'w-[11%]'
                }`}>
                  {field}
                </th>
              ))}
              <th className="w-[5%] p-2 border text-center">Action</th>
            </tr>
          </thead>
          <tbody className="text-[13px] font-poppins bg-white divide-y divide-gray-200">
            {paginatedAssets.length > 0 ? (
              paginatedAssets.map((asset, index) => (
                <tr key={asset.AssetsId} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="p-2 border text-center">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                  {categoryFields.map(field => (
                    <td key={field} className="p-2 border text-center mx-auto">
                      {field === 'Status' ? getStatusDot(asset[field]) : 
                       field === 'CurrentUser' ? (asset.CurrentUser || 'Unassigned') :
                       (asset[field] || 'N/A')}
                    </td>
                  ))}
                  <td className="p-2 border text-center">
                    <Link href={`/dashboard/assets/${category.replace(/\s+/g, '')}/${asset.AssetsId}`}>
                      <FaEdit className="mx-auto text-blue-500 hover:text-blue-700 cursor-pointer" />
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={categoryFields.length + 2} className="p-2 text-center border">No assets found for this category.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
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
    </div>
  )
}
