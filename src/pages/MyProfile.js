import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import Header from '../components/common/Header';

const MyProfile = () => {
  const { user, refreshUserData } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [operatorData, setOperatorData] = useState({
    name: '',
    contact: '',
    email: ''
  });
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    email: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchOperatorData();
  }, [user]);

  const fetchOperatorData = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const operatorDoc = await getDoc(doc(db, 'operators', user.uid));
      
      if (operatorDoc.exists()) {
        const data = operatorDoc.data();
        setOperatorData(data);
        setFormData(data);
      } else {
        // If no operator document exists, use email from auth
        const defaultData = {
          name: '',
          contact: '',
          email: user.email || ''
        };
        setOperatorData(defaultData);
        setFormData(defaultData);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error loading profile data' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setMessage({ type: 'error', text: 'Name is required' });
      return;
    }

    if (!formData.contact.trim()) {
      setMessage({ type: 'error', text: 'Contact is required' });
      return;
    }

    try {
      setSaving(true);
      setMessage({ type: '', text: '' });

      const updateData = {
        name: formData.name.trim(),
        contact: formData.contact.trim(),
        email: formData.email // Keep email as is (read-only)
      };

      // Use setDoc with merge option to create document if it doesn't exist
      await setDoc(doc(db, 'operators', user.uid), updateData, { merge: true });
      
      setOperatorData(updateData);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      
      // Refresh user data in AuthContext to update header
      await refreshUserData();
    } catch (error) {
      setMessage({ type: 'error', text: 'Error updating profile. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(operatorData);
    setMessage({ type: '', text: '' });
    // Navigate to home page based on user role
    if (user?.uid === '6suqqzr9j8gCUqEAHk4jEA1x1AA2' || user?.role === 'admin') {
      navigate('/analytics');
    } else {
      navigate('/staff');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mr-4">
              <i className="fas fa-user text-white text-xl"></i>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
              <p className="text-gray-600">Manage your profile information</p>
            </div>
          </div>

          {message.text && (
            <div className={`mb-4 p-3 rounded-md ${
              message.type === 'success' 
                ? 'bg-green-100 border border-green-400 text-green-700' 
                : 'bg-red-100 border border-red-400 text-red-700'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Enter your full name"
                required
              />
            </div>

            <div>
              <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-2">
                Contact *
              </label>
              <input
                type="tel"
                id="contact"
                name="contact"
                value={formData.contact}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Enter your contact number"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-500 cursor-not-allowed"
                placeholder="Email address"
                disabled
                readOnly
              />
              <p className="mt-1 text-sm text-gray-500">Email cannot be changed</p>
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </span>
                ) : (
                  'Update Profile'
                )}
              </button>
              
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;
