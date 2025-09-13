import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, deleteDoc, doc, query, orderBy, onSnapshot, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import Header from '../components/common/Header';
import JobsTable from '../components/admin/JobsTable';
import EditJobModal from '../components/admin/EditJobModal';
import FilterControls from '../components/admin/FilterControls';
import MobileBottomNav from '../components/common/MobileBottomNav';
import ExportControls from '../components/admin/ExportControls';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [serviceAreas, setServiceAreas] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingJob, setEditingJob] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAreaConfigModal, setShowAreaConfigModal] = useState(false);
  const [selectedAreaForEditing, setSelectedAreaForEditing] = useState(null);
  const [editedLandmarks, setEditedLandmarks] = useState([]);
  const [newAreaName, setNewAreaName] = useState('');
  const [newLandmark, setNewLandmark] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [filters, setFilters] = useState({
    area: 'all',
    landmark: 'all',
    category: 'all',
    jobType: 'all',
    staff: 'all',
    staffName: 'all',
    timeRange: 'all',
    period: 'all',
    startDate: '',
    endDate: '',
    search: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch jobs
        const jobsSnapshot = await getDocs(query(collection(db, 'jobs'), orderBy('timestamp', 'desc')));
        const jobsData = jobsSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          timestamp: doc.data().timestamp
        }));
        console.log('Fetched jobs:', jobsData);
        console.log('Jobs length:', jobsData.length);
        setJobs(jobsData);

        // Fetch service areas
        const areasSnapshot = await getDocs(collection(db, 'serviceAreas'));
        const areasData = areasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setServiceAreas(areasData);

        // Fetch staff members
        const staffSnapshot = await getDocs(collection(db, 'staffMembers'));
        const staffData = staffSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setStaffMembers(staffData);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [jobs, filters, searchTerm]);

  const applyFilters = () => {
    let filtered = [...jobs];
    console.log('Applying filters to jobs:', jobs.length);
    console.log('Current filters:', filters);

    // Area filter
    if (filters.area !== 'all') {
      filtered = filtered.filter(job => job.area === filters.area);
      console.log('After area filter:', filtered.length);
    }

    // Landmark filter
    if (filters.landmark !== 'all') {
      filtered = filtered.filter(job => job.landmark === filters.landmark);
      console.log('After landmark filter:', filtered.length);
    }

    // Job Type filter (category)
    if (filters.jobType !== 'all') {
      filtered = filtered.filter(job => job.category === filters.jobType);
      console.log('After job type filter:', filtered.length);
    }

    // Staff filter
    if (filters.staffName !== 'all') {
      filtered = filtered.filter(job => job.staffName === filters.staffName);
      console.log('After staff filter:', filtered.length);
    }

    // Time period filter
    if (filters.period !== 'all') {
      const now = new Date();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      filtered = filtered.filter(job => {
        const jobDate = job.timestamp?.toDate ? job.timestamp.toDate() : new Date(job.timestamp);
        
        switch (filters.period) {
          case 'week':
            return jobDate >= startOfWeek;
          case 'month':
            return jobDate >= startOfMonth;
          case 'custom':
            if (filters.startDate && filters.endDate) {
              const start = new Date(filters.startDate);
              const end = new Date(filters.endDate);
              end.setHours(23, 59, 59, 999); // Include the entire end date
              return jobDate >= start && jobDate <= end;
            }
            return true;
          default:
            return true;
        }
      });
      console.log('After time filter:', filtered.length);
    }

    // Search filter
    const searchValue = filters.search || searchTerm;
    if (searchValue) {
      const searchLower = searchValue.toLowerCase();
      filtered = filtered.filter(job => 
        job.staffName?.toLowerCase().includes(searchLower) ||
        job.area?.toLowerCase().includes(searchLower) ||
        job.landmark?.toLowerCase().includes(searchLower) ||
        job.notes?.toLowerCase().includes(searchLower) ||
        job.customerAddress?.toLowerCase().includes(searchLower) ||
        job.address?.toLowerCase().includes(searchLower) ||
        job.category?.toLowerCase().includes(searchLower)
      );
      console.log('After search filter:', filtered.length);
    }

    console.log('Final filtered jobs:', filtered.length);
    setFilteredJobs(filtered);
  };

  const handleDeleteJob = async (jobId) => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      try {
        await deleteDoc(doc(db, 'jobs', jobId));
      } catch (error) {
        console.error('Error deleting job:', error);
        alert('Failed to delete job. Please try again.');
      }
    }
  };

  const handleEditJob = (job) => {
    setEditingJob(job);
    setShowEditModal(true);
  };

  const handleJobUpdated = () => {
    // Jobs will be automatically updated via onSnapshot listener
    console.log('Job updated successfully');
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingJob(null);
  };

  const handleSort = (key) => {
    // This function can be implemented for sorting functionality
    console.log('Sort by:', key);
  };

  // Area Configuration Functions
  const handleAddServiceArea = async () => {
    if (!newAreaName.trim()) {
      alert("Area name cannot be empty.");
      return;
    }
    if (serviceAreas.some(area => area.name.toLowerCase() === newAreaName.toLowerCase())) {
      alert("This service area already exists.");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "serviceAreas"), {
        name: newAreaName.trim(),
        landmarks: [],
        timestamp: new Date()
      });
      setNewAreaName('');
      setSuccessMessage(`Service area "${newAreaName}" added successfully.`);
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error adding service area: ", error);
      alert("Failed to add service area.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSelectedArea = async () => {
    if (!selectedAreaForEditing) {
      alert("No area selected.");
      return;
    }
    const areaName = selectedAreaForEditing.name;
    if (window.confirm(`Are you sure you want to delete the area "${areaName}" and all its landmarks? This action cannot be undone.`)) {
      setLoading(true);
      try {
        await deleteDoc(doc(db, "serviceAreas", selectedAreaForEditing.id));
        setSelectedAreaForEditing(null);
        setEditedLandmarks([]);
        setSuccessMessage(`Area "${areaName}" was deleted successfully.`);
        setShowSuccessModal(true);
      } catch (error) {
        console.error("Error deleting service area: ", error);
        alert("Failed to delete service area.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSaveChanges = async () => {
    if (!selectedAreaForEditing) {
      alert("Please select an area first.");
      return;
    }
    setLoading(true);
    try {
      const areaRef = doc(db, "serviceAreas", selectedAreaForEditing.id);
      await updateDoc(areaRef, {
        landmarks: editedLandmarks
      });
      setSuccessMessage(`Changes for "${selectedAreaForEditing.name}" saved successfully.`);
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error saving changes: ", error);
      alert("Failed to save changes.");
    } finally {
      setLoading(false);
    }
  };

  const handleAreaSelect = (areaId) => {
    if (areaId) {
      const area = serviceAreas.find(a => a.id === areaId);
      setSelectedAreaForEditing(area);
      setEditedLandmarks([...area.landmarks]);
    } else {
      setSelectedAreaForEditing(null);
      setEditedLandmarks([]);
    }
  };

  const handleAddLandmark = () => {
    if (!newLandmark.trim()) return;
    if (editedLandmarks.includes(newLandmark.trim())) {
      alert("This landmark already exists.");
      return;
    }
    setEditedLandmarks([...editedLandmarks, newLandmark.trim()]);
    setNewLandmark('');
  };

  const handleRemoveLandmark = (landmark) => {
    setEditedLandmarks(editedLandmarks.filter(l => l !== landmark));
  };


  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <Header 
        title="Cable Service Dashboard"
        showLanguageSwitch={false}
      />

      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Action Buttons */}
        <div className="mb-6 flex flex-wrap gap-3">
          <button
            onClick={() => setShowAreaConfigModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-md"
          >
            <i className="fas fa-cog mr-2"></i>
            Area Configuration
          </button>
          <ExportControls jobs={filteredJobs} />
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-md">
          <FilterControls
            filters={filters}
            setFilters={setFilters}
            serviceAreas={serviceAreas}
            staffMembers={staffMembers}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            t={t}
          />
          
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="text-gray-500">Loading jobs...</div>
            </div>
          ) : (
            <JobsTable
              jobs={filteredJobs}
              onDeleteJob={handleDeleteJob}
              onEditJob={handleEditJob}
              sortBy={''}
              sortOrder={''}
              onSort={handleSort}
            />
          )}
        </div>
      </div>

      <MobileBottomNav />

      {/* Edit Job Modal */}
      <EditJobModal
        job={editingJob}
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        onJobUpdated={handleJobUpdated}
      />

      {/* Area Configuration Modal */}
      {showAreaConfigModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Area & Landmark Configuration</h2>
              <button
                onClick={() => setShowAreaConfigModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Add New Area Section */}
              <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">
                  <i className="fas fa-plus-circle mr-2"></i>
                  Add New Service Area
                </h3>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newAreaName}
                    onChange={(e) => setNewAreaName(e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter new area name (e.g., Downtown, Suburbs)"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddServiceArea()}
                  />
                  <button
                    onClick={handleAddServiceArea}
                    disabled={loading || !newAreaName.trim()}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? (
                      <i className="fas fa-spinner fa-spin"></i>
                    ) : (
                      <>
                        <i className="fas fa-plus mr-2"></i>
                        Add Area
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Edit Existing Area Section */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  <i className="fas fa-edit mr-2"></i>
                  Edit Existing Areas
                </h3>
                <select
                  value={selectedAreaForEditing?.id || ''}
                  onChange={(e) => handleAreaSelect(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- Select Area to Edit --</option>
                  {serviceAreas.map(area => (
                    <option key={area.id} value={area.id}>{area.name}</option>
                  ))}
                </select>
              </div>

              {/* Landmark Editor */}
              {selectedAreaForEditing && (
                <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">
                      <i className="fas fa-map-marker-alt mr-2"></i>
                      Manage Landmarks for "{selectedAreaForEditing.name}"
                    </h4>
                    <button
                      onClick={handleDeleteSelectedArea}
                      disabled={loading}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <i className="fas fa-trash mr-2"></i>
                      Delete Area
                    </button>
                  </div>

                  {/* Landmarks List */}
                  <div className="mb-4">
                    <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-4 bg-white">
                      {editedLandmarks.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No landmarks added yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {editedLandmarks.sort().map(landmark => (
                            <div key={landmark} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <span className="font-medium text-gray-700">{landmark}</span>
                              <button
                                onClick={() => handleRemoveLandmark(landmark)}
                                className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                                title="Remove landmark"
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Add New Landmark */}
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newLandmark}
                      onChange={(e) => setNewLandmark(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Add new landmark (e.g., Main Street, City Hall)"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddLandmark()}
                    />
                    <button
                      onClick={handleAddLandmark}
                      disabled={!newLandmark.trim()}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <i className="fas fa-plus mr-2"></i>
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowAreaConfigModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors"
                >
                  Close
                </button>
                {selectedAreaForEditing && (
                  <button
                    onClick={handleSaveChanges}
                    disabled={loading}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save mr-2"></i>
                        Save Changes
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <i className="fas fa-check text-green-600 text-xl"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Success!</h3>
              <p className="text-sm text-gray-600 mb-6">{successMessage}</p>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  setSuccessMessage('');
                }}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
