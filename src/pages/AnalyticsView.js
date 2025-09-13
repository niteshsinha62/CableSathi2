import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import Header from '../components/common/Header';
import MobileBottomNav from '../components/common/MobileBottomNav';
import { db } from '../config/firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import ExportControls from '../components/admin/ExportControls';

const AnalyticsView = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [serviceAreas, setServiceAreas] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [filters, setFilters] = useState({
    area: 'all',
    period: 'all',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    // Listen for jobs
    const jobsQuery = query(collection(db, 'jobs'), orderBy('timestamp', 'desc'));
    const unsubscribeJobs = onSnapshot(jobsQuery, (snapshot) => {
      const jobsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setJobs(jobsData);
    });

    // Listen for service areas
    const areasQuery = query(collection(db, 'serviceAreas'), orderBy('name'));
    const unsubscribeAreas = onSnapshot(areasQuery, (snapshot) => {
      const areas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setServiceAreas(areas);
    });

    return () => {
      unsubscribeJobs();
      unsubscribeAreas();
    };
  }, []);

  useEffect(() => {
    calculateAnalytics();
  }, [jobs, filters]);

  const calculateAnalytics = () => {
    let filteredJobs = [...jobs];

    // Apply area filter
    if (filters.area !== 'all') {
      filteredJobs = filteredJobs.filter(job => job.area === filters.area);
    }

    // Apply date filter
    if (filters.period !== 'all') {
      const now = new Date();
      let startDate;

      switch (filters.period) {
        case 'week':
          startDate = new Date();
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate = new Date();
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'custom':
          if (filters.startDate && filters.endDate) {
            const start = new Date(filters.startDate);
            const end = new Date(filters.endDate);
            end.setHours(23, 59, 59, 999);
            filteredJobs = filteredJobs.filter(job => {
              const jobDate = job.timestamp?.toDate?.() || new Date(job.timestamp);
              return jobDate >= start && jobDate <= end;
            });
          }
          break;
      }

      if (startDate && filters.period !== 'custom') {
        filteredJobs = filteredJobs.filter(job => {
          const jobDate = job.timestamp?.toDate?.() || new Date(job.timestamp);
          return jobDate >= startDate;
        });
      }
    }

    // Calculate analytics
    const areaStats = {};
    const jobTypeStats = { Installation: 0, Maintenance: 0, Repair: 0 };
    const staffStats = {};
    const dailyStats = {};

    filteredJobs.forEach(job => {
      // Area statistics
      if (!areaStats[job.area]) {
        areaStats[job.area] = { total: 0, Installation: 0, Maintenance: 0, Repair: 0 };
      }
      areaStats[job.area].total++;
      areaStats[job.area][job.category]++;

      // Job type statistics
      jobTypeStats[job.category]++;

      // Staff statistics
      if (!staffStats[job.staffName]) {
        staffStats[job.staffName] = 0;
      }
      staffStats[job.staffName]++;

      // Daily statistics
      const date = (job.timestamp?.toDate?.() || new Date(job.timestamp)).toDateString();
      if (!dailyStats[date]) {
        dailyStats[date] = 0;
      }
      dailyStats[date]++;
    });

    setAnalytics({
      totalJobs: filteredJobs.length,
      areaStats,
      jobTypeStats,
      staffStats,
      dailyStats,
      topArea: Object.keys(areaStats).reduce((a, b) => areaStats[a]?.total > areaStats[b]?.total ? a : b, ''),
      topStaff: Object.keys(staffStats).reduce((a, b) => staffStats[a] > staffStats[b] ? a : b, '')
    });
  };


  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <Header 
        title={t('viewAnalytics')}
        showLanguageSwitch={false}
      >
        <div className="flex items-center space-x-3">
          <ExportControls jobs={jobs} />
          <button
            onClick={() => navigate('/admin')}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            <i className="fas fa-arrow-left mr-1"></i>
            Back
          </button>
        </div>
      </Header>

      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={filters.area}
              onChange={(e) => setFilters(prev => ({ ...prev, area: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Areas</option>
              {serviceAreas.map(area => (
                <option key={area.id} value={area.name}>{area.name}</option>
              ))}
            </select>

            <select
              value={filters.period}
              onChange={(e) => setFilters(prev => ({ ...prev, period: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Time</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="custom">Custom Range</option>
            </select>

            {filters.period === 'custom' && (
              <>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <i className="fas fa-clipboard-list text-blue-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalJobs || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <i className="fas fa-tools text-green-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Installations</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.jobTypeStats?.Installation || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100">
                <i className="fas fa-wrench text-yellow-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Maintenance</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.jobTypeStats?.Maintenance || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100">
                <i className="fas fa-hammer text-red-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Repairs</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.jobTypeStats?.Repair || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Area Performance */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Area Performance</h3>
            <div className="space-y-4">
              {Object.entries(analytics.areaStats || {}).map(([area, stats]) => (
                <div key={area} className="border-b pb-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{area}</span>
                    <span className="text-sm text-gray-600">{stats.total} jobs</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="text-center p-2 bg-green-50 rounded">
                      <div className="text-green-600 font-semibold">{stats.Installation}</div>
                      <div className="text-gray-600">Install</div>
                    </div>
                    <div className="text-center p-2 bg-yellow-50 rounded">
                      <div className="text-yellow-600 font-semibold">{stats.Maintenance}</div>
                      <div className="text-gray-600">Maintain</div>
                    </div>
                    <div className="text-center p-2 bg-red-50 rounded">
                      <div className="text-red-600 font-semibold">{stats.Repair}</div>
                      <div className="text-gray-600">Repair</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Staff Performance */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Staff Performance</h3>
            <div className="space-y-3">
              {Object.entries(analytics.staffStats || {})
                .sort(([,a], [,b]) => b - a)
                .map(([staff, count]) => (
                <div key={staff} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium">{staff}</span>
                  <div className="flex items-center">
                    <span className="text-lg font-bold text-blue-600 mr-2">{count}</span>
                    <span className="text-sm text-gray-600">jobs</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Performers */}
        {analytics.topArea && analytics.topStaff && (
          <div className="mt-6 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Top Performers</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <i className="fas fa-trophy text-blue-600 text-2xl mb-2"></i>
                <h4 className="font-semibold text-blue-900">Top Area</h4>
                <p className="text-xl font-bold text-blue-600">{analytics.topArea}</p>
                <p className="text-sm text-blue-700">{analytics.areaStats[analytics.topArea]?.total} jobs</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <i className="fas fa-star text-green-600 text-2xl mb-2"></i>
                <h4 className="font-semibold text-green-900">Top Staff</h4>
                <p className="text-xl font-bold text-green-600">{analytics.topStaff}</p>
                <p className="text-sm text-green-700">{analytics.staffStats[analytics.topStaff]} jobs</p>
              </div>
            </div>
          </div>
        )}
      </div>


      <MobileBottomNav />
    </div>
  );
};

export default AnalyticsView;
