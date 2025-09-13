import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import Header from '../components/common/Header';
import MobileBottomNav from '../components/common/MobileBottomNav';
import { db } from '../config/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';

const StaffManagement = () => {
  const { user, isAdmin } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [staffMembers, setStaffMembers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showLeaveListModal, setShowLeaveListModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [formData, setFormData] = useState({ name: '', mobile: '', salary: '' });
  const [leaveData, setLeaveData] = useState({ date: '', reason: '' });
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    period: 'month',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    // Listen for staff members
    const staffQuery = query(collection(db, 'staffMembers'), orderBy('name'));
    const unsubscribeStaff = onSnapshot(staffQuery, (snapshot) => {
      const staff = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStaffMembers(staff);
    });

    // Listen for jobs
    const jobsQuery = query(collection(db, 'jobs'), orderBy('timestamp', 'desc'));
    const unsubscribeJobs = onSnapshot(jobsQuery, (snapshot) => {
      const jobsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setJobs(jobsData);
    });

    return () => {
      unsubscribeStaff();
      unsubscribeJobs();
    };
  }, []);

  const calculateStaffStats = () => {
    let filteredJobs = [...jobs];
    const now = new Date();
    let startDate, endDate;

    // Apply date filter
    if (filters.period !== 'all') {
      switch (filters.period) {
        case 'today':
          startDate = new Date();
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date();
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'week':
          startDate = new Date();
          startDate.setDate(now.getDate() - 7);
          endDate = new Date();
          break;
        case 'month':
          startDate = new Date();
          startDate.setMonth(now.getMonth() - 1);
          endDate = new Date();
          break;
        case 'custom':
          if (filters.startDate && filters.endDate) {
            startDate = new Date(filters.startDate);
            endDate = new Date(filters.endDate);
            endDate.setHours(23, 59, 59, 999);
          }
          break;
        default:
          break;
      }

      if (startDate && endDate) {
        filteredJobs = filteredJobs.filter(job => {
          const jobDate = job.timestamp?.toDate?.() || new Date(job.timestamp);
          return jobDate >= startDate && jobDate <= endDate;
        });
      }
    }

    const staffStats = {};
    const currentYear = new Date().getFullYear();
    
    staffMembers.forEach(staff => {
      // Calculate current year leave count only
      let leaveCount = 0;
      if (staff.leaves && Array.isArray(staff.leaves)) {
        leaveCount = staff.leaves.filter(leave => {
          // Handle both old format (string dates) and new format (objects with date)
          const leaveDate = typeof leave === 'string' ? leave : leave.date;
          const date = new Date(leaveDate);
          return date.getFullYear() === currentYear;
        }).length;
      }

      staffStats[staff.name] = {
        id: staff.id,
        mobile: staff.mobile || 'N/A',
        salary: staff.salary ? `₹${parseInt(staff.salary).toLocaleString('en-IN')}` : 'N/A',
        leaveCount: leaveCount,
        allLeaves: staff.leaves || [],
        Installation: 0,
        Maintenance: 0,
        Repair: 0,
        total: 0
      };
    });

    filteredJobs.forEach(job => {
      if (staffStats[job.staffName] && job.category) {
        staffStats[job.staffName][job.category]++;
        staffStats[job.staffName].total++;
      }
    });

    return staffStats;
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.mobile.trim()) {
      setError('Name and mobile number are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (selectedStaff) {
        // Update existing staff
        await updateDoc(doc(db, 'staffMembers', selectedStaff.id), {
          name: formData.name.trim(),
          mobile: formData.mobile.trim(),
          salary: formData.salary.trim() || null
        });
      } else {
        // Add new staff
        await addDoc(collection(db, 'staffMembers'), {
          name: formData.name.trim(),
          mobile: formData.mobile.trim(),
          salary: formData.salary.trim() || null,
          leaves: [],
          timestamp: new Date()
        });
      }
      
      setShowAddModal(false);
      setFormData({ name: '', mobile: '', salary: '' });
      setSelectedStaff(null);
    } catch (error) {
      console.error('Error saving staff:', error);
      setError('Failed to save staff member');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStaff = async () => {
    if (!selectedStaff) return;

    setLoading(true);
    try {
      await deleteDoc(doc(db, 'staffMembers', selectedStaff.id));
      setShowDeleteModal(false);
      setSelectedStaff(null);
    } catch (error) {
      console.error('Error deleting staff:', error);
      alert('Failed to delete staff member');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLeave = async (e) => {
    e.preventDefault();
    if (!leaveData.date) {
      setError('Leave date is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const staffDoc = doc(db, 'staffMembers', selectedStaff.id);
      const currentStaff = staffMembers.find(s => s.id === selectedStaff.id);
      const currentLeaves = currentStaff.leaves || [];
      
      // Create leave object with date and reason
      const leaveEntry = {
        date: leaveData.date,
        reason: leaveData.reason || 'No reason provided'
      };
      
      // Add new leave entry to the array
      const updatedLeaves = [...currentLeaves, leaveEntry];
      
      await updateDoc(staffDoc, {
        leaves: updatedLeaves
      });
      
      setShowLeaveModal(false);
      setLeaveData({ date: '', reason: '' });
      setSelectedStaff(null);
    } catch (error) {
      console.error('Error adding leave:', error);
      setError('Failed to add leave');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLeave = async (leaveIndex) => {
    setLoading(true);
    try {
      const staffDoc = doc(db, 'staffMembers', selectedStaff.id);
      const currentStaff = staffMembers.find(s => s.id === selectedStaff.id);
      const currentLeaves = currentStaff.leaves || [];
      
      // Remove the leave entry at the specified index
      const updatedLeaves = currentLeaves.filter((_, index) => index !== leaveIndex);
      
      await updateDoc(staffDoc, {
        leaves: updatedLeaves
      });
      
      // Update the selected staff data to reflect the change immediately
      setSelectedStaff(prev => ({
        ...prev,
        leaves: updatedLeaves
      }));
      
      // Show success message
      setSuccessMessage('Leave entry deleted successfully!');
      setShowSuccessModal(true);
      
    } catch (error) {
      console.error('Error deleting leave:', error);
      setError('Failed to delete leave');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (staff) => {
    setSelectedStaff(staff);
    // Extract numeric value from formatted salary (remove ₹ and commas)
    const numericSalary = staff.salary && staff.salary !== 'N/A' 
      ? staff.salary.replace(/₹|,/g, '') 
      : '';
    setFormData({ name: staff.name, mobile: staff.mobile || '', salary: numericSalary });
    setShowAddModal(true);
  };

  const openLeaveModal = (staff) => {
    setSelectedStaff(staff);
    setLeaveData({ date: '', reason: '' });
    setShowLeaveModal(true);
  };

  const openLeaveListModal = (staff) => {
    setSelectedStaff(staff);
    setShowLeaveListModal(true);
  };

  const openDeleteModal = (staff) => {
    setSelectedStaff(staff);
    setShowDeleteModal(true);
  };

  const staffStats = calculateStaffStats();
  const bestPerformer = Object.keys(staffStats).reduce((a, b) => 
    staffStats[a]?.total > staffStats[b]?.total ? a : b, ''
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <Header 
        title={t('manageStaff')}
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

      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Staff Performance</h2>
            <p className="text-gray-600">Manage staff members and view their performance</p>
          </div>
          <button
            onClick={() => {
              setSelectedStaff(null);
              setFormData({ name: '', mobile: '' });
              setShowAddModal(true);
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium touch-target"
          >
            <i className="fas fa-plus mr-2"></i>
            Add Staff
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <label className="font-medium text-gray-700">Date Range:</label>
            <select
              value={filters.period}
              onChange={(e) => setFilters(prev => ({ ...prev, period: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="month">Current Month</option>
              <option value="week">This Week</option>
              <option value="today">Today</option>
              <option value="all">All Time</option>
              <option value="custom">Custom Range</option>
            </select>
            
            {filters.period === 'custom' && (
              <div className="flex gap-2 items-center">
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  className="px-2 py-1 border border-gray-300 rounded-lg"
                />
                <span>to</span>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  className="px-2 py-1 border border-gray-300 rounded-lg"
                />
              </div>
            )}
          </div>
        </div>

        {/* Staff Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Mobile View */}
          <div className="md:hidden">
            {Object.entries(staffStats).map(([name, stats]) => (
              <div key={stats.id} className="p-4 border-b border-gray-200">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 flex items-center">
                      {name === bestPerformer && staffStats[bestPerformer]?.total > 0 && (
                        <i className="fas fa-star text-yellow-400 mr-2" title="Best Performer"></i>
                      )}
                      {name}
                    </h3>
                    <p className="text-sm text-gray-600">{stats.mobile}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openEditModal({ id: stats.id, name, mobile: stats.mobile, salary: stats.salary })}
                      className="text-blue-600 hover:text-blue-800 p-2"
                      title="Edit Staff"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      onClick={() => openLeaveModal({ id: stats.id, name })}
                      className="text-green-600 hover:text-green-800 p-2"
                      title="Add Leave"
                    >
                      <i className="fas fa-calendar-plus"></i>
                    </button>
                    <button
                      onClick={() => openDeleteModal({ id: stats.id, name })}
                      className="text-red-600 hover:text-red-800 p-2"
                      title="Delete Staff"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div>
                    <span className="text-gray-600">Salary: </span>
                    <span className="font-medium">{stats.salary}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Leaves: </span>
                    <button
                      onClick={() => openLeaveListModal({ id: stats.id, name, leaves: stats.allLeaves })}
                      className="font-medium text-blue-600 hover:text-blue-800"
                    >
                      {stats.leaveCount}
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-2 text-center text-sm">
                  <div className="bg-green-50 p-2 rounded">
                    <div className="font-semibold text-green-600">{stats.Installation}</div>
                    <div className="text-gray-600">Install</div>
                  </div>
                  <div className="bg-yellow-50 p-2 rounded">
                    <div className="font-semibold text-yellow-600">{stats.Maintenance}</div>
                    <div className="text-gray-600">Maintain</div>
                  </div>
                  <div className="bg-red-50 p-2 rounded">
                    <div className="font-semibold text-red-600">{stats.Repair}</div>
                    <div className="text-gray-600">Repair</div>
                  </div>
                  <div className="bg-blue-50 p-2 rounded">
                    <div className="font-semibold text-blue-600">{stats.total}</div>
                    <div className="text-gray-600">Total</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-200">
                <tr>
                  <th className="py-3 px-4 text-left">Name</th>
                  <th className="py-3 px-4 text-left">Mobile</th>
                  <th className="py-3 px-4 text-left">Salary</th>
                  <th className="py-3 px-4 text-center">Leave Count</th>
                  <th className="py-3 px-4 text-center">Installation</th>
                  <th className="py-3 px-4 text-center">Maintenance</th>
                  <th className="py-3 px-4 text-center">Repair</th>
                  <th className="py-3 px-4 text-center">Total Jobs</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(staffStats).map(([name, stats]) => (
                  <tr key={stats.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">
                      {name === bestPerformer && staffStats[bestPerformer]?.total > 0 && (
                        <i className="fas fa-star text-yellow-400 mr-2" title="Best Performer"></i>
                      )}
                      {name}
                    </td>
                    <td className="py-3 px-4">{stats.mobile}</td>
                    <td className="py-3 px-4">{stats.salary}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => openLeaveListModal({ id: stats.id, name, leaves: stats.allLeaves })}
                        className="font-medium text-blue-600 hover:text-blue-800"
                      >
                        {stats.leaveCount}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center">{stats.Installation}</td>
                    <td className="py-3 px-4 text-center">{stats.Maintenance}</td>
                    <td className="py-3 px-4 text-center">{stats.Repair}</td>
                    <td className="py-3 px-4 text-center font-bold">{stats.total}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => openEditModal({ id: stats.id, name, mobile: stats.mobile, salary: stats.salary })}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Edit"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          onClick={() => openLeaveModal({ id: stats.id, name })}
                          className="text-green-600 hover:text-green-800 p-1"
                          title="Add Leave"
                        >
                          <i className="fas fa-calendar-plus"></i>
                        </button>
                        <button
                          onClick={() => openDeleteModal({ id: stats.id, name })}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Delete"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {selectedStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
            </h3>
            
            <form onSubmit={handleAddStaff} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                <input
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Salary (Optional)</label>
                <input
                  type="number"
                  value={formData.salary}
                  onChange={(e) => setFormData(prev => ({ ...prev, salary: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="25000"
                />
                <p className="text-xs text-gray-500 mt-1">Enter amount in numbers only (e.g., 25000)</p>
              </div>
              
              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</div>
              )}
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedStaff(null);
                    setFormData({ name: '', mobile: '', salary: '' });
                    setError('');
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (selectedStaff ? 'Update' : 'Add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Delete Staff Member</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{selectedStaff?.name}</strong>? This action cannot be undone.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedStaff(null);
                }}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteStaff}
                disabled={loading}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Leave Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add Leave for {selectedStaff?.name}</h3>
            
            <form onSubmit={handleAddLeave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Leave Date</label>
                <input
                  type="date"
                  value={leaveData.date}
                  onChange={(e) => setLeaveData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason (Optional)</label>
                <input
                  type="text"
                  value={leaveData.reason}
                  onChange={(e) => setLeaveData(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Sick leave, Personal"
                />
              </div>
              
              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</div>
              )}
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowLeaveModal(false);
                    setSelectedStaff(null);
                    setLeaveData({ date: '', reason: '' });
                    setError('');
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Leave'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leave List Modal */}
      {showLeaveListModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-96 flex flex-col">
            {/* Fixed Header */}
            <div className="p-6 pb-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Leave History - {selectedStaff?.name}</h3>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 pt-4">
              {selectedStaff?.leaves && selectedStaff.leaves.length > 0 ? (
                <div className="space-y-3">
                  {selectedStaff.leaves.map((leave, index) => {
                    // Handle both old format (string dates) and new format (objects with date)
                    const leaveDate = typeof leave === 'string' ? leave : leave.date;
                    const leaveReason = typeof leave === 'object' ? leave.reason : 'No reason provided';
                    
                    return (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1">
                            <span className="text-sm font-medium block">
                              {new Date(leaveDate).toLocaleDateString('en-IN', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(leaveDate) > new Date() ? 'Upcoming' : 'Past'}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteLeave(index)}
                            disabled={loading}
                            className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                            title="Delete Leave"
                          >
                            <i className="fas fa-trash text-sm"></i>
                          </button>
                        </div>
                        
                        <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
                          <span className="font-medium">Reason: </span>
                          {leaveReason}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No leave records found</p>
              )}
            </div>
            
            {/* Fixed Footer */}
            <div className="p-6 pt-4 border-t border-gray-200">
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setShowLeaveListModal(false);
                    setSelectedStaff(null);
                  }}
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  Close
                </button>
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

      <MobileBottomNav />
    </div>
  );
};

export default StaffManagement;
