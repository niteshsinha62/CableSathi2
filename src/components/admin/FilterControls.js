import React from 'react';

const FilterControls = ({ filters, setFilters, serviceAreas, staffMembers, searchTerm, setSearchTerm, t }) => {
  const selectedArea = serviceAreas.find(area => area.name === filters.area);
  const landmarks = selectedArea?.landmarks || [];

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    
    // Clear landmark when area changes
    if (key === 'area') {
      setFilters(prev => ({ ...prev, landmark: 'all' }));
    }
  };

  return (
    <div className="p-4 border-b border-gray-200">
      {/* Mobile-first filter layout */}
      <div className="space-y-4">
        {/* Search */}
        <div className="w-full">
          <input
            type="text"
            placeholder="Search notes, address, staff..."
            value={filters.search || searchTerm || ''}
            onChange={(e) => {
              const value = e.target.value;
              handleFilterChange('search', value);
              if (setSearchTerm) setSearchTerm(value);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filter dropdowns - 2 columns on mobile, 5 on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <select
            value={filters.area}
            onChange={(e) => handleFilterChange('area', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Areas</option>
            {serviceAreas.map(area => (
              <option key={area.id} value={area.name}>{area.name}</option>
            ))}
          </select>

          <select
            value={filters.landmark}
            onChange={(e) => handleFilterChange('landmark', e.target.value)}
            disabled={filters.area === 'all'}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100"
          >
            <option value="all">All Landmarks</option>
            {landmarks.map(landmark => (
              <option key={landmark} value={landmark}>{landmark}</option>
            ))}
          </select>

          <select
            value={filters.jobType}
            onChange={(e) => handleFilterChange('jobType', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Job Types</option>
            <option value="Installation">Installation</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Repair">Repair</option>
          </select>

          <select
            value={filters.staffName}
            onChange={(e) => handleFilterChange('staffName', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Staff</option>
            {staffMembers.map(staff => (
              <option key={staff.id} value={staff.name}>{staff.name}</option>
            ))}
          </select>

          <select
            value={filters.period}
            onChange={(e) => handleFilterChange('period', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Time</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        {/* Custom date range */}
        {filters.period === 'custom' && (
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-500 text-sm">to</span>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterControls;
