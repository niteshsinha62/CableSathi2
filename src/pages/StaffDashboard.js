import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import Header from '../components/common/Header';
import MobileBottomNav from '../components/common/MobileBottomNav';
import { db } from '../config/firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { uploadToCloudinary } from '../config/cloudinary';
import JobForm from '../components/staff/JobForm';
import CameraCapture from '../components/common/CameraCapture';
import LocationPicker from '../components/common/LocationPicker';
import SuccessModal from '../components/common/SuccessModal';

const StaffDashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [staffMembers, setStaffMembers] = useState([]);
  const [serviceAreas, setServiceAreas] = useState([]);
  const [formData, setFormData] = useState({
    staffName: '',
    jobType: '',
    serviceArea: '',
    landmark: '',
    location: null,
    junctionAddress: '',
    customerDetails: '',
    photos: []
  });
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Listen for staff members
    const staffQuery = query(collection(db, 'staffMembers'), orderBy('name'));
    const unsubscribeStaff = onSnapshot(staffQuery, (snapshot) => {
      const staff = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStaffMembers(staff);
    });

    // Listen for service areas
    const areasQuery = query(collection(db, 'serviceAreas'), orderBy('name'));
    const unsubscribeAreas = onSnapshot(areasQuery, (snapshot) => {
      const areas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setServiceAreas(areas);
    });

    return () => {
      unsubscribeStaff();
      unsubscribeAreas();
    };
  }, []);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.staffName) newErrors.staffName = 'Staff name is required';
    if (!formData.jobType) newErrors.jobType = 'Job type is required';
    if (!formData.serviceArea) newErrors.serviceArea = 'Service area is required';
    if (!formData.landmark) newErrors.landmark = 'Landmark is required';
    if (!formData.location) newErrors.location = 'Location is required';
    if (!formData.customerDetails) newErrors.customerDetails = 'Customer details are required';
    if (formData.photos.length === 0) newErrors.photos = 'At least one photo is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Upload photos to Cloudinary
      const photoUrls = await Promise.all(
        formData.photos.map(photo => uploadToCloudinary(photo))
      );

      // Save job to Firestore
      await addDoc(collection(db, 'jobs'), {
        staffName: formData.staffName,
        category: formData.jobType,
        area: formData.serviceArea,
        landmark: formData.landmark,
        location: formData.location,
        address: formData.location.address || '',
        junctionAddress: formData.junctionAddress,
        notes: formData.customerDetails,
        photos: photoUrls,
        timestamp: new Date(),
        coordinates: {
          lat: formData.location.lat,
          lng: formData.location.lng
        }
      });

      // Reset form
      setFormData({
        staffName: '',
        jobType: '',
        serviceArea: '',
        landmark: '',
        location: null,
        junctionAddress: '',
        customerDetails: '',
        photos: []
      });
      setErrors({});
      setShowSuccess(true);

    } catch (error) {
      console.error('Error submitting job:', error);
      alert('Failed to submit job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoCapture = (photoBlob) => {
    setFormData(prev => ({
      ...prev,
      photos: [...prev.photos, photoBlob]
    }));
    setShowCamera(false);
    // Clear photos error when photo is captured
    if (errors.photos) {
      const newErrors = { ...errors };
      delete newErrors.photos;
      setErrors(newErrors);
    }
  };

  const handleLocationSelect = (location) => {
    setFormData(prev => ({ ...prev, location }));
    setShowLocationPicker(false);
    // Clear location error when location is selected
    if (errors.location) {
      const newErrors = { ...errors };
      delete newErrors.location;
      setErrors(newErrors);
    }
  };

  const removePhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-20 md:pb-0">
      <Header 
        title={t('recordJobActivity')} 
        showLanguageSwitch={true}
      />
      
      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <JobForm
            formData={formData}
            setFormData={setFormData}
            staffMembers={staffMembers}
            serviceAreas={serviceAreas}
            errors={errors}
            setErrors={setErrors}
            loading={loading}
            onSubmit={handleSubmit}
            onOpenCamera={() => setShowCamera(true)}
            onOpenLocationPicker={() => setShowLocationPicker(true)}
            onRemovePhoto={removePhoto}
            t={t}
          />
        </div>
      </div>

      {showCamera && (
        <CameraCapture
          onCapture={handlePhotoCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      {showLocationPicker && (
        <LocationPicker
          onLocationSelect={handleLocationSelect}
          onClose={() => setShowLocationPicker(false)}
        />
      )}

      {showSuccess && (
        <SuccessModal
          title={t('successTitle')}
          message={t('successMessage')}
          onClose={() => setShowSuccess(false)}
        />
      )}

      <MobileBottomNav />
    </div>
  );
};

export default StaffDashboard;
