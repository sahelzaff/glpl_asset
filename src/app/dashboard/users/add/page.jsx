'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast, { Toaster } from 'react-hot-toast'
import Select from 'react-select'
import { useMutation } from '@tanstack/react-query'

const departmentOptions = ['Select Department', 'IT', 'HR', 'Finance', 'Operations', 'Sales', 'Marketing']
const locationOptions = ['Select Location', 'Mumbai', 'Nagpur', 'Pune']

const EMAIL_DOMAINS = [
  { value: '@goodrichlogistics.com', label: '@goodrichlogistics.com' },
  { value: '@goodrich-me.com', label: '@goodrich-me.com' },
  { value: '@goodrichindia.com', label: '@goodrichindia.com' },
  { value: '@seahorsemaritimo.com', label: '@seahorsemaritimo.com' },
  { value: '@intshiplog.com', label: '@intshiplog.com' },
  { value: '@dragonmaritimo.com', label: '@dragonmaritimo.com' }
]

export default function AddUser() {
  const { data: session } = useSession()
  const router = useRouter()
  const [formData, setFormData] = useState({
    UserName: '',
    EmailId: '',
    EmailPassword: '',
    DomainId: '',
    DomainPassword: '',
    Department: 'Select Department',
    Location: 'Select Location',
    Status: 'Active User',
    AssetAssignedDate: '',
    Remarks: '',
    Comments: ''
  })
  const [emailPrefix, setEmailPrefix] = useState('')
  const [selectedDomain, setSelectedDomain] = useState(EMAIL_DOMAINS[0])

  const createUserMutation = useMutation({
    mutationFn: async (data) => {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users`,
        data,
        {
          headers: { Authorization: `Bearer ${session?.accessToken}` }
        }
      )
      return response.data
    },
    onSuccess: () => {
      toast.success('User created successfully!', {
        duration: 3000,
        position: 'top-right',
        style: {
          background: '#10B981',
          color: '#fff',
        }
      })
      setTimeout(() => {
        router.push('/dashboard/users')
      }, 2000)
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error creating user', {
        duration: 3000,
        position: 'top-right',
        style: {
          background: '#EF4444',
          color: '#fff',
        }
      })
    }
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const fullEmail = emailPrefix + selectedDomain.value
    const updatedFormData = {
      ...formData,
      EmailId: fullEmail,
      Status: 'Active User'
    }
    createUserMutation.mutate(updatedFormData)
  }

  return (
    <div className="p-4 max-w-[1400px] mx-auto">
      <Toaster position="top-right" />
      <h1 className="text-2xl font-bold mb-4 font-outfit">Add New User</h1>
      
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-4">
        <div className="grid grid-cols-2 gap-3">
          {/* Basic Information */}
          <div className="mb-3">
            <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="UserName">
              Username*
            </label>
            <input
              type="text"
              name="UserName"
              value={formData.UserName}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-1.5 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
              required
            />
          </div>

          <div className="mb-3">
            <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="Department">
              Department*
            </label>
            <select
              name="Department"
              value={formData.Department}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-1.5 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
              required
            >
              {departmentOptions.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="Location">
              Location*
            </label>
            <select
              name="Location"
              value={formData.Location}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-1.5 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
              required
            >
              {locationOptions.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          {/* Domain Information */}
          <div className="mb-3">
            <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="DomainId">
              Domain ID*
            </label>
            <input
              type="text"
              name="DomainId"
              value={formData.DomainId}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-1.5 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
              required
            />
          </div>

          <div className="mb-3">
            <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="DomainPassword">
              Domain Password
            </label>
            <input
              type="password"
              name="DomainPassword"
              value={formData.DomainPassword}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-1.5 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
            />
          </div>

          {/* Email Information */}
          <div className="mb-3">
            <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="EmailId">
              Email ID*
            </label>
            <div className="flex">
              <input
                type="text"
                placeholder="username"
                className="shadow appearance-none border rounded-l w-full py-1.5 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
                value={emailPrefix}
                onChange={(e) => setEmailPrefix(e.target.value.toLowerCase())}
              />
              <Select
                options={EMAIL_DOMAINS}
                value={selectedDomain}
                onChange={setSelectedDomain}
                isSearchable={false}
                className="w-[28rem]"
                classNamePrefix="select"
                styles={{
                  control: (base) => ({
                    ...base,
                    borderTopLeftRadius: 0,
                    borderBottomLeftRadius: 0,
                    height: '100%'
                  })
                }}
              />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Full email will be: {emailPrefix}{selectedDomain.value}
            </p>
          </div>

          <div className="mb-3">
            <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="EmailPassword">
              Email Password
            </label>
            <input
              type="password"
              name="EmailPassword"
              value={formData.EmailPassword}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-1.5 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
            />
          </div>

          {/* Additional Information */}
          <div className="mb-3">
            <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="AssetAssignedDate">
              Asset Assigned Date
            </label>
            <input
              type="date"
              name="AssetAssignedDate"
              value={formData.AssetAssignedDate}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-1.5 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
            />
          </div>

          <div className="mb-3 col-span-2">
            <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="Remarks">
              Remarks
            </label>
            <textarea
              name="Remarks"
              value={formData.Remarks}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-1.5 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
              rows="2"
            />
          </div>

          <div className="mb-3 col-span-2">
            <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="Comments">
              Comments
            </label>
            <textarea
              name="Comments"
              value={formData.Comments}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-1.5 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
              rows="2"
            />
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button
            type="button"
            onClick={() => router.push('/dashboard/users')}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-1.5 px-4 rounded mr-2 text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1.5 px-4 rounded text-sm"
          >
            Add User
          </button>
        </div>
      </form>
    </div>
  )
}