'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminSettingsPage() {
  const { currentUser } = useAuth();
  const [apiSettings, setApiSettings] = useState({
    hiveApiEnabled: true,
    mockModeEnabled: false,
    rateLimit: 100,
  });
  const [userSettings, setUserSettings] = useState({
    allowSignups: true,
    requireEmailVerification: false,
    maxDocumentsPerUser: 50,
  });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Handle API settings form submission
  const handleApiSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real application, this would save the settings to a database
    setLoading(true);
    setError(null);
    setSavedSuccess(false);
    
    try {
      // Simulate an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success message
      setSavedSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSavedSuccess(false);
      }, 3000);
    } catch (error) {
      setError('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  // Handle user settings form submission
  const handleUserSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real application, this would save the settings to a database
    setLoading(true);
    setError(null);
    setSavedSuccess(false);
    
    try {
      // Simulate an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success message
      setSavedSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSavedSuccess(false);
      }, 3000);
    } catch (error) {
      setError('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Admin Settings</h1>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
          {error}
        </div>
      )}
      
      {savedSuccess && (
        <div className="bg-green-50 text-green-700 p-4 rounded-md mb-6">
          Settings saved successfully
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* API Settings */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">API Settings</h2>
          
          <form onSubmit={handleApiSettingsSubmit}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label htmlFor="hiveApiEnabled" className="text-gray-700">
                  Enable Hive API
                </label>
                <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                  <input
                    type="checkbox"
                    id="hiveApiEnabled"
                    className="opacity-0 w-0 h-0"
                    checked={apiSettings.hiveApiEnabled}
                    onChange={(e) => setApiSettings({
                      ...apiSettings,
                      hiveApiEnabled: e.target.checked,
                    })}
                  />
                  <label
                    htmlFor="hiveApiEnabled"
                    className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-colors duration-200 ${
                      apiSettings.hiveApiEnabled ? 'bg-primary-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute left-1 bottom-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ${
                        apiSettings.hiveApiEnabled ? 'transform translate-x-6' : ''
                      }`}
                    ></span>
                  </label>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <label htmlFor="mockModeEnabled" className="text-gray-700">
                  Enable Mock Mode
                </label>
                <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                  <input
                    type="checkbox"
                    id="mockModeEnabled"
                    className="opacity-0 w-0 h-0"
                    checked={apiSettings.mockModeEnabled}
                    onChange={(e) => setApiSettings({
                      ...apiSettings,
                      mockModeEnabled: e.target.checked,
                    })}
                  />
                  <label
                    htmlFor="mockModeEnabled"
                    className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-colors duration-200 ${
                      apiSettings.mockModeEnabled ? 'bg-primary-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute left-1 bottom-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ${
                        apiSettings.mockModeEnabled ? 'transform translate-x-6' : ''
                      }`}
                    ></span>
                  </label>
                </div>
              </div>
              
              <div>
                <label htmlFor="rateLimit" className="block text-sm font-medium text-gray-700 mb-1">
                  API Rate Limit (per minute)
                </label>
                <input
                  type="number"
                  id="rateLimit"
                  min="1"
                  max="1000"
                  value={apiSettings.rateLimit}
                  onChange={(e) => setApiSettings({
                    ...apiSettings,
                    rateLimit: parseInt(e.target.value) || 100,
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save API Settings'}
                </button>
              </div>
            </div>
          </form>
        </div>
        
        {/* User Settings */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">User Settings</h2>
          
          <form onSubmit={handleUserSettingsSubmit}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label htmlFor="allowSignups" className="text-gray-700">
                  Allow New Signups
                </label>
                <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                  <input
                    type="checkbox"
                    id="allowSignups"
                    className="opacity-0 w-0 h-0"
                    checked={userSettings.allowSignups}
                    onChange={(e) => setUserSettings({
                      ...userSettings,
                      allowSignups: e.target.checked,
                    })}
                  />
                  <label
                    htmlFor="allowSignups"
                    className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-colors duration-200 ${
                      userSettings.allowSignups ? 'bg-primary-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute left-1 bottom-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ${
                        userSettings.allowSignups ? 'transform translate-x-6' : ''
                      }`}
                    ></span>
                  </label>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <label htmlFor="requireEmailVerification" className="text-gray-700">
                  Require Email Verification
                </label>
                <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                  <input
                    type="checkbox"
                    id="requireEmailVerification"
                    className="opacity-0 w-0 h-0"
                    checked={userSettings.requireEmailVerification}
                    onChange={(e) => setUserSettings({
                      ...userSettings,
                      requireEmailVerification: e.target.checked,
                    })}
                  />
                  <label
                    htmlFor="requireEmailVerification"
                    className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-colors duration-200 ${
                      userSettings.requireEmailVerification ? 'bg-primary-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute left-1 bottom-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ${
                        userSettings.requireEmailVerification ? 'transform translate-x-6' : ''
                      }`}
                    ></span>
                  </label>
                </div>
              </div>
              
              <div>
                <label htmlFor="maxDocumentsPerUser" className="block text-sm font-medium text-gray-700 mb-1">
                  Max Documents Per User
                </label>
                <input
                  type="number"
                  id="maxDocumentsPerUser"
                  min="1"
                  max="1000"
                  value={userSettings.maxDocumentsPerUser}
                  onChange={(e) => setUserSettings({
                    ...userSettings,
                    maxDocumentsPerUser: parseInt(e.target.value) || 50,
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save User Settings'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
      
      {/* System Information */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">System Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Application</h3>
            <table className="min-w-full">
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="py-2 text-sm text-gray-500">Version</td>
                  <td className="py-2 text-sm font-medium">1.0.0</td>
                </tr>
                <tr>
                  <td className="py-2 text-sm text-gray-500">Environment</td>
                  <td className="py-2 text-sm font-medium">Production</td>
                </tr>
                <tr>
                  <td className="py-2 text-sm text-gray-500">Node.js Version</td>
                  <td className="py-2 text-sm font-medium">18.x</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Database</h3>
            <table className="min-w-full">
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="py-2 text-sm text-gray-500">Type</td>
                  <td className="py-2 text-sm font-medium">Firebase Firestore</td>
                </tr>
                <tr>
                  <td className="py-2 text-sm text-gray-500">Status</td>
                  <td className="py-2 text-sm font-medium">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Connected
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-sm text-gray-500">Last Backup</td>
                  <td className="py-2 text-sm font-medium">
                    {new Date().toLocaleDateString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 