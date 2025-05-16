import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useProjects } from '../contexts/ProjectContext';
import { useTasks } from '../contexts/TaskContext';
import api from '../services/api';

export default function ProjectReports() {
  const { projectId } = useParams();
  const { currentProject } = useProjects();
  const { allTasks, loading } = useTasks();
  const [reportConfig, setReportConfig] = useState({
    type: 'taskList',
    filters: {
      status: '',
      assignee: '',
      priority: '',
      dueDate: '',
      tags: []
    },
    groupBy: 'none',
    sortBy: 'createdAt',
    sortDirection: 'desc'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [availableTags, setAvailableTags] = useState([]);
  
  // Extract available tags from tasks
  useEffect(() => {
    if (allTasks && allTasks.length > 0) {
      const tagSet = new Set();
      allTasks.forEach(task => {
        if (task.tags && Array.isArray(task.tags)) {
          task.tags.forEach(tag => tagSet.add(tag));
        }
      });
      setAvailableTags(Array.from(tagSet).sort());
    }
  }, [allTasks]);
  
  // Handle report config changes
  const handleConfigChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('filters.')) {
      const filterName = name.split('.')[1];
      setReportConfig(prev => ({
        ...prev,
        filters: {
          ...prev.filters,
          [filterName]: value
        }
      }));
    } else {
      setReportConfig(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Handle tag selection
  const handleTagChange = (e) => {
    const selectedTags = Array.from(e.target.selectedOptions, option => option.value);
    
    setReportConfig(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        tags: selectedTags
      }
    }));
  };
  
  // Generate report based on configuration
  const generateReport = () => {
    setIsGenerating(true);
    
    // Apply filters to tasks
    let filteredTasks = [...allTasks];
    
    // Filter by status
    if (reportConfig.filters.status) {
      filteredTasks = filteredTasks.filter(task => task.status === reportConfig.filters.status);
    }
    
    // Filter by assignee
    if (reportConfig.filters.assignee) {
      if (reportConfig.filters.assignee === 'unassigned') {
        filteredTasks = filteredTasks.filter(task => !task.assignee);
      } else {
        filteredTasks = filteredTasks.filter(task => 
          task.assignee && task.assignee._id === reportConfig.filters.assignee
        );
      }
    }
    
    // Filter by priority
    if (reportConfig.filters.priority) {
      filteredTasks = filteredTasks.filter(task => task.priority === reportConfig.filters.priority);
    }
    
    // Filter by due date
    if (reportConfig.filters.dueDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      switch (reportConfig.filters.dueDate) {
        case 'overdue':
          filteredTasks = filteredTasks.filter(task => 
            task.dueDate && new Date(task.dueDate) < today
          );
          break;
        case 'today':
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          filteredTasks = filteredTasks.filter(task => 
            task.dueDate && new Date(task.dueDate) >= today && new Date(task.dueDate) < tomorrow
          );
          break;
        case 'week':
          const nextWeek = new Date(today);
          nextWeek.setDate(nextWeek.getDate() + 7);
          filteredTasks = filteredTasks.filter(task => 
            task.dueDate && new Date(task.dueDate) >= today && new Date(task.dueDate) < nextWeek
          );
          break;
        case 'no-date':
          filteredTasks = filteredTasks.filter(task => !task.dueDate);
          break;
      }
    }
    
    // Filter by tags
    if (reportConfig.filters.tags && reportConfig.filters.tags.length > 0) {
      filteredTasks = filteredTasks.filter(task => 
        task.tags && reportConfig.filters.tags.some(tag => task.tags.includes(tag))
      );
    }
    
    // Group tasks if needed
    let groupedTasks = {};
    
    if (reportConfig.groupBy !== 'none') {
      filteredTasks.forEach(task => {
        let groupKey;
        
        switch (reportConfig.groupBy) {
          case 'status':
            groupKey = task.status;
            break;
          case 'assignee':
            groupKey = task.assignee ? task.assignee.displayName : 'Unassigned';
            break;
          case 'priority':
            groupKey = task.priority;
            break;
          case 'dueDate':
            if (!task.dueDate) {
              groupKey = 'No Due Date';
            } else {
              const dueDate = new Date(task.dueDate);
              groupKey = dueDate.toLocaleDateString();
            }
            break;
          default:
            groupKey = 'All Tasks';
        }
        
        if (!groupedTasks[groupKey]) {
          groupedTasks[groupKey] = [];
        }
        
        groupedTasks[groupKey].push(task);
      });
    } else {
      groupedTasks = { 'All Tasks': filteredTasks };
    }
    
    // Sort tasks
    Object.keys(groupedTasks).forEach(group => {
      groupedTasks[group].sort((a, b) => {
        let aValue, bValue;
        
        switch (reportConfig.sortBy) {
          case 'title':
            aValue = a.title.toLowerCase();
            bValue = b.title.toLowerCase();
            break;
          case 'priority':
            const priorityOrder = { 'Urgent': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
            aValue = priorityOrder[a.priority] || 999;
            bValue = priorityOrder[b.priority] || 999;
            break;
          case 'dueDate':
            aValue = a.dueDate ? new Date(a.dueDate) : new Date(8640000000000000);
            bValue = b.dueDate ? new Date(b.dueDate) : new Date(8640000000000000);
            break;
          default: // createdAt
            aValue = new Date(a.createdAt);
            bValue = new Date(b.createdAt);
        }
        
        if (reportConfig.sortDirection === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
    });
    
    setReportData(groupedTasks);
    setIsGenerating(false);
  };
  
  // Export report as CSV
  const exportCSV = () => {
    if (!reportData) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Headers
    csvContent += "Group,Title,Description,Status,Priority,Assignee,Due Date,Created At\n";
    
    // Add data rows
    Object.keys(reportData).forEach(group => {
      reportData[group].forEach(task => {
        const row = [
          group,
          `"${task.title.replace(/"/g, '""')}"`,
          `"${task.description ? task.description.replace(/"/g, '""') : ''}"`,
          task.status,
          task.priority,
          task.assignee ? task.assignee.displayName : 'Unassigned',
          task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '',
          new Date(task.createdAt).toLocaleDateString()
        ].join(',');
        
        csvContent += row + "\n";
      });
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${currentProject.title} - Task Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center my-8">
        <div className="spinner"></div>
        <p className="ml-2">Loading report data...</p>
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {currentProject.title} - Reports
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Generate and export detailed task reports
          </p>
        </div>
      </div>
      
      {/* Report Configuration */}
      <div className="bg-white dark:bg-dark-800 p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-medium mb-4">Report Configuration</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Report Type
            </label>
            <select
              id="type"
              name="type"
              value={reportConfig.type}
              onChange={handleConfigChange}
              className="input-field"
            >
              <option value="taskList">Task List</option>
              <option value="summary">Status Summary</option>
              <option value="timeTracking">Time Tracking</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="groupBy" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Group By
            </label>
            <select
              id="groupBy"
              name="groupBy"
              value={reportConfig.groupBy}
              onChange={handleConfigChange}
              className="input-field"
            >
              <option value="none">No Grouping</option>
              <option value="status">Status</option>
              <option value="assignee">Assignee</option>
              <option value="priority">Priority</option>
              <option value="dueDate">Due Date</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sort By
            </label>
            <select
              id="sortBy"
              name="sortBy"
              value={reportConfig.sortBy}
              onChange={handleConfigChange}
              className="input-field"
            >
              <option value="createdAt">Created Date</option>
              <option value="title">Title</option>
              <option value="priority">Priority</option>
              <option value="dueDate">Due Date</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="sortDirection" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sort Direction
            </label>
            <select
              id="sortDirection"
              name="sortDirection"
              value={reportConfig.sortDirection}
              onChange={handleConfigChange}
              className="input-field"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>
        
        <h3 className="text-md font-medium mb-3">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label htmlFor="filters.status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              id="filters.status"
              name="filters.status"
              value={reportConfig.filters.status}
              onChange={handleConfigChange}
              className="input-field"
            >
              <option value="">All Statuses</option>
              {currentProject?.statuses?.map((status) => (
                <option key={status.name} value={status.name}>{status.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="filters.assignee" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Assignee
            </label>
            <select
              id="filters.assignee"
              name="filters.assignee"
              value={reportConfig.filters.assignee}
              onChange={handleConfigChange}
              className="input-field"
            >
              <option value="">All Assignees</option>
              <option value="unassigned">Unassigned</option>
              {currentProject?.members?.map((member) => (
                <option key={member._id} value={member._id}>{member.displayName}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="filters.priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Priority
            </label>
            <select
              id="filters.priority"
              name="filters.priority"
              value={reportConfig.filters.priority}
              onChange={handleConfigChange}
              className="input-field"
            >
              <option value="">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="filters.dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Due Date
            </label>
            <select
              id="filters.dueDate"
              name="filters.dueDate"
              value={reportConfig.filters.dueDate}
              onChange={handleConfigChange}
              className="input-field"
            >
              <option value="">All Due Dates</option>
              <option value="overdue">Overdue</option>
              <option value="today">Due Today</option>
              <option value="week">Due This Week</option>
              <option value="no-date">No Due Date</option>
            </select>
          </div>
          
          <div className="lg:col-span-2">
            <label htmlFor="filters.tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tags
            </label>
            <select
              id="filters.tags"
              name="filters.tags"
              multiple
              value={reportConfig.filters.tags}
              onChange={handleTagChange}
              className="input-field h-20"
            >
              {availableTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Hold Ctrl/Cmd to select multiple</p>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => setReportConfig({
              type: 'taskList',
              filters: {
                status: '',
                assignee: '',
                priority: '',
                dueDate: '',
                tags: []
              },
              groupBy: 'none',
              sortBy: 'createdAt',
              sortDirection: 'desc'
            })}
            className="px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={generateReport}
            disabled={isGenerating}
            className="btn-primary disabled:opacity-70"
          >
            {isGenerating ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>
      
      {/* Report Results */}
      {reportData && (
        <div className="bg-white dark:bg-dark-800 p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Report Results</h2>
            
            <button
              type="button"
              onClick={exportCSV}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
          </div>
          
          {Object.keys(reportData).length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No tasks match the selected filters
            </div>
          ) : (
            <div className="space-y-6">
              {Object.keys(reportData).map(group => (
                <div key={group} className="border dark:border-dark-700 rounded-lg overflow-hidden">
                  <div className="bg-gray-100 dark:bg-dark-700 px-4 py-3 font-medium">
                    {group} <span className="text-gray-500 dark:text-gray-400 text-sm">({reportData[group].length} tasks)</span>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-700">
                      <thead className="bg-gray-50 dark:bg-dark-800">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Title
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Priority
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Assignee
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Due Date
                          </th>
                          
                          {reportConfig.type === 'timeTracking' && (
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Time Logged
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-700">
                        {reportData[group].map(task => (
                          <tr key={task._id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{task.title}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                {task.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                task.priority === 'Low' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : task.priority === 'Medium'
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                    : task.priority === 'High'
                                      ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              }`}>
                                {task.priority}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {task.assignee ? (
                                <div className="flex items-center">
                                  <img
                                    src={task.assignee.photoURL || `https://ui-avatars.com/api/?name=${task.assignee.displayName}&background=random`}
                                    alt={task.assignee.displayName}
                                    className="w-6 h-6 rounded-full mr-2"
                                  />
                                  <div className="text-sm text-gray-900 dark:text-white">{task.assignee.displayName}</div>
                                </div>
                              ) : (
                                <div className="text-sm text-gray-500 dark:text-gray-400">Unassigned</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {task.dueDate ? (
                                <div className={`text-sm ${
                                  new Date(task.dueDate) < new Date() && task.status !== 'Done'
                                    ? 'text-red-600 dark:text-red-400'
                                    : 'text-gray-900 dark:text-white'
                                }`}>
                                  {new Date(task.dueDate).toLocaleDateString()}
                                </div>
                              ) : (
                                <div className="text-sm text-gray-500 dark:text-gray-400">None</div>
                              )}
                            </td>
                            
                            {reportConfig.type === 'timeTracking' && (
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900 dark:text-white">
                                  {task.timeTracking && task.timeTracking.logged ? (
                                    <>
                                      {Math.floor(task.timeTracking.logged / 60)}h {task.timeTracking.logged % 60}m
                                    </>
                                  ) : (
                                    <span className="text-gray-500 dark:text-gray-400">No time logged</span>
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}