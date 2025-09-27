import React, { useState } from 'react';

const JobsTable = ({ jobs, onDeleteJob, onEditJob, sortBy, sortOrder, onSort }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'desc' });
  const [imageModal, setImageModal] = useState({ isOpen: false, images: [], currentIndex: 0, jobInfo: null });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedJobs = React.useMemo(() => {
    let sortableJobs = [...jobs];
    if (sortConfig.key) {
      sortableJobs.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle timestamp sorting
        if (sortConfig.key === 'timestamp') {
          aValue = a.timestamp?.toDate?.() || new Date(a.timestamp);
          bValue = b.timestamp?.toDate?.() || new Date(b.timestamp);
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableJobs;
  }, [jobs, sortConfig]);

  const formatDate = (timestamp) => {
    const date = timestamp?.toDate?.() || new Date(timestamp);
    return date.toLocaleString();
  };

  const shareLocation = (lat, lng) => {
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    if (navigator.share) {
      navigator.share({
        title: 'Job Location',
        url: url
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(url).then(() => {
        alert('Location link copied to clipboard!');
      }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Location link copied to clipboard!');
      });
    }
  };

  const downloadPhotos = async (photos, staffName, jobId) => {
    try {
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        const response = await fetch(photo);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${staffName}_Job_${jobId}_Photo_${i + 1}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading photos:', error);
      alert('Failed to download photos. Please try again.');
    }
  };

  const openInMaps = (lat, lng) => {
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(url, '_blank');
  };

  const openImageModal = (job) => {
    let images = [];
    if (job.photoURLs && Array.isArray(job.photoURLs)) {
      images = job.photoURLs;
    } else if (job.photos && Array.isArray(job.photos)) {
      images = job.photos;
    } else if (job.photoURLs && typeof job.photoURLs === 'string') {
      images = job.photoURLs.split(',').map(url => url.trim());
    } else if (job.photos && typeof job.photos === 'string') {
      images = job.photos.split(',').map(url => url.trim());
    }
    
    if (images.length > 0) {
      setImageModal({
        isOpen: true,
        images: images,
        currentIndex: 0,
        jobInfo: {
          staffName: job.staffName,
          area: job.area,
          landmark: job.landmark,
          category: job.category
        }
      });
    }
  };

  const closeImageModal = () => {
    setImageModal({ isOpen: false, images: [], currentIndex: 0, jobInfo: null });
  };

  const nextImage = () => {
    setImageModal(prev => ({
      ...prev,
      currentIndex: (prev.currentIndex + 1) % prev.images.length
    }));
  };

  const prevImage = () => {
    setImageModal(prev => ({
      ...prev,
      currentIndex: prev.currentIndex === 0 ? prev.images.length - 1 : prev.currentIndex - 1
    }));
  };

  const downloadCurrentImage = async () => {
    try {
      const imageUrl = imageModal.images[imageModal.currentIndex];
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${imageModal.jobInfo.staffName}_${imageModal.jobInfo.area}_Image_${imageModal.currentIndex + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
      alert('Failed to download image. Please try again.');
    }
  };


  return (
    <div className="overflow-x-auto">
      {/* Mobile/Tablet Card View */}
      <div className="lg:hidden space-y-4 p-4">
        {sortedJobs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No jobs found matching your filters.
          </div>
        ) : (
          sortedJobs.map((job) => (
            <div key={job.id} className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900">{job.staffName}</h3>
                  <p className="text-sm text-gray-600">{job.category}</p>
                </div>
                <span className="text-xs text-gray-500">
                  {formatDate(job.timestamp)}
                </span>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm"><strong>Area:</strong> {job.area}</p>
                <p className="text-sm"><strong>Landmark:</strong> {job.landmark}</p>
                {(job.customerAddress || job.address) && (
                  <p className="text-sm"><strong>Address:</strong> {job.customerAddress || job.address}</p>
                )}
                {job.notes && (
                  <p className="text-sm"><strong>Notes:</strong> {job.notes}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  onClick={() => onEditJob && onEditJob(job)}
                  className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 touch-target"
                >
                  <i className="fas fa-edit mr-1"></i>
                  Edit
                </button>
                <button
                  onClick={() => window.open(`/map?jobId=${job.id}`, '_blank')}
                  className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-200 touch-target"
                >
                  <i className="fas fa-map-marker-alt mr-1"></i>
                  View Map
                </button>
                {job.coordinates && (
                  <>
                    <button
                      onClick={() => openInMaps(job.coordinates.lat, job.coordinates.lng)}
                      className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 touch-target"
                    >
                      <i className="fas fa-external-link-alt mr-1"></i>
                      Navigate
                    </button>
                    <button
                      onClick={() => shareLocation(job.coordinates.lat, job.coordinates.lng)}
                      className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 touch-target"
                    >
                      <i className="fas fa-share mr-1"></i>
                      Share
                    </button>
                  </>
                )}
                {((job.photoURLs && job.photoURLs.length > 0) || (job.photos && job.photos.length > 0)) && (
                  <button
                    onClick={() => openImageModal(job)}
                    className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 touch-target"
                  >
                    <i className="fas fa-image mr-1"></i>
                    View Images
                  </button>
                )}
                <button
                  onClick={() => onDeleteJob(job.id)}
                  className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 touch-target"
                >
                  <i className="fas fa-trash mr-1"></i>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full bg-white text-sm table-fixed">
          <thead className="bg-gray-200">
            <tr>
              <th 
                className="py-3 px-3 text-left cursor-pointer hover:bg-gray-300 text-xs font-semibold w-24"
                onClick={() => handleSort('area')}
              >
                Area
                <i className={`fas fa-sort ml-1 ${sortConfig.key === 'area' ? 
                  (sortConfig.direction === 'asc' ? 'fa-sort-up' : 'fa-sort-down') : ''}`}></i>
              </th>
              <th 
                className="py-3 px-3 text-left cursor-pointer hover:bg-gray-300 text-xs font-semibold w-28"
                onClick={() => handleSort('landmark')}
              >
                Landmark
                <i className={`fas fa-sort ml-1 ${sortConfig.key === 'landmark' ? 
                  (sortConfig.direction === 'asc' ? 'fa-sort-up' : 'fa-sort-down') : ''}`}></i>
              </th>
              <th 
                className="py-3 px-3 text-left cursor-pointer hover:bg-gray-300 text-xs font-semibold w-20"
                onClick={() => handleSort('category')}
              >
                Job Type
                <i className={`fas fa-sort ml-1 ${sortConfig.key === 'category' ? 
                  (sortConfig.direction === 'asc' ? 'fa-sort-up' : 'fa-sort-down') : ''}`}></i>
              </th>
              <th 
                className="py-3 px-3 text-left cursor-pointer hover:bg-gray-300 text-xs font-semibold w-24"
                onClick={() => handleSort('staffName')}
              >
                Staff Name
                <i className={`fas fa-sort ml-1 ${sortConfig.key === 'staffName' ? 
                  (sortConfig.direction === 'asc' ? 'fa-sort-up' : 'fa-sort-down') : ''}`}></i>
              </th>
              <th className="py-3 px-3 text-left text-xs font-semibold w-48">Address</th>
              <th className="py-3 px-3 text-left text-xs font-semibold w-56">Customer Details/Notes</th>
              <th 
                className="py-3 px-3 text-left cursor-pointer hover:bg-gray-300 text-xs font-semibold w-20"
                onClick={() => handleSort('timestamp')}
              >
                Timestamp
                <i className={`fas fa-sort ml-1 ${sortConfig.key === 'timestamp' ? 
                  (sortConfig.direction === 'asc' ? 'fa-sort-up' : 'fa-sort-down') : ''}`}></i>
              </th>
              <th className="py-3 px-3 text-left text-xs font-semibold w-20">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedJobs.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-8 text-gray-500 text-sm">
                  No jobs found matching your filters.
                </td>
              </tr>
            ) : (
              sortedJobs.map((job) => {
                // Get image count
                let imageCount = 0;
                if (job.photoURLs && Array.isArray(job.photoURLs)) {
                  imageCount = job.photoURLs.length;
                } else if (job.photos && Array.isArray(job.photos)) {
                  imageCount = job.photos.length;
                } else if (job.photoURLs && typeof job.photoURLs === 'string') {
                  imageCount = job.photoURLs.split(',').filter(url => url.trim()).length;
                } else if (job.photos && typeof job.photos === 'string') {
                  imageCount = job.photos.split(',').filter(url => url.trim()).length;
                }
                
                return (
                  <tr key={job.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-3 text-xs align-top">{job.area}</td>
                    <td className="py-3 px-3 text-xs align-top">{job.landmark}</td>
                    <td className="py-3 px-3 text-xs align-top">{job.category}</td>
                    <td className="py-3 px-3 text-xs font-medium align-top">{job.staffName}</td>
                    <td className="py-3 px-3 text-xs align-top">
                      <div className="whitespace-pre-wrap break-words leading-relaxed">
                        {job.customerAddress || job.address || 'N/A'}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-xs align-top">
                      <div className="whitespace-pre-wrap break-words leading-relaxed">
                        {job.notes || 'No notes'}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-xs align-top">
                      <div className="whitespace-nowrap">
                        {new Date(job.timestamp?.toDate?.() || job.timestamp).toLocaleDateString()},<br/>
                        {new Date(job.timestamp?.toDate?.() || job.timestamp).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="py-3 px-3 align-top">
                      <div className="flex flex-col items-center space-y-2">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => onEditJob && onEditJob(job)}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                            title="Edit"
                          >
                            <i className="fas fa-edit text-sm"></i>
                          </button>
                          <button
                            onClick={() => window.open(`/map?jobId=${job.id}`, '_blank')}
                            className="text-indigo-600 hover:text-indigo-800 p-1 rounded hover:bg-indigo-50 transition-colors"
                            title="View on Map"
                          >
                            <i className="fas fa-map-marker-alt text-sm"></i>
                          </button>
                          <button
                            onClick={() => onDeleteJob(job.id)}
                            className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <i className="fas fa-trash text-sm"></i>
                          </button>
                        </div>
                        {imageCount > 0 && (
                          <div className="flex flex-col items-center space-y-1">
                            <button
                              onClick={() => openImageModal(job)}
                              className="text-purple-600 hover:text-purple-800 p-1 rounded hover:bg-purple-50 transition-colors"
                              title="View Images"
                            >
                              <i className="fas fa-image text-sm"></i>
                            </button>
                            <span className="text-xs text-gray-500 font-medium">({imageCount})</span>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Image Modal */}
      {imageModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="text-lg font-semibold">Image Preview</h3>
                <p className="text-sm text-gray-600">
                  {imageModal.jobInfo.staffName} - {imageModal.jobInfo.area}, {imageModal.jobInfo.landmark} ({imageModal.jobInfo.category})
                </p>
                <p className="text-xs text-gray-500">
                  {imageModal.currentIndex + 1} of {imageModal.images.length}
                </p>
              </div>
              <button
                onClick={closeImageModal}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Image Display */}
            <div className="relative">
              <img
                src={imageModal.images[imageModal.currentIndex]}
                alt={`Job image ${imageModal.currentIndex + 1}`}
                className="w-full h-96 object-contain bg-gray-100"
              />
              
              {/* Navigation Arrows */}
              {imageModal.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
                  >
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
                  >
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-4 border-t bg-gray-50">
              <div className="flex space-x-2">
                {imageModal.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setImageModal(prev => ({ ...prev, currentIndex: index }))}
                    className={`w-3 h-3 rounded-full ${
                      index === imageModal.currentIndex ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={downloadCurrentImage}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
              >
                <i className="fas fa-download"></i>
                <span>Download Image</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobsTable;
