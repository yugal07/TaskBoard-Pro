import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useProjects } from '../contexts/ProjectContext';
import { useTasks } from '../contexts/TaskContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export default function Dashboard() {
  const { currentUser } = useAuth();
  const { projects, loading: projectsLoading } = useProjects();
  const { allTasks, loading: tasksLoading } = useTasks();
  const [recentActivity, setRecentActivity] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    overdueTasks: 0
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectData, setNewProjectData] = useState({
    title: '',
    description: ''
  });

  // Get task and project statistics 
  useEffect(() => {
    if (!projectsLoading && !tasksLoading) {
      // Calculate basic stats
      const totalProjects = projects.length;
      const totalTasks = allTasks.length;
      const completedTasks = allTasks.filter(task => task.status === 'Done').length;
      const overdueTasks = allTasks.filter(task => 
        task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Done'
      ).length;

      setStats({
        totalProjects,
        totalTasks,
        completedTasks,
        overdueTasks
      });

      // Get upcoming tasks (due in the next 7 days)
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      const upcoming = allTasks.filter(task => 
        task.status !== 'Done' &&
        task.dueDate &&
        new Date(task.dueDate) >= today &&
        new Date(task.dueDate) <= nextWeek
      ).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

      setUpcomingTasks(upcoming.slice(0, 5)); // Top 5 upcoming tasks
    }
  }, [projects, allTasks, projectsLoading, tasksLoading]);

  // Fetch recent activities across all projects
  useEffect(() => {
    const fetchRecentActivity = async () => {
      if (!currentUser) return;
      
      try {
        setActivitiesLoading(true);
        
        // In a real app, you would have an API endpoint for this
        // For now, we'll simulate it with recent tasks and modifications
        const recentlyCreatedTasks = allTasks
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5)
          .map(task => ({
            id: task._id,
            type: 'task_created',
            title: task.title,
            projectId: task.project,
            projectTitle: projects.find(p => p._id === task.project)?.title || 'Unknown Project',
            user: task.createdBy?.displayName || 'A team member',
            timestamp: task.createdAt
          }));
          
        const recentlyUpdatedTasks = allTasks
          .filter(task => task.updatedAt !== task.createdAt)
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
          .slice(0, 5)
          .map(task => ({
            id: task._id,
            type: 'task_updated',
            title: task.title,
            projectId: task.project,
            projectTitle: projects.find(p => p._id === task.project)?.title || 'Unknown Project',
            user: task.assignee?.displayName || 'A team member',
            timestamp: task.updatedAt
          }));
          
        // Combine and sort by timestamp
        const allActivities = [...recentlyCreatedTasks, ...recentlyUpdatedTasks]
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 10);
          
        setRecentActivity(allActivities);
        setActivitiesLoading(false);
      } catch (error) {
        console.error('Error fetching recent activity:', error);
        setActivitiesLoading(false);
      }
    };
    
    fetchRecentActivity();
  }, [currentUser, allTasks, projects]);

  // Handle project creation
  const handleCreateProject = async (e) => {
    e.preventDefault();
    
    try {
      const response = await api.post('/projects', newProjectData);
      
      // Add new project to list (this would typically be handled by context)
      setShowCreateModal(false);
      setNewProjectData({ title: '', description: '' });
      
      // Redirect to new project (this would typically be handled by navigation)
      window.location.href = `/projects/${response.data._id}`;
    } catch (error) {
      console.error('Error creating project:', error);
      // Show error toast
    }
  };

  // Loading state
  if (projectsLoading || tasksLoading) {
    return (
      <div className="flex justify-center my-8">
        <div className="spinner"></div>
        <p className="ml-2">Loading dashboard...</p>
      </div>
    );
  }

  // Dashboard UI
  return (
    <div className="space-y-6">
      {/* Header with welcome and quick actions */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome, {currentUser?.displayName || 'there'}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Here's your task activity across all projects
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Create Project
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-dark-800 p-4 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Projects</h2>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.totalProjects}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-800 p-4 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed Tasks</h2>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.completedTasks} / {stats.totalTasks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-800 p-4 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className={`p-3 rounded-full ${
              stats.overdueTasks > 0
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
            }`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Overdue Tasks</h2>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.overdueTasks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-800 p-4 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Completion Rate</h2>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {stats.totalTasks ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Projects List - Takes up 2 columns */}
        <div className="lg:col-span-2 bg-white dark:bg-dark-800 rounded-lg shadow-sm">
          <div className="px-4 py-3 border-b dark:border-dark-700">
            <h2 className="font-medium">Your Projects</h2>
          </div>
          
          <div className="p-4">
            {projects.length === 0 ? (
              <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p>No projects yet</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-2 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                >
                  Create your first project
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-dark-700">
                {projects.map(project => (
                  <li key={project._id} className="py-3">
                    <Link to={`/projects/${project._id}`} className="block hover:bg-gray-50 dark:hover:bg-dark-700 -m-3 p-3 rounded-md transition-colors">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium text-gray-900 dark:text-white">{project.title}</h3>
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {allTasks.filter(task => task.project === project._id).length} tasks
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                        {project.description}
                      </p>
                      
                      {/* Project Progress Bar */}
                      <div className="mt-2">
                        {(() => {
                          const projectTasks = allTasks.filter(task => task.project === project._id);
                          const completedCount = projectTasks.filter(task => task.status === 'Done').length;
                          const completionPercentage = projectTasks.length > 0 
                            ? Math.round((completedCount / projectTasks.length) * 100)
                            : 0;
                            
                          return (
                            <>
                              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                                <span>{completionPercentage}% complete</span>
                                <span>{completedCount}/{projectTasks.length} tasks</span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-dark-600 rounded-full h-1.5">
                                <div 
                                  className="bg-green-600 h-1.5 rounded-full" 
                                  style={{ width: `${completionPercentage}%` }}
                                ></div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Activity Feed - Takes up 2 columns */}
        <div className="lg:col-span-2 bg-white dark:bg-dark-800 rounded-lg shadow-sm">
          <div className="px-4 py-3 border-b dark:border-dark-700">
            <h2 className="font-medium">Recent Activity</h2>
          </div>
          
          <div className="p-4">
            {activitiesLoading ? (
              <div className="flex justify-center py-8">
                <div className="spinner"></div>
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p>No recent activity</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-dark-700">
                {recentActivity.map((activity) => (
                  <li key={`${activity.type}-${activity.id}-${activity.timestamp}`} className="py-3">
                    <div className="flex">
                      <span className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                        activity.type === 'task_created' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {activity.type === 'task_created' ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        )}
                      </span>
                      <div className="ml-4">
                        <p className="text-sm">
                          <span className="font-medium">{activity.user}</span>
                          {' '}
                          {activity.type === 'task_created' ? 'created' : 'updated'}
                          {' '}
                          <Link 
                            to={`/projects/${activity.projectId}`} 
                            className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
                          >
                            {activity.title}
                          </Link>
                          {' in '}
                          <Link 
                            to={`/projects/${activity.projectId}`} 
                            className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
                          >
                            {activity.projectTitle}
                          </Link>
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Upcoming Tasks - Takes up 1 column */}
        <div className="lg:col-span-1 bg-white dark:bg-dark-800 rounded-lg shadow-sm">
          <div className="px-4 py-3 border-b dark:border-dark-700">
            <h2 className="font-medium">Upcoming Tasks</h2>
          </div>
          
          <div className="p-4">
            {upcomingTasks.length === 0 ? (
              <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p>No upcoming tasks</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-dark-700">
                {upcomingTasks.map(task => {
                  const dueDate = new Date(task.dueDate);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  
                  const isToday = dueDate.getDate() === today.getDate() &&
                                  dueDate.getMonth() === today.getMonth() &&
                                  dueDate.getFullYear() === today.getFullYear();
                  
                  const isTomorrow = dueDate.getDate() === today.getDate() + 1 &&
                                    dueDate.getMonth() === today.getMonth() &&
                                    dueDate.getFullYear() === today.getFullYear();
                                    
                  const dueDateText = isToday ? 'Today' : 
                                      isTomorrow ? 'Tomorrow' : 
                                      dueDate.toLocaleDateString();
                  
                  return (
                    <li key={task._id} className="py-3">
                      <Link 
                        to={`/projects/${task.project}`}
                        className="block hover:bg-gray-50 dark:hover:bg-dark-700 -m-3 p-3 rounded-md transition-colors"
                      >
                        <div className="flex justify-between">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                            {task.title}
                          </h3>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            isToday
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          }`}>
                            {dueDateText}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {(() => {
                            const project = projects.find(p => p._id === task.project);
                            return project?.title || 'Unknown Project';
                          })()}
                        </p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-4 border-b dark:border-dark-700">
              <h2 className="text-lg font-medium">Create New Project</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleCreateProject} className="p-4">
              <div className="mb-4">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={newProjectData.title}
                  onChange={(e) => setNewProjectData(prev => ({ ...prev, title: e.target.value }))}
                  className="input-field"
                  placeholder="My Awesome Project"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  value={newProjectData.description}
                  onChange={(e) => setNewProjectData(prev => ({ ...prev, description: e.target.value }))}
                  className="input-field min-h-[100px]"
                  placeholder="Project description"
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}