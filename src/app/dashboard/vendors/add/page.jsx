'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast, { Toaster } from 'react-hot-toast'

const categoryOptions = [
  'IT Hardware',
  'Software', 
  'Network Equipment',
  'Office Supplies',
  'Security Equipment',
  'Services',
  'Visiting Cards',
  'Others'
]

const indianStates = [
  'Mumbai',
  'Nagpur',
  'Chennai',
  'Pune',
  'Delhi',
  'Gandhidham',
  'Jaipur',
  'Ahmedabad',
  'Kolkata',
  'Chittagong',
  'Hyderabad',
  'Vizag',
  'Tuticorin'
]

const statusOptions = ['Active', 'Inactive', 'Blacklisted']
const ratingOptions = ['1', '2', '3', '4', '5']

export default function AddVendor() {
  const { data: session } = useSession()
  const router = useRouter()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const [formData, setFormData] = useState({
    vendor_name: '',
    category: '',
    location: '',
    address: '',
    gstin: '',
    contact_person: '',
    contact_phone: '',
    contact_email: '',
    website: '',
    registration_number: '',
    bank_name: '',
    bank_account_number: '',
    ifsc_code: '',
    payment_terms: '',
    credit_limit: '',
    pan_number: '',
    rating: '3',
    active_status: 'Active',
    notes: ''
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/vendors`,
        formData,
        {
          headers: { 
            Authorization: `Bearer ${session?.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      toast.success('Vendor added successfully')
      router.push('/dashboard/vendors')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error adding vendor')
    }
  }

  const renderField = (name, label, type = 'text') => {
    const baseClass = "shadow appearance-none border rounded w-full py-1.5 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
    
    const mandatoryFields = [
      'vendor_name',
      'category',
      'location',
      'address',
      'gstin',
      'contact_person',
      'contact_phone',
      'contact_email',
      'bank_name',
      'bank_account_number',
      'ifsc_code',
      'active_status'
    ]

    const isRequired = mandatoryFields.includes(name)
    
    if (name === 'location') {
      return (
        <div className="mb-3">
          <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor={name}>
            {label} {isRequired && <span className="text-red-500">*</span>}
          </label>
          <div className="relative">
            <select
              name={name}
              value={formData[name]}
              onChange={handleInputChange}
              className={`${baseClass} pr-8`}
              required={isRequired}
            >
              <option value="">Select State</option>
              {indianStates.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
              </svg>
            </div>
          </div>
        </div>
      )
    }

    if (name === 'category') {
      return (
        <div className="mb-3">
          <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor={name}>
            {label} {isRequired && <span className="text-red-500">*</span>}
          </label>
          <div className="relative">
            <select
              name={name}
              value={formData[name]}
              onChange={handleInputChange}
              className={`${baseClass} pr-8`}
              required={isRequired}
            >
              <option value="">Select Category</option>
              {categoryOptions.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
              </svg>
            </div>
          </div>
        </div>
      )
    }

    if (name === 'active_status') {
      return (
        <div className="mb-3">
          <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor={name}>
            {label} {isRequired && <span className="text-red-500">*</span>}
          </label>
          <div className="relative">
            <select
              name={name}
              value={formData[name]}
              onChange={handleInputChange}
              className={`${baseClass} pr-8`}
              required={isRequired}
            >
              {statusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
              </svg>
            </div>
          </div>
        </div>
      )
    }

    if (name === 'rating') {
      return (
        <div className="mb-3">
          <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor={name}>
            {label}
          </label>
          <div className="relative">
            <select
              name={name}
              value={formData[name]}
              onChange={handleInputChange}
              className={`${baseClass} pr-8`}
            >
              {ratingOptions.map(rating => (
                <option key={rating} value={rating}>{rating}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
              </svg>
            </div>
          </div>
        </div>
      )
    }

    if (name === 'notes') {
      return (
        <div className="mb-3">
          <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor={name}>
            {label}
          </label>
          <textarea
            name={name}
            value={formData[name]}
            onChange={handleInputChange}
            className={baseClass}
            rows="3"
          />
        </div>
      )
    }

    return (
      <div className="mb-3">
        <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor={name}>
          {label} {isRequired && <span className="text-red-500">*</span>}
        </label>
        <input
          type={type}
          name={name}
          value={formData[name]}
          onChange={handleInputChange}
          className={baseClass}
          required={isRequired}
        />
      </div>
    )
  }

  return (
    <div className="p-4 w-full max-w-[1400px] mx-auto">
      <Toaster position="top-right" />
      <h1 className="text-2xl font-bold mb-4 font-outfit">Add New Vendor</h1>
      
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {renderField('vendor_name', 'Vendor Name')}
          {renderField('category', 'Category')}
          {renderField('location', 'Location')}
          {renderField('address', 'Address')}
          {renderField('gstin', 'GSTIN')}
          {renderField('contact_person', 'Contact Person')}
          {renderField('contact_phone', 'Contact Phone')}
          {renderField('contact_email', 'Contact Email', 'email')}
          {renderField('website', 'Website', 'url')}
          {renderField('registration_number', 'Registration Number')}
          {renderField('bank_name', 'Bank Name')}
          {renderField('bank_account_number', 'Bank Account Number')}
          {renderField('ifsc_code', 'IFSC Code')}
          {renderField('payment_terms', 'Payment Terms')}
          {renderField('credit_limit', 'Credit Limit', 'number')}
          {renderField('pan_number', 'PAN Number')}
          {renderField('rating', 'Rating')}
          {renderField('active_status', 'Status')}
          <div className="lg:col-span-3">
            {renderField('notes', 'Notes')}
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            type="button"
            onClick={() => router.push('/dashboard/vendors')}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-1.5 px-4 rounded mr-2 text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1.5 px-4 rounded text-sm"
          >
            Add Vendor
          </button>
        </div>
      </form>
    </div>
  )
} 