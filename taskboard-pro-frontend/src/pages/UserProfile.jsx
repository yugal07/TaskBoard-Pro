import { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { updateProfile } from 'firebase/auth';
import { auth } from '../firebase/config';

export default function UserProfile() {
  const { currentUser, updateUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  // Profile data state
  const [profileData, setProfileData] = useState({
    displayName: currentUser?.displayName || '',
    photoURL: currentUser?.photoURL || '',
  });
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  // Refs
  const fileInputRef = useRef(null);
  
  // Handle profile changes
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle password changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle file selection for profile picture
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setProfileData(prev => ({
        ...prev,
        photoURL: e.target.result
      }));
    };
    reader.readAsDataURL(file);
  };
  
  // Trigger file input click
  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };
  
  // Update profile
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!profileData.displayName.trim()) {
      setError('Display name is required');
      return;
    }
    
    try {
      setLoading(true);
      
      // Update Firebase profile
      await updateProfile(auth.currentUser, {
        displayName: profileData.displayName,
        photoURL: profileData.photoURL
      });
      
      // Update backend profile
      await updateUserProfile(profileData);
      
      setSuccess('Profile updated successfully');
      setIsEditingProfile(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Update password
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validate password inputs
    if (!passwordData.currentPassword) {
      setError('Current password is required');
      return;
    }
    
    if (!passwordData.newPassword) {
      setError('New password is required');
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    // Simple password strength validation
    if (passwordData.newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      return;
    }
    
    try {
      setLoading(true);
      
      // Use Auth context method to change password
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      
      setSuccess('Password updated successfully');
      
      // Clear password fields
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Error updating password:', error);
      
      // Handle specific error cases
      if (error.code === 'auth/wrong-password') {
        setError('Current password is incorrect');
      } else if (error.code === 'auth/weak-password') {
        setError('New password is too weak. Please choose a stronger password.');
      } else {
        setError('Failed to update password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Your Profile</h1>
      
      {error && (
        <div className="mb-4 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 p-3 rounded-md">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 p-3 rounded-md">
          {success}
        </div>
      )}
      
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm mb-6">
        <div className="px-4 py-3 border-b dark:border-dark-700">
          <h2 className="font-medium">Profile Information</h2>
        </div>
        
        <div className="p-4">
          {!isEditingProfile ? (
            // View mode
            <div className="flex flex-col md:flex-row">
              <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-6">
                <img
                  src={currentUser?.photoURL || `https://ui-avatars.com/api/?name=${currentUser?.displayName || 'User'}&background=random`}
                  alt={currentUser?.displayName || 'User profile'}
                  className="w-24 h-24 rounded-full object-cover"
                />
              </div>
              
              <div className="flex-grow">
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Display Name</h3>
                  <p className="mt-1 text-lg">{currentUser?.displayName || 'Not set'}</p>
                </div>
                
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</h3>
                  <p className="mt-1">{currentUser?.email}</p>
                </div>
                
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Email Verification</h3>
                  <p className="mt-1 flex items-center">
                    {currentUser?.emailVerified ? (
                      <>
                        <svg className="w-5 h-5 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-green-600 dark:text-green-400">Verified</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 text-yellow-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-yellow-600 dark:text-yellow-400">Not verified</span>
                        <button 
                          type="button"
                          className="ml-2 text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                          onClick={resendVerificationEmail}
                        >
                          Resend verification email
                        </button>
                      </>
                    )}
                  </p>
                </div>
                
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(true)}
                  className="btn-primary"
                >
                  Edit Profile
                </button>
              </div>
            </div>
          ) : (
            // Edit mode
            <form onSubmit={handleUpdateProfile}>
              <div className="flex flex-col md:flex-row">
                <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-6">
                  <div className="relative">
                    <img
                      src={profileData.photoURL || `https://ui-avatars.com/api/?name=${profileData.displayName || 'User'}&background=random`}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover cursor-pointer"
                      onClick={handleAvatarClick}
                    />
                    <div 
                      className="absolute bottom-0 right-0 bg-primary-600 rounded-full p-1 cursor-pointer"
                      onClick={handleAvatarClick}
                    >
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                    Click to change
                  </p>
                </div>
                
                <div className="flex-grow">
                  <div className="mb-4">
                    <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      id="displayName"
                      name="displayName"
                      value={profileData.displayName}
                      onChange={handleProfileChange}
                      className="input-field"
                      placeholder="Your name"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={currentUser?.email}
                      className="input-field bg-gray-100 dark:bg-dark-700"
                      disabled
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Email cannot be changed
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:justify-end mt-6 space-y-2 sm:space-y-0 sm:space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary disabled:opacity-70"
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
      
      {/* Password Change Section */}
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm">
        <div className="px-4 py-3 border-b dark:border-dark-700">
          <h2 className="font-medium">Change Password</h2>
        </div>
        
        <div className="p-4">
          <form onSubmit={handleUpdatePassword}>
            <div className="mb-4">
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Current Password
              </label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                className="input-field"
                placeholder="••••••••"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                className="input-field"
                placeholder="••••••••"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Password must be at least 8 characters long
              </p>
            </div>
            
            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                className="input-field"
                placeholder="••••••••"
              />
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary disabled:opacity-70"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}