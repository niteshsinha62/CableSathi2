import React, { useRef, useEffect, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

const LocationPicker = ({ onLocationSelect, onClose }) => {
  const mapRef = useRef(null);
  const searchInputRef = useRef(null);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 50;
    
    const initMap = () => {
      if (window.google && window.google.maps && window.google.maps.places && mapRef.current && searchInputRef.current) {
        console.log('Initializing LocationPicker map...');
        initializeMap();
      } else if (retryCount < maxRetries) {
        retryCount++;
        console.log(`Retrying map initialization (${retryCount}/${maxRetries})`);
        setTimeout(initMap, 100);
      } else {
        console.error('Failed to initialize map after maximum retries');
      }
    };
    
    // Wait for the modal to fully render
    const timer = setTimeout(initMap, 300);
    
    return () => clearTimeout(timer);
  }, []);

  const initializeMap = () => {
    if (!mapRef.current || !searchInputRef.current) {
      console.log('Map ref or search input ref not available');
      return;
    }
    
    try {
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: { lat: 25.5941, lng: 85.1376 }, // Default to Patna
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
      });

      // Check if Places API is available
      if (!window.google.maps.places) {
        console.error('Google Maps Places API not loaded');
        return;
      }

      const searchBox = new window.google.maps.places.SearchBox(searchInputRef.current);
      
      searchBox.addListener('places_changed', () => {
        const places = searchBox.getPlaces();
        if (places.length === 0) return;

        const place = places[0];
        if (!place.geometry || !place.geometry.location) return;

        updateLocation(place.geometry.location, place.formatted_address || place.name);
        mapInstance.setCenter(place.geometry.location);
        mapInstance.setZoom(17);
      });

      mapInstance.addListener('click', (event) => {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: event.latLng }, (results, status) => {
          if (status === 'OK' && results[0]) {
            updateLocation(event.latLng, results[0].formatted_address);
          } else {
            updateLocation(event.latLng, 'Unknown location');
          }
        });
      });

      setMap(mapInstance);
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  };

  const updateLocation = (latLng, address) => {
    if (marker) {
      marker.setMap(null);
    }

    const newMarker = new window.google.maps.Marker({
      position: latLng,
      map: map,
      title: address
    });

    setMarker(newMarker);
    setSelectedLocation({
      lat: latLng.lat(),
      lng: latLng.lng(),
      address: address
    });
  };

  const getCurrentLocation = () => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: pos }, (results, status) => {
            if (status === 'OK' && results[0]) {
              updateLocation(new window.google.maps.LatLng(pos.lat, pos.lng), results[0].formatted_address);
              map.setCenter(pos);
              map.setZoom(17);
            }
            setLoading(false);
          });
        },
        () => {
          alert('Error: The Geolocation service failed.');
          setLoading(false);
        }
      );
    } else {
      alert('Error: Your browser doesn\'t support geolocation.');
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold mb-4">{t('jobLocationLabel')}</h3>
          <input
            ref={searchInputRef}
            type="text"
            placeholder={t('jobLocationPlaceholder')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex-1 min-h-[300px] relative">
          <div ref={mapRef} className="w-full h-full" style={{ minHeight: '300px' }}></div>
          {!map && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <div className="loader mx-auto mb-2"></div>
                <p className="text-gray-600">Loading map...</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t">
          <button
            onClick={getCurrentLocation}
            disabled={loading}
            className="w-full mb-3 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 touch-target flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="loader w-5 h-5 mr-2"></div>
                Getting location...
              </>
            ) : (
              <>
                <i className="fas fa-location-arrow mr-2"></i>
                {t('useCurrentLocation')}
              </>
            )}
          </button>
          
          {selectedLocation && (
            <div className="mb-3 p-2 bg-gray-50 rounded text-sm">
              <strong>Selected:</strong> {selectedLocation.address}
            </div>
          )}
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 touch-target"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedLocation}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed touch-target"
            >
              Confirm Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;
