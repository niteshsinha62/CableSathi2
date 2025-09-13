import React from 'react';

const JobForm = ({
  formData,
  setFormData,
  staffMembers,
  serviceAreas,
  errors,
  setErrors,
  loading,
  onSubmit,
  onOpenCamera,
  onOpenLocationPicker,
  onRemovePhoto,
  t
}) => {
  const selectedArea = serviceAreas.find(area => area.name === formData.serviceArea);
  const landmarks = selectedArea?.landmarks || [];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear landmark when service area changes
    if (field === 'serviceArea') {
      setFormData(prev => ({ ...prev, landmark: '' }));
    }
  };

  const clearError = (field) => {
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  const handleFieldChange = (field, value) => {
    handleInputChange(field, value);
    if (value) {
      clearError(field);
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      photos: [...prev.photos, ...files]
    }));
    if (files.length > 0) {
      clearError('photos');
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Staff Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('staffNameLabel')} <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.staffName}
          onChange={(e) => handleFieldChange('staffName', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 touch-target"
        >
          <option value="" disabled>Select Staff Name</option>
          {staffMembers.map(staff => (
            <option key={staff.id} value={staff.name}>{staff.name}</option>
          ))}
        </select>
        {errors.staffName && <p className="text-red-500 text-sm mt-1">{errors.staffName}</p>}
      </div>

      {/* Job Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('jobType')} <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.jobType}
          onChange={(e) => handleFieldChange('jobType', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 touch-target"
        >
          <option value="" disabled>Select Job Type</option>
          <option value="Installation">{t('installation')}</option>
          <option value="Maintenance">{t('maintenance')}</option>
          <option value="Repair">{t('repair')}</option>
        </select>
        {errors.jobType && <p className="text-red-500 text-sm mt-1">{errors.jobType}</p>}
      </div>

      {/* Service Area and Landmark */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('serviceArea')} <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.serviceArea}
            onChange={(e) => handleFieldChange('serviceArea', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 touch-target"
          >
            <option value="" disabled>Select Service Area</option>
            {serviceAreas.map(area => (
              <option key={area.id} value={area.name}>{area.name}</option>
            ))}
          </select>
          {errors.serviceArea && <p className="text-red-500 text-sm mt-1">{errors.serviceArea}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('landmarkLabel')} <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.landmark}
            onChange={(e) => handleFieldChange('landmark', e.target.value)}
            disabled={!formData.serviceArea}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 touch-target disabled:bg-gray-100"
          >
            <option value="" disabled>Select Landmark</option>
            {landmarks.map(landmark => (
              <option key={landmark} value={landmark}>{landmark}</option>
            ))}
          </select>
          {errors.landmark && <p className="text-red-500 text-sm mt-1">{errors.landmark}</p>}
        </div>
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('jobLocationLabel')} <span className="text-red-500">*</span>
        </label>
        <button
          type="button"
          onClick={onOpenLocationPicker}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-blue-500 touch-target hover:bg-gray-50"
        >
          {formData.location ? formData.location.address : t('jobLocationPlaceholder')}
        </button>
        {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
      </div>


      {/* Customer Details */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('customerDetailsLabel')} <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.customerDetails}
          onChange={(e) => handleFieldChange('customerDetails', e.target.value)}
          rows="3"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder={t('customerDetailsPlaceholder')}
        />
        {errors.customerDetails && <p className="text-red-500 text-sm mt-1">{errors.customerDetails}</p>}
      </div>

      {/* Photos */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('attachments')} <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <label className="cursor-pointer bg-blue-50 text-blue-700 p-3 rounded-lg hover:bg-blue-100 text-center font-medium touch-target">
            <i className="fas fa-upload mr-2"></i>
            {t('uploadPhoto')}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          <button
            type="button"
            onClick={onOpenCamera}
            className="bg-gray-600 text-white p-3 rounded-lg hover:bg-gray-700 font-medium touch-target"
          >
            <i className="fas fa-camera mr-2"></i>
            {t('takePhoto')}
          </button>
        </div>
        
        {/* Photo Preview */}
        {formData.photos.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            {formData.photos.map((photo, index) => (
              <div key={index} className="relative">
                <img
                  src={URL.createObjectURL(photo)}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-20 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => onRemovePhoto(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        {errors.photos && <p className="text-red-500 text-sm mt-1">{errors.photos}</p>}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-4 pt-6 border-t">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium touch-target"
        >
          {t('cancel')}
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium touch-target flex items-center"
        >
          {loading ? (
            <>
              <div className="loader w-5 h-5 mr-2"></div>
              Submitting...
            </>
          ) : (
            t('submit')
          )}
        </button>
      </div>
    </form>
  );
};

export default JobForm;
