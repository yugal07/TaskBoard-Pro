import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProjects } from '../contexts/ProjectContext';
import { useTasks } from '../contexts/TaskContext';
import { parseISO, addDays } from 'date-fns';

// Import analytics components
import StatusSummary from '../components/analytics/StatusSummary';
import BurndownChart from '../components/analytics/BurndownChart';
import TeamPerformance from '../components/analytics/TeamPerformance';

export default function ProjectAnalytics() {
  const { projectId } = useParams();
  const { currentProject } = useProjects();
  const { allTasks, loading } = useTasks();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Calculate project dates for the burndown chart
  const getProjectDates = () => {
    if (!currentProject || !allTasks || allTasks.length === 0) {
      return {
        startDate: new Date(),
        targetDate: addDays(new Date(), 30)
      };
    }
    
    // Find earliest task creation date for project start
    const sortedByCreation = [...allTasks].sort((a, b) => 
      new Date(a.createdAt) - new Date(b.createdAt)
    );
    
    const startDate = parseISO(sortedByCreation[0].createdAt);
    
    // For target date, use the latest due date if available
    const tasksWithDueDates = allTasks.filter(task => task.dueDate);
    
    let targetDate;
    if (tasksWithDueDates.length > 0) {
      const sortedByDueDate = [...tasksWithDueDates].sort((a, b) => 
        new Date(b.dueDate) - new Date(a.dueDate)
      );
      targetDate = parseISO(sortedByDueDate[0].dueDate);
    } else {
      // Default to 30 days after the start date if no due dates
      targetDate = addDays(startDate, 30);
    }
    
    return { startDate, targetDate };
  };
  
  if (loading) {
    return (
      <div className="flex justify-center my-8">
        <div className="spinner"></div>
        <p className="ml-2">Loading analytics data...</p>
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
  
  const { startDate, targetDate } = getProjectDates();
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {currentProject.title} - Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Visualize project metrics and performance
          </p>
        </div>
        
        <Link
          to={`/projects/${projectId}/reports`}
          className="btn-primary flex items-center"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Generate Reports
        </Link>
      </div>
      
      {/* Tab Navigation */}
      <div className="bg-white dark:bg-dark-800 p-1 rounded-lg shadow-sm">
        <nav className="flex space-x-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'overview'
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-200'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('burndown')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'burndown'
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-200'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700'
            }`}
          >
            Burndown Chart
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'team'
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-200'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700'
            }`}
          >
            Team Performance
          </button>
        </nav>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'overview' && (
        <StatusSummary 
          tasks={allTasks} 
          projectStatuses={currentProject.statuses} 
        />
      )}
      
      {activeTab === 'burndown' && (
        <BurndownChart 
          tasks={allTasks}
          projectStartDate={startDate}
          targetDate={targetDate}
        />
      )}
      
      {activeTab === 'team' && (
        <TeamPerformance 
          tasks={allTasks}
          members={currentProject.members}
          timeRange={30}
        />
      )}
      
      {/* Additional Metrics and KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Priority Distribution */}
        <div className="bg-white dark:bg-dark-800 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium mb-3">Priority Distribution</h3>
          <div className="space-y-3">
            {['Urgent', 'High', 'Medium', 'Low'].map(priority => {
              const count = allTasks.filter(task => task.priority === priority).length;
              const percentage = Math.round((count / allTasks.length) * 100) || 0;
              
              let barColor;
              switch(priority) {
                case 'Urgent': barColor = 'bg-red-500'; break;
                case 'High': barColor = 'bg-orange-500'; break;
                case 'Medium': barColor = 'bg-blue-500'; break;
                case 'Low': barColor = 'bg-green-500'; break;
                default: barColor = 'bg-gray-500';
              }
              
              return (
                <div key={priority}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{priority}</span>
                    <span className="text-sm text-gray-500">{count} tasks ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-dark-700 rounded-full h-2.5">
                    <div 
                      className={`${barColor} h-2.5 rounded-full`} 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Days to Completion */}
        <div className="bg-white dark:bg-dark-800 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium mb-3">Task Completion Time</h3>
          <div className="flex flex-col h-full justify-center">
            {allTasks.some(task => task.status === 'Done') ? (
              <div className="text-center py-4">
                <div className="text-4xl font-bold text-primary-600 dark:text-primary-400">
                  {Math.round(
                    allTasks
                      .filter(task => task.status === 'Done' && task.createdAt && task.updatedAt)
                      .reduce((sum, task) => {
                        const createdAt = new Date(task.createdAt);
                        const updatedAt = new Date(task.updatedAt);
                        return sum + ((updatedAt - createdAt) / (1000 * 60 * 60 * 24)); // days
                      }, 0) / 
                    (allTasks.filter(task => task.status === 'Done' && task.createdAt && task.updatedAt).length || 1)
                  )}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Average days to complete a task
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                No completed tasks yet
              </div>
            )}
          </div>
        </div>
        
        {/* Assignee Distribution */}
        <div className="bg-white dark:bg-dark-800 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium mb-3">Task Assignment</h3>
          
          <div className="space-y-4">
            {currentProject.members.map(member => {
              const assignedTasks = allTasks.filter(task => 
                task.assignee && task.assignee._id === member._id
              );
              const percentage = Math.round((assignedTasks.length / allTasks.length) * 100) || 0;
              
              return (
                <div key={member._id} className="flex items-center">
                  <img 
                    src={member.photoURL || `https://ui-avatars.com/api/?name=${member.displayName}&background=random`}
                    alt={member.displayName}
                    className="w-8 h-8 rounded-full mr-3"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">{member.displayName}</span>
                      <span className="text-xs text-gray-500">{assignedTasks.length} tasks</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-dark-700 rounded-full h-1.5">
                      <div 
                        className="bg-primary-600 dark:bg-primary-500 h-1.5 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Unassigned Tasks */}
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-dark-700 flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">Unassigned</span>
                  <span className="text-xs text-gray-500">
                    {allTasks.filter(task => !task.assignee).length} tasks
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-dark-700 rounded-full h-1.5">
                  <div 
                    className="bg-gray-400 h-1.5 rounded-full" 
                    style={{ 
                      width: `${Math.round((allTasks.filter(task => !task.assignee).length / allTasks.length) * 100) || 0}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tag Metrics */}
      <div className="bg-white dark:bg-dark-800 p-4 rounded-lg shadow-sm">
        <h3 className="text-lg font-medium mb-3">Popular Tags</h3>
        
        {(() => {
          // Extract all tags and count occurrences
          const tagCounts = {};
          allTasks.forEach(task => {
            if (task.tags && Array.isArray(task.tags)) {
              task.tags.forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
              });
            }
          });
          
          // Sort tags by count
          const sortedTags = Object.entries(tagCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 15); // Show top 15 tags
          
          if (sortedTags.length === 0) {
            return (
              <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                No tags used in this project yet
              </div>
            );
          }
          
          return (
            <div className="flex flex-wrap gap-2">
              {sortedTags.map(([tag, count]) => (
                <div 
                  key={tag} 
                  className="bg-gray-100 dark:bg-dark-700 rounded-full px-3 py-1 text-sm"
                >
                  <span className="font-medium">{tag}</span>
                  <span className="ml-1 text-gray-500 dark:text-gray-400">({count})</span>
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    </div>
  );
}