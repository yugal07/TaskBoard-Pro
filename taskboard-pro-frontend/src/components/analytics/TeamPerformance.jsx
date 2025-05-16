import { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { parseISO, format, subDays, differenceInDays } from 'date-fns';

export default function TeamPerformance({ tasks, members, timeRange = 30 }) {
  const [chartData, setChartData] = useState(null);
  
  useEffect(() => {
    if (!tasks || !members || members.length === 0) return;
    
    // Calculate member performance metrics
    const calculateMemberPerformance = () => {
      const endDate = new Date();
      const startDate = subDays(endDate, timeRange);
      
      // Initialize data structure for each member
      const memberData = {};
      members.forEach(member => {
        memberData[member._id] = {
          name: member.displayName,
          photoURL: member.photoURL,
          tasksCompleted: 0,
          tasksAssigned: 0,
          timeLogged: 0,
          avgCompletionTime: 0 // in days
        };
      });
      
      // Filter tasks within the time range
      const filteredTasks = tasks.filter(task => {
        const createdAt = parseISO(task.createdAt);
        return createdAt >= startDate && createdAt <= endDate;
      });
      
      // Calculate metrics for each task
      filteredTasks.forEach(task => {
        // Skip if task has no assignee
        if (!task.assignee) return;
        
        const memberId = task.assignee._id;
        // Skip if assignee is not in the project members list
        if (!memberData[memberId]) return;
        
        // Count assigned tasks
        memberData[memberId].tasksAssigned++;
        
        // Count completed tasks
        if (task.status === 'Done') {
          memberData[memberId].tasksCompleted++;
          
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
          }
        }
        
        // Add time logged
        if (task.timeTracking && task.timeTracking.logged) {
          memberData[memberId].timeLogged += task.timeTracking.logged;
        }
      });
      
      return memberData;
    };
    
    const memberPerformance = calculateMemberPerformance();
    
    // Prepare data for chart
    const completedData = [];
    const assignedData = [];
    const labels = [];
    const memberIds = [];
    
    // Sort members by tasks completed
    Object.keys(memberPerformance)
      .sort((a, b) => memberPerformance[b].tasksCompleted - memberPerformance[a].tasksCompleted)
      .forEach(memberId => {
        const member = memberPerformance[memberId];
        labels.push(member.name);
        completedData.push(member.tasksCompleted);
        assignedData.push(member.tasksAssigned);
        memberIds.push(memberId);
      });
    
    setChartData({
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
    });
  }, [tasks, members, timeRange]);
  
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
    return (
      <div className="flex items-center justify-center h-60 bg-gray-100 dark:bg-dark-700 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">Loading team performance data...</p>
      </div>
    );
  }
  
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
        <Bar data={chartData} options={chartOptions} />
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
              {chartData.memberIds.map(memberId => {
                const memberStats = chartData.memberData[memberId];
                return (
                  <tr key={memberId}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img 
                          className="h-8 w-8 rounded-full mr-3" 
                          src={memberStats.photoURL || `https://ui-avatars.com/api/?name=${memberStats.name}&background=random`} 
                          alt={memberStats.name} 
                        />
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {memberStats.name}
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
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}