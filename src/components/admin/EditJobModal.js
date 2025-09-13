import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useLanguage } from '../../contexts/LanguageContext';
import CameraCapture from '../common/CameraCapture';
import SuccessModal from '../common/SuccessModal';
import { uploadToCloudinary } from '../../config/cloudinary';

const EditJobModal = ({ job, isOpen, onClose, onJobUpdated }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    staffName: '',
    category: '',
    area: '',
    landmark: '',
    cableJunctionAddress: '',
    notes: '',
    coordinates: null,
    address: '',
    photos: []
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showCamera, setShowCamera] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newPhotos, setNewPhotos] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [removedPhotos, setRemovedPhotos] = useState([]);

  // Service areas and landmarks (same as in JobForm)
  const serviceAreas = [
    {
      id: 1,
      name: 'SAMPATCHAK',
      landmarks: ['SOHGI MOR', 'RAILWAY STATION', 'BUS STAND', 'MARKET COMPLEX']
    },
    {
      id: 2,
      name: 'KURTHOUL',
      landmarks: ['GYATRI NAGAR', 'PASURAMCHAK', 'MAIN ROAD', 'SCHOOL AREA']
    },
    {
      id: 3,
      name: 'FATUHA',
      landmarks: ['STATION ROAD', 'MARKET', 'HOSPITAL', 'COLLEGE']
    }
  ];

  const jobCategories = ['Installation', 'Maintenance', 'Repair'];
  const staffMembers = ['Dipu', 'Golu', 'Raju', 'Amit', 'Suresh'];

  // Populate form data when job changes
  useEffect(() => {
    if (job) {
      console.log('Job data:', job);
      
      // Extract photos from photoURLs field (based on original script.js)
      let photoUrls = [];
      
      // Check for photoURLs field first (primary - matches original script.js)
      if (job.photoURLs) {
        console.log('Found photoURLs:', job.photoURLs);
        if (Array.isArray(job.photoURLs)) {
          photoUrls = job.photoURLs;
        } else if (typeof job.photoURLs === 'string') {
          photoUrls = job.photoURLs.includes(',') 
            ? job.photoURLs.split(',').map(url => url.trim())
            : [job.photoURLs];
        }
      } 
      // Check for photosURL field (fallback)
      else if (job.photosURL) {
        console.log('Found photosURL:', job.photosURL);
        if (Array.isArray(job.photosURL)) {
          photoUrls = job.photosURL;
        } else if (typeof job.photosURL === 'string') {
          photoUrls = job.photosURL.includes(',') 
            ? job.photosURL.split(',').map(url => url.trim())
            : [job.photosURL];
        }
      }
      // Check for photos field (another fallback)
      else if (job.photos) {
        console.log('Found photos:', job.photos);
        if (Array.isArray(job.photos)) {
          photoUrls = job.photos;
        } else if (typeof job.photos === 'string') {
          photoUrls = job.photos.includes(',') 
            ? job.photos.split(',').map(url => url.trim())
            : [job.photos];
        }
      }

      console.log('Final photo URLs:', photoUrls);

      setFormData({
        staffName: job.staffName || '',
        category: job.category || '',
        area: job.area || '',
        landmark: job.landmark || '',
        cableJunctionAddress: job.customerAddress || job.cableJunctionAddress || '',
        notes: job.notes || '',
        coordinates: job.coordinates || null,
        address: job.address || '',
        photos: photoUrls
      });
      setNewPhotos([]); // Reset new photos when job changes
      setRemovedPhotos([]); // Reset removed photos when job changes
    }
  }, [job]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAreaChange = (area) => {
    setFormData(prev => ({ 
      ...prev, 
      area, 
      landmark: '' // Reset landmark when area changes
    }));
    if (errors.area) {
      setErrors(prev => ({ ...prev, area: '' }));
    }
  };


  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.staffName) newErrors.staffName = 'Staff name is required';
    if (!formData.category) newErrors.category = 'Job type is required';
    if (!formData.area) newErrors.area = 'Service area is required';
    if (!formData.landmark) newErrors.landmark = 'Landmark is required';
    if (!formData.cableJunctionAddress.trim()) newErrors.cableJunctionAddress = 'Cable junction address is required';
    if (!formData.notes.trim()) newErrors.notes = 'Job notes are required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = files.map(file => uploadToCloudinary(file));
      const uploadedUrls = await Promise.all(uploadPromises);
      setNewPhotos(prev => [...prev, ...uploadedUrls]);
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Failed to upload images. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleCameraCapture = async (blob) => {
    setUploading(true);
    try {
      const uploadedUrl = await uploadToCloudinary(blob);
      setNewPhotos(prev => [...prev, uploadedUrl]);
      setShowCamera(false);
    } catch (error) {
      console.error('Error uploading captured photo:', error);
      alert('Failed to upload photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeNewPhoto = (index) => {
    setNewPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingPhoto = (index) => {
    const photoToRemove = formData.photos[index];
    setRemovedPhotos(prev => [...prev, photoToRemove]);
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const jobRef = doc(db, 'jobs', job.id);
      
      // Combine remaining existing photos with new photos (excluding removed ones)
      const allPhotos = [...formData.photos, ...newPhotos];
      
      const updateData = {
        staffName: formData.staffName,
        category: formData.category,
        area: formData.area,
        landmark: formData.landmark,
        customerAddress: formData.cableJunctionAddress,
        notes: formData.notes,
        photoURLs: allPhotos, // Update photos array
        updatedAt: new Date()
      };
      await updateDoc(jobRef, updateData);

      setShowSuccess(true);
    } catch (error) {
      console.error('Error updating job:', error);
      alert('Failed to update job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    onJobUpdated();
    onClose();
  };

  const selectedArea = serviceAreas.find(area => area.name === formData.area);
  const landmarks = selectedArea?.landmarks || [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <img src="/logo.png" alt="Logo" className="h-8 w-8" onError={(e) => e.target.style.display = 'none'} />
            <h2 className="text-xl font-semibold text-gray-900">Edit Job Record</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Staff Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.staffName}
              onChange={(e) => handleInputChange('staffName', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.staffName ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="" disabled>Select Staff Member</option>
              {staffMembers.map(staff => (
                <option key={staff} value={staff}>{staff}</option>
              ))}
            </select>
            {errors.staffName && <p className="text-red-500 text-xs mt-1">{errors.staffName}</p>}
          </div>

          {/* Job Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Job Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.category ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="" disabled>Select Job Type</option>
              {jobCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
          </div>

          {/* Service Area and Landmark */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Area <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.area}
                onChange={(e) => handleAreaChange(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.area ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="" disabled>Select Area</option>
                {serviceAreas.map(area => (
                  <option key={area.id} value={area.name}>{area.name}</option>
                ))}
              </select>
              {errors.area && <p className="text-red-500 text-xs mt-1">{errors.area}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Landmark <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.landmark}
                onChange={(e) => handleInputChange('landmark', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.landmark ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={!formData.area}
              >
                <option value="" disabled>Select Landmark</option>
                {landmarks.map(landmark => (
                  <option key={landmark} value={landmark}>{landmark}</option>
                ))}
              </select>
              {errors.landmark && <p className="text-red-500 text-xs mt-1">{errors.landmark}</p>}
            </div>
          </div>

          {/* Cable Junction Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cable Junction Address <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.cableJunctionAddress}
              onChange={(e) => handleInputChange('cableJunctionAddress', e.target.value)}
              placeholder="Enter cable junction address details"
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                errors.cableJunctionAddress ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.cableJunctionAddress && <p className="text-red-500 text-xs mt-1">{errors.cableJunctionAddress}</p>}
          </div>

          {/* Customer Details / Job Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Details / Job Notes <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Enter job details and customer information"
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                errors.notes ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.notes && <p className="text-red-500 text-xs mt-1">{errors.notes}</p>}
          </div>


          {/* Photos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Attachments
            </label>
            
            {/* Upload and Camera Controls */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <label className="w-full text-center cursor-pointer bg-blue-50 text-blue-700 p-2 rounded-lg hover:bg-blue-100 font-semibold border border-blue-200">
                <i className="fas fa-upload mr-2"></i>
                {uploading ? 'Uploading...' : 'Upload Photo'}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </label>
              <button
                type="button"
                onClick={() => setShowCamera(true)}
                disabled={uploading}
                className="w-full bg-gray-600 text-white p-2 rounded-lg hover:bg-gray-700 font-semibold disabled:opacity-50"
              >
                <i className="fas fa-camera mr-2"></i>
                Take Photo
              </button>
            </div>

            {/* Existing Photos */}
            {formData.photos && formData.photos.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-600 mb-2">Existing Photos:</h4>
                <div className="grid grid-cols-3 gap-2">
                  {formData.photos.map((photo, index) => {
                    // Use original photo URL without transformations for better quality
                    let imageUrl = photo;
                    if (typeof photo === 'string') {
                      // If it's a Cloudinary URL, make sure it's properly formatted
                      if (photo.includes('cloudinary.com') && !photo.includes('/image/upload/')) {
                        imageUrl = photo.replace('cloudinary.com/', 'cloudinary.com/image/upload/');
                      }
                    }
                    
                    return (
                      <div key={index} className="relative group">
                        <img
                          src={imageUrl}
                          alt={`Job photo ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(photo, '_blank')}
                          onError={(e) => {
                            console.log('Image load error for:', imageUrl);
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingPhoto(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                        <div className="hidden w-full h-24 bg-gray-100 rounded-lg border items-center justify-center">
                          <i className="fas fa-image text-gray-400 text-sm"></i>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* New Photos */}
            {newPhotos.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-600 mb-2">New Photos:</h4>
                <div className="grid grid-cols-3 gap-2">
                  {newPhotos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={photo}
                        alt={`New photo ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(photo, '_blank')}
                      />
                      <button
                        type="button"
                        onClick={() => removeNewPhoto(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all duration-200 flex items-center justify-center">
                        <i className="fas fa-expand text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm"></i>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {formData.photos.length === 0 && newPhotos.length === 0 && (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg mb-4">
                <i className="fas fa-images text-3xl text-gray-400 mb-2"></i>
                <p>No photos available for this job</p>
              </div>
            )}

            <p className="text-sm text-gray-500">
              <i className="fas fa-info-circle mr-1"></i>
              Click on photos to view in full size. You can add new photos using upload or camera. Click × to remove photos.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Updating...
                </>
              ) : (
                'Update Job'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      {/* Success Modal */}
      {showSuccess && (
        <SuccessModal
          title="Success!"
          message="Job record updated successfully."
          onClose={handleSuccessClose}
        />
      )}
    </div>
  );
};

export default EditJobModal;
