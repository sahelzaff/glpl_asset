'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import toast, { Toaster } from 'react-hot-toast'
import { useDropzone } from 'react-dropzone'
import { FaCloudUploadAlt, FaFileAlt, FaTimesCircle } from 'react-icons/fa'

// Function to fetch vendors for dropdown
const fetchVendors = async (token) => {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/vendors`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.data
}

export default function AddInvoice() {
  const { data: session } = useSession()
  const router = useRouter()
  const [selectedFile, setSelectedFile] = useState(null)
  const [formData, setFormData] = useState({
    recieved_name: '',
    invoice_number: '',
    upload_date: new Date().toISOString().split('T')[0],
    vendor_id: '',
    invoice_date: '',
    amount: '',
    purpose: ''
  })

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Fetch vendors for dropdown
  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => fetchVendors(session?.accessToken),
    enabled: !!session?.accessToken,
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!selectedFile) {
      toast.error('Please select a file to upload')
      return
    }
    
    try {
      if (selectedFile) {
        // Create FormData to send file
        const formDataWithFile = new FormData()
        formDataWithFile.append('file', selectedFile)
        formDataWithFile.append('invoice_number', formData.invoice_number)
        
        // First upload file through our backend
        const uploadResponse = await axios.post(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/invoices/upload`,
          formDataWithFile,
          {
            headers: { 
              Authorization: `Bearer ${session?.accessToken}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        )

        // Create invoice data with file path from response
        const invoiceData = {
          ...formData,
          file_path: uploadResponse.data.file_path
        }

        console.log('Invoice Data being sent:', invoiceData); // Debug log

        // Submit invoice data
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/invoices`,
          invoiceData,
          {
            headers: { 
              Authorization: `Bearer ${session?.accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        )

        toast.success('Invoice added successfully')
        router.push('/dashboard/invoices')
      } else {
        toast.error('Please select a file to upload')
      }
    } catch (error) {
      console.error('Upload error:', error.response?.data || error); // Enhanced error logging
      toast.error(error.response?.data?.message || 'Error adding invoice')
    }
  }

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles?.length) {
      setSelectedFile(acceptedFiles[0])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpg', '.jpeg', '.png'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: false,
  })

  const formatAmount = (value) => {
    if (!value) return '';
    return value.toString().replace(/\B(?=(?:(\d\d)+(\d)(?!\d))+(?!\d))/g, ',');
  }

  return (
    <div className="p-4 max-w-8xl mx-auto">
      <Toaster position="top-right" />
      <h1 className="text-2xl font-bold mb-4 font-outfit">Add New Invoice</h1>
      
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="mb-3">
            <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="recieved_name">
              Received Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="recieved_name"
              value={formData.recieved_name}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-1.5 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
              required
            />
          </div>

          <div className="mb-3">
            <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="invoice_number">
              Invoice Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="invoice_number"
              value={formData.invoice_number}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-1.5 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
              required
            />
          </div>

          <div className="mb-3">
            <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="vendor_id">
              Vendor <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                name="vendor_id"
                value={formData.vendor_id}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-1.5 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm pr-8"
                required
              >
                <option value="">Select Vendor</option>
                {vendors.map(vendor => (
                  <option key={vendor.vendor_id} value={vendor.vendor_id}>
                    {vendor.vendor_name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="amount">
              Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
              <input
                type="text"
                name="amount"
                value={formData.amount ? formatAmount(formData.amount) : ''}
                onChange={(e) => {
                  // Remove all non-numeric characters
                  const numericValue = e.target.value.replace(/[^0-9]/g, '');
                  setFormData(prev => ({
                    ...prev,
                    amount: numericValue
                  }));
                }}
                className="shadow appearance-none border rounded w-full py-1.5 pl-7 pr-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
                required
                placeholder="0"
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="invoice_date">
              Invoice Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="invoice_date"
              value={formData.invoice_date}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-1.5 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
              required
            />
          </div>

          <div className="mb-3">
            <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="upload_date">
              Upload Date
            </label>
            <input
              type="date"
              name="upload_date"
              value={formData.upload_date}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-1.5 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
              readOnly
            />
          </div>

          <div className="mb-3 col-span-2">
            <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="purpose">
              Purpose <span className="text-red-500">*</span>
            </label>
            <textarea
              name="purpose"
              value={formData.purpose}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-1.5 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
              required
              rows={3}
            />
          </div>

          <div className="mb-3 col-span-2">
            <label className="block text-gray-700 text-sm font-bold mb-1">
              Upload Invoice <span className="text-red-500">*</span>
            </label>
            <div 
              {...getRootProps()} 
              className={`
                border-2 border-dashed rounded-lg p-6 
                transition-colors duration-200 ease-in-out
                cursor-pointer
                ${!selectedFile && 'border-red-300'}
                ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}
                ${selectedFile ? 'bg-green-50 border-green-500' : ''}
              `}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center justify-center space-y-3">
                {selectedFile ? (
                  <>
                    <div className="flex items-center space-x-2">
                      <FaFileAlt className="text-green-500 text-xl" />
                      <span className="text-sm text-gray-600">{selectedFile.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedFile(null)
                      }}
                      className="text-red-500 hover:text-red-700 text-sm flex items-center space-x-1"
                    >
                      <FaTimesCircle />
                      <span>Remove file</span>
                    </button>
                  </>
                ) : (
                  <>
                    <FaCloudUploadAlt className={`text-4xl ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`} />
                    <div className="text-center">
                      <p className="text-gray-600 text-sm">
                        {isDragActive ? (
                          "Drop the file here"
                        ) : (
                          <>
                            Drag & drop your invoice here, or{" "}
                            <span className="text-blue-500">browse</span>
                          </>
                        )}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Supports: PDF, DOC, DOCX, JPG, PNG
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
            {!selectedFile && (
              <p className="text-red-500 text-xs mt-1">Please select a file</p>
            )}
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button
            type="button"
            onClick={() => router.push('/dashboard/invoices')}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-1.5 px-4 rounded mr-2 text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1.5 px-4 rounded text-sm"
          >
            Add Invoice
          </button>
        </div>
      </form>
    </div>
  )
} 