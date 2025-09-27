import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import SidebarMenu from './SidebarMenu';

const Header = ({ showLanguageSwitch = true }) => {
  const { user, logout } = useAuth();
  const { language, changeLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [operatorName, setOperatorName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [nameLoading, setNameLoading] = useState(true);
  const dropdownRef = useRef(null);

  // Fetch operator data from Firestore
  const fetchOperatorData = async () => {
    if (!user?.uid) {
      setNameLoading(false);
      return;
    }
    
    try {
      setNameLoading(true);
      const operatorDoc = await getDoc(doc(db, 'operators', user.uid));
      if (operatorDoc.exists()) {
        const data = operatorDoc.data();
        setOperatorName(data.name || '');
        setCompanyName(data.companyName || '');
      } else {
        // const staffDoc = await getDoc(doc(db, 'staffs', user.uid));
        // const data = staffDoc.data();
        setOperatorName('Agent');
        setCompanyName('Starvision Cable & Broadband');
      }
    } catch (error) {
      console.error('Error fetching operator data:', error);
      setOperatorName('');
      setCompanyName('');
    } finally {
      setNameLoading(false);
    }
  };

  useEffect(() => {
    fetchOperatorData();
  }, [user?.uid]);

  // Listen for profile updates
  useEffect(() => {
    const handleProfileUpdate = () => {
      fetchOperatorData();
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };

    if (showProfileDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileDropdown]);

  const handleLogout = async () => {
    try {
      await logout();
      setShowProfileDropdown(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleProfileClick = () => {
    navigate('/profile');
    setShowProfileDropdown(false);
  };

  // Get first name from the full name using substring
  const getFirstName = (fullName) => {
    if (!fullName || fullName.trim() === '') return '';
    const spaceIndex = fullName.indexOf(' ');
    if (spaceIndex === -1) {
      return fullName.trim(); // No space found, return the whole name
    }
    return fullName.substring(0, spaceIndex).trim();
  };


  return (
    <div className="bg-white shadow-sm sticky top-0 z-50 header-container">
      <div className="max-w-full mx-auto px-3 sm:px-6">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center min-w-0 flex-1 overflow-hidden">
            {user && <SidebarMenu />}
            <div className="flex items-center ml-2 sm:ml-3 min-w-0 flex-1">
              <div className="flex flex-col">
                <span className="font-medium text-base sm:text-lg whitespace-nowrap flex-shrink-0">
                  <span className="text-black">Cable</span>
                  <span className="text-orange-500">Sathi</span>
                </span>
                {/* Mobile only: Company name below CableSathi */}
                {companyName && (
                  <span className="text-gray-600 text-xs font-medium truncate md:hidden" title={companyName}>
                    {companyName}
                  </span>
                )}
              </div>
              {/* Desktop only: Company name with separator */}
              {companyName && (
                <>
                  <span className="text-gray-400 mx-1 sm:mx-2 text-base sm:text-lg flex-shrink-0 hidden md:inline">|</span>
                  <span 
                    className="text-gray-700 font-medium text-xs sm:text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-48 sm:max-w-80 hidden md:inline"
                    title={companyName}
                  >
                    {companyName}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            {/* Profile name beside profile icon for both mobile and desktop */}
            {user && !nameLoading && operatorName && (
              <span className="text-gray-800 text-xs sm:text-sm font-medium whitespace-nowrap max-w-32 sm:max-w-64 truncate header-greeting no-select">
                Hello, {getFirstName(operatorName)}
              </span>
            )}
            
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center text-white hover:bg-gray-700 p-1.5 sm:p-2 rounded-md transition-colors mobile-touch-target"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <i className="fas fa-user text-white text-xs sm:text-sm"></i>
                </div>
              </button>

                {showProfileDropdown && (
                  <div className="absolute right-0 mt-2 w-44 sm:w-48 bg-gray-700 rounded-md shadow-lg py-1 z-50">
                    <button
                      onClick={handleProfileClick}
                      className="block w-full text-left px-3 sm:px-4 py-2.5 sm:py-2 text-sm text-white hover:bg-gray-600 active:bg-gray-500"
                    >
                      <i className="fas fa-user-circle mr-2"></i>
                      My Profile
                    </button>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-3 sm:px-4 py-2.5 sm:py-2 text-sm text-white hover:bg-gray-600 active:bg-gray-500"
                    >
                      <i className="fas fa-sign-out-alt mr-2"></i>
                      Logout
                    </button>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;