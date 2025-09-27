import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, onSnapshot, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useLanguage } from '../contexts/LanguageContext';
import Header from '../components/common/Header';
import MobileBottomNav from '../components/common/MobileBottomNav';

const CustomerMapView = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const mapRef = useRef(null);
  const { t } = useLanguage();
  const [map, setMap] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [allCustomerData, setAllCustomerData] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [serviceAreas, setServiceAreas] = useState([]);
  const [markers, setMarkers] = useState([]);
  const [filters, setFilters] = useState({
    area: 'all',
    landmark: 'all',
    status: 'all',
    search: ''
  });
  const [selectedJob, setSelectedJob] = useState(null);
  const [infoWindows, setInfoWindows] = useState([]);
  const [activeInfoWindow, setActiveInfoWindow] = useState(null);
  const [singleCustomerMode, setSingleCustomerMode] = useState(false);
  const [mobileView, setMobileView] = useState('list'); // 'list', 'map'

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
    
    // Add global functions for info window buttons
    window.openInMaps = (lat, lng) => {
      openInMaps(lat, lng);
    };
    
    window.shareJobLocation = (lat, lng) => {
      shareLocation(lat, lng);
    };
    
    window.shareJobPhoto = (jobId) => {
      const job = jobs.find(j => j.id === jobId);
      if (job) {
        shareImages(job);
      }
    };
    
    window.closeInfoWindow = () => {
      if (activeInfoWindow) {
        activeInfoWindow.close();
        setActiveInfoWindow(null);
      }
    };
    
    initMap();

    // Check if we're in single customer mode
    const urlParams = new URLSearchParams(location.search);
    const customerId = urlParams.get('customerId');
    
    if (customerId) {
      setSingleCustomerMode(true);
      // Fetch single customer and related job
      const fetchSingleCustomer = async () => {
        try {
          console.log('Fetching single customer with ID:', customerId);
          
          // Try to fetch from jobs collection first (since most CustomerView records are installation jobs)
          const jobDoc = await getDoc(doc(db, 'jobs', customerId));
          if (jobDoc.exists()) {
            const jobData = { id: jobDoc.id, ...jobDoc.data() };
            console.log('Found job:', jobData);
            // Only include if it's an Installation job
            if (jobData.category === 'Installation') {
              setJobs([jobData]);
              setCustomers([]); // No direct customers needed
              return; // Exit early if we found the job
            } else {
              console.log('Job is not Installation category:', jobData.category);
            }
          }
          
          // If not found in jobs or not Installation, try customers collection
          const customerDoc = await getDoc(doc(db, 'customers', customerId));
          if (customerDoc.exists()) {
            const customerData = { id: customerDoc.id, ...customerDoc.data() };
            console.log('Found customer:', customerData);
            setCustomers([customerData]);
            setJobs([]); // No jobs needed if we have direct customer
          } else {
            console.log('No customer or job found with ID:', customerId);
            // Set empty data to show "no data" state
            setCustomers([]);
            setJobs([]);
          }
        } catch (error) {
          console.error('Error fetching single customer:', error);
          setCustomers([]);
          setJobs([]);
        }
      };
      fetchSingleCustomer();
      
      // Still need service areas for single customer mode
      const areasQuery = query(collection(db, 'serviceAreas'), orderBy('name'));
      const unsubscribeAreas = onSnapshot(areasQuery, (snapshot) => {
        const areas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setServiceAreas(areas);
      });

      return () => {
        unsubscribeAreas();
        // Clean up global functions
        delete window.openInMaps;
        delete window.shareJobLocation;
        delete window.shareJobPhoto;
        delete window.closeInfoWindow;
      };
    } else {
      setSingleCustomerMode(false);
      // Listen for all jobs - only Installation jobs for customer tracking
      const jobsQuery = query(collection(db, 'jobs'), orderBy('timestamp', 'desc'));
      const unsubscribeJobs = onSnapshot(jobsQuery, (snapshot) => {
        const jobsData = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          timestamp: doc.data().timestamp
        }));
        // Filter only Installation jobs
        const installationJobs = jobsData.filter(job => job.category === 'Installation');
        setJobs(installationJobs);
      });

      // Listen for customers
      const customersQuery = query(collection(db, 'customers'), orderBy('timestamp', 'desc'));
      const unsubscribeCustomers = onSnapshot(customersQuery, (snapshot) => {
        const customersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCustomers(customersData);
      });

      // Listen for service areas
      const areasQuery = query(collection(db, 'serviceAreas'), orderBy('name'));
      const unsubscribeAreas = onSnapshot(areasQuery, (snapshot) => {
        const areas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setServiceAreas(areas);
      });

      return () => {
        unsubscribeJobs();
        unsubscribeCustomers();
        unsubscribeAreas();
        // Clean up global functions
        delete window.openInMaps;
        delete window.shareJobLocation;
        delete window.shareJobPhoto;
        delete window.closeInfoWindow;
      };
    }
  }, [location.search]);

  // Combine customers and installation jobs for display (like CustomerView)
  useEffect(() => {
    const installationJobs = jobs.map(job => {
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
        sourceJobId: job.id,
        // Preserve image fields for info window display
        photoURLs: job.photoURLs,
        photos: job.photos
      };
    });
    
    // Process customers from customers collection to match expected format
    const processedCustomers = customers.map(customer => {
      return {
        id: customer.id,
        customerName: customer.customerName || customer.name || 'Unknown Customer',
        mobile: customer.mobile || customer.contact || 'No Mobile',
        notes: customer.notes || '',
        customerType: customer.customerType || 'Customer',
        area: customer.area || customer.serviceArea || '',
        landmark: customer.landmark || '',
        staffName: customer.staffName || 'N/A',
        status: customer.status || 'Active',
        timestamp: customer.timestamp,
        location: customer.location,
        coordinates: customer.coordinates,
        address: customer.address || customer.customerAddress || '',
        sourceJobId: customer.sourceJobId || customer.id,
        // Preserve image fields for info window display
        photoURLs: customer.photoURLs,
        photos: customer.photos
      };
    });
    
    const allCustomers = [...processedCustomers, ...installationJobs];
    setAllCustomerData(allCustomers);
  }, [jobs, customers]);

  useEffect(() => {
    applyFilters();
  }, [allCustomerData, filters]);

  useEffect(() => {
    if (map) {
      updateMapMarkers();
      // Auto-center and zoom to single customer if in single customer mode
      if (singleCustomerMode && allCustomerData.length === 1) {
        const customer = allCustomerData[0];
        const coords = customer.coordinates || customer.location;
        if (coords && coords.lat && coords.lng) {
          map.setCenter({ lat: parseFloat(coords.lat), lng: parseFloat(coords.lng) });
          map.setZoom(16);
        }
      }
    }
  }, [map, filteredJobs, singleCustomerMode, allCustomerData]);


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
    
    let filtered = [...allCustomerData];

    // In single customer mode, don't apply filters - show the single customer
    if (!singleCustomerMode) {
      if (filters.area !== 'all') {
        filtered = filtered.filter(customer => customer.area === filters.area);
      }

      if (filters.landmark !== 'all') {
        filtered = filtered.filter(customer => customer.landmark === filters.landmark);
      }

      if (filters.status !== 'all') {
        filtered = filtered.filter(customer => (customer.status || 'Active') === filters.status);
      }

      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filtered = filtered.filter(customer =>
          customer.notes?.toLowerCase().includes(searchTerm) ||
          customer.address?.toLowerCase().includes(searchTerm) ||
          customer.customerAddress?.toLowerCase().includes(searchTerm) ||
          customer.staffName?.toLowerCase().includes(searchTerm) ||
          customer.customerName?.toLowerCase().includes(searchTerm) ||
          customer.mobile?.includes(searchTerm)
        );
      }
    }

    setFilteredJobs(filtered);
  };

  const updateMapMarkers = () => {
    if (!map || !window.google) return;
    
    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));

    const newMarkers = [];
    const bounds = new window.google.maps.LatLngBounds();
    
    // Filter jobs with valid coordinates
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
    
    
    jobsWithCoordinates.forEach((job, index) => {
      try {
        // Use coordinates field first, fallback to location field
        const coords = job.coordinates || job.location;
        const lat = parseFloat(coords.lat);
        const lng = parseFloat(coords.lng);
        
        const marker = new window.google.maps.Marker({
          position: { lat: lat, lng: lng },
          map: map,
          title: `Customer - ${job.staffName}`,
          icon: getCustomerMarkerIcon(job.status || 'Active'),
          animation: window.google.maps.Animation.DROP
        });

        // Create info window for this marker using processed customer data
        const photoUrl = (job.photoURLs && job.photoURLs.length > 0) ? job.photoURLs[0] : 
                        (job.photos && job.photos.length > 0) ? job.photos[0] : null;
        
        
        const infoWindow = new window.google.maps.InfoWindow({
          disableAutoPan: false,
          content: `
            <div style="width: 300px; font-family: Arial, sans-serif;">
              <div style="position: relative;">
                <div style="margin-bottom: 12px;">
                  <h3 style="margin: 0 0 4px 0; font-size: 18px; font-weight: bold; color: #333;">
                    ${job.customerName || 'Customer'} <span style="font-size: 14px; color: #666; font-weight: normal;">(${job.area}, ${job.landmark})</span>
                  </h3>
                  <div style="display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; ${job.status === 'Active' ? 'background: #dcfce7; color: #166534;' : 'background: #fecaca; color: #991b1b;'}">
                    ${job.status || 'Active'}
                  </div>
                </div>
                
                ${job.mobile && job.mobile !== 'No Mobile' ? `
                  <div style="margin-bottom: 12px;">
                    <p style="margin: 0; font-size: 14px; color: #555; line-height: 1.4;">
                      <span style="font-weight: bold; color: #333;">📱 Contact:</span> ${job.mobile}
                    </p>
                  </div>
                ` : ''}
                
                ${job.customerType ? `
                  <div style="margin-bottom: 12px;">
                    <p style="margin: 0; font-size: 14px; color: #555; line-height: 1.4;">
                      <span style="font-weight: bold; color: #333;">🏷️ Type:</span> ${job.customerType}
                    </p>
                  </div>
                ` : ''}
                
                ${job.address ? `
                  <div style="margin-bottom: 12px;">
                    <p style="margin: 0; font-size: 14px; color: #555; line-height: 1.4;">
                      <span style="font-weight: bold; color: #333;">📍 Address:</span> ${job.address}
                    </p>
                  </div>
                ` : ''}
                
                ${job.notes && job.notes.trim() ? `
                  <div style="margin-bottom: 12px;">
                    <p style="margin: 0; font-size: 14px; color: #555; line-height: 1.4;">
                      <span style="font-weight: bold; color: #333;">📝 Notes:</span> ${job.notes}
                    </p>
                  </div>
                ` : ''}
                
                ${photoUrl ? `
                  <div style="margin-bottom: 12px;">
                    <img src="${photoUrl}" alt="Customer photo" onclick="window.open('${photoUrl}', '_blank')"
                         style="width: 120px; height: 80px; object-fit: cover; border-radius: 4px; border: 1px solid #ddd; cursor: pointer;">
                  </div>
                ` : ''}
                
                ${job.staffName && job.staffName !== 'N/A' ? `
                  <div style="margin-bottom: 12px; display: flex; align-items: center; font-size: 13px; color: #666;">
                    <span style="margin-right: 8px;">👨‍💼</span>
                    <span>Staff: ${job.staffName}</span>
                  </div>
                ` : ''}
                
                ${job.timestamp ? `
                  <div style="margin-bottom: 16px; display: flex; align-items: center; font-size: 13px; color: #666;">
                    <span style="margin-right: 8px;">📅</span>
                    <span>${new Date(job.timestamp?.toDate?.() || job.timestamp).toLocaleDateString()}, ${new Date(job.timestamp?.toDate?.() || job.timestamp).toLocaleTimeString()}</span>
                  </div>
                ` : ''}
                
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
      } catch (error) {
        console.error(`Error creating marker for ${job.staffName}:`, error);
      }
    });

    setMarkers(newMarkers);
    console.log('CustomerMapView - Total markers created:', newMarkers.length);

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
    } else {
      // Reset to default view if no markers
      map.setCenter({ lat: 25.5941, lng: 85.1376 });
      map.setZoom(11);
    }
  };

  const focusOnCustomer = (customerId) => {
    if (!map || !allCustomerData.length) return;

    // Find the specific customer by ID
    const targetCustomer = allCustomerData.find(customer => customer.id === customerId);
    
    if (!targetCustomer) {
      console.log('Customer not found with ID:', customerId);
      return;
    }

    // Get coordinates
    const coords = targetCustomer.coordinates || targetCustomer.location;
    if (!coords || !coords.lat || !coords.lng) {
      console.log('No coordinates found for customer:', customerId);
      return;
    }

    const lat = parseFloat(coords.lat);
    const lng = parseFloat(coords.lng);

    if (isNaN(lat) || isNaN(lng)) {
      console.log('Invalid coordinates for customer:', customerId);
      return;
    }

    // Center map on the customer location
    map.setCenter({ lat, lng });
    map.setZoom(16); // Close zoom level to focus on the specific location

    // Find and open the info window for this customer
    setTimeout(() => {
      const marker = markers.find(marker => marker.jobId === customerId);

      if (marker && marker.infoWindow) {
        // Close any open info windows
        if (activeInfoWindow) {
          activeInfoWindow.close();
        }
        
        // Open the info window for this customer
        marker.infoWindow.open(map, marker);
        setActiveInfoWindow(marker.infoWindow);
        setSelectedJob(targetCustomer);
      }
    }, 500); // Small delay to ensure markers are created
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

  const shareLocation = (lat, lng) => {
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    if (navigator.share && navigator.canShare && navigator.canShare({ url })) {
      navigator.share({
        title: 'Customer Location',
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
      const customerName = job.customerName || 'Customer';
      const text = `Customer Images for ${customerName}\nType: ${job.customerType || 'Customer'}\nContact: ${job.mobile || 'N/A'}\n\nImages:\n${imageUrls.join('\n')}`;
      
      if (navigator.share && navigator.canShare && navigator.canShare({ text })) {
        navigator.share({
          title: 'Customer Images',
          text: text
        }).catch(err => {
          console.log('Share cancelled or failed:', err);
          navigator.clipboard.writeText(text);
          alert('Customer image URLs copied to clipboard!');
        });
      } else {
        navigator.clipboard.writeText(text);
        alert('Customer image URLs copied to clipboard!');
      }
    } else {
      alert('No images available for this customer.');
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
        title="Customer Map View"
        showLanguageSwitch={false}
      >
        <button
          onClick={() => window.close()}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          <i className="fas fa-times mr-1"></i>
          Close
        </button>
      </Header>

      {/* Mobile View Toggle Buttons */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex space-x-2">
          <button
            onClick={() => setMobileView('list')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mobileView === 'list' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <i className="fas fa-list mr-2"></i>
            List View
          </button>
          <button
            onClick={() => setMobileView('map')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mobileView === 'map' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <i className="fas fa-map mr-2"></i>
            Map View
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden md:flex-row">
        {/* Sidebar */}
        <div className={`bg-white shadow-lg flex flex-col ${
          mobileView === 'list' 
            ? 'w-full md:w-1/3 lg:w-1/4' 
            : 'hidden md:flex md:w-1/3 lg:w-1/4'
        }`}>
          {/* Filters - Hide in single customer mode */}
          {!singleCustomerMode && (
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

              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">All Status</option>
                <option value="Active">Active</option>
                <option value="Deactivated">Deactivated</option>
              </select>

              <input
                type="text"
                placeholder="Search customers..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
          )}

        {/* Results Summary */}
        <div className="mb-4 text-sm text-gray-600 p-4">
          {singleCustomerMode ? (
            <span className="text-blue-600 font-medium">Single Customer View</span>
          ) : (
            <>
              Showing {filteredJobs.length} Installation customers
              {filteredJobs.length === 0 && allCustomerData.length > 0 && (
                <span className="text-orange-600 ml-2">- Try adjusting your filters</span>
              )}
              {allCustomerData.length === 0 && (
                <span className="text-red-600 ml-2">- No customer data available</span>
              )}
            </>
          )}
        </div>

        {/* Customer List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {filteredJobs.map((job) => {
              return (
                <div
                  key={job.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedJob?.id === job.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    const coords = job.coordinates || job.location;
                    if (coords) {
                      // On mobile, switch to map view when clicking a customer
                      if (window.innerWidth < 768) {
                        setMobileView('map');
                      }
                      
                      if (map) {
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
                    }
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm text-gray-900">{job.customerName || 'Customer'}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      job.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {job.status || 'Active'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-1">📍 {job.area} - {job.landmark}</p>
                  <p className="text-xs text-gray-600 mb-1">📱 {job.mobile || 'No contact'}</p>
                  <p className="text-xs text-gray-500">🏷️ {job.customerType || 'Customer'}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

        {/* Map */}
        <div className={`${
          mobileView === 'list' 
            ? 'hidden md:flex md:flex-1' 
            : 'flex-1'
        }`}>
          <div ref={mapRef} className="w-full h-full"></div>
        </div>
      </div>

      <MobileBottomNav />
    </div>
);
};

export default CustomerMapView;
