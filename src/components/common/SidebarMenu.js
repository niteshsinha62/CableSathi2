import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

const SidebarMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  // const { t } = useLanguage();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      setIsOpen(false);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Check if user is admin (assuming admin UID is stored in user data or a specific UID)
  const isAdmin = user?.uid === '6suqqzr9j8gCUqEAHk4jEA1x1AA2' || user?.role === 'admin';

  const staffMenuItems = [
    {
      id: 'job-entry',
      title: 'Job Entry',
      icon: 'fa-plus-circle',
      path: '/staff',
      adminOnly: false
    }
  ];

  const adminMenuItems = [
    {
      id: 'home',
      title: 'Home',
      icon: 'fa-home',
      path: '/analytics',
      adminOnly: false
    },
    {
      id: 'map',
      title: 'View Map',
      icon: 'fa-map-location-dot',
      path: '/map',
      adminOnly: false
    },
    {
      id: 'job-records',
      title: 'Reports',
      icon: 'fa-chart-line',
      path: '/admin',
      adminOnly: true
    },
    {
      id: 'customer',
      title: 'Manage Customers',
      icon: 'fa-person-burst',
      path: '/customers',
      adminOnly: false
    },
    
    {
      id: 'staff',
      title: 'Manage Employees',
      icon: 'fa-users',
      path: '/staff-management',
      adminOnly: true
    }
  ];

  // Use different menu items based on user role
  const filteredMenuItems = isAdmin ? adminMenuItems : staffMenuItems;

  const isActivePath = (path) => {
    return location.pathname === path;
  };

  const handleMenuClick = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <>
      {/* Hamburger Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="p-2 text-white hover:bg-gray-700 rounded-lg transition-colors"
        aria-label="Open menu"
      >
        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
          <i className="fas fa-bars text-white text-sm"></i>
        </div>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sliding Sidebar */}
      <div
        className={`fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-gray-700 shadow-lg transform transition-transform duration-300 ease-in-out z-40 ${
          isOpen || isHovered ? 'translate-x-0' : '-translate-x-full'
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Menu Items */}
        <nav className="h-full p-0">
          <ul className="space-y-0">
            {filteredMenuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => handleMenuClick(item.path)}
                  className={`w-full flex items-center px-6 py-4 text-left transition-colors ${
                    isActivePath(item.path)
                      ? 'bg-orange-500 text-white'
                      : 'text-white hover:bg-gray-600 hover:text-white'
                  }`}
                >
                  <i className={`fas ${item.icon} mr-4 text-lg w-5`}></i>
                  <span className="font-medium">{item.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

      </div>
    </>
  );
};

export default SidebarMenu;
