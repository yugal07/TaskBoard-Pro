import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useProjects } from '../contexts/ProjectContext';
import { useTasks } from '../contexts/TaskContext';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement,
  PointElement,
  LineElement,
  TimeScale
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { formatDistanceToNow, format, subDays, isAfter, isBefore, parseISO } from 'date-fns';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  TimeScale
);

export default function ProjectAnalytics() {
  const { projectId } = useParams();
  const { currentProject } = useProjects();
  const { allTasks, loading } = useTasks();
  const [reportType, setReportType] = useState('status');
  const [timeRange, setTimeRange] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: subDays(new Date(), 30),
    end: new Date()
  });
  const [isExporting, setIsExporting] = useState(false);
  
  // Filter tasks based on time range
  const getFilteredTasks = () => {
    if (timeRange === 'all') return allTasks;
    
    const now = new Date();
    let startDate;
    
    switch(timeRange) {
      case 'week':
        startDate = subDays(now, 7);
        break;
      case 'month':
        startDate = subDays(now, 30);
        break;
      case 'quarter':
        startDate = subDays(now, 90);
        break;
      case 'custom':
        startDate = dateRange.start;
        break;
      default:
        return allTasks;
    }
    
    return allTasks.filter(task => {
      const taskDate = parseISO(task.createdAt);
      return isAfter(taskDate, startDate) && (timeRange === 'custom' ? isBefore(taskDate, dateRange.end) : true);
    });
  };
  
  // Prepare data for status distribution chart
  const prepareStatusChartData = () => {
    const filteredTasks = getFilteredTasks();
    const statusCounts = {};
    
    // Count tasks by status
    filteredTasks.forEach(task => {
      statusCounts[task.status] = (statusCounts[task.status] || 0) + 1;
    });
    
    // Generate colors for each status
    const statusColors = {
      'To Do': 'rgba(54, 162, 235, 0.8)',
      'In Progress': 'rgba(255, 206, 86, 0.8)',
      'Done': 'rgba(75, 192, 192, 0.8)'
    };
    
    // Add colors for custom statuses
    Object.keys(statusCounts).forEach(status => {
      if (!statusColors[status]) {
        // Generate a random color for statuses not in the default mapping
        statusColors[status] = `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.8)`;
      }
    });
    
    return {
      labels: Object.keys(statusCounts),
      datasets: [{
        label: 'Tasks by Status',
        data: Object.values(statusCounts),
        backgroundColor: Object.keys(statusCounts).map(status => statusColors[status]),
        borderWidth: 1
      }]
    };
  };
  
  // Prepare data for assignee distribution chart
  const prepareAssigneeChartData = () => {
    const filteredTasks = getFilteredTasks();
    const assigneeCounts = {};
    
    // Count tasks by assignee
    filteredTasks.forEach(task => {
      const assigneeName = task.assignee ? task.assignee.displayName : 'Unassigned';
      assigneeCounts[assigneeName] = (assigneeCounts[assigneeName] || 0) + 1;
    });
    
    return {
      labels: Object.keys(assigneeCounts),
      datasets: [{
        label: 'Tasks by Assignee',
        data: Object.values(assigneeCounts),
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 159, 64, 0.8)',
          'rgba(199, 199, 199, 0.8)'
        ],
        borderWidth: 1
      }]
    };
  };
  
  // Prepare data for priority distribution chart
  const preparePriorityChartData = () => {
    const filteredTasks = getFilteredTasks();
    const priorityCounts = {
      'Low': 0,
      'Medium': 0,
      'High': 0,
      'Urgent': 0
    };
    
    // Count tasks by priority
    filteredTasks.forEach(task => {
      priorityCounts[task.priority] = (priorityCounts[task.priority] || 0) + 1;
    });
    
    return {
      labels: Object.keys(priorityCounts),
      datasets: [{
        label: 'Tasks by Priority',
        data: Object.values(priorityCounts),
        backgroundColor: [
          'rgba(75, 192, 192, 0.8)', // Low - Green
          'rgba(54, 162, 235, 0.8)', // Medium - Blue
          'rgba(255, 159, 64, 0.8)', // High - Orange
          'rgba(255, 99, 132, 0.8)'  // Urgent - Red
        ],
        borderWidth: 1
      }]
    };
  };
  
  // Prepare data for task completion trend chart
  const prepareCompletionTrendData = () => {
    const filteredTasks = getFilteredTasks();
    const completedTasks = filteredTasks.filter(task => task.status === 'Done');
    
    // Group by date
    const dateGroups = {};
    const today = new Date();
    
    // Initialize with last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      dateGroups[dateStr] = 0;
    }
    
    // Count completed tasks by date
    completedTasks.forEach(task => {
      const updatedAt = parseISO(task.updatedAt);
      const dateStr = format(updatedAt, 'yyyy-MM-dd');
      
      if (dateGroups[dateStr] !== undefined) {
        dateGroups[dateStr] += 1;
      }
    });
    
    return {
      labels: Object.keys(dateGroups).map(dateStr => format(parseISO(dateStr), 'MMM dd')),
      datasets: [{
        label: 'Completed Tasks',
        data: Object.values(dateGroups),
        fill: false,
        borderColor: 'rgba(75, 192, 192, 1)',
        tension: 0.1
      }]
    };
  };
  
  // Handle exporting report as PDF or CSV
  const handleExport = (format) => {
    setIsExporting(true);
    
    // In a real implementation, you would use a library like jsPDF or html2canvas
    // to generate a PDF, or build a CSV file from your data
    
    setTimeout(() => {
      alert(`Exporting ${reportType} report as ${format}. This is a placeholder. In a real app, this would download a file.`);
      setIsExporting(false);
    }, 1000);
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
        <div className="flex space-x-2">
          <div className="dropdown relative">
            <button className="btn-primary flex items-center">
              Export Report
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="dropdown-menu absolute right-0 mt-2 bg-white dark:bg-dark-800 rounded-md shadow-lg overflow-hidden z-10 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-opacity duration-300">
              <button 
                className="px-4 py-2 w-full text-left hover:bg-gray-100 dark:hover:bg-dark-700"
                onClick={() => handleExport('pdf')}
                disabled={isExporting}
              >
                Export as PDF
              </button>
              <button 
                className="px-4 py-2 w-full text-left hover:bg-gray-100 dark:hover:bg-dark-700"
                onClick={() => handleExport('csv')}
                disabled={isExporting}
              >
                Export as CSV
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Report Controls */}
      <div className="bg-white dark:bg-dark-800 p-4 rounded-lg shadow-sm flex flex-wrap gap-4">
        <div className="w-full md:w-auto">
          <label htmlFor="reportType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Report Type
          </label>
          <select
            id="reportType"
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="input-field"
          >
            <option value="status">Status Distribution</option>
            <option value="assignee">Assignee Distribution</option>
            <option value="priority">Priority Distribution</option>
            <option value="completion">Completion Trend</option>
          </select>
        </div>
        
        <div className="w-full md:w-auto">
          <label htmlFor="timeRange" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Time Range
          </label>
          <select
            id="timeRange"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="input-field"
          >
            <option value="all">All Time</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="quarter">Last 90 Days</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
        
        {timeRange === 'custom' && (
          <>
            <div className="w-full md:w-auto">
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={dateRange.start.toISOString().slice(0, 10)}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: new Date(e.target.value) }))}
                className="input-field"
              />
            </div>
            <div className="w-full md:w-auto">
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={dateRange.end.toISOString().slice(0, 10)}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: new Date(e.target.value) }))}
                className="input-field"
              />
            </div>
          </>
        )}
      </div>
      
      {/* Charts */}
      <div className="bg-white dark:bg-dark-800 p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-medium mb-6">
          {reportType === 'status' && 'Task Status Distribution'}
          {reportType === 'assignee' && 'Task Assignee Distribution'}
          {reportType === 'priority' && 'Task Priority Distribution'}
          {reportType === 'completion' && 'Task Completion Trend'}
        </h2>
        
        <div className="h-80">
          {reportType === 'status' && (
            <Pie 
              data={prepareStatusChartData()} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right',
                  },
                  title: {
                    display: true,
                    text: 'Tasks by Status'
                  }
                }
              }}
            />
          )}
          
          {reportType === 'assignee' && (
            <Bar 
              data={prepareAssigneeChartData()} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                  title: {
                    display: true,
                    text: 'Tasks by Assignee'
                  }
                }
              }}
            />
          )}
          
          {reportType === 'priority' && (
            <Pie 
              data={preparePriorityChartData()} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right',
                  },
                  title: {
                    display: true,
                    text: 'Tasks by Priority'
                  }
                }
              }}
            />
          )}
          
          {reportType === 'completion' && (
            <Line 
              data={prepareCompletionTrendData()} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                  title: {
                    display: true,
                    text: 'Task Completion Trend (Last 7 Days)'
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      precision: 0
                    }
                  }
                }
              }}
            />
          )}
        </div>
      </div>
      
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-dark-800 p-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Tasks</h3>
          <p className="text-3xl font-bold mt-1">{getFilteredTasks().length}</p>
        </div>
        
        <div className="bg-white dark:bg-dark-800 p-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed Tasks</h3>
          <p className="text-3xl font-bold mt-1 text-green-600 dark:text-green-400">
            {getFilteredTasks().filter(task => task.status === 'Done').length}
          </p>
        </div>
        
        <div className="bg-white dark:bg-dark-800 p-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Overdue Tasks</h3>
          <p className="text-3xl font-bold mt-1 text-red-600 dark:text-red-400">
            {getFilteredTasks().filter(task => 
              task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Done'
            ).length}
          </p>
        </div>
        
        <div className="bg-white dark:bg-dark-800 p-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Completion Rate</h3>
          <p className="text-3xl font-bold mt-1">
            {getFilteredTasks().length > 0 
              ? Math.round((getFilteredTasks().filter(task => task.status === 'Done').length / getFilteredTasks().length) * 100)
              : 0}%
          </p>
        </div>
      </div>
    </div>
  );
}