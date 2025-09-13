import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import SidebarMenu from './SidebarMenu';

const Header = ({ showLanguageSwitch = true }) => {
  const { user, logout } = useAuth();
  const { language, changeLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef(null);

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

  // Get first name from the full name
  const getFirstName = (fullName) => {
    if (!fullName) return '';
    return fullName.split(' ')[0];
  };


  return (
    <div className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-full mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            {user && <SidebarMenu />}
            <div className="flex items-center ml-3">
              <span className="font-medium text-lg">
                <span className="text-black">Cable</span>
                <span className="text-orange-500">Sathi</span>
              </span>
              <span className="text-gray-400 mx-2 text-lg">|</span>
              <img src="/logo.png" alt="CableSathi Logo" className="h-12 w-auto object-contain" onError={(e) => {e.target.style.display='none'}} />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {user && user.name ? (
              <span className="text-gray-800 text-sm font-medium">
                Hello, {getFirstName(user.name)}
              </span>
            ) : user ? (
              <span className="text-gray-800 text-sm font-medium">
                Hello, User
              </span>
            ) : null}
            
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center text-white hover:bg-gray-700 p-2 rounded-md transition-colors"
              >
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <i className="fas fa-user text-white text-sm"></i>
                </div>
              </button>

              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-md shadow-lg py-1 z-50">
                  <button
                    onClick={handleProfileClick}
                    className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-600"
                  >
                    <i className="fas fa-user-circle mr-2"></i>
                    My Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-600"
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