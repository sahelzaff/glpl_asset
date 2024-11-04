'use client'

import { useQuery, useMutation } from '@tanstack/react-query'
import axios from 'axios'
import Select from 'react-select'
import toast from 'react-hot-toast'

export default function ForwardEmailModal({ 
    isOpen, 
    onClose, 
    session, 
    userEmail,
    onForwardComplete 
}) {
    const { data: activeEmails = [] } = useQuery({
        queryKey: ['activeEmails'],
        queryFn: async () => {
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/emails/active`,
                { headers: { Authorization: `Bearer ${session?.accessToken}` } }
            )
            return response.data.filter(email => email.email_address !== userEmail?.email_address)
        },
        enabled: !!session?.accessToken && isOpen && !!userEmail,
    })

    const forwardEmailMutation = useMutation({
        mutationFn: async ({ emailId, forwardTo }) => {
            const response = await axios.put(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/emails/${emailId}/forward`,
                { forward_to: forwardTo },
                { headers: { Authorization: `Bearer ${session?.accessToken}` } }
            )
            return response.data
        },
        onSuccess: () => {
            toast.success('Email forwarded successfully')
            onForwardComplete()
            onClose()
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Error forwarding email')
        }
    })

    const handleForward = (selectedOption) => {
        if (!selectedOption) {
            toast.error('Please select an email to forward to')
            return
        }
        forwardEmailMutation.mutate({
            emailId: userEmail.email_id,
            forwardTo: selectedOption.value
        })
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <h2 className="text-xl font-bold mb-4">Forward Email</h2>
                <p className="mb-4">
                    Select an active email address to forward {userEmail?.email_address} to:
                </p>
                <div className="mb-4">
                    <Select
                        options={activeEmails.map(email => ({
                            value: email.email_address,
                            label: email.email_address
                        }))}
                        onChange={(selected) => handleForward(selected)}
                        className="basic-select"
                        classNamePrefix="select"
                        placeholder="Select email to forward to..."
                    />
                </div>
                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    )
} 