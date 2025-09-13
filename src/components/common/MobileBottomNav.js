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
    { path: '/staff', icon: 'fa-clipboard-list', label: t('recordJobActivity') }
  ];

  const adminNavItems = [
    { path: '/admin', icon: 'fa-chart-line', label: t('dashboard') },
    { path: '/map', icon: 'fa-map-location-dot', label: t('viewMap') },
    { path: '/analytics', icon: 'fa-chart-bar', label: t('viewAnalytics') },
    { path: '/staff-management', icon: 'fa-users', label: t('manageStaff') }
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
