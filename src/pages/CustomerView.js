import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import Header from '../components/common/Header';
import MobileBottomNav from '../components/common/MobileBottomNav';
import { db } from '../config/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, deleteDoc, where } from 'firebase/firestore';
import { uploadToCloudinary } from '../config/cloudinary';
import CameraCapture from '../components/common/CameraCapture';
import LocationPicker from '../components/common/LocationPicker';
import SuccessModal from '../components/common/SuccessModal';

const CustomerView = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [staffMembers, setStaffMembers] = useState([]);
  const [serviceAreas, setServiceAreas] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [installationJobs, setInstallationJobs] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    staffName: '',
    customerName: '',
    mobile: '',
    customerType: 'Broadband',
    serviceArea: '',
    landmark: '',
    location: null,
    notes: '',
    photos: []
  });
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    area: 'all',
    landmark: 'all',
    status: 'all',
    search: ''
  });
  const [sortConfig, setSortConfig] = useState({ key: 'customerName', direction: 'asc' });

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

    // Listen for customers
    const customersQuery = query(collection(db, 'customers'), orderBy('timestamp', 'desc'));
    const unsubscribeCustomers = onSnapshot(customersQuery, (snapshot) => {
      const customersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCustomers(customersData);
    });

    // Listen for jobs to get Installation jobs directly
    const jobsQuery = query(collection(db, 'jobs'), orderBy('timestamp', 'desc'));
    const unsubscribeJobs = onSnapshot(jobsQuery, (snapshot) => {
      const jobsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setJobs(jobsData);
      
      // Filter Installation jobs and parse customer data
      const installations = jobsData
        .filter(job => job.category === 'Installation')
        .map(job => {
          const customerInfo = parseCustomerInfoFromNotes(job.notes || '');
          return {
            id: job.id,
            customerName: customerInfo.name || 'Unknown Customer',
            mobile: customerInfo.mobile || 'No Mobile',
            notes: customerInfo.notes || job.notes || '',
            customerType: customerInfo.customerType || job.customerType || 'Installation',
            area: job.area || '',
            landmark: job.landmark || '',
            staffName: job.staffName || '',
            status: job.status || 'Active',
            timestamp: job.timestamp,
            location: job.location,
            coordinates: job.coordinates,
            address: job.address || job.customerAddress || '',
            sourceJobId: job.id
          };
        });
      
      setInstallationJobs(installations);
    });

    return () => {
      unsubscribeStaff();
      unsubscribeAreas();
      unsubscribeCustomers();
      unsubscribeJobs();
    };
  }, []);

  // Sync Installation jobs to customers automatically
  const syncInstallationJobsToCustomers = async (jobsData) => {
    const installationJobs = jobsData.filter(job => job.category === 'Installation');
    
    for (const job of installationJobs) {
      if (job.notes && job.staffName) {
        // Parse customer info from job notes
        const customerInfo = parseCustomerInfoFromNotes(job.notes);
        if (customerInfo.name && customerInfo.mobile) {
          // Check if customer already exists
          const existingCustomer = customers.find(c => 
            c.mobile === customerInfo.mobile && c.sourceJobId === job.id
          );
          
          if (!existingCustomer) {
            try {
              await addDoc(collection(db, 'customers'), {
                customerName: customerInfo.name,
                mobile: customerInfo.mobile,
                notes: customerInfo.notes || job.notes,
                staffName: job.staffName,
                area: job.area,
                landmark: job.landmark,
                location: job.location,
                coordinates: job.coordinates,
                address: job.address || job.customerAddress,
                customerType: 'Installation',
                status: 'Active',
                sourceJobId: job.id,
                syncedFromJob: true,
                timestamp: job.timestamp
              });
            } catch (error) {
              console.error('Error syncing job to customer:', error);
            }
          }
        }
      }
    }
  };

  // Parse customer information from job notes
  const parseCustomerInfoFromNotes = (notes) => {
    if (!notes) return { name: '', mobile: '', notes: '', customerType: '' };
    
    const lines = notes.split('\n');
    let name = '', mobile = '', customerType = '', extractedNotes = '';
    let hasStructuredFormat = false;
    
    // Check for structured format with expected fields
    const structuredFields = {
      name: false,
      mobile: false,
      notes: false,
      customerType: false
    };
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Look for Customer Name pattern
      if (trimmedLine.toLowerCase().includes('customer name:')) {
        const extracted = trimmedLine.split(':')[1]?.trim();
        if (extracted && extracted.length > 2) {
          name = extracted;
          structuredFields.name = true;
        }
      }
      
      // Look for Mobile Number pattern
      if (trimmedLine.toLowerCase().includes('mobile number:')) {
        const extracted = trimmedLine.split(':')[1]?.trim();
        if (extracted && extracted.match(/\d{10}/)) {
          mobile = extracted.match(/\d{10}/)[0];
          structuredFields.mobile = true;
        }
      }
      
      // Look for Customer Type pattern
      if (trimmedLine.toLowerCase().includes('customer type:')) {
        const extracted = trimmedLine.split(':')[1]?.trim();
        if (extracted) {
          customerType = extracted;
          structuredFields.customerType = true;
        }
      }
      
      // Look for Notes pattern
      if (trimmedLine.toLowerCase().includes('notes:')) {
        const extracted = trimmedLine.split(':')[1]?.trim();
        if (extracted) {
          extractedNotes = extracted;
          structuredFields.notes = true;
        }
      }
    }
    
    // Check if we have structured format
    hasStructuredFormat = structuredFields.name || structuredFields.mobile || 
                         structuredFields.notes || structuredFields.customerType;
    
    // If structured format is found, use only extracted notes
    // Otherwise, use the entire notes content
    const finalNotes = hasStructuredFormat ? extractedNotes : notes;
    
    // Fallback extraction if no structured format
    if (!hasStructuredFormat) {
      // Try to extract mobile from anywhere in text
      const mobileMatch = notes.match(/\b\d{10}\b/);
      if (mobileMatch) mobile = mobileMatch[0];
      
      // Try to extract name (capitalized words)
      const nameMatch = notes.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/);
      if (nameMatch) name = nameMatch[0];
    }
    
    return { 
      name: name || 'Customer', 
      mobile: mobile || 'No Contact', 
      notes: finalNotes || notes,
      customerType: customerType || 'Installation'
    };
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.staffName) newErrors.staffName = 'Staff name is required';
    if (!formData.customerName) newErrors.customerName = 'Customer name is required';
    if (!formData.mobile) newErrors.mobile = 'Mobile number is required';
    if (!formData.serviceArea) newErrors.serviceArea = 'Service area is required';
    if (!formData.landmark) newErrors.landmark = 'Landmark is required';
    if (!formData.location) newErrors.location = 'Location is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Customer action handlers
  const handleToggleStatus = async (customerId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'Active' ? 'Deactivated' : 'Active';
      await updateDoc(doc(db, 'customers', customerId), {
        status: newStatus,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating customer status:', error);
      alert('Failed to update customer status. Please try again.');
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    if (window.confirm('Are you sure you want to permanently delete this customer?')) {
      try {
        await deleteDoc(doc(db, 'customers', customerId));
      } catch (error) {
        console.error('Error deleting customer:', error);
        alert('Failed to delete customer. Please try again.');
      }
    }
  };

  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      staffName: customer.staffName || '',
      customerName: customer.customerName || '',
      mobile: customer.mobile || '',
      customerType: customer.customerType || 'Broadband',
      serviceArea: customer.area || '',
      landmark: customer.landmark || '',
      location: customer.location || null,
      notes: customer.notes || '',
      photos: []
    });
    setShowAddForm(true);
  };

  const handleNavigateToCustomer = (customer) => {
    // Navigate to Google Maps for directions
    if (customer.coordinates) {
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${customer.coordinates.lat},${customer.coordinates.lng}`;
      window.open(googleMapsUrl, '_blank');
    } else if (customer.location) {
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${customer.location.lat},${customer.location.lng}`;
      window.open(googleMapsUrl, '_blank');
    } else {
      alert('Location coordinates not available for this customer.');
    }
  };

  const handleViewCustomerOnMap = (customer) => {
    // Open customer map view focused on this specific customer (same behavior as AdminDashboard but with CustomerMapView)
    const mapUrl = `/customer-map?customerId=${customer.id}`;
    window.open(mapUrl, '_blank');
  };

  const handleViewAllCustomersOnMap = () => {
    // Open map view showing all customers
    const mapUrl = '/customer-map';
    window.open(mapUrl, '_blank');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Upload photos to Cloudinary if any
      const photoUrls = formData.photos.length > 0 
        ? await Promise.all(formData.photos.map(photo => uploadToCloudinary(photo)))
        : [];

      if (editingCustomer) {
        // Update existing customer
        await updateDoc(doc(db, 'customers', editingCustomer.id), {
          staffName: formData.staffName,
          customerName: formData.customerName,
          mobile: formData.mobile,
          customerType: formData.customerType,
          area: formData.serviceArea,
          landmark: formData.landmark,
          location: formData.location,
          address: formData.location.address || '',
          notes: formData.notes,
          photos: photoUrls,
          updatedAt: new Date(),
          coordinates: {
            lat: formData.location.lat,
            lng: formData.location.lng
          }
        });
      } else {
        // Save new customer to Firestore
        await addDoc(collection(db, 'customers'), {
          staffName: formData.staffName,
          customerName: formData.customerName,
          mobile: formData.mobile,
          customerType: formData.customerType,
          area: formData.serviceArea,
          landmark: formData.landmark,
          location: formData.location,
          address: formData.location.address || '',
          notes: formData.notes,
          photos: photoUrls,
          status: 'Active',
          timestamp: new Date(),
          coordinates: {
            lat: formData.location.lat,
            lng: formData.location.lng
          }
        });
      }

      // Reset form
      setFormData({
        staffName: '',
        customerName: '',
        mobile: '',
        customerType: 'Broadband',
        serviceArea: '',
        landmark: '',
        location: null,
        notes: '',
        photos: []
      });
      setErrors({});
      setShowSuccess(true);
      setShowAddForm(false);
      setEditingCustomer(null);

    } catch (error) {
      console.error('Error saving customer:', error);
      alert('Failed to save customer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear landmark when service area changes
    if (field === 'serviceArea') {
      setFormData(prev => ({ ...prev, landmark: '' }));
    }
  };

  const handlePhotoCapture = (photoBlob) => {
    setFormData(prev => ({
      ...prev,
      photos: [...prev.photos, photoBlob]
    }));
    setShowCamera(false);
  };

  const handleLocationSelect = (location) => {
    setFormData(prev => ({ ...prev, location }));
    setShowLocationPicker(false);
  };

  const removePhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      photos: [...prev.photos, ...files]
    }));
  };

  const selectedArea = serviceAreas.find(area => area.name === formData.serviceArea);
  const landmarks = selectedArea?.landmarks || [];

  // Handle sorting
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Combine customers and installation jobs for display
  const allCustomers = [...customers, ...installationJobs];
  
  // Apply filters
  const filteredCustomers = allCustomers.filter(customer => {
    // Area filter
    if (filters.area !== 'all' && customer.area !== filters.area) {
      return false;
    }
    
    // Landmark filter
    if (filters.landmark !== 'all' && customer.landmark !== filters.landmark) {
      return false;
    }
    
    // Status filter
    if (filters.status !== 'all' && (customer.status || 'Active') !== filters.status) {
      return false;
    }
    
    // Search filter
    const searchTerm = filters.search || '';
    if (searchTerm && !(
      customer.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.mobile?.includes(searchTerm) ||
      customer.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.area?.toLowerCase().includes(searchTerm.toLowerCase())
    )) {
      return false;
    }
    
    return true;
  });

  // Apply sorting
  const sortedCustomers = React.useMemo(() => {
    let sortableCustomers = [...filteredCustomers];
    if (sortConfig.key) {
      sortableCustomers.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle timestamp sorting
        if (sortConfig.key === 'timestamp') {
          aValue = a.timestamp?.toDate?.() || new Date(a.timestamp);
          bValue = b.timestamp?.toDate?.() || new Date(b.timestamp);
        }

        // Handle string comparison
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
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
    return sortableCustomers;
  }, [filteredCustomers, sortConfig]);

  return (
    <div className="min-h-screen bg-gray-100 pb-20 md:pb-0">
      <Header 
        title="Track Your Customer"
        showLanguageSwitch={false}
      >
        <button
          onClick={() => navigate('/admin')}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          <i className="fas fa-arrow-left mr-1"></i>
          Back
        </button>
      </Header>
      
      <div className="max-w-7xl mx-auto p-4">
        {!showAddForm ? (
          <div className="bg-white rounded-lg shadow-sm">
            {/* Header with buttons */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Customer Details</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Showing {sortedCustomers.length} Installation customers
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => handleViewAllCustomersOnMap()}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                  >
                    <i className="fas fa-map-marked-alt mr-2"></i>
                    Customer Locations
                  </button>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                  >
                    <i className="fas fa-plus mr-2"></i>
                    Add Customer
                  </button>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="p-4 border-b border-gray-200">
              <div className="space-y-4">
                {/* Search */}
                <div className="w-full">
                  <input
                    type="text"
                    placeholder="Search customers by name, mobile, notes, area..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Filter dropdowns */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <select
                    value={filters.area}
                    onChange={(e) => setFilters(prev => ({ ...prev, area: e.target.value, landmark: 'all' }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="all">All Areas</option>
                    {serviceAreas.map(area => (
                      <option key={area.id} value={area.name}>{area.name}</option>
                    ))}
                  </select>

                  <select
                    value={filters.landmark}
                    onChange={(e) => setFilters(prev => ({ ...prev, landmark: e.target.value }))}
                    disabled={filters.area === 'all'}
                    className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100"
                  >
                    <option value="all">All Landmarks</option>
                    {(serviceAreas.find(area => area.name === filters.area)?.landmarks || []).map(landmark => (
                      <option key={landmark} value={landmark}>{landmark}</option>
                    ))}
                  </select>

                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Deactivated">Deactivated</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4 p-4">
              {sortedCustomers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No customers found matching your filters.
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="block mt-2 text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Add a new customer
                  </button>
                </div>
              ) : (
                sortedCustomers.map((customer) => (
                  <div key={customer.id} className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">{customer.customerName}</h3>
                        <p className="text-sm text-gray-600">{customer.mobile}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                        customer.status === 'Active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {customer.status || 'Active'}
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm"><strong>Area:</strong> {customer.area || '-'}</p>
                      <p className="text-sm"><strong>Landmark:</strong> {customer.landmark || '-'}</p>
                      <p className="text-sm"><strong>Type:</strong> 
                        <span className={`ml-1 px-2 py-1 text-xs font-semibold rounded-full ${
                          customer.customerType === 'Installation' 
                            ? 'bg-blue-100 text-blue-800'
                            : customer.customerType === 'Broadband'
                            ? 'bg-green-100 text-green-800'
                            : customer.customerType === 'Cable'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {customer.customerType || 'Installation'}
                        </span>
                      </p>
                      {customer.notes && (
                        <p className="text-sm"><strong>Notes:</strong> {customer.notes}</p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <button
                        onClick={() => handleNavigateToCustomer(customer)}
                        className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 rounded bg-blue-100 hover:bg-blue-200"
                      >
                        <i className="fas fa-directions mr-1"></i>
                        Navigate
                      </button>
                      <button
                        onClick={() => handleEditCustomer(customer)}
                        className="text-yellow-600 hover:text-yellow-800 text-xs px-2 py-1 rounded bg-yellow-100 hover:bg-yellow-200"
                      >
                        <i className="fas fa-edit mr-1"></i>
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCustomer(customer.id)}
                        className="text-red-600 hover:text-red-800 text-xs px-2 py-1 rounded bg-red-100 hover:bg-red-200"
                      >
                        <i className="fas fa-trash mr-1"></i>
                        Delete
                      </button>
                      <button
                        onClick={() => handleViewCustomerOnMap(customer)}
                        className="text-green-600 hover:text-green-800 text-xs px-2 py-1 rounded bg-green-100 hover:bg-green-200"
                      >
                        <i className="fas fa-map-marker-alt mr-1"></i>
                        View on Map
                      </button>
                      <button
                        onClick={() => handleToggleStatus(customer.id, customer.status || 'Active')}
                        className={`text-xs px-2 py-1 rounded ${
                          customer.status === 'Active' 
                            ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' 
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        <i className={`fas ${
                          customer.status === 'Active' ? 'fa-pause-circle' : 'fa-play-circle'
                        } mr-1`}></i>
                        {customer.status === 'Active' ? 'Deactivate' : 'Activate'}
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
                      className="py-3 px-3 text-left cursor-pointer hover:bg-gray-300 text-xs font-semibold w-32"
                      onClick={() => handleSort('customerName')}
                    >
                      Name
                      <i className={`fas fa-sort ml-1 ${sortConfig.key === 'customerName' ? 
                        (sortConfig.direction === 'asc' ? 'fa-sort-up' : 'fa-sort-down') : ''}`}></i>
                    </th>
                    <th 
                      className="py-3 px-3 text-left cursor-pointer hover:bg-gray-300 text-xs font-semibold w-28"
                      onClick={() => handleSort('mobile')}
                    >
                      Contact
                      <i className={`fas fa-sort ml-1 ${sortConfig.key === 'mobile' ? 
                        (sortConfig.direction === 'asc' ? 'fa-sort-up' : 'fa-sort-down') : ''}`}></i>
                    </th>
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
                      className="py-3 px-3 text-left cursor-pointer hover:bg-gray-300 text-xs font-semibold w-24"
                      onClick={() => handleSort('customerType')}
                    >
                      Type
                      <i className={`fas fa-sort ml-1 ${sortConfig.key === 'customerType' ? 
                        (sortConfig.direction === 'asc' ? 'fa-sort-up' : 'fa-sort-down') : ''}`}></i>
                    </th>
                    <th className="py-3 px-3 text-left text-xs font-semibold w-48">Notes</th>
                    <th 
                      className="py-3 px-3 text-left cursor-pointer hover:bg-gray-300 text-xs font-semibold w-20"
                      onClick={() => handleSort('status')}
                    >
                      Status
                      <i className={`fas fa-sort ml-1 ${sortConfig.key === 'status' ? 
                        (sortConfig.direction === 'asc' ? 'fa-sort-up' : 'fa-sort-down') : ''}`}></i>
                    </th>
                    <th className="py-3 px-3 text-left text-xs font-semibold w-20">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCustomers.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-8 text-gray-500 text-sm">
                        No customers found matching your filters.
                        <button
                          onClick={() => setShowAddForm(true)}
                          className="block mt-2 text-blue-600 hover:text-blue-800 font-medium mx-auto"
                        >
                          Add a new customer
                        </button>
                      </td>
                    </tr>
                  ) : (
                    sortedCustomers.map((customer) => (
                      <tr key={customer.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-3 text-xs align-top font-medium">{customer.customerName}</td>
                        <td className="py-3 px-3 text-xs align-top">{customer.mobile}</td>
                        <td className="py-3 px-3 text-xs align-top">{customer.area || '-'}</td>
                        <td className="py-3 px-3 text-xs align-top">{customer.landmark || '-'}</td>
                        <td className="py-3 px-3 text-xs align-top">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            customer.customerType === 'Installation' 
                              ? 'bg-blue-100 text-blue-800'
                              : customer.customerType === 'Broadband'
                              ? 'bg-green-100 text-green-800'
                              : customer.customerType === 'Cable'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {customer.customerType || 'Installation'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-xs align-top">
                          <div className="whitespace-pre-wrap break-words leading-relaxed">
                            {customer.notes || 'No notes'}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-xs align-top">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            customer.status === 'Active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {customer.status || 'Active'}
                          </span>
                        </td>
                        <td className="py-3 px-3 align-top">
                          <div className="flex flex-col items-center space-y-2">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleNavigateToCustomer(customer)}
                                className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                                title="Navigate"
                              >
                                <i className="fas fa-directions text-sm"></i>
                              </button>
                              <button
                                onClick={() => handleViewCustomerOnMap(customer)}
                                className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50 transition-colors"
                                title="View on Map"
                              >
                                <i className="fas fa-map-marker-alt text-sm"></i>
                              </button>
                              <button
                                onClick={() => handleEditCustomer(customer)}
                                className="text-indigo-600 hover:text-indigo-800 p-1 rounded hover:bg-indigo-50 transition-colors"
                                title="Edit"
                              >
                                <i className="fas fa-edit text-sm"></i>
                              </button>
                              <button
                                onClick={() => handleDeleteCustomer(customer.id)}
                                className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                                title="Delete"
                              >
                                <i className="fas fa-trash text-sm"></i>
                              </button>
                            </div>
                            <button
                              onClick={() => handleToggleStatus(customer.id, customer.status || 'Active')}
                              className={`p-1 rounded transition-colors ${
                                customer.status === 'Active' 
                                  ? 'text-orange-600 hover:text-orange-800 hover:bg-orange-50' 
                                  : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                              }`}
                              title={customer.status === 'Active' ? 'Deactivate' : 'Activate'}
                            >
                              <i className={`fas ${
                                customer.status === 'Active' ? 'fa-pause-circle' : 'fa-play-circle'
                              } text-sm`}></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          // Add/Edit Customer Form
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h2>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingCustomer(null);
                  setErrors({});
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Staff Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Staff Name <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.staffName}
                  onChange={(e) => handleInputChange('staffName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 touch-target"
                >
                  <option value="">Select staff name...</option>
                  {staffMembers.map(staff => (
                    <option key={staff.id} value={staff.name}>{staff.name}</option>
                  ))}
                </select>
                {errors.staffName && <p className="text-red-500 text-sm mt-1">{errors.staffName}</p>}
              </div>

              {/* Customer Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => handleInputChange('customerName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 touch-target"
                  placeholder="Enter customer's full name"
                />
                {errors.customerName && <p className="text-red-500 text-sm mt-1">{errors.customerName}</p>}
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => handleInputChange('mobile', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 touch-target"
                  placeholder="Enter customer's mobile number"
                />
                {errors.mobile && <p className="text-red-500 text-sm mt-1">{errors.mobile}</p>}
              </div>

              {/* Customer Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.customerType}
                  onChange={(e) => handleInputChange('customerType', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 touch-target"
                >
                  <option value="Broadband">Broadband</option>
                  <option value="Cable">Cable</option>
                  <option value="Both">Both</option>
                </select>
              </div>

              {/* Service Area and Landmark */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Area <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.serviceArea}
                    onChange={(e) => handleInputChange('serviceArea', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 touch-target"
                  >
                    <option value="">Select an area...</option>
                    {serviceAreas.map(area => (
                      <option key={area.id} value={area.name}>{area.name}</option>
                    ))}
                  </select>
                  {errors.serviceArea && <p className="text-red-500 text-sm mt-1">{errors.serviceArea}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Landmark <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.landmark}
                    onChange={(e) => handleInputChange('landmark', e.target.value)}
                    disabled={!formData.serviceArea}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 touch-target disabled:bg-gray-100"
                  >
                    <option value="">Select a landmark...</option>
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
                  Customer Location <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowLocationPicker(true)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-blue-500 touch-target hover:bg-gray-50"
                >
                  {formData.location ? formData.location.address : 'Search for a location...'}
                </button>
                {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Enter any additional notes..."
                />
              </div>

              {/* Photos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attachments
                </label>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <label className="cursor-pointer bg-blue-50 text-blue-700 p-3 rounded-lg hover:bg-blue-100 text-center font-medium touch-target">
                    <i className="fas fa-upload mr-2"></i>
                    Upload Photo
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
                    onClick={() => setShowCamera(true)}
                    className="bg-gray-600 text-white p-3 rounded-lg hover:bg-gray-700 font-medium touch-target"
                  >
                    <i className="fas fa-camera mr-2"></i>
                    Take Photo
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
                          onClick={() => removePhoto(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingCustomer(null);
                    setErrors({});
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium touch-target"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium touch-target flex items-center"
                >
                  {loading ? (
                    <>
                      <div className="loader w-5 h-5 mr-2"></div>
                      {editingCustomer ? 'Updating...' : 'Adding...'}
                    </>
                  ) : (
                    editingCustomer ? 'Update Customer' : 'Add Customer'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
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
          title="Success!"
          message={editingCustomer ? "Customer updated successfully." : "Customer added successfully."}
          onClose={() => setShowSuccess(false)}
        />
      )}

      <MobileBottomNav />
    </div>
  );
};

export default CustomerView;
