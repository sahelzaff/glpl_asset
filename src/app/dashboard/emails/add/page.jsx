'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import axios from 'axios'
import Select from 'react-select'
import { FaEye, FaEyeSlash } from 'react-icons/fa'
import toast from 'react-hot-toast'
import { Toaster } from 'react-hot-toast'

const fetchUsers = async (token) => {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/emails/users`, {
        headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
}

// Available email domains
const EMAIL_DOMAINS = [
    { value: '@goodrichlogistics.com', label: '@goodrichlogistics.com' },
    { value: '@goodrich-me.com', label: '@goodrich-me.com' },
    { value: '@goodrichindia.com', label: '@goodrichindia.com' },
    { value: '@seahorsemaritimo.com', label: '@seahorsemaritimo.com' },
    { value: '@intshiplog.com', label: '@intshiplog.com' },
    { value: '@dragonmaritimo.com', label: '@dragonmaritimo.com' }
]

export default function AddEmail() {
    const { data: session } = useSession()
    const router = useRouter()
    const [emailPrefix, setEmailPrefix] = useState('')
    const [selectedDomain, setSelectedDomain] = useState(EMAIL_DOMAINS[0])
    const [formData, setFormData] = useState({
        email_address: '',
        email_password: '',
        assigned_users: []
    })
    const [showPassword, setShowPassword] = useState(false)

    const { data: users = [] } = useQuery({
        queryKey: ['users'],
        queryFn: () => fetchUsers(session?.accessToken),
        enabled: !!session?.accessToken,
    })

    const createEmailMutation = useMutation({
        mutationFn: async (data) => {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/emails`,
                data,
                {
                    headers: { Authorization: `Bearer ${session?.accessToken}` }
                }
            )
            return response.data
        },
        onSuccess: () => {
            toast.success('Email account created successfully!')
            setTimeout(() => {
                router.push('/dashboard/emails')
            }, 2000)
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Error creating email account')
        }
    })

    const handleSubmit = (e) => {
        e.preventDefault()
        const fullEmail = emailPrefix + selectedDomain.value
        createEmailMutation.mutate({
            ...formData,
            email_address: fullEmail,
            assigned_users: formData.assigned_users.map(id => parseInt(id))
        })
    }

    const userOptions = users.map(user => ({
        value: parseInt(user.id),
        label: user.name
    }))

    return (
        <div className="max-w-[1400px] mx-auto py-6">
            <Toaster position="top-right" />
            <h1 className="text-2xl font-bold mb-6 font-outfit">Add New Email</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="w-full">
                        <label className="block text-sm font-medium text-gray-700 font-poppins">Email Address</label>
                        <div className="flex">
                            <input
                                type="text"
                                required
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

                    <div className="w-full">
                        <label className="block text-sm font-medium text-gray-700 font-poppins">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                className="shadow appearance-none border rounded w-full py-1.5 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
                                value={formData.email_password}
                                onChange={(e) => setFormData(prev => ({ ...prev, email_password: e.target.value }))}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                            >
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                    </div>

                    <div className="w-full">
                        <label className="block text-sm font-medium text-gray-700 font-poppins">Assign Users</label>
                        <Select
                            isMulti
                            options={userOptions}
                            className="mt-1"
                            onChange={(selected) => setFormData(prev => ({
                                ...prev,
                                assigned_users: selected.map(option => option.value)
                            }))}
                        />
                    </div>
                </div>

                <div className="flex justify-end space-x-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                        disabled={createEmailMutation.isLoading || !emailPrefix.trim()}
                    >
                        {createEmailMutation.isLoading ? 'Creating...' : 'Create Email'}
                    </button>
                </div>
            </form>
        </div>
    )
} 