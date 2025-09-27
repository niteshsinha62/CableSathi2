import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAuth();
  const { t } = useLanguage();

  const staffNavItems = [
    { path: '/staff', icon: 'fa-plus-circle', label: 'Job Entry' }
  ];

  const adminNavItems = [
    { path: '/analytics', icon: 'fa-home', label: 'Home' },
    { path: '/customers', icon: 'fa-person-burst', label: 'Customers' },
    { path: '/staff-management', icon: 'fa-users', label: 'Staffs' },
    { path: '/map', icon: 'fa-map-location-dot', label: 'Map' }
  ];

  const navItems = isAdmin ? adminNavItems : staffNavItems;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50">
      <div className="grid grid-cols-4 h-16">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center justify-center space-y-1 touch-target ${
              location.pathname === item.path
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <i className={`fas ${item.icon} text-lg`}></i>
            <span className="text-xs font-medium truncate">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MobileBottomNav;
