'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast, { Toaster } from 'react-hot-toast'

const categories = [
  'Laptop',
  'Desktop',
  'Camera',
  'DVR',
  'Printer',
  'UCM',
  'TV',
  'AP'
]

// Base fields from MasterAssets table
const baseFields = {
  HostName: '',
  Brand: '',
  Model: '',
  SerialNo: '',
  Status: 'Active',
  Location: 'Mumbai',
  Category: ''
}

// Category-specific fields
const categoryFields = {
  Laptop: {
    RAM: '',
    Storage: '',
    Processor: '',
    ProcessorDetail: '',
    OperatingSystem: '',
    OperatingSystemVersion: '',
    OperatingSystemLicenseKey: '',
    LaptopPassword: '',
    MsOffice: '',
    Antivirus: '',
    WarrantyStatus: '',
    WarrantyDate: '',
    PurchasedDate: '',
    Vendor: '',
    Remarks: '',
    Comments: ''
  },
  Desktop: {
    RAM: '',
    Storage: '',
    Processor: '',
    ProcessorDetail: '',
    OperatingSystem: '',
    OperatingSystemVersion: '',
    OperatingSystemLicenseKey: '',
    DesktopPassword: '',
    MsOffice: '',
    Antivirus: '',
    WarrantyStatus: '',
    WarrantyDate: '',
    PurchasedDate: '',
    Vendor: '',
    Remarks: '',
    Comments: ''
  },
  Camera: {
    Resolution: '',
    LensType: '',
    IpAddress: '',
    SensorType: '',
    OpticalZoom: '',
    DigitalZoom: '',
    Connectivity: '',
    StorageType: '',
    VideoCapability: '',
    PowerSource: '',
    CameraUserName: '',
    CameraPassword: '',
    WarrantyStatus: '',
    WarrantyDate: '',
    PurchasedDate: '',
    Vendor: '',
    Remarks: '',
    Comments: ''
  },
  DVR: {
    ChannelsSupported: '',
    StorageCapacity: '',
    RecordingResolution: '',
    FirmwareVersion: '',
    IpAddress: '',
    MacAddress: '',
    NetworkConnectivity: '',
    LoginUserName: '',
    LoginPassword: '',
    WarrantyStatus: '',
    WarrantyDate: '',
    PurchasedDate: '',
    Vendor: '',
    Remarks: '',
    Comments: ''
  },
  Printer: {
    PrinterType: '',
    ColorPrinting: '',
    DuplexPrinting: '',
    MaxResolution: '',
    Connectivity: '',
    IpAddress: '',
    MacAddress: '',
    SupportedPaperSizes: '',
    TonerOrInkModel: '',
    TrayCapacity: '',
    FirmwareVersion: '',
    WarrantyStatus: '',
    WarrantyDate: '',
    PurchasedDate: '',
    Vendor: '',
    Remarks: '',
    Comments: ''
  },
  UCM: {
    IpAddress: '',
    MacAddress: '',
    Model: '',
    FirmwareVersion: '',
    Username: '',
    Password: '',
    ExtensionNumber: '',
    VoIPProvider: '',
    WarrantyStatus: '',
    WarrantyDate: '',
    PurchasedDate: '',
    Vendor: '',
    Remarks: '',
    Comments: ''
  },
  TV: {
    ScreenSize: '',
    DisplaySize: '',
    Resolution: '',
    SmartTV: '',
    OperatingSystem: '',
    HdmiPorts: '',
    UsbPorts: '',
    WifiEnabled: '',
    MacAddress: '',
    IpAddress: '',
    FirmwareVersion: '',
    WarrantyStatus: '',
    WarrantyDate: '',
    PurchasedDate: '',
    Vendor: '',
    Remarks: '',
    Comments: ''
  },
  AP: {
    IpAddress: '',
    MacAddress: '',
    SSID: '',
    FrequencyBand: '',
    SupportedStandards: '',
    FirmwareVersion: '',
    NumberOfAntennas: '',
    EncryptionType: '',
    LoginUserName: '',
    LoginPassword: '',
    WarrantyDate: '',
    PurchasedDate: '',
    Vendor: '',
    Remarks: '',
    Comments: ''
  }
}

const statusOptions = ['Active', 'In Stock', 'Repairing', 'Not Functional']
const locationOptions = ['Mumbai', 'Nagpur', 'Pune']

const hddOptions = [
  '500GB HDD',
  '1TB HDD',
  '120GB SSD',
  '240GB SSD',
  '256GB SSD',
  '512GB SSD',
  '1TB SSD',
  '500GB HDD + 256GB SSD Sata',
  '1TB HDD + 256GB SSD Sata',
  '500GB HDD + 512GB SSD Sata',
  '1TB HDD + 512GB SSD Sata',
  '500GB HDD + 256GB SSD Nvme',
  '1TB HDD + 256GB SSD Nvme',
  '500GB HDD + 512GB SSD Nvme',
  '1TB HDD + 512GB SSD Nvme'
];

const ramOptions = ['4GB', '8GB', '12GB', '16GB', '32GB'];
const operatingSystemOptions = [
  'Windows 7',
  'Windows 8.1',
  'Windows 10',
  'Windows 11'
];
const msOfficeOptions = ['Office 365', 'Office 2019', 'Office 2016', 'None'];
const antivirusOptions = ['Sophos AV', 'None'];

const laptopBrands = ['Dell', 'HP', 'Lenovo'];

const operatingSystemVersionOptions = ['Pro', 'Home', 'Enterprise'];

