'use client'

import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import axios from 'axios'
import { FaUsers, FaLaptop, FaBuilding, FaEnvelope, FaSimCard } from 'react-icons/fa'

const fetchUserCount = async (token) => {
  try {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data.length
  } catch (error) {
    console.error('Error fetching user count:', error)
    return 0
  }
}

const fetchAssetCounts = async (token) => {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/assets`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.data
}

const fetchEmailCount = async (token) => {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/emails/count`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.data.total
}

const fetchSimCardCount = async (token) => {
  try {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/simcard-users`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data.users.length
  } catch (error) {
    console.error('Error fetching simcard count:', error)
    return 0
  }
}

export default function DashboardPage() {
  const { data: session } = useSession()

  const { data: userCount = 0, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['userCount'],
    queryFn: () => fetchUserCount(session?.accessToken),
    enabled: !!session?.accessToken,
  })

  const { data: assetCounts = {}, isLoading: isLoadingAssets } = useQuery({
    queryKey: ['assetCounts'],
    queryFn: () => fetchAssetCounts(session?.accessToken),
    enabled: !!session?.accessToken,
  })

  const { data: emailCount = 0, isLoading: isLoadingEmails } = useQuery({
    queryKey: ['emailCount'],
    queryFn: () => fetchEmailCount(session?.accessToken),
    enabled: !!session?.accessToken,
  })

  const { data: simCardCount = 0, isLoading: isLoadingSimCards } = useQuery({
    queryKey: ['simCardCount'],
    queryFn: () => fetchSimCardCount(session?.accessToken),
    enabled: !!session?.accessToken,
  })

  const totalAssets = Object.values(assetCounts).reduce((a, b) => a + b, 0)

  return (
    <div className="flex-1 transition-all duration-300 ease-in-out mx-auto">
      <div className="max-w-full mx-auto p-4 sm:p-6">
        <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>
        
        {/* First row with 3 cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
          {/* Users Card */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Users</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-orange-500">{userCount}</h2>
              </div>
              <div className="bg-orange-100 p-2 sm:p-3 rounded-full">
                <FaUsers className="text-orange-500 text-xl sm:text-2xl" />
              </div>
            </div>
            <div className="mt-4">
              <div className="bg-orange-100 h-1 rounded-full">
                <div className="bg-orange-500 h-1 rounded-full" style={{ width: '70%' }}></div>
              </div>
              <p className="text-gray-500 text-xs sm:text-sm mt-2">Active users in system</p>
            </div>
          </div>

          {/* SIM Cards Card */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total SIM Cards</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-red-500">{simCardCount}</h2>
              </div>
              <div className="bg-red-100 p-2 sm:p-3 rounded-full">
                <FaSimCard className="text-red-500 text-xl sm:text-2xl" />
              </div>
            </div>
            <div className="mt-4">
              <div className="bg-red-100 h-1 rounded-full">
                <div className="bg-red-500 h-1 rounded-full" style={{ width: '70%' }}></div>
              </div>
              <p className="text-gray-500 text-xs sm:text-sm mt-2">Active SIM cards in system</p>
            </div>
          </div>

          {/* Total Assets Card */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Assets</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-blue-500">{totalAssets}</h2>
              </div>
              <div className="bg-blue-100 p-2 sm:p-3 rounded-full">
                <FaLaptop className="text-blue-500 text-xl sm:text-2xl" />
              </div>
            </div>
            <div className="mt-4">
              <div className="bg-blue-100 h-1 rounded-full">
                <div className="bg-blue-500 h-1 rounded-full" style={{ width: '70%' }}></div>
              </div>
              <p className="text-gray-500 text-xs sm:text-sm mt-2">Total assets in system</p>
            </div>
          </div>
        </div>

        {/* Second row with remaining cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Total Branches Card */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Branches</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-green-500">3</h2>
              </div>
              <div className="bg-green-100 p-2 sm:p-3 rounded-full">
                <FaBuilding className="text-green-500 text-xl sm:text-2xl" />
              </div>
            </div>
            <div className="mt-4">
              <div className="bg-green-100 h-1 rounded-full">
                <div className="bg-green-500 h-1 rounded-full" style={{ width: '100%' }}></div>
              </div>
              <p className="text-gray-500 text-xs sm:text-sm mt-2">Mumbai, Nagpur, Pune</p>
            </div>
          </div>

          {/* Total Email IDs Card */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Email IDs</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-purple-500">{emailCount}</h2>
              </div>
              <div className="bg-purple-100 p-2 sm:p-3 rounded-full">
                <FaEnvelope className="text-purple-500 text-xl sm:text-2xl" />
              </div>
            </div>
            <div className="mt-4">
              <div className="bg-purple-100 h-1 rounded-full">
                <div className="bg-purple-500 h-1 rounded-full" style={{ width: '70%' }}></div>
              </div>
              <p className="text-gray-500 text-xs sm:text-sm mt-2">Active email accounts</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
