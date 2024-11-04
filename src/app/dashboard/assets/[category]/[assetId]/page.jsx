'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { FaEdit, FaTrash, FaEye, FaEyeSlash } from 'react-icons/fa'
import toast, { Toaster } from 'react-hot-toast'
import { useMasterPassword } from '@/hooks/useMasterPassword'

const fetchAssetDetails = async (token, category, assetId) => {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/assets/${category}/${assetId}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.data
}

const updateAsset = async ({ token, category, assetId, updatedData }) => {
  const response = await axios.put(`${process.env.NEXT_PUBLIC_BACKEND_URL}/assets/${category}/${assetId}`, updatedData, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.data
}

const UserBadge = ({ name }) => (
  <span className="bg-blue-500 text-white px-2 py-1 rounded-full mr-2 mb-2 inline-block">
    {name.trim()}
  </span>
)

const parseUsers = (userString) => {
  if (!userString) return { currentUser: '', previousUsers: [] }

  const users = userString.split(/[/\\]/)
  const currentUser = users[users.length - 1].trim()
  const previousUsers = users.slice(0, -1).map(user => user.trim()).filter(Boolean)

  return { currentUser, previousUsers }
}

const statusOptions = ['Active', 'In Stock', 'Repairing', 'Not Functional']
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

const warrantyStatusOptions = ['In Warranty', 'Out of Warranty']
const msOfficeOptions = ['Office 365', 'Office 2019', 'Office 2016', 'None']
const antivirusOptions = ['Sophos AV', 'None']
const operatingSystemOptions = [
  'Windows 7',
  'Windows 8.1',
  'Windows 10',
  'Windows 11'
];
const operatingSystemVersionOptions = ['Pro', 'Home', 'Enterprise'];
const ramOptions = ['4GB', '8GB', '12GB', '16GB', '32GB'];
const locationOptions = ['Mumbai', 'Nagpur', 'Pune'];


export default function AssetDetails() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const { category, assetId } = params
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editedAsset, setEditedAsset] = useState(null)
  const [changedFields, setChangedFields] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showEditPassword, setShowEditPassword] = useState({});
  const [actionType, setActionType] = useState(null)

  const queryClient = useQueryClient()

  const { data: asset, isLoading, isError, error } = useQuery({
    queryKey: ['asset', category, assetId],
    queryFn: () => fetchAssetDetails(session?.accessToken, category, assetId),
    enabled: !!session?.accessToken && !!category && !!assetId,
  })

  const updateAssetMutation = useMutation({
    mutationFn: updateAsset,
    onSuccess: () => {
      queryClient.invalidateQueries(['asset', category, assetId])
      setIsEditModalOpen(false)
      toast.success('Asset updated successfully')
    },
    onError: (error) => {
      toast.error(`Error updating asset: ${error.message}`)
    },
  })

  const deleteAssetMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/assets/${category}/${assetId}`,
        {
          headers: { Authorization: `Bearer ${session?.accessToken}` }
        }
      )
      return response.data
    },
    onSuccess: () => {
      toast.success('Asset deleted successfully')
      router.push(`/dashboard/assets/${category}`)
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error deleting asset')
    }
  })

  const handleMasterPasswordSuccess = () => {
    if (actionType === 'delete') {
      deleteAssetMutation.mutate()
    } else if (actionType === 'password') {
      setShowPassword(true)
      // Auto-hide password after 30 seconds
      setTimeout(() => {
        setShowPassword(false)
      }, 30000)
    }
  }

  const { showMasterPasswordModal, setShowMasterPasswordModal, MasterPasswordModal } = useMasterPassword(
    session,
    handleMasterPasswordSuccess
  )

  useEffect(() => {
    let timer
    if (showPassword) {
      timer = setTimeout(() => {
        setShowPassword(false)
      }, 3000)
    }
    return () => clearTimeout(timer)
  }, [showPassword])

  if (isLoading) return <div>Loading...</div>
  if (isError) return <div>Error fetching asset details: {error.message}</div>

  const handleEdit = () => {
    const { AssetsId, ...editableAsset } = asset;
    setEditedAsset(editableAsset);
    setIsEditModalOpen(true);
    setShowEditPassword({});
  }

  const handleDelete = () => {
    setActionType('delete')
    setShowMasterPasswordModal(true)
  }

  const handlePasswordView = () => {
    setActionType('password')
    setShowMasterPasswordModal(true)
  }

  const handleInputChange = (key, value) => {
    setEditedAsset(prev => ({ ...prev, [key]: value }));
    if (value !== asset[key]) {
      setChangedFields(prev => ({ ...prev, [key]: value }));
    } else {
      setChangedFields(prev => {
        const { [key]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleUpdate = () => {
    if (Object.keys(changedFields).length === 0) {
      toast.info('No changes to update');
      return;
    }
    updateAssetMutation.mutate({
      token: session?.accessToken,
      category,
      assetId,
      updatedData: changedFields,
    });
  };

  const { currentUser, previousUsers } = parseUsers(asset?.Alloted_User_Name)

  const renderFormField = (key, value) => {
    const selectClass = "shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline pr-8 bg-white";
    const inputClass = "shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline";

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
    );

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
    );

    switch (key) {
      case 'Status':
        return renderSelect(statusOptions);
      case 'Storage':
        return renderSelect(hddOptions);
      case 'WarrantyStatus':
        return renderSelect(warrantyStatusOptions);
      case 'MsOffice':
        return renderSelect(msOfficeOptions);
      case 'Antivirus':
        return renderSelect(antivirusOptions);
      case 'OperatingSystem':
        return renderSelect(operatingSystemOptions);
      case 'OperatingSystemVersion':
        return renderSelect(operatingSystemVersionOptions);
      case 'RAM':
        return renderSelect(ramOptions);
      case 'Location':
        return renderSelect(locationOptions);
      case 'WarrantyDate':
      case 'PurchaseDate':
        return (
          <input
            type="date"
            id={key}
            value={value}
            onChange={(e) => handleInputChange(key, e.target.value)}
            className={inputClass}
          />
        );
      case 'LaptopPassword':
      case 'DesktopPassword':
      case 'LoginPassword':
      case 'CameraPassword':
        return renderPasswordInput();
      default:
        return (
          <input
            type="text"
            id={key}
            value={value}
            onChange={(e) => handleInputChange(key, e.target.value)}
            className={inputClass}
          />
        );
    }
  };

  const renderAssetDetails = () => {
    switch (category.toLowerCase()) {
      case 'laptop':
        return (
          <>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Host Name:</span> {asset.HostName}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Brand:</span> {asset.Brand}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Model:</span> {asset.Model}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Serial No:</span> {asset.SerialNo}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Storage:</span> {asset.Storage}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Ram:</span> {asset.RAM}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Processor:</span> {asset.Processor} {asset.ProcessorDetail}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Location:</span> {asset.Location}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Status:</span> {asset.Status}</p>
            <p className="font-medium font-poppins">
              <span className="font-semibold font-poppins">Laptop Password:</span>
              <span className="ml-2">
                {showPassword ? asset.LaptopPassword : '••••••••'}
              </span>
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="ml-2 text-black hover:text-grey-300"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Vendor:</span> {asset.Vendor}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Purchase Date:</span> {asset.PurchaseDate}</p>
          </>
        )
      case 'desktop':
        return (
          <>
          <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Host Name:</span> {asset.HostName}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Brand:</span> {asset.Brand}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Model:</span> {asset.Model}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Serial No:</span> {asset.SerialNo}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Storage:</span> {asset.Storage}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Ram:</span> {asset.RAM}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Processor:</span> {asset.Processor} {asset.ProcessorDetail}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Location:</span> {asset.Location}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Status:</span> {asset.Status}</p>
            <p className="font-medium font-poppins">
              <span className="font-semibold font-poppins">Desktop Password:</span>
              <span className="ml-2">
                {showPassword ? asset.DesktopPassword : '••••••••'}
              </span>
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="ml-2 text-black hover:text-grey-300"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Vendor:</span> {asset.Vendor}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Purchase Date:</span> {asset.PurchaseDate}</p>
          </>
        )
      case 'camera':
        return (
          <>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Brand:</span> {asset.Brand}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Category:</span> {asset.Category}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Model:</span> {asset.Model}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Location:</span> {asset.Location}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Serial No:</span> {asset.SerialNo}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Resolution:</span> {asset.Resolution}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Lens Type:</span> {asset.LensType}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">IP Address:</span> {asset.IpAddress}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Sensor Type:</span> {asset.SensorType}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Optical Zoom:</span> {asset.OpticalZoom}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Digital Zoom:</span> {asset.DigitalZoom}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Connectivity:</span> {asset.Connectivity}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Storage Type:</span> {asset.StorageType}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Power Source:</span> {asset.PowerSource}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Camera Username:</span> {asset.CameraUserName}</p>
            <p className="font-medium font-poppins">
              <span className="font-semibold font-poppins">Camera Password:</span>
              <span className="ml-2">
                {showPassword ? asset.CameraPassword : '••••••••'}
              </span>
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="ml-2 text-black hover:text-grey-300"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Purchased Date:</span> {asset.PurchaseDate}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Vendor:</span> {asset.Vendor}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Warranty:</span> {asset.WarrantyStatus}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Warranty Start Date:</span> {asset.WarrantyDate}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Status:</span> {asset.Status}</p>
          </>
        )
      case 'ap':
        return (
          <>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Brand:</span> {asset.Brand}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Category:</span> {asset.Category}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Model:</span> {asset.Model}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Serial No:</span> {asset.SerialNo}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">IP Address:</span> {asset.IpAddress}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">MAC Address:</span> {asset.MacAddress}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">SSID:</span> {asset.SSID}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Frequency Band:</span> {asset.FrequencyBand}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Supported Standards:</span> {asset.SupportedStandards}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Firmware Version:</span> {asset.FirmwareVersion}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Number of Antennas:</span> {asset.NumberOfAntennas}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Encryption Type:</span> {asset.EncryptionType}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Login Username:</span> {asset.LoginUserName}</p>
            <p className="font-medium font-poppins">
              <span className="font-semibold font-poppins">Login Password:</span>
              <span className="ml-2">
                {showPassword ? asset.LoginPassword : '••••••••'}
              </span>
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="ml-2 text-black hover:text-grey-300"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Warranty Date:</span> {asset.WarrantyDate}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Vendor:</span> {asset.Vendor}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Purchase Date:</span> {asset.PurchaseDate}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Status:</span> {asset.Status}</p>
          </>
        )
      case 'printer':
        return (
          <>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Brand:</span> {asset.Brand}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Category:</span> {asset.Category}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Model:</span> {asset.Model}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Serial No:</span> {asset.SerialNo}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Printer Type:</span> {asset.PrinterType}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Color Printing:</span> {asset.ColorPrinting}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Duplex Printing:</span> {asset.DuplexPrinting}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Max Resolution:</span> {asset.MaxResolution}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Connectivity:</span> {asset.Connectivity}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">IP Address:</span> {asset.IpAddress}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">MAC Address:</span> {asset.MacAddress}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Supported Paper Sizes:</span> {asset.SupportedPaperSizes}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Toner/Ink Model:</span> {asset.TonerOrInkModel}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Tray Capacity:</span> {asset.TrayCapacity}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Firmware Version:</span> {asset.FirmwareVersion}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Warranty Status:</span> {asset.WarrantyStatus}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Warranty Date:</span> {asset.WarrantyDate}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Vendor:</span> {asset.Vendor}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Purchase Date:</span> {asset.PurchaseDate}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Status:</span> {asset.Status}</p>
          </>
        )
      case 'ip_phone':
        return (
          <>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Brand:</span> {asset.Brand}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Category:</span> {asset.Category}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Model:</span> {asset.Model}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Serial No:</span> {asset.SerialNo}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">IP Address:</span> {asset.IpAddress}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">MAC Address:</span> {asset.MacAddress}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Firmware Version:</span> {asset.FirmwareVersion}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Warranty Status:</span> {asset.WarrantyStatus}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Warranty Date:</span> {asset.WarrantyDate}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Vendor:</span> {asset.Vendor}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Purchase Date:</span> {asset.PurchaseDate}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Status:</span> {asset.Status}</p>
          </>
        )
      case 'tv':
        return (
          <>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Brand:</span> {asset.Brand}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Category:</span> {asset.Category}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Model:</span> {asset.Model}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Serial No:</span> {asset.SerialNo}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Screen Size:</span> {asset.ScreenSize}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Display Size:</span> {asset.DisplaySize}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Resolution:</span> {asset.Resolution}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Smart TV:</span> {asset.SmartTV}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Operating System:</span> {asset.OperatingSystem}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">HDMI Ports:</span> {asset.HdmiPorts}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">USB Ports:</span> {asset.UsbPorts}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">WiFi Enabled:</span> {asset.WifiEnabled}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">MAC Address:</span> {asset.MacAddress}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">IP Address:</span> {asset.IpAddress}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Firmware Version:</span> {asset.FirmwareVersion}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Warranty Status:</span> {asset.WarrantyStatus}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Warranty Date:</span> {asset.WarrantyDate}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Vendor:</span> {asset.Vendor}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Purchase Date:</span> {asset.PurchaseDate}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Status:</span> {asset.Status}</p>
          </>
        )
      case 'dvr':
        return (
          <>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Brand:</span> {asset.Brand}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Category:</span> {asset.Category}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Model:</span> {asset.Model}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Serial No:</span> {asset.SerialNo}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Channels Supported:</span> {asset.ChannelsSupported}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Storage Capacity:</span> {asset.StorageCapacity}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Recording Resolution:</span> {asset.RecordingResolution}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Firmware Version:</span> {asset.FirmwareVerison}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">IP Address:</span> {asset.IpAddress}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">MAC Address:</span> {asset.MacAddress}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Network Connectivity:</span> {asset.NetworkConnectivity}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Login Username:</span> {asset.LoginUserName}</p>
            <p className="font-medium font-poppins">
              <span className="font-semibold font-poppins">Login Password:</span>
              <span className="ml-2">
                {showPassword ? asset.LoginPassword : '••••••••'}
              </span>
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="ml-2 text-black hover:text-grey-300"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Warranty Status:</span> {asset.WarrantyStatus}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Warranty Date:</span> {asset.WarrantyDate}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Vendor:</span> {asset.Vendor}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Purchase Date:</span> {asset.PurchaseDate}</p>
            <p className="font-medium font-poppins"><span className="font-semibold font-poppins">Status:</span> {asset.Status}</p>
          </>
        )
      default:
        return null
    }
  }

  const renderPassword = () => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700">Password</label>
      <div className="flex items-center">
        <span className="mr-2">
          {showPassword ? asset.password : '••••••••'}
        </span>
        <button
          onClick={handlePasswordView}
          className="text-gray-600 hover:text-gray-800"
        >
          {showPassword ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>
    </div>
  )

  return (
    <div className="py-6 px-4 md:px-8 lg:px-0 max-w-[1400px] mx-auto">
      <Toaster position="top-right" />
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-4xl font-bold font-outfit">Asset Details</h1>
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
      {asset ? (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-semibold font-outfit">Asset Info</h2>
          <hr className="mb-4 mt-1 border-t border-gray-300" />
          <div className="grid grid-cols-2 gap-2">
            <p className="font-medium font-poppins">
              <span className="font-semibold font-poppins">Current User:</span> 
              {asset.CurrentUser || 'Unassigned'}
            </p>
            {renderAssetDetails()}
          </div>

          {(asset.Category === 'Desktop' || asset.Category === 'Laptop') && (
            <div className="mt-6">
              <h3 className="text-2xl font-bold font-outfit mt-10">Software Information</h3>
              <hr className="mb-4 mt-1 border-t border-gray-300" />
              <div className="grid grid-cols-2 gap-2">
                <p className="font-medium font-poppins"><span className="font-semibold 
                font-poppins">Ms Office:</span> {asset.MsOffice}</p>
                <p className="font-medium font-poppins"><span className="font-semibold 
                font-poppins">AntiVirus:</span> {asset.Antivirus}</p>
                <p className="font-medium font-poppins"><span className="font-semibold 
                font-poppins">Operating System:</span> {asset.OperatingSystem}</p>
                <p className="font-medium font-poppins"><span className="font-semibold 
                font-poppins">Operating System Version:</span> {asset.OperatingSystemVersion}</p>
                <p className="font-medium font-poppins"><span className="font-semibold 
                font-poppins">Operating System License Key:</span> {asset.
                OperatingSystemLicenseKey}</p>
              </div>
            </div>
          )}
          
          <div className="mt-6">
            <h3 className="text-2xl font-bold font-outfit mt-10">Additional Information</h3>
            <hr className="mb-4 mt-1 border-t border-gray-300" />
            <div className="grid grid-cols-2 gap-2">
              <p><span className="font-medium">Remarks:</span> {asset.Remarks}</p>
              <p><span className="font-medium">Comments:</span> {asset.Comments}</p>
            </div>
          </div>
        </div>
      ) : (
        <p>No asset details found.</p>
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
          <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col my-6">
            <div className="sticky top-0 bg-white z-10 p-6 border-b">
              <h3 className="text-lg font-bold">Edit Asset</h3>
            </div>
            <div className="p-6 overflow-y-auto flex-grow">
              <form onSubmit={(e) => { e.preventDefault(); handleUpdate(); }}>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(editedAsset).map(([key, value]) => (
                    key !== 'AssetsId' && (
                      <div key={key} className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={key}>
                          {key}
                        </label>
                        {renderFormField(key, value)}
                      </div>
                    )
                  ))}
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

      <MasterPasswordModal 
        title={actionType === 'delete' 
          ? "Enter Master Password to Delete Asset" 
          : "Enter Master Password to View Password"
        }
        actionButtonText={actionType === 'delete' ? "Delete Asset" : "View Password"}
      />
    </div>
  )
}