export default function AddAsset() {
  const { data: session } = useSession()
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState('')
  const [formData, setFormData] = useState(baseFields)

  const handleCategoryChange = (category) => {
    setSelectedCategory(category)
    setFormData({
      ...baseFields,
      Category: category,
      ...(categoryFields[category] || {})
    })
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/assets/${selectedCategory}`,
        formData,
        {
          headers: { 
            Authorization: `Bearer ${session?.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      toast.success('Asset added successfully')
      router.push('/dashboard/assets')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error adding asset')
    }
  }

  const renderField = (name, value) => {
    const label = name.replace(/([A-Z])/g, ' $1').trim()
    
    const selectClass = "shadow appearance-none border rounded w-full py-1.5 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm pr-8"
    
    // Add dropdown arrow for select elements
    const renderSelect = (options) => (
      <div className="relative">
        <select
          name={name}
          value={value}
          onChange={handleInputChange}
          className={selectClass}
          required
        >
          <option value="">Select {label}</option>
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

    // Add Brand dropdown for Laptop category
    if (name === 'Brand' && selectedCategory === 'Laptop') {
      return (
        <div className="mb-3">
          <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor={name}>
            {label}
          </label>
          {renderSelect(laptopBrands)}
        </div>
      )
    }

    // Handle specific dropdowns
    if (name === 'Storage' && (selectedCategory === 'Laptop' || selectedCategory === 'Desktop')) {
      return (
        <div className="mb-3">
          <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor={name}>
            {label}
          </label>
          {renderSelect(hddOptions)}
        </div>
      )
    }

    if (name === 'RAM' && (selectedCategory === 'Laptop' || selectedCategory === 'Desktop')) {
      return (
        <div className="mb-3">
          <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor={name}>
            {label}
          </label>
          {renderSelect(ramOptions)}
        </div>
      )
    }

    if (name === 'OperatingSystem' && (selectedCategory === 'Laptop' || selectedCategory === 'Desktop')) {
      return (
        <div className="mb-3">
          <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor={name}>
            {label}
          </label>
          {renderSelect(operatingSystemOptions)}
        </div>
      )
    }

    if (name === 'MsOffice' && (selectedCategory === 'Laptop' || selectedCategory === 'Desktop')) {
      return (
        <div className="mb-3">
          <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor={name}>
            {label}
          </label>
          {renderSelect(msOfficeOptions)}
        </div>
      )
    }

    if (name === 'Antivirus' && (selectedCategory === 'Laptop' || selectedCategory === 'Desktop')) {
      return (
        <div className="mb-3">
          <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor={name}>
            {label}
          </label>
          {renderSelect(antivirusOptions)}
        </div>
      )
    }

    if (name === 'OperatingSystemVersion' && (selectedCategory === 'Laptop' || selectedCategory === 'Desktop')) {
      return (
        <div className="mb-3">
          <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor={name}>
            {label}
          </label>
          {renderSelect(operatingSystemVersionOptions)}
        </div>
      )
    }

    if (name === 'Status') {
      return (
        <div className="mb-3">
          <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor={name}>
            {label}
          </label>
          {renderSelect(statusOptions)}
        </div>
      )
    }

    if (name === 'Location') {
      return (
        <div className="mb-3">
          <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor={name}>
            {label}
          </label>
          {renderSelect(locationOptions)}
        </div>
      )
    }

    if (name.toLowerCase().includes('password')) {
      return (
        <div className="mb-3">
          <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor={name}>
            {label}
          </label>
          <input
            type="password"
            name={name}
            value={value}
            onChange={handleInputChange}
            className="shadow appearance-none border rounded w-full py-1.5 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
          />
        </div>
      )
    }

    if (name.includes('Date')) {
      return (
        <div className="mb-3">
          <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor={name}>
            {label}
          </label>
          <input
            type="date"
            name={name}
            value={value}
            onChange={handleInputChange}
            className="shadow appearance-none border rounded w-full py-1.5 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
          />
        </div>
      )
    }

    if (name === 'Remarks' || name === 'Comments') {
      return (
        <div className="mb-3">
          <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor={name}>
            {label}
          </label>
          <textarea
            name={name}
            value={value}
            onChange={handleInputChange}
            className="shadow appearance-none border rounded w-full py-1.5 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
            rows="2"
          />
        </div>
      )
    }

    return (
      <div className="mb-3">
        <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor={name}>
          {label}
        </label>
        <input
          type="text"
          name={name}
          value={value}
          onChange={handleInputChange}
          className="shadow appearance-none border rounded w-full py-1.5 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
        />
      </div>
    )
  }

  return (
    <div className="p-4 w-full max-w-[1400px] mx-auto">
      <Toaster position="top-right" />
      <h1 className="text-2xl font-bold mb-4 font-outfit">Add New Asset</h1>
      
      <div className="mb-4 max-w-md">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Select Category
        </label>
        <select
          value={selectedCategory}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          required
        >
          <option value="">Select a category</option>
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      {selectedCategory && (
        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Base Fields */}
            {Object.entries(baseFields).map(([name, value]) => (
              name !== 'Category' && (
                <div key={name} className="w-full">
                  {renderField(name, formData[name])}
                </div>
              )
            ))}
            
            {/* Category-specific Fields */}
            {Object.entries(categoryFields[selectedCategory] || {}).map(([name, value]) => (
              <div key={name} className={`w-full ${
                name === 'Remarks' || name === 'Comments' ? 'md:col-span-2 lg:col-span-3' : ''
              }`}>
                {renderField(name, formData[name])}
              </div>
            ))}
          </div>

          <div className="flex justify-end mt-6">
            <button
              type="button"
              onClick={() => router.push('/dashboard/assets')}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-1.5 px-4 rounded mr-2 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1.5 px-4 rounded text-sm"
            >
              Add Asset
            </button>
          </div>
        </form>
      )}
    </div>
  )
} 