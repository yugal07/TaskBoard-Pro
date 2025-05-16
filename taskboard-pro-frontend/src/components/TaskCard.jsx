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
  
  return (
    <div className="p-3">
      <div className="flex justify-between items-start">
        <h4 className="font-medium text-sm text-gray-800 dark:text-gray-200">
          {task.title}
        </h4>
      </div>
      
      {task.description && (
        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
          {task.description}
        </p>
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
        
        {task.dueDate && (
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            isOverdue 
              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
              : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
          }`}>
            {formatDueDate(task.dueDate)}
          </span>
        )}
      </div>
    </div>
  );
}