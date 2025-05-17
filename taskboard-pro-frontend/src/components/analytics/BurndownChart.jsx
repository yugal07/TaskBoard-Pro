import { useState, useEffect, useRef } from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { format, addDays, differenceInDays, parseISO, isAfter, isBefore, startOfDay } from 'date-fns';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function BurndownChart({ tasks, projectStartDate, targetDate }) {
  const [chartData, setChartData] = useState(null);
  const chartRef = useRef(null);
  
  useEffect(() => {
    if (!tasks || !projectStartDate || !targetDate) return;
    
    // Calculate burndown data
    const generateBurndownData = () => {
      // Convert dates to Date objects if they're not already
      const startDate = typeof projectStartDate === 'string' ? parseISO(projectStartDate) : projectStartDate;
      const endDate = typeof targetDate === 'string' ? parseISO(targetDate) : targetDate;
      
      // Calculate total project duration in days
      const projectDuration = Math.max(1, differenceInDays(endDate, startDate));
      
      // Calculate total task count and points
      const totalTasks = tasks.length;
      
      // Generate ideal burndown line (straight line from total tasks to 0)
      const idealBurndown = [];
      const dailyIdealBurn = totalTasks / projectDuration;
      
      // Generate date labels and ideal burndown points
      const labels = [];
      for (let i = 0; i <= projectDuration; i++) {
        const date = addDays(startDate, i);
        labels.push(format(date, 'MMM d'));
        idealBurndown.push(Math.max(0, totalTasks - (dailyIdealBurn * i)));
      }
      
      // Calculate actual burndown based on task completion dates
      const actualBurndown = [];
      const today = startOfDay(new Date());
      
      // For each day in the project, count how many tasks were remaining
      for (let i = 0; i <= projectDuration; i++) {
        const currentDate = addDays(startDate, i);
        const isCurrentDateInPast = isBefore(currentDate, today);
        
        // If current date is in the future, stop actual burndown line
        if (!isCurrentDateInPast && actualBurndown.length > 0) {
          actualBurndown.push(actualBurndown[actualBurndown.length - 1]);
          continue;
        }
        
        // Count tasks that were not completed by this date
        const remainingTasks = tasks.filter(task => {
          // If task status is not "Done", count as remaining
          if (task.status !== 'Done') return true;
          
          // If task is done, check if it was completed after the current date
          if (task.updatedAt) {
            const completionDate = parseISO(task.updatedAt);
            return isAfter(completionDate, currentDate);
          }
          
          // Default case: task is incomplete
          return true;
        }).length;
        
        actualBurndown.push(remainingTasks);
      }
      
      return {
        labels,
        idealBurndown,
        actualBurndown,
        projectDuration
      };
    };
    
    const { labels, idealBurndown, actualBurndown } = generateBurndownData();
    
    // Create chart data
    setChartData({
      labels,
      datasets: [
        {
          label: 'Ideal Burndown',
          data: idealBurndown,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderDash: [5, 5],
          tension: 0,
          fill: false
        },
        {
          label: 'Actual Progress',
          data: actualBurndown,
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.1,
          fill: false
        }
      ]
    });
  }, [tasks, projectStartDate, targetDate]);
  
  // Cleanup chart on unmount to prevent "Canvas already in use" error
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
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Remaining Tasks'
        },
        ticks: {
          precision: 0
        }
      },
      x: {
        title: {
          display: true,
          text: 'Project Timeline'
        }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${Math.round(context.raw)} tasks remaining`;
          }
        }
      },
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Project Burndown Chart'
      }
    }
  };
  
  if (!chartData) {
    return (
      <div className="flex items-center justify-center h-60 bg-gray-100 dark:bg-dark-700 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">Loading chart data...</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-dark-800 p-4 rounded-lg shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-medium">Project Burndown Chart</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Tracks task completion progress over time compared to ideal pace
        </p>
      </div>
      
      <div className="h-80">
        <Line 
          data={chartData} 
          options={chartOptions} 
          ref={chartRef}
        />
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="bg-gray-50 dark:bg-dark-700 p-3 rounded-lg">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Start Date</p>
          <p className="text-lg font-medium">
            {typeof projectStartDate === 'string' 
              ? format(parseISO(projectStartDate), 'MMM d, yyyy')
              : format(projectStartDate, 'MMM d, yyyy')}
          </p>
        </div>
        
        <div className="bg-gray-50 dark:bg-dark-700 p-3 rounded-lg">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Target Date</p>
          <p className="text-lg font-medium">
            {typeof targetDate === 'string' 
              ? format(parseISO(targetDate), 'MMM d, yyyy')
              : format(targetDate, 'MMM d, yyyy')}
          </p>
        </div>
      </div>
      
      <div className="mt-4">
        <div className="flex items-center text-sm">
          <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
          <span>
            {chartData.datasets[1].data[chartData.datasets[1].data.length - 1] === 0
              ? 'Project completed successfully!'
              : chartData.datasets[1].data[chartData.datasets[1].data.length - 1] < idealBurndown[idealBurndown.length - 1]
                ? 'Project is ahead of schedule'
                : 'Project is behind schedule'}
          </span>
        </div>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {tasks.filter(task => task.status === 'Done').length} of {tasks.length} tasks completed
          ({Math.round((tasks.filter(task => task.status === 'Done').length / tasks.length) * 100)}%)
        </p>
      </div>
    </div>
  );
}