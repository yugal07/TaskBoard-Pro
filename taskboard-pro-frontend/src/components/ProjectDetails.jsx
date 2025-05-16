import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useProjects } from '../contexts/ProjectContext';
import api from '../services/api';
import TaskBoard from '../components/TaskBoard';

export default function ProjectDetails() {
  const { projectId } = useParams();
  const { projects, setCurrentProject, currentProject } = useProjects();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
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
            
            <button className="btn-primary text-sm py-1 px-3">
              Invite
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-100 dark:bg-dark-800 p-4 rounded-lg mb-6">
        <div className="flex space-x-4">
          <button className="px-4 py-2 bg-white dark:bg-dark-700 rounded-md text-gray-800 dark:text-gray-200 font-medium shadow-sm">
            Board
          </button>
          <button className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-white hover:dark:bg-dark-700 rounded-md">
            Timeline
          </button>
          <button className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-white hover:dark:bg-dark-700 rounded-md">
            Analytics
          </button>
          <button className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-white hover:dark:bg-dark-700 rounded-md">
            Settings
          </button>
        </div>
      </div>
      <TaskFilter onFilterChange={applyFilters} />
      <TaskBoard />
    </div>
  );
}