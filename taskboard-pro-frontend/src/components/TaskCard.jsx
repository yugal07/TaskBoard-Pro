import { formatDistanceToNow } from 'date-fns';

export default function TaskCard({ task }) {
  // Calculate if task is overdue
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
  
  // Format due date
  const formatDueDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  // Priority color mapping
  const priorityColors = {
    Low: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-800 dark:text-green-200'
    },
    Medium: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-800 dark:text-blue-200'
    },
    High: {
      bg: 'bg-orange-100 dark:bg-orange-900/30',
      text: 'text-orange-800 dark:text-orange-200'
    },
    Urgent: {
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-800 dark:text-red-200'
    }
  };

  const priorityColor = priorityColors[task.priority] || priorityColors.Medium;
  
  return (
    <div className="p-3">
      <div className="flex justify-between items-start">
        <h4 className="font-medium text-sm text-gray-800 dark:text-gray-200">
          {task.title}
        </h4>
        <span className={`px-2 py-0.5 text-xs rounded-full ${priorityColor.bg} ${priorityColor.text}`}>
          {task.priority || 'Medium'}
        </span>
      </div>
      
      {task.description && (
        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
          {task.description}
        </p>
      )}
      
      {task.tags && task.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {task.tags.map((tag, index) => (
            <span 
              key={index}
              className="inline-block px-2 py-0.5 bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 rounded text-xs"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      
      <div className="mt-3 flex flex-wrap items-center justify-between">
        {task.assignee && (
          <div className="flex items-center mr-2">
            <img
              src={task.assignee.photoURL || `https://ui-avatars.com/api/?name=${task.assignee.displayName}&background=random`}
              alt={task.assignee.displayName}
              className="w-5 h-5 rounded-full mr-1"
            />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {task.assignee.displayName.split(' ')[0]}
            </span>
          </div>
        )}
        
        <div className="flex items-center">
          {task.dueDate && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              isOverdue 
                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
            }`}>
              {formatDueDate(task.dueDate)}
            </span>
          )}
          
          {task.attachments && task.attachments.length > 0 && (
            <span className="ml-2 text-gray-500 dark:text-gray-400 flex items-center">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <span className="ml-0.5 text-xs">{task.attachments.length}</span>
            </span>
          )}
          
          {task.timeTracking && task.timeTracking.logged > 0 && (
            <span className="ml-2 text-gray-500 dark:text-gray-400 flex items-center">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="ml-0.5 text-xs">
                {Math.floor(task.timeTracking.logged / 60)}h {task.timeTracking.logged % 60}m
              </span>
            </span>
          )}
        </div>
      </div>
      
      {task.dependencies && task.dependencies.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-dark-700">
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
            <span className="mr-1">Dependencies:</span>
            <span className="text-gray-700 dark:text-gray-300">
              {task.dependencies.length} {task.dependencies.length === 1 ? 'task' : 'tasks'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}