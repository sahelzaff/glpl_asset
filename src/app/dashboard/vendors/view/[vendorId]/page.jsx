'use client'

import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { FaArrowLeft, FaEdit } from 'react-icons/fa'
import { MdContentCopy } from "react-icons/md"
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Toaster } from 'react-hot-toast'
import { useMutation } from '@tanstack/react-query'

const fetchVendor = async (token, vendorId) => {
    if (!token) return null;
    const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/vendors/${vendorId}`, {
        headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
}

export default function VendorDetails({ params }) {
    const { data: session, status } = useSession()
    const router = useRouter()
    const vendorId = params.vendorId

    const { data: vendor, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['vendor', vendorId],
        queryFn: () => fetchVendor(session?.accessToken, vendorId),
        enabled: false,
    })

    useEffect(() => {
        if (status === 'authenticated' && session?.accessToken) {
            refetch()
        }
    }, [status, session, refetch])

    const renderDetail = (label, value) => (
        <div className="mb-4 font-poppins">
            <label className="block text-gray-700 text-sm font-bold mb-1">{label}</label>
            <div className="text-gray-600">{value || 'N/A'}</div>
        </div>
    )

    const copyBankingInfo = () => {
        const bankingInfo = `
Bank Details for ${vendor.vendor_name}
--------------------------------
Bank Name: ${vendor.bank_name || 'N/A'}
Account Number: ${vendor.bank_account_number || 'N/A'}
IFSC Code: ${vendor.ifsc_code || 'N/A'}
Payment Terms: ${vendor.payment_terms || 'N/A'}
Credit Limit: ${vendor.credit_limit || 'N/A'}
`.trim()

        navigator.clipboard.writeText(bankingInfo)
        toast.success(`Bank Details For ${vendor.vendor_name} Copied!`, {
            duration: 3000,
            style: {
                background: '#10B981',
                color: '#fff',
            },
        })
    }

    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editedVendor, setEditedVendor] = useState(null)

    const updateVendorMutation = useMutation({
        mutationFn: async (updatedData) => {
            const response = await axios.put(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/vendors/${vendor.vendor_id}`,
                updatedData,
                {
                    headers: { Authorization: `Bearer ${session?.accessToken}` }
                }
            )
            return response.data
        },
        onSuccess: () => {
            toast.success('Vendor updated successfully')
            setIsEditModalOpen(false)
            refetch() // Refresh vendor data
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Error updating vendor')
        }
    })

    const handleEdit = () => {
        setEditedVendor({ ...vendor })
        setIsEditModalOpen(true)
    }

    const handleUpdate = () => {
        updateVendorMutation.mutate(editedVendor)
    }

    if (status === 'loading' || isLoading) {
        return (
            <div className="p-6 max-w-[1400px] mx-auto">
                <div className="flex items-center mb-6">
                    <button
                        onClick={() => router.back()}
                        className="mr-4 text-gray-600 hover:text-gray-800"
                    >
                        <FaArrowLeft className="text-xl" />
                    </button>
                    <h1 className="text-2xl font-bold font-outfit">Loading Vendor Details...</h1>
                </div>
            </div>
        )
    }

    if (status === 'unauthenticated') {
        router.push('/login')
        return null
    }

    if (isError) {
        return (
            <div className="p-6 max-w-[1400px] mx-auto">
                <div className="flex items-center mb-6">
                    <button
                        onClick={() => router.back()}
                        className="mr-4 text-gray-600 hover:text-gray-800"
                    >
                        <FaArrowLeft className="text-xl" />
                    </button>
                    <h1 className="text-2xl font-bold font-outfit text-red-500">Error Loading Vendor Details</h1>
                </div>
                <p className="text-red-500 font-poppins">{error?.message || 'Failed to load vendor details'}</p>
            </div>
        )
    }

    if (!vendor) {
        return (
            <div className="p-6 max-w-[1400px] mx-auto">
                <div className="flex items-center mb-6">
                    <button
                        onClick={() => router.back()}
                        className="mr-4 text-gray-600 hover:text-gray-800"
                    >
                        <FaArrowLeft className="text-xl" />
                    </button>
                    <h1 className="text-2xl font-bold font-outfit">Vendor Not Found</h1>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 max-w-[1400px] mx-auto">
            <Toaster position="top-right" />
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <button
                        onClick={() => router.back()}
                        className="mr-4 text-gray-600 hover:text-gray-800"
                    >
                        <FaArrowLeft className="text-xl" />
                    </button>
                    <h1 className="text-2xl font-bold font-outfit">Vendor Details</h1>
                </div>
                <button
                    onClick={handleEdit}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center"
                >
                    <FaEdit className="mr-2" />
                    Edit Vendor
                </button>
            </div>

            <div className="bg-white shadow-md rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Basic Information */}
                    <div className="col-span-full">
                        <h2 className="text-xl font-semibold text-gray-800 font-outfit">Basic Information</h2>
                        <hr className="mb-4" />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {renderDetail('Vendor Name', vendor.vendor_name)}
                            {renderDetail('Category', vendor.category)}
                            {renderDetail('Location', vendor.location)}
                            {renderDetail('Status', vendor.active_status ? 'Active' : 'Inactive')}
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="col-span-full">
                        <h2 className="text-xl font-semibold text-gray-800 font-outfit">Contact Information</h2>
                        <hr className="mb-4" />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {renderDetail('Contact Person', vendor.contact_person)}
                            {renderDetail('Contact Phone', vendor.contact_phone)}
                            {renderDetail('Contact Email', vendor.contact_email)}
                            {renderDetail('Website', vendor.website)}
                        </div>
                    </div>

                    {/* Address Information */}
                    <div className="col-span-full">
                        <h2 className="text-xl font-semibold text-gray-800 font-outfit">Address Information</h2>
                        <hr className="mb-4" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {renderDetail('Address', vendor.address)}
                            {renderDetail('GSTIN', vendor.gstin)}
                            {renderDetail('PAN Number', vendor.pan_number)}
                            {renderDetail('Registration Number', vendor.registration_number)}
                        </div>
                    </div>

                    {/* Banking Information */}
                    <div className="col-span-full">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold text-gray-800 font-outfit">Banking Information</h2>
                            <button
                                onClick={copyBankingInfo}
                                className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                                title="Copy banking information"
                            >
                                <MdContentCopy className="text-lg" />
                                <span className="text-sm">Copy</span>
                            </button>
                        </div>
                        <hr className="mb-4" />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {renderDetail('Bank Name', vendor.bank_name)}
                            {renderDetail('Account Number', vendor.bank_account_number)}
                            {renderDetail('IFSC Code', vendor.ifsc_code)}
                            {renderDetail('Payment Terms', vendor.payment_terms)}
                            {renderDetail('Credit Limit', vendor.credit_limit)}
                        </div>
                    </div>

                    {/* Additional Information */}
                    <div className="col-span-full">
                        <h2 className="text-xl font-semibold text-gray-800 font-outfit">Additional Information</h2>
                        <hr className="mb-4" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {renderDetail('Remarks', vendor.remarks)}
                            
                        </div>
                    </div>

                    {/* Timestamps */}
                   
                </div>
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 h-[80vh] max-w-2xl w-full relative">
                        <div className="flex justify-between items-center mb-6 sticky top-0 bg-white z-10 pb-4 border-b">
                            <h2 className="text-xl font-bold font-outfit">Edit Vendor Details</h2>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="text-gray-500 hover:text-gray-700 text-xl"
                            >
                                ×
                            </button>
                        </div>

                        <div className="overflow-y-auto h-[calc(80vh-8rem)] pb-20">
                            {/* Contact Information */}
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold mb-4 font-outfit">Contact Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                                        <input
                                            type="text"
                                            value={editedVendor.contact_person || ''}
                                            onChange={(e) => setEditedVendor(prev => ({
                                                ...prev,
                                                contact_person: e.target.value
                                            }))}
                                            className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                                        <input
                                            type="text"
                                            value={editedVendor.contact_phone || ''}
                                            onChange={(e) => setEditedVendor(prev => ({
                                                ...prev,
                                                contact_phone: e.target.value
                                            }))}
                                            className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                                        <input
                                            type="email"
                                            value={editedVendor.contact_email || ''}
                                            onChange={(e) => setEditedVendor(prev => ({
                                                ...prev,
                                                contact_email: e.target.value
                                            }))}
                                            className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                                        <input
                                            type="text"
                                            value={editedVendor.website || ''}
                                            onChange={(e) => setEditedVendor(prev => ({
                                                ...prev,
                                                website: e.target.value
                                            }))}
                                            className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Additional Information */}
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold mb-4 font-outfit">Additional Information</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                                        <textarea
                                            value={editedVendor.remarks || ''}
                                            onChange={(e) => setEditedVendor(prev => ({
                                                ...prev,
                                                remarks: e.target.value
                                            }))}
                                            rows={3}
                                            className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Comments</label>
                                        <textarea
                                            value={editedVendor.comments || ''}
                                            onChange={(e) => setEditedVendor(prev => ({
                                                ...prev,
                                                comments: e.target.value
                                            }))}
                                            rows={3}
                                            className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 bg-white p-4 border-t flex justify-end space-x-3">
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdate}
                                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                                disabled={updateVendorMutation.isLoading}
                            >
                                {updateVendorMutation.isLoading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
} 