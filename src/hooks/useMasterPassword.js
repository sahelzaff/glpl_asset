import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import toast from 'react-hot-toast'

export const useMasterPassword = (session, onSuccess) => {
    const [showMasterPasswordModal, setShowMasterPasswordModal] = useState(false)
    const [masterPassword, setMasterPassword] = useState('')

    const verifyMasterPassword = useMutation({
        mutationFn: async (password) => {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/verify-master-password`,
                { password },
                { headers: { Authorization: `Bearer ${session?.accessToken}` } }
            )
            return response.data
        },
        onSuccess: (data) => {
            if (data.verified) {
                onSuccess()
                setShowMasterPasswordModal(false)
                setMasterPassword('')
            } else {
                toast.error('Invalid master password')
                setMasterPassword('')
            }
        },
        onError: (error) => {
            toast.error('Error verifying master password')
            setMasterPassword('')
        }
    })

    const MasterPasswordModal = ({ title = "Enter Master Password", actionButtonText = "Confirm" }) => (
        showMasterPasswordModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full">
                    <h2 className="text-xl font-bold mb-4 font-outfit">{title}</h2>
                    <form 
                        onSubmit={(e) => {
                            e.preventDefault()
                            verifyMasterPassword.mutate(masterPassword)
                        }} 
                        autoComplete="off"
                        spellCheck="false"
                        className="credential-form"
                    >
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2 font-poppins">
                                Master Password
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={masterPassword}
                                    onChange={(e) => setMasterPassword(e.target.value)}
                                    className="w-full p-2 border rounded font-poppins password-input"
                                    autoFocus
                                    autoComplete="off"
                                    autoCapitalize="off"
                                    autoCorrect="off"
                                    spellCheck="false"
                                    data-form-type="other"
                                    style={{
                                        WebkitTextSecurity: 'disc',
                                        MozTextSecurity: 'disc'
                                    }}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowMasterPasswordModal(false)
                                    setMasterPassword('')
                                }}
                                className="px-4 py-2 border rounded text-gray-700 font-poppins hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 font-poppins"
                                disabled={verifyMasterPassword.isLoading}
                            >
                                {verifyMasterPassword.isLoading ? 'Verifying...' : actionButtonText}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )
    )

    return {
        showMasterPasswordModal,
        setShowMasterPasswordModal,
        MasterPasswordModal
    }
} 