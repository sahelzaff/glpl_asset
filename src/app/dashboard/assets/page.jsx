'use client'

import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import axios from 'axios'
import Link from 'next/link'
import { FaLaptop, FaDesktop, FaPrint, FaTv, FaWifi, FaServer, FaVideo, FaQuestionCircle, FaPlus } from 'react-icons/fa'

const fetchAssetCounts = async (token) => {
  if (!token) {
    throw new Error('No token available')
  }
  const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/assets`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.data
}

const getCategoryIcon = (category) => {
  switch(category?.toLowerCase()) {
    case 'laptop': return <FaLaptop className="mr-2" />;
    case 'desktop': return <FaDesktop className="mr-2" />;
    case 'printer': return <FaPrint className="mr-2" />;
    case 'tv': return <FaTv className="mr-2" />;
    case 'ap': return <FaWifi className="mr-2" />;
    case 'ucm': return <FaServer className="mr-2" />;
    case 'dvr':
    case 'camera': return <FaVideo className="mr-2" />;
    default: return <FaQuestionCircle className="mr-2" />;
  }
}

export default function Assets() {
  const { data: session, status } = useSession()

  const { data: assetCounts, isLoading, isError, error } = useQuery({
    queryKey: ['assetCounts'],
    queryFn: () => fetchAssetCounts(session?.accessToken),
    enabled: !!session?.accessToken,
    retry: false,
  })

  if (status === 'loading') return <div>Loading session...</div>
  if (status === 'unauthenticated') return <div>Please log in to view assets.</div>
  if (isLoading) return <div>Loading assets...</div>
  if (isError) return <div>Error fetching asset counts: {error.message}</div>

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold font-outfit">Asset Categories</h1>
        <Link
          href="/dashboard/assets/add"
          className="bg-[#C7092C] hover:bg-[#9A0724] text-white font-bold py-2 px-4 rounded flex items-center"
        >
          <FaPlus className="inline-block mr-2" />
          Add New Asset
        </Link>
      </div>
      {assetCounts && Object.keys(assetCounts).length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(assetCounts).map(([category, count]) => (
            <Link href={`/dashboard/assets/${encodeURIComponent(category)}`} key={category}>
              <div className="bg-white shadow-md rounded-lg p-4 hover:shadow-lg transition-shadow">
                <h2 className="text-xl font-semibold mb-2 flex items-center">
                  {getCategoryIcon(category)}
                  {category || 'Uncategorized'}
                </h2>
                <p>Total: {count}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p>No asset categories found.</p>
      )}
    </div>
  )
}
