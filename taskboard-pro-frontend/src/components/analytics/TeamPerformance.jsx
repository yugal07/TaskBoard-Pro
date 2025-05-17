import { useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { parseISO, format, subDays, differenceInDays } from 'date-fns';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function TeamPerformance({ tasks, members, timeRange = 30 }) {
  const [chartData, setChartData] = useState(null);
  const chartRef = useRef(null);
  
  useEffect(() => {
    // Debug the input props
    console.log('TeamPerformance - tasks:', tasks);
    console.log('TeamPerformance - members:', members);
    console.log('TeamPerformance - timeRange:', timeRange);
    
    if (!tasks || !members) {
      console.log('TeamPerformance - tasks or members is falsy, returning early');
      return;
    }
    
    if (members.length === 0) {
      console.log('TeamPerformance - members array is empty, returning early');
      return;
    }
    
    // Calculate member performance metrics
    const calculateMemberPerformance = () => {
      const endDate = new Date();
      const startDate = subDays(endDate, timeRange);
      console.log('TeamPerformance - date range:', { startDate, endDate });
      
      // Initialize data structure for each member
      const memberData = {};
      console.log('TeamPerformance - initializing memberData for each member');
      
      members.forEach((member, index) => {
        console.log(`TeamPerformance - processing member ${index}:`, member);
        
        // Debug member properties
        console.log(`Member ${index} object:`, member);
        
        // First, determine the member ID using different possible properties
        // This handles different API response formats
        const memberId = 
          member.id || 
          member._id || 
          (typeof member === 'string' ? member : null);
        
        if (!memberId) {
          console.warn(`TeamPerformance - Member without ID found, skipping:`, member);
          return;
        }
        
        // Now extract the member name from different possible properties
        // This handles different API response formats
        const memberName = 
          member.displayName || 
          member.name || 
          member.fullName || 
          `Team Member ${index + 1}`;
        
        // Extract photo URL with fallback
        const photoURL = 
          member.photoURL || 
          member.avatar || 
          member.profilePic || 
          `https://ui-avatars.com/api/?name=${encodeURIComponent(memberName)}&background=random`;
        
        memberData[memberId] = {
          name: memberName,
          photoURL,
          tasksCompleted: 0,
          tasksAssigned: 0,
          timeLogged: 0,
          avgCompletionTime: 0 // in days
        };
        
        console.log(`TeamPerformance - Added member to memberData:`, memberData[memberId]);
      });
      
      console.log('TeamPerformance - memberData after initialization:', memberData);
      
      // Filter tasks within the time range
      const filteredTasks = tasks.filter(task => {
        if (!task.createdAt) {
          console.log('TeamPerformance - Task missing createdAt, skipping:', task);
          return false;
        }
        
        const createdAt = parseISO(task.createdAt);
        return createdAt >= startDate && createdAt <= endDate;
      });
      
      console.log(`TeamPerformance - filtered ${filteredTasks.length} tasks in time range`);
      
      // Calculate metrics for each task
      filteredTasks.forEach((task, index) => {
        console.log(`TeamPerformance - processing task ${index}:`, task);
        
        // Skip if task has no assignee
        if (!task.assignee) {
          console.log(`TeamPerformance - task ${index} has no assignee, skipping`);
          return;
        }
        
        console.log(`TeamPerformance - task ${index} assignee:`, task.assignee);
        
        // Get the member ID using all possible property paths
        const memberId = 
          (task.assignee.id || task.assignee._id) || // If assignee is an object with id
          (typeof task.assignee === 'string' ? task.assignee : null); // If assignee is just the ID string
        
        console.log(`TeamPerformance - task ${index} determined memberId:`, memberId);
        
        // Skip if assignee is not in the project members list
        if (!memberData[memberId]) {
          console.log(`TeamPerformance - task ${index} assignee not in members, skipping`);
          return;
        }
        
        // Count assigned tasks
        memberData[memberId].tasksAssigned++;
        console.log(`TeamPerformance - incremented tasksAssigned for ${memberId}`);
        
        // Count completed tasks
        if (task.status === 'Done') {
          memberData[memberId].tasksCompleted++;
          console.log(`TeamPerformance - incremented tasksCompleted for ${memberId}`);
          
          // Calculate completion time if task has an updatedAt date
          if (task.updatedAt && task.createdAt) {
            const createdAt = parseISO(task.createdAt);
            const updatedAt = parseISO(task.updatedAt);
            const completionTime = differenceInDays(updatedAt, createdAt);
            
            // Add to running average calculation
            const currentAvg = memberData[memberId].avgCompletionTime;
            const currentCount = memberData[memberId].tasksCompleted - 1;
            
            const newAvg = currentCount === 0
              ? completionTime
              : (currentAvg * currentCount + completionTime) / (currentCount + 1);
            
            memberData[memberId].avgCompletionTime = newAvg;
            console.log(`TeamPerformance - updated avgCompletionTime for ${memberId}:`, newAvg);
          }
        }
        
        // Add time logged
        if (task.timeTracking && task.timeTracking.logged) {
          memberData[memberId].timeLogged += task.timeTracking.logged;
          console.log(`TeamPerformance - added ${task.timeTracking.logged} to timeLogged for ${memberId}`);
        }
      });
      
      console.log('TeamPerformance - final memberData:', memberData);
      return memberData;
    };
    
    const memberPerformance = calculateMemberPerformance();
    console.log('TeamPerformance - memberPerformance:', memberPerformance);
    
    // Check if we have any data to display
    if (Object.keys(memberPerformance).length === 0) {
      console.log('TeamPerformance - no member performance data to display');
      setChartData({
        labels: [],
        datasets: [
          {
            label: 'Tasks Completed',
            data: [],
            backgroundColor: 'rgba(75, 192, 192, 0.8)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          },
          {
            label: 'Tasks Assigned',
            data: [],
            backgroundColor: 'rgba(54, 162, 235, 0.8)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          }
        ],
        memberData: {},
        memberIds: []
      });
      return;
    }
    
    // Prepare data for chart
    const completedData = [];
    const assignedData = [];
    const labels = [];
    const memberIds = [];
    
    // Sort members by tasks completed
    console.log('TeamPerformance - preparing chart data');
    Object.keys(memberPerformance)
      .sort((a, b) => memberPerformance[b].tasksCompleted - memberPerformance[a].tasksCompleted)
      .forEach(memberId => {
        const member = memberPerformance[memberId];
        labels.push(member.name);
        completedData.push(member.tasksCompleted);
        assignedData.push(member.tasksAssigned);
        memberIds.push(memberId);
      });
    
    const chartDataObject = {
      labels,
      datasets: [
        {
          label: 'Tasks Completed',
          data: completedData,
          backgroundColor: 'rgba(75, 192, 192, 0.8)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        },
        {
          label: 'Tasks Assigned',
          data: assignedData,
          backgroundColor: 'rgba(54, 162, 235, 0.8)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }
      ],
      memberData: memberPerformance,
      memberIds
    };
    
    console.log('TeamPerformance - setting chartData:', chartDataObject);
    setChartData(chartDataObject);
  }, [tasks, members, timeRange]);

  // Cleanup chart instance on unmount
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, []);
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Team Performance'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Tasks'
        },
        ticks: {
          precision: 0
        }
      },
      x: {
        title: {
          display: true,
          text: 'Team Members'
        }
      }
    }
  };
  
  if (!chartData) {
    console.log('TeamPerformance - chartData is null, showing loading state');
    return (
      <div className="flex items-center justify-center h-60 bg-gray-100 dark:bg-dark-700 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">Loading team performance data...</p>
      </div>
    );
  }
  
  console.log('TeamPerformance - rendering with chartData:', chartData);
  
  // Format minutes to hours and minutes
  const formatTimeLogged = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };
  
  return (
    <div className="bg-white dark:bg-dark-800 p-4 rounded-lg shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-medium">Team Performance</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Team member productivity over the last {timeRange} days
        </p>
      </div>
      
      <div className="h-80 mb-6">
        <Bar 
          data={chartData} 
          options={chartOptions} 
          ref={chartRef}
        />
      </div>
      
      <div className="mt-6">
        <h4 className="text-md font-medium mb-3">Detailed Performance</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-700">
            <thead className="bg-gray-50 dark:bg-dark-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Team Member
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tasks Completed
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Completion Rate
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Avg. Completion Time
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Time Logged
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-700">
              {chartData.memberIds.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No team member data available
                  </td>
                </tr>
              ) : (
                chartData.memberIds.map(memberId => {
                  const memberStats = chartData.memberData[memberId];
                  console.log(`TeamPerformance - rendering row for member:`, memberStats);
                  
                  return (
                    <tr key={memberId}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img 
                            className="h-8 w-8 rounded-full mr-3" 
                            src={memberStats.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(memberStats.name || 'Unknown')}&background=random`} 
                            alt={memberStats.name || 'Unknown'} 
                          />
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {memberStats.name || 'Unknown'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {memberStats.tasksCompleted} / {memberStats.tasksAssigned}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {memberStats.tasksAssigned > 0 
                            ? `${Math.round((memberStats.tasksCompleted / memberStats.tasksAssigned) * 100)}%`
                            : '0%'
                          }
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {memberStats.avgCompletionTime > 0 
                            ? `${Math.round(memberStats.avgCompletionTime)} days`
                            : 'N/A'
                          }
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {memberStats.timeLogged > 0 
                            ? formatTimeLogged(memberStats.timeLogged)
                            : 'None'
                          }
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}