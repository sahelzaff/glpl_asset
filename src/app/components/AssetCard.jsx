import { FaLaptop, FaDesktop, FaPrint, FaTv, FaWifi, FaServer, FaVideo, FaQuestionCircle } from 'react-icons/fa'

const getCategoryIcon = (category) => {
  console.log('Category:', category); // Debugging line
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

export default function AssetCard({ asset }) {
  return (
    <div className="bg-white shadow-md rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-2">
        {asset.Host_Name}
      </h3>
      <p><span className="font-medium">Category:</span> {asset.Category}</p>
      <p><span className="font-medium">User:</span> {asset.Alloted_User_Name}</p>
      <p><span className="font-medium">Department:</span> {asset.Department}</p>
      <p><span className="font-medium">Make:</span> {asset.Make}</p>
      <p><span className="font-medium">Model:</span> {asset.Model_No}</p>
      <p><span className="font-medium">Serial No:</span> {asset.Serial_No}</p>
      <p><span className="font-medium">OS:</span> {asset.OS} {asset.OS_Version}</p>
    </div>
  )
}
