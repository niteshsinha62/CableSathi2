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
  const [nameLoading, setNameLoading] = useState(true);
  const dropdownRef = useRef(null);

  // Fetch operator name from Firestore
  const fetchOperatorName = async () => {
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
      } else {
        setOperatorName('');
      }
    } catch (error) {
      console.error('Error fetching operator name:', error);
      setOperatorName('');
    } finally {
      setNameLoading(false);
    }
  };

  useEffect(() => {
    fetchOperatorName();
  }, [user?.uid]);

  // Listen for profile updates
  useEffect(() => {
    const handleProfileUpdate = () => {
      fetchOperatorName();
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
          <div className="flex items-center min-w-0 flex-1">
            {user && <SidebarMenu />}
            <div className="flex items-center ml-2 sm:ml-3 min-w-0">
              <span className="font-medium text-base sm:text-lg whitespace-nowrap">
                <span className="text-black">Cable</span>
                <span className="text-orange-500">Sathi</span>
              </span>
              <span className="text-gray-400 mx-1 sm:mx-2 text-base sm:text-lg hidden sm:inline">|</span>
              <img src="/logo.png" alt="CableSathi Logo" className="h-8 sm:h-12 w-auto object-contain hidden sm:block" onError={(e) => {e.target.style.display='none'}} />
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
            {user && !nameLoading ? (
              operatorName ? (
                <span className="text-gray-800 text-xs sm:text-sm font-medium whitespace-nowrap max-w-24 sm:max-w-none truncate header-greeting no-select">
                  Hello, {getFirstName(operatorName)}
                </span>
              ) : (
                <span className="text-gray-800 text-xs sm:text-sm font-medium whitespace-nowrap header-greeting no-select">
                  Hello, User
                </span>
              )
            ) : null}
            
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