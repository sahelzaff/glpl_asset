'use client'

import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { useState, useMemo } from 'react'
import axios from 'axios'
import Link from 'next/link'
import { FaSearch, FaDownload, FaChevronLeft, FaChevronRight, FaPlus } from 'react-icons/fa'

const fetchInvoices = async (token) => {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/invoices`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.data
}

export default function Invoices() {
  const { data: session } = useSession()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15

  const { data: invoices = [], isLoading, isError, error } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => fetchInvoices(session?.accessToken),
    enabled: !!session?.accessToken,
  })

  const filterFields = [
    { value: 'invoice_number', label: 'Invoice Number' },
    { value: 'vendor_name', label: 'Vendor Name' },
    { value: 'purpose', label: 'Purpose' }
  ]

  const handleDownload = async (filePath) => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/invoices/download/${encodeURIComponent(filePath)}`,
        {
          headers: { Authorization: `Bearer ${session?.accessToken}` },
          responseType: 'blob'
        }
      )
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filePath.split('/').pop())
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      toast.error('Error downloading file')
    }
  }

  const filteredInvoices = useMemo(() => {
    if (!invoices) return []
    return invoices.filter(invoice => {
      const matchesSearch = !filterType || !searchTerm || 
        (invoice[filterType] && invoice[filterType].toString().toLowerCase().includes(searchTerm.toLowerCase()))
      return matchesSearch
    })
  }, [invoices, searchTerm, filterType])

  const paginatedInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredInvoices.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredInvoices, currentPage])

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage)

  if (isLoading) return <div>Loading...</div>
  if (isError) return <div>Error fetching invoices: {error.message}</div>

  return (
    <div className="py-6 px-4 md:px-8 lg:px-0 max-w-[1400px] mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold font-outfit">Invoices</h1>
        <Link
          href="/dashboard/invoices/add"
          className="bg-[#C7092C] hover:bg-[#9A0724] text-white font-bold py-2 px-4 rounded flex items-center"
        >
          <FaPlus className="mr-2" />
          <span>Add New Invoice</span>
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
              <th className="w-[15%] p-2 border text-center">Invoice Number</th>
              <th className="w-[20%] p-2 border text-center">Vendor Name</th>
              <th className="w-[12%] p-2 border text-center">Invoice Date</th>
              <th className="w-[20%] p-2 border text-center">Purpose</th>
              <th className="w-[13%] p-2 border text-center">Amount</th>
              <th className="w-[10%] p-2 border text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 text-sm font-poppins">
            {paginatedInvoices.map((invoice, index) => (
              <tr key={invoice.invoice_id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                <td className="p-2 border text-center">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                <td className="p-2 border text-center">{invoice.invoice_number}</td>
                <td className="p-2 border text-center">{invoice.vendor_name}</td>
                <td className="p-2 border text-center">{new Date(invoice.invoice_date).toLocaleDateString()}</td>
                <td className="p-2 border text-center">{invoice.purpose}</td>
                <td className="p-2 border text-center">₹{Number(invoice.Amount).toLocaleString('en-IN')}</td>
                <td className="p-2 border text-center">
                  <button
                    onClick={() => handleDownload(invoice.file_path)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <FaDownload className="mx-auto" />
                  </button>
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