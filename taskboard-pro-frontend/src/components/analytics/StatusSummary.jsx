import { useState, useEffect } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { parseISO, isAfter, format } from 'date-fns';

export default function StatusSummary({ tasks, projectStatuses }) {
  const [summaryData, setSummaryData] = useState(null);
  
  useEffect(() => {
    if (!tasks || tasks.length === 0) return;
    
    // Calculate summary metrics
    const calculateSummary = () => {
      // Initialize counters
      const statusCounts = {};
      let overdueCount = 0;
      let completedCount = 0;
      let timeLoggedTotal = 0;
      let timeEstimateTotal = 0;
      
      // Count by status
      projectStatuses.forEach(status => {
        statusCounts[status.name] = 0;
      });
      
      // Process tasks
      tasks.forEach(task => {
        // Count by status
        statusCounts[task.status] = (statusCounts[task.status] || 0) + 1;
        
        // Check if overdue
        if (
          task.dueDate && 
          task.status !== 'Done' && 
          isAfter(new Date(), parseISO(task.dueDate))
        ) {
          overdueCount++;
        }
        
        // Count completed tasks
        if (task.status === 'Done') {
          completedCount++;
        }
        
        // Sum time tracked
        if (task.timeTracking) {
          if (task.timeTracking.logged) {
            timeLoggedTotal += task.timeTracking.logged;
          }
          
          if (task.timeTracking.estimate) {
            timeEstimateTotal += task.timeTracking.estimate;
          }
        }
      });
      
      // Calculate completion percentage
      const completionPercentage = tasks.length > 0 
        ? Math.round((completedCount / tasks.length) * 100) 
        : 0;
      
      // Calculate time tracking efficiency
      const timeTrackingEfficiency = timeEstimateTotal > 0 
        ? Math.round((timeLoggedTotal / timeEstimateTotal) * 100) 
        : 0;
      
      // Prepare chart data
      const chartData = {
        labels: Object.keys(statusCounts),
        datasets: [{
          data: Object.values(statusCounts),
          backgroundColor: [
            'rgba(54, 162, 235, 0.8)',   // To Do - Blue
            'rgba(255, 206, 86, 0.8)',   // In Progress - Yellow
            'rgba(75, 192, 192, 0.8)',   // Done - Green
            'rgba(153, 102, 255, 0.8)',  // Other status - Purple
            'rgba(255, 159, 64, 0.8)',   // Other status - Orange
            'rgba(199, 199, 199, 0.8)'   // Other status - Gray
          ],
          borderWidth: 1
        }]
      };
      
      return {
        totalTasks: tasks.length,
        completedTasks: completedCount,
        overdueTasks: overdueCount,
        statusCounts,
        completionPercentage,
        timeLoggedTotal,
        timeEstimateTotal,
        timeTrackingEfficiency,
        chartData
      };
    };
    
    setSummaryData(calculateSummary());
  }, [tasks, projectStatuses]);
  
  const chartOptions = {
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
  };
  
  // Format minutes to hours and minutes
  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };
  
  if (!summaryData) {
    return (
      <div className="flex items-center justify-center h-60 bg-gray-100 dark:bg-dark-700 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">Loading summary data...</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-dark-800 p-4 rounded-lg shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-medium">Project Status Summary</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Overview of current project health and progress
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Distribution Chart */}
        <div>
          <div className="h-64">
            <Doughnut data={summaryData.chartData} options={chartOptions} />
          </div>
        </div>
        
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-dark-700 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Completion</h4>
            <div className="mt-2 flex items-baseline">
              <p className="text-3xl font-semibold text-gray-900 dark:text-white">
                {summaryData.completionPercentage}%
              </p>
              <p className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                {summaryData.completedTasks} of {summaryData.totalTasks}
              </p>
            </div>
            <div className="mt-2 w-full bg-gray-200 dark:bg-dark-600 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full" 
                style={{ width: `${summaryData.completionPercentage}%` }}
              ></div>
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-dark-700 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Overdue</h4>
            <div className="mt-2 flex items-baseline">
              <p className={`text-3xl font-semibold ${
                summaryData.overdueTasks > 0 ? 'text-red-500' : 'text-green-500'
              }`}>
                {summaryData.overdueTasks}
              </p>
              <p className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                tasks
              </p>
            </div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {summaryData.overdueTasks === 0 
                ? 'No overdue tasks' 
                : `${Math.round((summaryData.overdueTasks / summaryData.totalTasks) * 100)}% of all tasks`
              }
            </p>
          </div>
          
          <div className="bg-gray-50 dark:bg-dark-700 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Time Logged</h4>
            <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
              {formatTime(summaryData.timeLoggedTotal)}
            </p>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {summaryData.timeEstimateTotal > 0 
                ? `vs ${formatTime(summaryData.timeEstimateTotal)} estimated` 
                : 'No estimates provided'
              }
            </p>
          </div>
          
          <div className="bg-gray-50 dark:bg-dark-700 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Time Efficiency</h4>
            <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
              {summaryData.timeTrackingEfficiency}%
            </p>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {summaryData.timeTrackingEfficiency < 100 
                ? 'Under estimated time' 
                : summaryData.timeTrackingEfficiency > 100
                  ? 'Over estimated time'
                  : 'On target'
              }
            </p>
          </div>
        </div>
      </div>
      
      {/* Status Breakdown */}
      <div className="mt-8">
        <h4 className="text-md font-medium mb-3">Status Breakdown</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(summaryData.statusCounts).map(([status, count]) => (
            <div key={status} className="bg-gray-50 dark:bg-dark-700 p-3 rounded-lg">
              <div className="flex justify-between items-start">
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {status}
                </span>
                <span className="text-2xl font-semibold text-gray-900 dark:text-white">{count}</span>
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {Math.round((count / summaryData.totalTasks) * 100)}% of total
              </p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Health Assessment */}
      <div className="mt-8">
        <h4 className="text-md font-medium mb-3">Health Assessment</h4>
        <div className="bg-gray-50 dark:bg-dark-700 p-4 rounded-lg">
          {summaryData.completionPercentage >= 90 ? (
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800 dark:text-green-300">Excellent Progress</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Project is almost complete and on track for successful delivery.
                </p>
              </div>
            </div>
          ) : summaryData.completionPercentage >= 60 ? (
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">Good Progress</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Project is moving forward at a steady pace.
                </p>
              </div>
            </div>
          ) : summaryData.completionPercentage >= 30 ? (
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Moderate Progress</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Project is moving, but may need additional focus.
                  {summaryData.overdueTasks > 0 && ' Consider addressing overdue tasks.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Needs Attention</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Project progress is slow. Consider reviewing priorities and resource allocation.
                  {summaryData.overdueTasks > 0 && ' Address overdue tasks as soon as possible.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Recommendations Section */}
      <div className="mt-8">
        <h4 className="text-md font-medium mb-3">Recommendations</h4>
        <div className="bg-gray-50 dark:bg-dark-700 p-4 rounded-lg">
          <ul className="space-y-2">
            {summaryData.overdueTasks > 0 && (
              <li className="flex items-start">
                <span className="flex-shrink-0 h-5 w-5 text-red-500">•</span>
                <span className="ml-2">Address {summaryData.overdueTasks} overdue task{summaryData.overdueTasks > 1 ? 's' : ''} to prevent project delays.</span>
              </li>
            )}
            
            {summaryData.timeTrackingEfficiency > 120 && (
              <li className="flex items-start">
                <span className="flex-shrink-0 h-5 w-5 text-yellow-500">•</span>
                <span className="ml-2">Review time estimates as actual time spent exceeds estimates by {summaryData.timeTrackingEfficiency - 100}%.</span>
              </li>
            )}
            
            {summaryData.statusCounts['To Do'] > summaryData.totalTasks * 0.6 && (
              <li className="flex items-start">
                <span className="flex-shrink-0 h-5 w-5 text-blue-500">•</span>
                <span className="ml-2">Start working on more tasks. {summaryData.statusCounts['To Do']} tasks ({Math.round((summaryData.statusCounts['To Do'] / summaryData.totalTasks) * 100)}%) remain in "To Do" status.</span>
              </li>
            )}
            
            {summaryData.completionPercentage < 20 && summaryData.totalTasks > 5 && (
              <li className="flex items-start">
                <span className="flex-shrink-0 h-5 w-5 text-blue-500">•</span>
                <span className="ml-2">Focus on completing a few tasks to build momentum.</span>
              </li>
            )}
            
            {Object.values(summaryData.statusCounts).every(count => count === 0 || count < 2) && (
              <li className="flex items-start">
                <span className="flex-shrink-0 h-5 w-5 text-green-500">•</span>
                <span className="ml-2">Project is well-balanced across all statuses.</span>
              </li>
            )}
            
            {(!summaryData.overdueTasks && summaryData.completionPercentage > 50) && (
              <li className="flex items-start">
                <span className="flex-shrink-0 h-5 w-5 text-green-500">•</span>
                <span className="ml-2">Project is on track with no overdue tasks. Continue the good momentum.</span>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}