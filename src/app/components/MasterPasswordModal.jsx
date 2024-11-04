'use client'

import { useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function MasterPasswordModal({ isOpen, onClose, onSuccess, title, actionButtonText }) {
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/master-password/verify`,
        { password }
      )

      if (response.data.valid) {
        onSuccess()
        onClose()
      } else {
        toast.error('Invalid master password')
      }
    } catch (error) {
      toast.error('Error verifying password')
    } finally {
      setIsLoading(false)
      setPassword('')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter master password"
            className="w-full p-2 border rounded mb-4"
            required
          />
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              disabled={isLoading}
            >
              {isLoading ? 'Verifying...' : actionButtonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 