'use client'

import { useQuery, useMutation } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { useState, useMemo } from 'react'
import axios from 'axios'
import Link from 'next/link'
import { FaSearch, FaPlus, FaEye, FaEyeSlash, FaChevronLeft, FaChevronRight, FaEdit, FaTrash } from 'react-icons/fa'
import toast from 'react-hot-toast'
import Select from 'react-select'
import { Toaster } from 'react-hot-toast'
import { useMasterPassword } from '@/hooks/useMasterPassword'

const fetchEmails = async (token) => {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/emails`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.data
}

const DOMAIN_OPTIONS = [
  { value: '', label: 'All Domains' },
  { value: '@goodrichlogistics.com', label: '@goodrichlogistics.com' },
  { value: '@goodrich-me.com', label: '@goodrich-me.com' },
  { value: '@goodrichindia.com', label: '@goodrichindia.com' },
  { value: '@seahorsemaritimo.com', label: '@seahorsemaritimo.com' },
  { value: '@intshiplog.com', label: '@intshiplog.com' },
  { value: '@dragonmaritimo.com', label: '@dragonmaritimo.com' }
]

export default function Emails() {
  const { data: session } = useSession()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('')
  const [domainFilter, setDomainFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showPasswords, setShowPasswords] = useState({})
  const itemsPerPage = 15
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingEmail, setEditingEmail] = useState(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [emailToDelete, setEmailToDelete] = useState(null)
  const [selectedEmailId, setSelectedEmailId] = useState(null)

  const { data: emails = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['emails'],
    queryFn: () => fetchEmails(session?.accessToken),
    enabled: !!session?.accessToken,
  })

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/emails/users`,
        { headers: { Authorization: `Bearer ${session?.accessToken}` } }
      )
      return response.data
    },
    enabled: !!session?.accessToken,
  })

  const updateEmailMutation = useMutation({
    mutationFn: async (data) => {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/emails/${data.email_id}`,
        data,
        { headers: { Authorization: `Bearer ${session?.accessToken}` } }
      )
      return response.data
    },
    onSuccess: () => {
      toast.success('Email updated successfully')
      setIsEditModalOpen(false)
      refetch()
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error updating email')
    }
  })

  const deleteEmailMutation = useMutation({
    mutationFn: async (emailId) => {
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/emails/${emailId}`,
        { headers: { Authorization: `Bearer ${session?.accessToken}` } }
      )
      return response.data
    },
    onSuccess: () => {
      toast.success('Email deleted successfully')
      setIsDeleteModalOpen(false)
      refetch()
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error deleting email')
    }
  })

  const handleEdit = (email) => {
    setEditingEmail({
      ...email,
      assigned_users: email.assigned_users ? 
        email.assigned_users.split(', ').map(name => 
          users.find(u => u.name === name)?.id
        ).filter(Boolean) : []
    })
    setIsEditModalOpen(true)
  }

  const handleUpdate = () => {
    updateEmailMutation.mutate(editingEmail)
  }

  const handleDelete = (email) => {
    setEmailToDelete(email)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = () => {
    setIsDeleteModalOpen(false)
    setShowMasterPasswordModal(true)
  }

  const { showMasterPasswordModal, setShowMasterPasswordModal, MasterPasswordModal } = useMasterPassword(
    session,
    () => deleteEmailMutation.mutate(emailToDelete.email_id)
  )

  const filterFields = [
    { value: 'email_address', label: 'Email Address' },
    { value: 'assigned_users', label: 'Assigned Users' },
  ]

  const filteredEmails = useMemo(() => {
    return emails.filter(email => {
      const matchesSearch = !filterType || !searchTerm || 
        (email[filterType] && email[filterType].toString().toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesDomain = !domainFilter || 
        (email.email_address && email.email_address.endsWith(domainFilter))
      
      return matchesSearch && matchesDomain
    })
  }, [emails, searchTerm, filterType, domainFilter])

  const paginatedEmails = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredEmails.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredEmails, currentPage])

  const totalPages = Math.ceil(filteredEmails.length / itemsPerPage)

  const togglePasswordVisibility = (emailId) => {
    setShowPasswords(prev => ({
      ...prev,
      [emailId]: !prev[emailId]
    }))
  }

  const handlePasswordView = (emailId) => {
    setSelectedEmailId(emailId)
    setShowMasterPasswordModal(true)
  }

  if (isLoading) return <div>Loading...</div>
  if (isError) return <div>Error fetching emails</div>

  return (
    <div className="py-6 max-w-[1400px] mx-auto">
      <Toaster position="top-right" />
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold font-outfit">Email Management</h1>
        <Link 
          href="/dashboard/emails/add" 
          className="bg-[#C7092C] hover:bg-[#9A0724] text-white font-bold py-2 px-4 rounded flex items-center"
        >
          <FaPlus className="inline-block mr-2" />
          Add New Email
        </Link>
      </div>

      <div className="mb-4 flex items-center space-x-4">
        <select
          className="p-2 border rounded"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="" className="font-poppins">Filter By</option>
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
          className="p-2 border rounded min-w-[200px]"
          value={domainFilter}
          onChange={(e) => setDomainFilter(e.target.value)}
        >
          {DOMAIN_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 border text-center font-outfit">Email Address</th>
              <th className="p-2 border text-center font-outfit">Password</th>
              <th className="p-2 border text-center font-outfit">Assigned Users</th>
              <th className="p-2 border text-center font-outfit">Status</th>
              <th className="p-2 border text-center font-outfit">Forwarded To</th>
              <th className="w-[120px] p-2 border text-center font-outfit">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedEmails.map((email) => (
              <tr key={`${email.source}-${email.email_id}`}>
                <td className="p-2 border text-center font-poppins">{email.email_address}</td>
                <td className="p-2 border text-center font-poppins">
                  <div className="flex items-center justify-center">
                    <span className="mr-2">
                      {showPasswords[email.email_id] ? email.email_password : '••••••••'}
                    </span>
                    <button
                      onClick={() => handlePasswordView(email.email_id)}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      {showPasswords[email.email_id] ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </td>
                <td className="p-2 border text-center font-poppins">{email.assigned_users || 'None'}</td>
                <td className="p-2 border text-center font-poppins">
                  <span className={`px-6 font-medium py-1 rounded-lg text-sm font-poppins ${
                    email.status === 'Active' ? 'bg-green-400 text-white' : 'bg-red-100 text-red-800'
                  }`}>
                    {email.status || 'Active'}
                  </span>
                </td>
                <td className="p-2 border text-center font-poppins">{email.forwarded_to || 'None'}</td>
                <td className="p-2 border text-center font-poppins">
                  <div className="flex items-center justify-center space-x-2">
                    <button
                      onClick={() => handleEdit(email)}
                      className="text-blue-500 hover:text-blue-700"
                      title="Edit Email"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(email)}
                      className="text-red-500 hover:text-red-700"
                      title="Delete Email"
                    >
                      <FaTrash />
                    </button>
                  </div>
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

      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-5xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit Email</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="text"
                  value={editingEmail.email_address}
                  disabled
                  className="w-full p-2 border rounded bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords[editingEmail.email_id] ? "text" : "password"}
                    value={editingEmail.email_password}
                    onChange={(e) => setEditingEmail(prev => ({
                      ...prev,
                      email_password: e.target.value
                    }))}
                    className="w-full p-2 border rounded"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility(editingEmail.email_id)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  >
                    {showPasswords[editingEmail.email_id] ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={editingEmail.status}
                  onChange={(e) => setEditingEmail(prev => ({
                    ...prev,
                    status: e.target.value
                  }))}
                  className="w-full p-2 border rounded"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Forwarded">Forwarded</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Forwarded To
                </label>
                <input
                  type="text"
                  value={editingEmail.forwarded_to || ''}
                  onChange={(e) => setEditingEmail(prev => ({
                    ...prev,
                    forwarded_to: e.target.value
                  }))}
                  className="w-full p-2 border rounded"
                  placeholder="Enter forwarding email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned Users
                </label>
                <Select
                  isMulti
                  value={users
                    .filter(user => editingEmail.assigned_users.includes(user.id))
                    .map(user => ({ value: user.id, label: user.name }))}
                  onChange={(selected) => setEditingEmail(prev => ({
                    ...prev,
                    assigned_users: selected.map(option => option.value)
                  }))}
                  options={users.map(user => ({
                    value: user.id,
                    label: user.name
                  }))}
                  className="basic-multi-select"
                  classNamePrefix="select"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                disabled={updateEmailMutation.isLoading}
              >
                {updateEmailMutation.isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
            <p className="mb-6">
              Are you sure you want to delete the email account &quot;{emailToDelete?.email_address}&quot;?
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                disabled={deleteEmailMutation.isLoading}
              >
                {deleteEmailMutation.isLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <MasterPasswordModal 
        title="Enter Master Password to Delete Email" 
        actionButtonText="Delete Email" 
      />
    </div>
  )
} 