import { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { useProjects } from '../contexts/ProjectContext';
import { useTasks } from '../contexts/TaskContext';
import api from '../services/api';
import TaskBoard from '../components/TaskBoard';
import TaskFilter from '../components/TaskFilter';
import AddTaskButton from '../components/AddTaskButton';

export default function ProjectDetails() {
  const { projectId } = useParams();
  const location = useLocation();
  const { projects, setCurrentProject, currentProject } = useProjects();
  const { applyFilters, tasks } = useTasks();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [email, setEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [projectFetched, setProjectFetched] = useState(false); // Add this to track if we've fetched the project
  
  // Fetch project details when component mounts or projectId changes
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
        setProjectFetched(true); // Mark that we've fetched the project
      } catch (error) {
        console.error('Error fetching project details:', error);
        setError('Failed to load project details. Please try again later.');
        setLoading(false);
      }
    };
    
    // Only fetch if we haven't already fetched or if the projectId changes
    if (!projectFetched || currentProject?._id !== projectId) {
      fetchProjectDetails();
    }
    
    // Clean up current project when unmounting
    return () => {
      // Only clear the current project when navigating away from this component
      if (location.pathname.indexOf(projectId) === -1) {
        setCurrentProject(null);
        setProjectFetched(false);
      }
    };
  }, [projectId, projects, setCurrentProject]); // Remove currentProject from dependencies
  
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
          <div className="flex items-center space-x-4">
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
        <div className="flex space-x-4 overflow-x-auto">
          <Link
            to={`/projects/${projectId}`}
            className={`px-4 py-2 whitespace-nowrap ${
              !location.pathname.includes('/automations') && 
              !location.pathname.includes('/analytics') && 
              !location.pathname.includes('/reports') && 
              !location.pathname.includes('/settings')
                ? 'bg-white dark:bg-dark-700 rounded-md text-gray-800 dark:text-gray-200 font-medium shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-white hover:dark:bg-dark-700 rounded-md'
            }`}
          >
            Board
          </Link>
          <Link
            to={`/projects/${projectId}/analytics`}
            className={`px-4 py-2 whitespace-nowrap ${
              location.pathname.includes('/analytics')
                ? 'bg-white dark:bg-dark-700 rounded-md text-gray-800 dark:text-gray-200 font-medium shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-white hover:dark:bg-dark-700 rounded-md'
            }`}
          >
            Analytics
          </Link>
          <Link
            to={`/projects/${projectId}/reports`}
            className={`px-4 py-2 whitespace-nowrap ${
              location.pathname.includes('/reports')
                ? 'bg-white dark:bg-dark-700 rounded-md text-gray-800 dark:text-gray-200 font-medium shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-white hover:dark:bg-dark-700 rounded-md'
            }`}
          >
            Reports
          </Link>
          <Link
            to={`/projects/${projectId}/automations`}
            className={`px-4 py-2 whitespace-nowrap ${
              location.pathname.includes('/automations')
                ? 'bg-white dark:bg-dark-700 rounded-md text-gray-800 dark:text-gray-200 font-medium shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-white hover:dark:bg-dark-700 rounded-md'
            }`}
          >
            Automations
          </Link>
          <Link
            to={`/projects/${projectId}/settings`}
            className={`px-4 py-2 whitespace-nowrap ${
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
       !location.pathname.includes('/reports') && 
       !location.pathname.includes('/settings') && (
        <>
          <div className="flex justify-between items-center mb-6">
            <TaskFilter onFilterChange={applyFilters} />
            {/* Add the new Add Task Button here */}
            <AddTaskButton />
          </div>
          <TaskBoard />
          
          {/* Basic Analytics Summary on the Board Page */}
          <div className="mt-8 bg-white dark:bg-dark-800 p-4 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Project Overview</h2>
              <Link
                to={`/projects/${projectId}/analytics`}
                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium"
              >
                View Full Analytics
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Completion Status */}
              <div className="bg-gray-50 dark:bg-dark-700 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Completion</h4>
                <div className="mt-2">
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {Math.round((tasks.filter(task => task.status === 'Done').length / (tasks.length || 1)) * 100)}%
                  </p>
                  <div className="mt-2 w-full bg-gray-200 dark:bg-dark-600 rounded-full h-1.5">
                    <div 
                      className="bg-green-600 h-1.5 rounded-full" 
                      style={{ 
                        width: `${Math.round((tasks.filter(task => task.status === 'Done').length / (tasks.length || 1)) * 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
              
              {/* Tasks by Status */}
              <div className="bg-gray-50 dark:bg-dark-700 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Tasks</h4>
                <div className="mt-2">
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{tasks.length}</p>
                  <div className="mt-2 flex text-xs">
                    <div className="mr-2">
                      <span className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-1"></span>
                      <span>{tasks.filter(task => task.status === 'To Do').length} Todo</span>
                    </div>
                    <div className="mr-2">
                      <span className="inline-block w-3 h-3 rounded-full bg-yellow-500 mr-1"></span>
                      <span>{tasks.filter(task => task.status === 'In Progress').length} In Progress</span>
                    </div>
                    <div>
                      <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-1"></span>
                      <span>{tasks.filter(task => task.status === 'Done').length} Done</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Overdue Tasks */}
              <div className="bg-gray-50 dark:bg-dark-700 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Overdue</h4>
                <div className="mt-2">
                  <p className={`text-2xl font-semibold ${
                    tasks.filter(task => 
                      task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Done'
                    ).length > 0 
                      ? 'text-red-500'
                      : 'text-green-500'
                  }`}>
                    {tasks.filter(task => 
                      task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Done'
                    ).length}
                  </p>
                  <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    {tasks.filter(task => 
                      task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Done'
                    ).length === 0
                      ? 'No overdue tasks'
                      : 'Tasks past due date'
                    }
                  </p>
                </div>
              </div>
              
              {/* Team Workload */}
              <div className="bg-gray-50 dark:bg-dark-700 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Team Workload</h4>
                <div className="mt-2">
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {Math.round(tasks.length / (currentProject.members.length || 1))}
                  </p>
                  <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    Avg tasks per member
                  </p>
                </div>
              </div>
            </div>
          </div>
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
    </div>
  );
}