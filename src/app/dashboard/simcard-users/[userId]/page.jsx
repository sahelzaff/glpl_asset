'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { FaEdit, FaTrash, FaEye, FaEyeSlash, FaArrowLeft } from 'react-icons/fa'
import toast, { Toaster } from 'react-hot-toast'
import { useMasterPassword } from '@/hooks/useMasterPassword'
import MasterPasswordModal from '@/app/components/MasterPasswordModal'

const fetchSimcardUserDetails = async (token, userId) => {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/simcard-users/${userId}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.data
}

const updateSimcardUser = async ({ token, userId, updatedData }) => {
  const response = await axios.put(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/simcard-users/${userId}`, 
    updatedData,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  )
  return response.data
}

const locationOptions = [
  'Africa', 'Agartala', 'Ahemdabad', 'Mumbai', 'Delhi', 'Chennai', 'Pune', 
  'Nagpur', 'Gandhidham', 'Jaipur', 'Jamshedhpur', 'Jodhpur', 'Ludhiana', 
  'Vizag', 'Tuticurin', 'Rudrapur', 'Kolkata', 'Hyderabad'
]

const statusOptions = ['Active', 'Suspended', 'In Stock']
const modeOptions = ['Voice Card', 'ESim']
const assetMappingOptions = ['Done', 'Pending']
const isdOptions = ['Active', 'In active']

const departmentOptions = [
  'Accounts',
  'Accounts and Finance',
  'Admin',
  'Business Development',
  'Custom Clearance',
  'Customer Service',
  'Customer Service Export',
  'Customer Service Import',
  'Customer Service and Inventory',
  'Customer Service and Operations',
  'Customer Services',
  'Event',
  'HR',
  'HR and Admin',
  'IT',
  'Inventory',
  'Inventory and MNR',
  'Operation Custom',
  'Operations',
  'Operations Import',
  'PMS and HR',
  'Pricing',
  'Sales',
  'Sales & Marketing',
  'Sales & Operations',
  'Sales and Customer Service',
  'Sales and Marketing',
  'Sales and Operations'
];

const designationOptions = [
  'Assistant',
  'Assistant General Manager',
  'Assistant Manager',
  'Branch Manager',
  'Chief Executive Officer',
  'Customer Exe Inventory Management',
  'Deputy Branch Manager',
  'Deputy Manager',
  'Executive',
  'Executive Customer Service',
  'Executive Operations',
  'Manager',
  'Manager Business Development',
  'Office Assistant',
  'Regional Head- South India',
  'Regional Manager- East India',
  'Senior Executive',
  'Senior Manager',
  'Senior Manager Commercials',
  'Trainee'
];

export default function SimcardUserDetails({ params }) {
  const { data: session } = useSession()
  const router = useRouter()
  const userId = params.userId
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [is90ModalOpen, setIs90ModalOpen] = useState(false)
  const [is100ModalOpen, setIs100ModalOpen] = useState(false)
  const [isOverModalOpen, setIsOverModalOpen] = useState(false)
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false)
  const [editedUser, setEditedUser] = useState(null)
  const [emailData, setEmailData] = useState({
    DataUsage: '',
    month: '',
    isd_minutes: ''
  })
  const queryClient = useQueryClient()
  const [showMasterPasswordModal, setShowMasterPasswordModal] = useState(false)

  const { data: user, isLoading, isError, error } = useQuery({
    queryKey: ['simcardUser', userId],
    queryFn: () => fetchSimcardUserDetails(session?.accessToken, userId),
    enabled: !!session?.accessToken && !!userId,
  })

  const updateUserMutation = useMutation({
    mutationFn: updateSimcardUser,
    onSuccess: () => {
      queryClient.invalidateQueries(['simcardUser', userId])
      setIsEditModalOpen(false)
      toast.success('SIM card user updated successfully')
    },
    onError: (error) => {
      toast.error(`Error updating user: ${error.message}`)
    },
  })

  const handleEmailSubmit = async (emailType) => {
    let subject, body;
    const { Current_User_Name, Cell_no, Current_User_Email } = user;
    const { DataUsage } = emailData;

    switch (emailType) {
      case '90':
        subject = `90% Data Usage Alert For +91 ${Cell_no}`;
        body = `Dear ${Current_User_Name},\n\n` +
          `I hope this message finds you well.\n` +
          `This is to inform you that you have used 90% of your allocated data quota for your Vi number +91 ${Cell_no}. Your remaining data balance is ${DataUsage} GB...`;
        break;
      case '100':
        subject = `100% Data Usage Alert For +91 ${Cell_no}`;
        body = `Dear ${Current_User_Name},\n\n` +
          `I hope this message finds you well.\n` +
          `This is to inform you that you have used 100% of your allocated data quota...`;
        break;
      case 'over':
        subject = `Data Limit Exceeded Additional Charges Applied For +91 ${Cell_no}`;
        body = `Dear ${Current_User_Name},\n\n` +
          `I hope this message finds you well.\n\n` +
          `This is to inform you that you have fully utilised your allocated data quota...`;
        break;
      case 'approval':
        subject = `Approval Request for Vodafone Mobile Bills ${emailData.month} ${Current_User_Name}`;
        body = `Dear ${user.Reporting_Manager},\n\n` +
          `Please find attached the Vodafone mobile bills ${emailData.month} for ${Current_User_Name}...`;
        break;
    }

    try {
      const requestUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/compose-email/${emailType}`;
      const response = await axios.post(requestUrl, {
        recipient: Current_User_Email,
        subject,
        body
      });

      if (response.data.mailto_link) {
        window.open(response.data.mailto_link, '_blank');
      }

      toast.success('Email composed successfully');
      closeAllModals();
    } catch (error) {
      toast.error('Error composing email');
    }
  };

  const closeAllModals = () => {
    setIs90ModalOpen(false);
    setIs100ModalOpen(false);
    setIsOverModalOpen(false);
    setIsApprovalModalOpen(false);
  };

  const handleDelete = () => {
    setShowMasterPasswordModal(true)
  }

  const handleDeleteConfirmed = async () => {
    try {
      await deleteUserMutation.mutateAsync()
    } catch (error) {
      toast.error('Failed to delete user')
    }
  }

  const handleEdit = () => {
    setEditedUser({ ...user })
    setIsEditModalOpen(true)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setEditedUser(prev => {
      if (name === 'Current_User_Name' && value !== user.Current_User_Name) {
        const currentPreviousUsers = user.Previous_User ? user.Previous_User.split('/') : [];
        const newPreviousUsers = [
          ...new Set([user.Current_User_Name, ...currentPreviousUsers])
        ].filter(Boolean);
        
        return {
          ...prev,
          [name]: value,
          Previous_User: newPreviousUsers.join('/')
        };
      }
      
      return {
        ...prev,
        [name]: value
      };
    });
  };

  const handleUpdate = async () => {
    try {
      toast.loading('Updating user details...', { id: 'updateToast' });
      
      await updateUserMutation.mutateAsync({
        token: session?.accessToken,
        userId,
        updatedData: editedUser,
      });

      toast.success('User details updated successfully', { id: 'updateToast' });
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error.response?.data?.message || 'Error updating user details', { id: 'updateToast' });
    }
  };

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
        <div className="text-red-500 text-xl mb-4">Error fetching user details: {error.message}</div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <Toaster position="top-right" />
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <button
            onClick={() => router.back()}
            className="mr-4 text-gray-600 hover:text-gray-800"
          >
            <FaArrowLeft className="text-xl" />
          </button>
          <h1 className="text-4xl font-bold font-outfit">SIM Card Details</h1>
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

      {/* Personal Data Section */}
      <div className='p-4'>
        <h1 className='font-outfit font-bold text-xl'>Personal Data</h1>
        <hr className="mb-4" />
        
        <div className='grid grid-cols-2 gap-6 font-poppins'>
          <div className='space-y-2'>
            <div className="flex items-center">
              <p className="font-semibold mr-2">Name:</p>
              <p>{user?.Current_User_Name || 'N/A'}</p>
            </div>
            
            <div className="flex items-center">
              <p className="font-semibold mr-2">Phone No:</p>
              <p>{user?.Cell_no ? `+91 ${user.Cell_no}` : 'N/A'}</p>
            </div>
            
            <div className="flex items-center">
              <p className="font-semibold mr-2">Location:</p>
              <p>{user?.Location || 'N/A'}</p>
            </div>
          </div>
          
          <div className='space-y-4'>
            <div className="flex items-center">
              <p className="font-semibold mr-2">Email:</p>
              <p>{user?.Current_User_Email || 'N/A'}</p>
            </div>
            
            <div>
              <p className="font-semibold">Previous Users:</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {user?.Previous_User ? 
                  user.Previous_User.split('/').map((prevUser, index) => (
                    <span 
                      key={index}
                      className="bg-gray-200 text-gray-700 px-3 py-1 rounded-md"
                    >
                      {prevUser.trim()}
                    </span>
                  ))
                  : 
                  <span className="text-gray-500">No previous users</span>
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sim Information Section */}
      <div className='p-4 mt-4'>
        <h1 className='font-outfit font-bold text-xl'>Sim Information</h1>
        <hr className="mb-4" />
        
        <div className='grid grid-cols-2 gap-6 font-poppins'>
          <div className='space-y-2'>
            <div className="flex items-center">
              <p className="font-semibold mr-2">Sim No:</p>
              <p>{user?.SIM_No || 'N/A'}</p>
            </div>
            
            <div className="flex items-center">
              <p className="font-semibold mr-2">Plan Name:</p>
              <p>{user?.PlanName || 'N/A'}</p>
            </div>
            
            <div className="flex items-center">
              <p className="font-semibold mr-2">Asset Mapping:</p>
              <p>{user?.Asset_Mapping || 'N/A'}</p>
            </div>
            
            <div className="flex items-center">
              <p className="font-semibold mr-2">Plan Cost:</p>
              <p>{user?.Cost ? `₹${user.Cost}.00` : 'N/A'}</p>
            </div>
          </div>
          
          <div className='space-y-4'>
            <div className="flex items-center">
              <p className="font-semibold mr-2">Vi Status:</p>
              <span className={`inline-block px-4 py-1 rounded-lg text-white ${
                user?.Vi_Status === 'Active' ? 'bg-green-500' :
                user?.Vi_Status === 'Suspended' ? 'bg-red-500' :
                user?.Vi_Status === 'In Stock' ? 'bg-blue-500' :
                'bg-yellow-500'
              }`}>
                {user?.Vi_Status || 'N/A'}
              </span>
            </div>
            
            <div className="flex items-center">
              <p className="font-semibold mr-2">Mode:</p>
              <p>{user?.Mode || 'N/A'}</p>
            </div>
            
            <div className="flex items-center">
              <p className="font-semibold mr-2">GLPL Remark:</p>
              <p>{user?.Remark || 'N/A'}</p>
            </div>

            <div className="flex items-center">
              <p className="font-semibold mr-2">ISD Status:</p>
              <span className={`px-4 py-1 rounded-lg ${
                user?.isd === 'Active' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}>
                {user?.isd || 'In active'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Work Details Section */}
      <div className='p-4 mt-4'>
        <h1 className='font-outfit font-bold text-xl'>Work Details</h1>
        <hr className="mb-4" />
        
        <div className='grid grid-cols-2 gap-6 font-poppins'>
          <div className='space-y-2'>
            <div className="flex items-center">
              <p className="font-semibold mr-2">Designation:</p>
              <p>{user?.Designation || 'None'}</p>
            </div>
            
            <div className="flex items-center">
              <p className="font-semibold mr-2">Department:</p>
              <p>{user?.Department || 'None'}</p>
            </div>
            
            <div className="flex items-center">
              <p className="font-semibold mr-2">Email:</p>
              <p>{user?.Current_User_Email || 'None'}</p>
            </div>
          </div>
          
          <div className='space-y-4'>
            <div className="flex items-center">
              <p className="font-semibold mr-2">Reporting Manager:</p>
              <p>{user?.Reporting_Manager || 'None'}</p>
            </div>
            
            <div className="flex items-center">
              <p className="font-semibold mr-2">Reporting Manager Email:</p>
              <p>{user?.Manager_Email || 'None'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Rest of your sections (Sim Information, Work Details, etc.) */}
      {/* ... */}

      {/* Your existing modals */}
      {/* ... */}

      {isEditModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
          <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col my-6">
            <div className="sticky top-0 bg-white z-10 p-6 border-b">
              <h3 className="text-lg font-bold">Edit SIM Card Details</h3>
            </div>
            
            <div className="p-6 overflow-y-auto flex-grow">
              <form onSubmit={(e) => { e.preventDefault(); handleUpdate(); }}>
                <div className="grid grid-cols-2 gap-4">
                  {/* Personal Information */}
                  <div className="col-span-2">
                    <h4 className="text-lg font-semibold mb-3">Personal Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Name</label>
                        <input
                          type="text"
                          name="Current_User_Name"
                          value={editedUser.Current_User_Name || ''}
                          onChange={handleInputChange}
                          className="w-full p-2 border rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Previous Users</label>
                        <div className="p-2 border rounded bg-gray-50 min-h-[38px] flex flex-wrap gap-1">
                          {editedUser.Previous_User?.split('/').map((prevUser, index) => (
                            <span 
                              key={index}
                              className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-sm"
                            >
                              {prevUser.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input
                          type="email"
                          name="Current_User_Email"
                          value={editedUser.Current_User_Email || ''}
                          onChange={handleInputChange}
                          className="w-full p-2 border rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Location</label>
                        <select
                          name="Location"
                          value={editedUser.Location || ''}
                          onChange={handleInputChange}
                          className="w-full p-2 border rounded"
                        >
                          <option value="">Select Location</option>
                          {locationOptions.map(loc => (
                            <option key={loc} value={loc}>{loc}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* SIM Information */}
                  <div className="col-span-2">
                    <h4 className="text-lg font-semibold mb-3">SIM Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Phone Number</label>
                        <input
                          type="text"
                          name="Cell_no"
                          value={editedUser.Cell_no || ''}
                          className="w-full p-2 border rounded bg-gray-100 cursor-not-allowed"
                          disabled
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">SIM Number</label>
                        <input
                          type="text"
                          name="SIM_No"
                          value={editedUser.SIM_No || ''}
                          onChange={handleInputChange}
                          className="w-full p-2 border rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Plan Name</label>
                        <input
                          type="text"
                          name="PlanName"
                          value={editedUser.PlanName || ''}
                          onChange={handleInputChange}
                          className="w-full p-2 border rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Cost</label>
                        <input
                          type="text"
                          name="Cost"
                          value={editedUser.Cost || ''}
                          onChange={handleInputChange}
                          className="w-full p-2 border rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Mode</label>
                        <select
                          name="Mode"
                          value={editedUser.Mode || ''}
                          onChange={handleInputChange}
                          className="w-full p-2 border rounded"
                        >
                          <option value="">Select Mode</option>
                          {modeOptions.map(mode => (
                            <option key={mode} value={mode}>{mode}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Status</label>
                        <select
                          name="Vi_Status"
                          value={editedUser.Vi_Status || ''}
                          onChange={handleInputChange}
                          className="w-full p-2 border rounded"
                        >
                          <option value="">Select Status</option>
                          {statusOptions.map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Asset Mapping</label>
                        <select
                          name="Asset_Mapping"
                          value={editedUser.Asset_Mapping || ''}
                          onChange={handleInputChange}
                          className="w-full p-2 border rounded"
                        >
                          <option value="">Select Status</option>
                          {assetMappingOptions.map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">ISD Status</label>
                        <select
                          name="isd"
                          value={editedUser.isd || 'In active'}
                          onChange={handleInputChange}
                          className="w-full p-2 border rounded"
                        >
                          <option value="Active">Active</option>
                          <option value="In active">In active</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Work Details */}
                  <div className="col-span-2">
                    <h4 className="text-lg font-semibold mb-3">Work Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Department</label>
                        <select
                          name="Department"
                          value={editedUser.Department || ''}
                          onChange={handleInputChange}
                          className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Department</option>
                          {departmentOptions.map((dept) => (
                            <option key={dept} value={dept}>
                              {dept}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Designation</label>
                        <select
                          name="Designation"
                          value={editedUser.Designation || ''}
                          onChange={handleInputChange}
                          className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Designation</option>
                          {designationOptions.map((desig) => (
                            <option key={desig} value={desig}>
                              {desig}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Reporting Manager</label>
                        <input
                          type="text"
                          name="Reporting_Manager"
                          value={editedUser.Reporting_Manager || ''}
                          onChange={handleInputChange}
                          className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Manager Email</label>
                        <input
                          type="email"
                          name="Manager_Email"
                          value={editedUser.Manager_Email || ''}
                          onChange={handleInputChange}
                          className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="sticky bottom-0 bg-gray-100 px-6 py-4 rounded-b-lg">
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const EmailModal = ({ title, onClose, onSubmit, emailData, setEmailData, user }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg max-w-md w-full">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <input
        type="text"
        value={emailData.DataUsage}
        onChange={(e) => setEmailData({ ...emailData, DataUsage: e.target.value })}
        placeholder="Data Usage (GB)"
        className="w-full p-2 border rounded mb-4"
      />
      {/* Add other fields as needed */}
      <div className="flex justify-end gap-4">
        <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">
          Cancel
        </button>
        <button onClick={onSubmit} className="px-4 py-2 bg-blue-500 text-white rounded">
          Send Email
        </button>
      </div>
    </div>
  </div>
); 