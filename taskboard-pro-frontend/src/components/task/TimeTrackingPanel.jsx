import { useState } from 'react';

export default function TimeTrackingPanel({ task, onAddTimeEntry, isLoading }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    duration: '',
    description: '',
    startTime: null,
    endTime: null
  });
  const [trackingMode, setTrackingMode] = useState('manual'); // 'manual' or 'timer'
  const [timer, setTimer] = useState({
    isRunning: false,
    startTime: null,
    elapsed: 0,
    intervalId: null
  });
  
  // Calculate total logged time
  const totalLogged = task.timeTracking?.logged || 0;
  const totalLoggedFormatted = formatDuration(totalLogged);
  
  // Format estimated time
  const estimateFormatted = task.timeTracking?.estimate
    ? formatDuration(task.timeTracking.estimate)
    : 'Not set';
  
  // Format completion percentage
  const completionPercentage = 
    task.timeTracking?.estimate && task.timeTracking.logged
      ? Math.min(Math.round((task.timeTracking.logged / task.timeTracking.estimate) * 100), 100)
      : 0;
  
  // Format duration (minutes to hours/minutes)
  function formatDuration(minutes) {
    if (!minutes && minutes !== 0) return '0m';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
      return `${mins}m`;
    } else if (mins === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${mins}m`;
    }
  }
  
  // Format date for display
  const formatDate = (date) => {
    if (!date) return '';
    
    return new Date(date).toLocaleString();
  };
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Toggle time tracking mode
  const toggleTrackingMode = () => {
    // If timer is running, stop it first
    if (timer.isRunning) {
      stopTimer();
    }
    
    setTrackingMode(prev => prev === 'manual' ? 'timer' : 'manual');
  };
  
  // Start timer
  const startTimer = () => {
    const startTime = new Date();
    const intervalId = setInterval(() => {
      setTimer(prev => ({
        ...prev,
        elapsed: Math.floor((new Date() - startTime) / 1000 / 60)
      }));
    }, 1000);
    
    setTimer({
      isRunning: true,
      startTime,
      elapsed: 0,
      intervalId
    });
  };
  
  // Stop timer
  const stopTimer = () => {
    clearInterval(timer.intervalId);
    
    const endTime = new Date();
    const duration = Math.round((endTime - timer.startTime) / 1000 / 60);
    
    setFormData({
      duration: duration.toString(),
      description: formData.description,
      startTime: timer.startTime,
      endTime
    });
    
    setTimer({
      isRunning: false,
      startTime: null,
      elapsed: 0,
      intervalId: null
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate input
    if (!formData.duration || isNaN(parseInt(formData.duration)) || parseInt(formData.duration) <= 0) {
      alert('Please enter a valid duration');
      return;
    }
    
    try {
      await onAddTimeEntry({
        duration: parseInt(formData.duration),
        description: formData.description,
        startTime: formData.startTime,
        endTime: formData.endTime
      });
      
      // Reset form
      setFormData({
        duration: '',
        description: '',
        startTime: null,
        endTime: null
      });
      
      setShowForm(false);
    } catch (error) {
      console.error('Error adding time entry:', error);
    }
  };
  
  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-medium">Time Tracking</h3>
        {!showForm && !timer.isRunning && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary text-sm py-1.5"
          >
            Log Time
          </button>
        )}
      </div>
      
      {/* Time tracking summary */}
      <div className="bg-gray-50 dark:bg-dark-700 p-4 rounded-lg mb-4">
        <div className="flex justify-between mb-2">
          <div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Logged:</span>
            <span className="ml-2 text-lg font-bold">{totalLoggedFormatted}</span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Estimated:</span>
            <span className="ml-2">{estimateFormatted}</span>
          </div>
        </div>
        
        {task.timeTracking?.estimate > 0 && (
          <div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span>{totalLoggedFormatted}</span>
              <span>{completionPercentage}%</span>
              <span>{estimateFormatted}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-dark-600 rounded-full h-2">
              <div 
                className="bg-primary-600 dark:bg-primary-500 h-2 rounded-full" 
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
      
      {/* Timer */}
      {trackingMode === 'timer' && (
        <div className="mb-4 p-4 border border-gray-200 dark:border-dark-700 rounded-lg">
          <div className="text-center mb-4">
            <span className="text-2xl font-mono">
              {Math.floor(timer.elapsed / 60).toString().padStart(2, '0')}:
              {(timer.elapsed % 60).toString().padStart(2, '0')}
            </span>
          </div>
          
          {timer.isRunning ? (
            <button
              onClick={stopTimer}
              className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
              disabled={isLoading}
            >
              Stop Timer
            </button>
          ) : (
            <button
              onClick={startTimer}
              className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
              disabled={isLoading}
            >
              Start Timer
            </button>
          )}
        </div>
      )}
      
      {/* Time entry form */}
      {(showForm || (trackingMode === 'timer' && !timer.isRunning && formData.duration)) && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 border border-gray-200 dark:border-dark-700 rounded-lg">
          <div className="flex items-center justify-end mb-4">
            <div className="flex items-center">
              <span className="mr-2 text-sm text-gray-600 dark:text-gray-400">
                {trackingMode === 'manual' ? 'Manual Entry' : 'Timer Entry'}
              </span>
              <button
                type="button"
                onClick={toggleTrackingMode}
                className="w-12 h-6 rounded-full bg-gray-200 dark:bg-dark-600 flex items-center p-1 cursor-pointer"
              >
                <div className={`w-4 h-4 rounded-full bg-white transform duration-300 ease-in-out ${
                  trackingMode === 'timer' ? 'translate-x-6' : ''
                }`}></div>
              </button>
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Duration (minutes) *
            </label>
            <input
              type="number"
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              className="input-field"
              min="1"
              required
              disabled={trackingMode === 'timer'}
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="input-field"
              placeholder="What did you work on?"
              rows="2"
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setFormData({
                  duration: '',
                  description: '',
                  startTime: null,
                  endTime: null
                });
              }}
              className="px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary disabled:opacity-70"
            >
              {isLoading ? 'Saving...' : 'Log Time'}
            </button>
          </div>
        </form>
      )}
      
      {/* Time entries history */}
      {task.timeTracking?.history && task.timeTracking.history.length > 0 ? (
        <div>
          <h4 className="font-medium mb-2">Time Log History</h4>
          <div className="divide-y divide-gray-200 dark:divide-dark-700">
            {task.timeTracking.history.map((entry, index) => (
              <div key={index} className="py-3">
                <div className="flex justify-between">
                  <span className="font-medium">{formatDuration(entry.duration)}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(entry.startTime || entry.endTime || '')}
                  </span>
                </div>
                {entry.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {entry.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500 dark:text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>No time entries yet</p>
        </div>
      )}
    </div>
  );
}