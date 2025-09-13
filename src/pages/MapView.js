import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { collection, onSnapshot, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useLanguage } from '../contexts/LanguageContext';
import Header from '../components/common/Header';
import MobileBottomNav from '../components/common/MobileBottomNav';

const MapView = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get('jobId');
  const [map, setMap] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [serviceAreas, setServiceAreas] = useState([]);
  const [markers, setMarkers] = useState([]);
  const [filters, setFilters] = useState({
    area: 'all',
    landmark: 'all',
    search: ''
  });
  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [infoWindows, setInfoWindows] = useState([]);
  const [activeInfoWindow, setActiveInfoWindow] = useState(null);
  const [singleJobMode, setSingleJobMode] = useState(false);

  useEffect(() => {
    // Initialize map when Google Maps is loaded
    const initMap = () => {
      if (window.google && window.google.maps && mapRef.current) {
        initializeMap();
      } else {
        // Retry after a short delay if Google Maps isn't ready
        setTimeout(initMap, 100);
      }
    };
    
    // Global functions for info window buttons
    window.openInMaps = (lat, lng) => {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      window.open(url, '_blank');
    };
    
    window.shareJobLocation = (lat, lng) => {
      const url = `https://www.google.com/maps?q=${lat},${lng}`;
      if (navigator.share) {
        navigator.share({
          title: 'Job Location',
          url: url
        });
      } else {
        navigator.clipboard.writeText(url);
        alert('Location URL copied to clipboard!');
      }
    };
    
    window.shareJobPhoto = (photoUrl) => {
      if (navigator.share) {
        navigator.share({
          title: 'Job Photo',
          url: photoUrl
        });
      } else {
        navigator.clipboard.writeText(photoUrl);
        alert('Photo URL copied to clipboard!');
      }
    };
    
    window.closeInfoWindow = () => {
      if (activeInfoWindow) {
        activeInfoWindow.close();
        setActiveInfoWindow(null);
      }
    };
    
    initMap();

    return () => {
      // Clean up global functions
      delete window.openInMaps;
      delete window.shareJobLocation;
      delete window.shareJobPhoto;
      delete window.closeInfoWindow;
    };
  }, []);

  useEffect(() => {
    // Check if we're in single job mode
    if (jobId) {
      setSingleJobMode(true);
      // Fetch single job
      const fetchSingleJob = async () => {
        try {
          const jobDoc = await getDoc(doc(db, 'jobs', jobId));
          if (jobDoc.exists()) {
            const jobData = { id: jobDoc.id, ...jobDoc.data() };
            setJobs([jobData]);
          }
        } catch (error) {
          console.error('Error fetching job:', error);
        }
      };
      fetchSingleJob();
    } else {
      setSingleJobMode(false);
      // Listen for all jobs
      const jobsQuery = query(collection(db, 'jobs'), orderBy('timestamp', 'desc'));
      const unsubscribeJobs = onSnapshot(jobsQuery, (snapshot) => {
        const jobsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setJobs(jobsData);
      });

      return () => {
        unsubscribeJobs();
      };
    }
  }, [jobId]);

  useEffect(() => {
    // Listen for service areas
    const areasQuery = query(collection(db, 'serviceAreas'), orderBy('name'));
    const unsubscribeAreas = onSnapshot(areasQuery, (snapshot) => {
      const areasData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setServiceAreas(areasData);
    });

    return () => {
      unsubscribeAreas();
    };
  }, []);

  useEffect(() => {
    applyFilters();
  }, [jobs, filters]);

  useEffect(() => {
    if (map) {
      updateMapMarkers();
      // Auto-center and zoom to single job if in single job mode
      if (singleJobMode && jobs.length === 1 && jobs[0].coordinates) {
        const job = jobs[0];
        map.setCenter({ lat: job.coordinates.lat, lng: job.coordinates.lng });
        map.setZoom(16);
      }
    }
  }, [map, filteredJobs, singleJobMode, jobs]);

  const initializeMap = () => {
    const mapInstance = new window.google.maps.Map(mapRef.current, {
      center: { lat: 25.5941, lng: 85.1376 }, // Default to Patna
      zoom: 11,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
      mapTypeControlOptions: {
        style: window.google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
        position: window.google.maps.ControlPosition.TOP_CENTER,
      }
    });

    setMap(mapInstance);
  };

  const applyFilters = () => {
    console.log('MapView - Total jobs:', jobs.length);
    
    // Check coordinate structure in sample jobs
    const sampleJobs = jobs.slice(0, 3);
    sampleJobs.forEach((job, index) => {
      console.log(`Sample job ${index}:`, {
        id: job.id,
        staffName: job.staffName,
        coordinates: job.coordinates,
        location: job.location,
        hasCoordinates: !!(job.coordinates && job.coordinates.lat && job.coordinates.lng),
        hasLocation: !!(job.location && job.location.lat && job.location.lng)
      });
    });
    
    let filtered = [...jobs];
    console.log('MapView - After initial filter:', filtered.length);

    if (filters.area !== 'all') {
      filtered = filtered.filter(job => job.area === filters.area);
      console.log('MapView - After area filter:', filtered.length);
    }

    if (filters.landmark !== 'all') {
      filtered = filtered.filter(job => job.landmark === filters.landmark);
      console.log('MapView - After landmark filter:', filtered.length);
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(job =>
        job.notes?.toLowerCase().includes(searchTerm) ||
        job.address?.toLowerCase().includes(searchTerm) ||
        job.customerAddress?.toLowerCase().includes(searchTerm) ||
        job.staffName?.toLowerCase().includes(searchTerm)
      );
      console.log('MapView - After search filter:', filtered.length);
    }

    console.log('MapView - Final filtered jobs:', filtered.length);
    setFilteredJobs(filtered);
  };

  const updateMapMarkers = () => {
    if (!map || !window.google) return;
    
    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));

    const newMarkers = [];
    const bounds = new window.google.maps.LatLngBounds();

    // Debug coordinate checking
    console.log('MapView - Checking coordinates in filtered jobs:');
    filteredJobs.forEach((job, index) => {
      if (index < 5) { // Log first 5 jobs
        console.log(`Job ${index}:`, {
          id: job.id,
          staffName: job.staffName,
          coordinates: job.coordinates,
          location: job.location,
          hasValidCoords: !!(job.coordinates && 
            typeof job.coordinates.lat === 'number' && 
            typeof job.coordinates.lng === 'number' &&
            !isNaN(job.coordinates.lat) && 
            !isNaN(job.coordinates.lng)),
          hasValidLocation: !!(job.location && 
            typeof job.location.lat === 'number' && 
            typeof job.location.lng === 'number' &&
            !isNaN(job.location.lat) && 
            !isNaN(job.location.lng))
        });
      }
    });
    
    // Filter jobs with valid coordinates - check both coordinates and location fields
    const jobsWithCoordinates = filteredJobs.filter(job => {
      // Check coordinates field first
      if (job.coordinates && job.coordinates.lat && job.coordinates.lng) {
        const lat = parseFloat(job.coordinates.lat);
        const lng = parseFloat(job.coordinates.lng);
        
        const isValid = !isNaN(lat) && !isNaN(lng) && 
                       lat !== 0 && lng !== 0 &&
                       lat >= -90 && lat <= 90 &&
                       lng >= -180 && lng <= 180;
        
        if (isValid) return true;
      }
      
      // Check location field (original format)
      if (job.location && job.location.lat && job.location.lng) {
        const lat = parseFloat(job.location.lat);
        const lng = parseFloat(job.location.lng);
        
        const isValid = !isNaN(lat) && !isNaN(lng) && 
                       lat !== 0 && lng !== 0 &&
                       lat >= -90 && lat <= 90 &&
                       lng >= -180 && lng <= 180;
        
        if (isValid) return true;
      }
      
      return false;
    });
    
    console.log('MapView - Jobs with valid coordinates for markers:', jobsWithCoordinates.length);
    
    // Show all jobs with coordinates (no filtering for focused job)
    const jobsToShow = jobsWithCoordinates;
    
    jobsToShow.forEach((job, index) => {
      console.log(`Creating marker ${index} for:`, job.staffName, 'at', job.coordinates || job.location);
      
      try {
        // Use coordinates field first, fallback to location field
        const coords = job.coordinates || job.location;
        const lat = parseFloat(coords.lat);
        const lng = parseFloat(coords.lng);
        
        const marker = new window.google.maps.Marker({
          position: { lat: lat, lng: lng },
          map: map,
          title: `${job.staffName} - ${job.category}`,
          icon: getMarkerIcon(job.category),
          animation: window.google.maps.Animation.DROP
        });

        // Create info window for this marker
        const photoUrl = (job.photoURLs && job.photoURLs.length > 0) ? job.photoURLs[0] : 
                        (job.photos && job.photos.length > 0) ? job.photos[0] : null;
        
        const infoWindow = new window.google.maps.InfoWindow({
          disableAutoPan: false,
          content: `
            <div style="width: 280px; font-family: Arial, sans-serif;">
              <div style="position: relative;">
                <div style="margin-bottom: 12px;">
                  <h3 style="margin: 0 0 4px 0; font-size: 18px; font-weight: bold; color: #333;">
                    ${job.category} <span style="font-size: 14px; color: #666; font-weight: normal;">(${job.area}, ${job.landmark})</span>
                  </h3>
                </div>
                
                ${job.customerAddress || job.address ? `
                  <div style="margin-bottom: 12px;">
                    <p style="margin: 0; font-size: 14px; color: #555; line-height: 1.4;">
                      <span style="font-weight: bold; color: #333;">Address:</span> ${job.customerAddress || job.address}
                    </p>
                  </div>
                ` : ''}
                
                ${job.notes ? `
                  <div style="margin-bottom: 12px;">
                    <p style="margin: 0; font-size: 14px; color: #555; line-height: 1.4;">
                      ${job.notes}
                    </p>
                  </div>
                ` : ''}
                
                ${photoUrl ? `
                  <div style="margin-bottom: 12px;">
                    <img src="${photoUrl}" alt="Job photo" onclick="window.open('${photoUrl}', '_blank')"
                         style="width: 120px; height: 80px; object-fit: cover; border-radius: 4px; border: 1px solid #ddd; cursor: pointer;">
                  </div>
                ` : ''}
                
                <div style="margin-bottom: 12px; display: flex; align-items: center; font-size: 13px; color: #666;">
                  <span style="margin-right: 8px;">👤</span>
                  <span>${job.staffName}</span>
                </div>
                
                <div style="margin-bottom: 16px; display: flex; align-items: center; font-size: 13px; color: #666;">
                  <span style="margin-right: 8px;">🕐</span>
                  <span>${new Date(job.timestamp?.toDate?.() || job.timestamp).toLocaleDateString()}, ${new Date(job.timestamp?.toDate?.() || job.timestamp).toLocaleTimeString()}</span>
                </div>
                
                <div style="display: flex; gap: 4px;">
                  <button onclick="window.openInMaps('${coords.lat}', '${coords.lng}')" 
                          style="flex: 1; padding: 8px 12px; background: #4285f4; color: white; 
                                 border: none; border-radius: 4px; font-size: 12px; cursor: pointer; 
                                 font-weight: 500;">
                    Navigate
                  </button>
                  
                  <button onclick="window.shareJobLocation('${coords.lat}', '${coords.lng}')" 
                          style="flex: 1; padding: 8px 12px; background: #34a853; color: white; 
                                 border: none; border-radius: 4px; font-size: 12px; cursor: pointer; 
                                 font-weight: 500;">
                    Share Location
                  </button>
                  
                  <button onclick="window.shareJobPhoto('${job.id}')" 
                          style="flex: 1; padding: 8px 12px; background: #5f6368; color: white; 
                                 border: none; border-radius: 4px; font-size: 12px; cursor: pointer; 
                                 font-weight: 500;">
                    Share Photo
                  </button>
                </div>
              </div>
            </div>
          `
        });

        // Store reference to info window
        marker.infoWindow = infoWindow;
        marker.jobId = job.id;


        marker.addListener('click', () => {
          // Close active info window if any
          if (activeInfoWindow) {
            activeInfoWindow.close();
            setActiveInfoWindow(null);
          }
          
          // Open this marker's info window
          infoWindow.open(map, marker);
          setActiveInfoWindow(infoWindow);
          
          // Center map on clicked marker
          map.panTo({ lat: parseFloat(coords.lat), lng: parseFloat(coords.lng) });
          map.setZoom(16);
        });

        // Add close event listener to track when info window is closed
        infoWindow.addListener('closeclick', () => {
          setActiveInfoWindow(null);
        });

        newMarkers.push(marker);
        bounds.extend(marker.getPosition());
        console.log(`Marker created successfully for ${job.staffName}`);
      } catch (error) {
        console.error(`Error creating marker for ${job.staffName}:`, error);
      }
    });

    setMarkers(newMarkers);
    console.log('MapView - Total markers created:', newMarkers.length);

    if (newMarkers.length > 0) {
      // Add padding to bounds to ensure all markers are visible
      const padding = { top: 50, right: 50, bottom: 50, left: 50 };
      map.fitBounds(bounds, padding);
      
      // Ensure minimum zoom level
      const listener = window.google.maps.event.addListener(map, 'bounds_changed', () => {
        if (map.getZoom() > 15) {
          map.setZoom(15);
        }
        window.google.maps.event.removeListener(listener);
      });
      
      console.log('MapView - Map bounds fitted to show', newMarkers.length, 'markers');
    } else {
      // Reset to default view if no markers
      console.log('MapView - No markers to show, using default center');
      map.setCenter({ lat: 25.5941, lng: 85.1376 });
      map.setZoom(11);
    }
  };

  const getCustomerMarkerIcon = (status) => {
    // Different colors for active vs deactivated customers
    const color = status === 'Active' ? '#22c55e' : '#ef4444'; // Green for active, red for deactivated
    
    // Use customer/person icon for Installation jobs
    return {
      path: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      rotation: 0,
      scale: 1.2,
      anchor: new window.google.maps.Point(12, 12)
    };
  };

  const getMarkerIcon = (jobType) => {
    const colors = {
      'Installation': '#22c55e', // Green
      'Maintenance': '#3b82f6',  // Blue
      'Repair': '#ef4444'        // Red
    };
    
    const color = colors[jobType] || '#6b7280';
    
    // Use location pin icon like original
    return {
      path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
      fillColor: color,
      fillOpacity: 1,
      strokeWeight: 0,
      rotation: 0,
      scale: 1.5,
      anchor: new window.google.maps.Point(12, 24)
    };
  };

  const shareLocation = (lat, lng) => {
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    if (navigator.share && navigator.canShare && navigator.canShare({ url })) {
      navigator.share({
        title: 'Job Location',
        url: url
      }).catch(err => {
        console.log('Share cancelled or failed:', err);
        navigator.clipboard.writeText(url);
        alert('Location link copied to clipboard!');
      });
    } else {
      navigator.clipboard.writeText(url);
      alert('Location link copied to clipboard!');
    }
  };

  const shareImages = (job) => {
    const images = job.photoURLs || job.photos || [];
    if (images.length > 0) {
      const imageUrls = Array.isArray(images) ? images : images.split(',');
      const text = `Job Images for ${job.staffName} - ${job.category}\n${imageUrls.join('\n')}`;
      
      if (navigator.share && navigator.canShare && navigator.canShare({ text })) {
        navigator.share({
          title: 'Job Images',
          text: text
        }).catch(err => {
          console.log('Share cancelled or failed:', err);
          navigator.clipboard.writeText(text);
          alert('Image links copied to clipboard!');
        });
      } else {
        navigator.clipboard.writeText(text);
        alert('Image links copied to clipboard!');
      }
    } else {
      alert('No images available for this job.');
    }
  };

  const openInMaps = (lat, lng) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
  };

  const selectedArea = serviceAreas.find(area => area.name === filters.area);
  const landmarks = selectedArea?.landmarks || [];

  return (
    <div className="h-screen flex flex-col">
      <Header 
        title={t('viewMap')}
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

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-full md:w-1/3 lg:w-1/4 bg-white shadow-lg flex flex-col">
          {/* Filters - Hide in single job mode */}
          {!singleJobMode && (
            <div className="p-4 border-b border-gray-200">
              <div className="space-y-3">
                <select
                  value={filters.area}
                  onChange={(e) => setFilters(prev => ({ ...prev, area: e.target.value, landmark: 'all' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="all">All Areas</option>
                  {serviceAreas.map(area => (
                    <option key={area.id} value={area.name}>{area.name}</option>
                  ))}
                </select>

                {filters.area !== 'all' && (
                  <select
                    value={filters.landmark}
                    onChange={(e) => setFilters(prev => ({ ...prev, landmark: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="all">All Landmarks</option>
                    {landmarks.map(landmark => (
                      <option key={landmark} value={landmark}>{landmark}</option>
                    ))}
                  </select>
                )}

                <input
                  type="text"
                  placeholder="Search jobs..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
          )}

        {/* Results Summary */}
        <div className="p-4 border-b border-gray-200">
          <div className="text-sm text-gray-600">
            {singleJobMode ? (
              <span className="text-blue-600 font-medium">Single Job View</span>
            ) : (
              <>
                Showing {filteredJobs.length} of {jobs.length} jobs
                {filteredJobs.length === 0 && jobs.length > 0 && (
                  <span className="text-orange-600 ml-2">- Try adjusting your filters</span>
                )}
                {jobs.length === 0 && (
                  <span className="text-red-600 ml-2">- No job data available</span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Job List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedJob?.id === job.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => {
                  const coords = job.coordinates || job.location;
                  if (coords && map) {
                    // Find the marker for this job
                    const marker = markers.find(m => m.jobId === job.id);
                    if (marker) {
                      // Close any active info window first
                      if (activeInfoWindow) {
                        activeInfoWindow.close();
                        setActiveInfoWindow(null);
                      }
                      
                      // Open the info window for this marker
                      marker.infoWindow.open(map, marker);
                      setActiveInfoWindow(marker.infoWindow);
                      
                      // Navigate to the marker location
                      map.panTo({ lat: parseFloat(coords.lat), lng: parseFloat(coords.lng) });
                      map.setZoom(16);
                    }
                  }
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm">{job.staffName}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    job.category === 'Installation' ? 'bg-green-100 text-green-800' :
                    job.category === 'Maintenance' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {job.category}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-1">{job.area} - {job.landmark}</p>
                {job.address && (
                  <p className="text-xs text-gray-500 truncate">{job.address}</p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(job.timestamp?.toDate?.() || job.timestamp).toLocaleDateString()}, {new Date(job.timestamp?.toDate?.() || job.timestamp).toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1">
        <div ref={mapRef} className="w-full h-full"></div>
      </div>
    </div>

    {/* Job Detail Modal */}
    {showJobModal && selectedJob && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg w-full max-w-md max-h-96 overflow-hidden">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{selectedJob.category} Job</h3>
              <p className="text-sm text-gray-600">
                {selectedJob.area}, {selectedJob.landmark}
              </p>
            </div>
            <button
              onClick={() => setShowJobModal(false)}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-4 overflow-y-auto max-h-96">
            {/* Job Details */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <i className="fas fa-user text-gray-500"></i>
                <span className="text-sm">{selectedJob.staffName}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <i className="fas fa-calendar text-gray-500"></i>
                <span className="text-sm">
                  {new Date(selectedJob.timestamp?.toDate?.() || selectedJob.timestamp).toLocaleDateString()}, {new Date(selectedJob.timestamp?.toDate?.() || selectedJob.timestamp).toLocaleTimeString()}
                </span>
              </div>

              {selectedJob.customerAddress && (
                <div className="flex items-start space-x-2">
                  <i className="fas fa-map-marker-alt text-gray-500 mt-1"></i>
                  <span className="text-sm">{selectedJob.customerAddress}</span>
                </div>
              )}

              {selectedJob.notes && (
                <div className="flex items-start space-x-2">
                  <i className="fas fa-sticky-note text-gray-500 mt-1"></i>
                  <span className="text-sm">{selectedJob.notes}</span>
                </div>
              )}
            </div>

            {/* Images */}
            {((selectedJob.photoURLs && selectedJob.photoURLs.length > 0) || (selectedJob.photos && selectedJob.photos.length > 0)) && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Images</h4>
                <div className="grid grid-cols-2 gap-2">
                  {(selectedJob.photoURLs || selectedJob.photos || []).slice(0, 4).map((photo, index) => (
                    <img
                      key={index}
                      src={photo}
                      alt={`Job photo ${index + 1}`}
                      className="w-full h-20 object-cover rounded border cursor-pointer hover:opacity-80"
                      onClick={() => window.open(photo, '_blank')}
                    />
                  ))}
                </div>
                {(selectedJob.photoURLs || selectedJob.photos || []).length > 4 && (
                  <p className="text-xs text-gray-500 mt-1">
                    +{(selectedJob.photoURLs || selectedJob.photos || []).length - 4} more images
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="bg-gray-50 px-4 py-3 border-t">
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  const coords = selectedJob.coordinates || selectedJob.location;
                  openInMaps(coords.lat, coords.lng);
                }}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <i className="fas fa-directions mr-2"></i>
                Navigate
              </button>
              
              <button
                onClick={() => {
                  const coords = selectedJob.coordinates || selectedJob.location;
                  shareLocation(coords.lat, coords.lng);
                }}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                <i className="fas fa-share mr-2"></i>
                Share Location
              </button>
              
              {((selectedJob.photoURLs && selectedJob.photoURLs.length > 0) || (selectedJob.photos && selectedJob.photos.length > 0)) && (
                <button
                  onClick={() => shareImages(selectedJob)}
                  className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
                >
                  <i className="fas fa-image mr-2"></i>
                  Share Images
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )}

    <MobileBottomNav />
  </div>
  );
};

export default MapView;
