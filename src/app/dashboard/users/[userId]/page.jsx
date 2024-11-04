'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { FaEdit, FaTrash, FaEye, FaEyeSlash, FaArrowLeft } from 'react-icons/fa'
import toast, { Toaster } from 'react-hot-toast'
import { useMasterPassword } from '@/hooks/useMasterPassword'
import ForwardEmailModal from './ForwardEmailModal'

const fetchUserDetails = async (token, userId) => {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${userId}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.data
}

const updateUser = async ({ token, userId, updatedData }) => {
  const response = await axios.put(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${userId}`, updatedData, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.data
}

const departmentOptions = ['IT', 'HR', 'Finance', 'Operations', 'Sales', 'Marketing']
const locationOptions = ['Mumbai', 'Nagpur', 'Pune']
const statusOptions = ['Select status','Active User', 'Resigned']

// Add this after other constants
const fieldOrder = [
  'UserName',
  'EmailId',
  'EmailPassword',
  'DomainId',
  'DomainPassword',
  'AssetID',
  'Location',
  'Department',
  'Status',
  'AssetAssignedDate',
  'Remarks',
  'Comments'
];

// Add this helper function at the top of the file after the constants
const PreviousUserBadge = ({ name }) => (
  <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-md mr-2 mb-2 inline-block">
    {name.trim()}
  </span>
);

const formatPreviousUsers = (previousUsers) => {
  if (!previousUsers) return [];
  return previousUsers.split(/[/\\]/).map(user => user.trim()).filter(Boolean);
};

const fetchHostNames = async (token) => {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/assets/hostnames`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Add this helper function
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

export default function UserDetails({ params }) {
  const { data: session } = useSession()
  const router = useRouter()
  const userId = params.userId
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editedUser, setEditedUser] = useState(null)
  const [changedFields, setChangedFields] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showEditPassword, setShowEditPassword] = useState({})
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [swapDetails, setSwapDetails] = useState({
    oldAssetId: null,
    newAssetId: null,
    oldHostName: '',
    newHostName: ''
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showForwardModal, setShowForwardModal] = useState(false)
  const [userEmail, setUserEmail] = useState(null)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const queryClient = useQueryClient()

  const { data: user, isLoading, isError, error } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUserDetails(session?.accessToken, userId),
    enabled: !!session?.accessToken && !!userId,
  })

  const updateUserMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      queryClient.invalidateQueries(['user', userId])
      setIsEditModalOpen(false)
      toast.success('User updated successfully')
    },
    onError: (error) => {
      toast.error(`Error updating user: ${error.message}`)
    },
  })

  const { data: hostNames = [] } = useQuery({
    queryKey: ['hostNames'],
    queryFn: () => fetchHostNames(session?.accessToken),
    enabled: !!session?.accessToken,
  });

  const deleteUserMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${userId}`,
        {
          headers: { Authorization: `Bearer ${session?.accessToken}` }
        }
      )
      return response.data
    },
    onSuccess: () => {
      toast.success('User deleted successfully')
      router.push('/dashboard/users')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error deleting user')
    }
  })

  const { showMasterPasswordModal, setShowMasterPasswordModal, MasterPasswordModal } = useMasterPassword(
    session,
    () => deleteUserMutation.mutate()
  )

  const handleDelete = () => {
    setShowMasterPasswordModal(true)
  }

  if (isLoading) return <div>Loading...</div>
  if (isError) return <div>Error fetching user details: {error.message}</div>

  const handleEdit = () => {
    const { UserId, ...editableUser } = user
    setEditedUser(editableUser)
    setIsEditModalOpen(true)
    setShowEditPassword({})
  }

  const handleDeleteConfirmation = async (confirmed) => {
    if (confirmed) {
      await deleteUserMutation.mutateAsync()
    }
    setShowDeleteModal(false)
  }

  const handleInputChange = (key, value) => {
    if (key === 'AssetID' && value !== editedUser.AssetID && editedUser.AssetID) {
      // Get the hostnames for both assets
      const oldAsset = hostNames.find(asset => asset.AssetsId === editedUser.AssetID);
      const newAsset = hostNames.find(asset => asset.AssetsId === value);
      
      setSwapDetails({
        oldAssetId: editedUser.AssetID,
        newAssetId: value,
        oldHostName: oldAsset?.HostName || '',
        newHostName: newAsset?.HostName || ''
      });
      setShowSwapModal(true);
    }
    
    setEditedUser(prev => ({ ...prev, [key]: value }));
    if (value !== user[key]) {
      setChangedFields(prev => ({ ...prev, [key]: value }));
    } else {
      setChangedFields(prev => {
        const { [key]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleUpdate = () => {
    if (editedUser.Status === 'Resigned' && user.Status !== 'Resigned') {
      // Get user's email from the emails table
      axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/emails/user/${userId}`,
        { headers: { Authorization: `Bearer ${session?.accessToken}` } }
      ).then(response => {
        if (response.data) {
          setUserEmail(response.data)
          setShowForwardModal(true)
        } else {
          // If no email found, proceed with update
          updateUserMutation.mutate({
            token: session?.accessToken,
            userId,
            updatedData: changedFields,
          })
        }
      })
    } else {
      updateUserMutation.mutate({
        token: session?.accessToken,
        userId,
        updatedData: changedFields,
      })
    }
  }

  const renderFormField = (key, value) => {
    const selectClass = "shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline pr-8 bg-white"
    const inputClass = "shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"

    const renderSelect = (options) => (
      <div className="relative">
        <select
          id={key}
          value={value}
          onChange={(e) => handleInputChange(key, e.target.value)}
          className={selectClass}
        >
          {options.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
          </svg>
        </div>
      </div>
    )

    const renderPasswordInput = () => (
      <div className="relative">
        <input
          type={showEditPassword[key] ? "text" : "password"}
          id={key}
          value={value}
          onChange={(e) => handleInputChange(key, e.target.value)}
          className={inputClass}
        />
        <button
          type="button"
          onClick={() => setShowEditPassword(prev => ({ ...prev, [key]: !prev[key] }))}
          className="absolute inset-y-0 right-0 flex items-center px-2"
        >
          {showEditPassword[key] ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>
    )

    switch (key) {
      case 'Department':
        return renderSelect(departmentOptions)
      case 'Location':
        return renderSelect(locationOptions)
      case 'Status':
        return renderSelect(statusOptions)
      case 'DomainPassword':
      case 'EmailPassword':
        return renderPasswordInput()
      case 'AssetAssignedDate':
        return (
          <input
            type="date"
            id={key}
            value={formatDateForInput(value)}
            onChange={(e) => handleInputChange(key, e.target.value)}
            className={inputClass}
          />
        )
      case 'AssetID':
        return (
          <div className="relative">
            <select
              id={key}
              value={value || ''}
              onChange={(e) => handleInputChange(key, e.target.value)}
              className={selectClass}
            >
              <option value="">Select Asset</option>
              {hostNames.map((asset) => (
                <option key={asset.AssetsId} value={asset.AssetsId}>
                  {asset.HostName}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
              </svg>
            </div>
          </div>
        );
      default:
        return (
          <input
            type="text"
            id={key}
            value={value}
            onChange={(e) => handleInputChange(key, e.target.value)}
            className={inputClass}
          />
        )
    }
  }

  const handleSwapConfirmation = async (shouldSwap) => {
    if (shouldSwap) {
      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/assets/swap-hostnames`,
          {
            assetId1: swapDetails.oldAssetId,
            assetId2: swapDetails.newAssetId
          },
          {
            headers: { 
              Authorization: `Bearer ${session?.accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.status === 200) {
          toast.success('Assets swapped successfully');
          queryClient.invalidateQueries(['user', userId]); // Refresh user data
        } else {
          throw new Error('Failed to swap assets');
        }
      } catch (error) {
        console.error('Swap error:', error);
        toast.error(error.response?.data?.message || 'Error swapping assets');
        // Revert the asset selection
        setEditedUser(prev => ({ ...prev, AssetID: swapDetails.oldAssetId }));
      }
    }
    setShowSwapModal(false);
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center mb-6">
       
       
      </div>
      <Toaster position="top-right" />
      <div className="flex justify-between items-center mb-4">
      <div className="flex items-center">
      <button
          onClick={() => router.back()}
          className="mr-4 text-gray-600 hover:text-gray-800"
        >
          <FaArrowLeft className="text-xl" />
        </button>
        <h1 className="text-4xl font-bold font-outfit">User Details</h1>
      </div>
      
        <div>
          <button
            onClick={handleEdit}
            className="bg-blue-500 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded mr-2 font-montserrat"
          >
            <FaEdit className="inline-block mr-2" />
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-500 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded font-montserrat"
          >
            <FaTrash className="inline-block mr-2" />
            Delete
          </button>
        </div>
      </div>
      {user ? (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-semibold font-outfit">User Information</h2>
          <hr className="mb-4 mt-1 border-t border-gray-300" />
          <div className="grid grid-cols-2 gap-2">
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Username:</span> {user.UserName}</p>
            <div className="font-medium font-poppins">
              <span className="font-semibold font-poppins block mb-2">Previous Users:</span>
              <div className="flex flex-wrap">
                {formatPreviousUsers(user.PreviousUsers).map((prevUser, index) => (
                  <PreviousUserBadge key={index} name={prevUser} />
                ))}
              </div>
            </div>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Department:</span> {user.Department}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Location:</span> {user.Location}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Domain ID:</span> {user.DomainId}</p>
            <p className="font-medium font-poppins">
              <span className="font-semibold font-poppins">Domain Password:</span>
              <span className="ml-2">
                {showPassword ? user.DomainPassword : '••••••••'}
              </span>
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="ml-2 text-black hover:text-grey-300"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Email ID:</span> {user.EmailId}</p>
            <p className="font-medium font-poppins">
              <span className="font-semibold font-poppins">Email Password:</span>
              <span className="ml-2">
                {showPassword ? user.EmailPassword : '••••••••'}
              </span>
            </p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Asset Assigned Date:</span> {user.AssetAssignedDate}</p>
            <p className="font-medium font-poppins">
              <span className="font-semibold font-poppins">Assigned Asset:</span>
              {hostNames.find(asset => asset.AssetsId === user.AssetID)?.HostName || 'None'}
            </p>
          </div>

          <div className="mt-6">
            <h3 className="text-2xl font-bold font-outfit mt-10">Additional Information</h3>
            <hr className="mb-4 mt-1 border-t border-gray-300" />
            <div className="grid grid-cols-2 gap-2">
              <p><span className="font-medium">Remarks:</span> {user.Remarks}</p>
              <p><span className="font-medium">Comments:</span> {user.Comments}</p>
            </div>
          </div>
        </div>
      ) : (
        <p>No user details found.</p>
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
          <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col my-6">
            <div className="sticky top-0 bg-white z-10 p-6 border-b">
              <h3 className="text-lg font-bold">Edit User</h3>
            </div>
            <div className="p-6 overflow-y-auto flex-grow">
              <form onSubmit={(e) => { e.preventDefault(); handleUpdate(); }}>
                <div className="grid grid-cols-2 gap-4">
                  {fieldOrder.map(key => {
                    if (key === 'UserId' || !editedUser.hasOwnProperty(key)) return null;
                    return (
                      <div key={key} className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={key}>
                          {key.replace(/([A-Z])/g, ' $1').trim()} {/* Adds spaces before capital letters */}
                        </label>
                        {renderFormField(key, editedUser[key])}
                      </div>
                    );
                  })}
                </div>
              </form>
            </div>
            <div className="sticky bottom-0 bg-gray-100 px-6 py-4 rounded-b-lg">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded mr-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSwapModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Swap SSD Confirmation</h3>
            <p className="mb-4">
              Do you want to swap the SSD between:
              <br />
              <span className="font-semibold">{swapDetails.oldHostName}</span>
              <br />
              and
              <br />
              <span className="font-semibold">{swapDetails.newHostName}</span>?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => handleSwapConfirmation(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                No
              </button>
              <button
                onClick={() => handleSwapConfirmation(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
            <p className="mb-4">Are you sure you want to delete this user? This action cannot be undone.</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => handleDeleteConfirmation(false)}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteConfirmation(true)}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <MasterPasswordModal 
        title="Enter Master Password to Delete User" 
        actionButtonText="Delete User" 
      />

      <ForwardEmailModal
        isOpen={showForwardModal}
        onClose={() => setShowForwardModal(false)}
        session={session}
        userEmail={userEmail}
        onForwardComplete={() => {
          updateUserMutation.mutate({
            token: session?.accessToken,
            userId,
            updatedData: changedFields,
          })
        }}
      />
    </div>
  )
}
