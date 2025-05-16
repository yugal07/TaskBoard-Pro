import { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { useProjects } from '../contexts/ProjectContext';
import { useTasks } from '../contexts/TaskContext';
import api from '../services/api';
import TaskBoard from '../components/TaskBoard';
import TaskFilter from '../components/TaskFilter';

export default function ProjectDetails() {
  const { projectId } = useParams();
  const location = useLocation();
  const { projects, setCurrentProject, currentProject } = useProjects();
  const { applyFilters } = useTasks();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [email, setEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  
  // Fetch project details when component mounts
  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if project is already in the context
        const existingProject = projects.find(p => p._id === projectId);
        
        if (existingProject && !currentProject) {
          // Set as current project if not already set
          setCurrentProject(existingProject);
        }
        
        // Fetch full project details
        const response = await api.get(`/projects/${projectId}`);
        setCurrentProject(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching project details:', error);
        setError('Failed to load project details. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchProjectDetails();
    
    // Clean up current project when unmounting
    return () => {
      setCurrentProject(null);
    };
  }, [projectId, projects, setCurrentProject, currentProject]);
  
  // Handle inviting a user to the project
  const handleInvite = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setInviteError('Email is required');
      return;
    }
    
    try {
      setInviteLoading(true);
      setInviteError('');
      setInviteSuccess('');
      
      await api.post(`/projects/${projectId}/invite`, { email });
      
      setInviteSuccess(`Invitation sent to ${email}`);
      setEmail('');
      
      // Refresh project details to show new member
      const response = await api.get(`/projects/${projectId}`);
      setCurrentProject(response.data);
    } catch (error) {
      console.error('Error inviting user:', error);
      setInviteError(error.response?.data?.message || 'Failed to send invitation');
    } finally {
      setInviteLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center my-8">
        <div className="spinner"></div>
        <p className="ml-2">Loading project...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="my-8 p-4 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-md">
        {error}
      </div>
    );
  }
  
  if (!currentProject) {
    return (
      <div className="my-8 p-4 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-md">
        Project not found
      </div>
    );
  }
  
  return (
    <div>
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{currentProject.title}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{currentProject.description}</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex -space-x-2">
              {currentProject.members?.slice(0, 3).map((member) => (
                <img
                  key={member._id}
                  src={member.photoURL || `https://ui-avatars.com/api/?name=${member.displayName}&background=random`}
                  alt={member.displayName}
                  title={member.displayName}
                  className="w-8 h-8 rounded-full border-2 border-white dark:border-dark-800"
                />
              ))}
              {currentProject.members?.length > 3 && (
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-dark-700 flex items-center justify-center text-xs font-medium text-gray-800 dark:text-gray-200 border-2 border-white dark:border-dark-800">
                  +{currentProject.members.length - 3}
                </div>
              )}
            </div>
            
            <button 
              className="btn-primary text-sm py-1 px-3"
              onClick={() => setShowInviteModal(true)}
            >
              Invite
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-100 dark:bg-dark-800 p-4 rounded-lg mb-6">
        <div className="flex space-x-4">
          <Link
            to={`/projects/${projectId}`}
            className={`px-4 py-2 ${
              !location.pathname.includes('/automations') && !location.pathname.includes('/settings')
                ? 'bg-white dark:bg-dark-700 rounded-md text-gray-800 dark:text-gray-200 font-medium shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-white hover:dark:bg-dark-700 rounded-md'
            }`}
          >
            Board
          </Link>
          <Link
            to={`/projects/${projectId}/automations`}
            className={`px-4 py-2 ${
              location.pathname.includes('/automations')
                ? 'bg-white dark:bg-dark-700 rounded-md text-gray-800 dark:text-gray-200 font-medium shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-white hover:dark:bg-dark-700 rounded-md'
            }`}
          >
            Automations
          </Link>
          <Link
            to={`/projects/${projectId}/analytics`}
            className={`px-4 py-2 ${
              location.pathname.includes('/analytics')
                ? 'bg-white dark:bg-dark-700 rounded-md text-gray-800 dark:text-gray-200 font-medium shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-white hover:dark:bg-dark-700 rounded-md'
            }`}
          >
            Analytics
          </Link>
          <Link
            to={`/projects/${projectId}/settings`}
            className={`px-4 py-2 ${
              location.pathname.includes('/settings')
                ? 'bg-white dark:bg-dark-700 rounded-md text-gray-800 dark:text-gray-200 font-medium shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-white hover:dark:bg-dark-700 rounded-md'
            }`}
          >
            Settings
          </Link>
        </div>
      </div>
      
      {/* Only show TaskFilter and TaskBoard on the main board tab */}
      {!location.pathname.includes('/automations') && 
       !location.pathname.includes('/analytics') && 
       !location.pathname.includes('/settings') && (
        <>
          <TaskFilter onFilterChange={applyFilters} />
          <TaskBoard />
        </>
      )}
      
      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-4 border-b dark:border-dark-700">
              <h2 className="text-lg font-medium">Invite Team Member</h2>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleInvite} className="p-4">
              {inviteError && (
                <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 p-2 rounded-md mb-4">
                  {inviteError}
                </div>
              )}
              
              {inviteSuccess && (
                <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 p-2 rounded-md mb-4">
                  {inviteSuccess}
                </div>
              )}
              
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="colleague@example.com"
                  required
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  The user must already have an account in TaskBoard Pro
                </p>
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="btn-primary disabled:opacity-70"
                >
                  {inviteLoading ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Member List Modal (could be implemented for the full member list) */}
    </div>
  );
}