import { useState, useEffect } from 'react';
import { useTasks } from '../contexts/TaskContext';
import { useProjects } from '../contexts/ProjectContext';

export default function TaskBoard() {
  const { tasks, loading, moveTask } = useTasks();
  const { currentProject } = useProjects();
  const [groupedTasks, setGroupedTasks] = useState({});
  
  // Group tasks by status
  useEffect(() => {
    if (!tasks.length) return;
    
    const grouped = {};
    
    // Initialize groups based on project statuses
    if (currentProject && currentProject.statuses) {
      currentProject.statuses.forEach(status => {
        grouped[status.name] = [];
      });
    } else {
      // Default statuses
      grouped['To Do'] = [];
      grouped['In Progress'] = [];
      grouped['Done'] = [];
    }
    
    // Group tasks by status
    tasks.forEach(task => {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      } else {
        // Handle tasks with statuses that no longer exist in the project
        if (!grouped['Other']) {
          grouped['Other'] = [];
        }
        grouped['Other'].push(task);
      }
    });
    
    setGroupedTasks(grouped);
  }, [tasks, currentProject]);
  
  // Handle drag start
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('taskId', taskId);
  };
  
  // Handle drag over
  const handleDragOver = (e) => {
    e.preventDefault();
  };
  
  // Handle drop
  const handleDrop = async (e, status) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    
    try {
      await moveTask(taskId, status);
      // No need to update state manually, the socket will handle it
    } catch (error) {
      console.error('Error moving task:', error);
      // Handle error (show toast, etc.)
    }
  };
  
  if (loading) {
    return <div className="flex justify-center my-8">Loading tasks...</div>;
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Object.keys(groupedTasks).map((status) => (
        <div
          key={status}
          className="bg-white dark:bg-dark-800 rounded-lg shadow-md"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, status)}
        >
          <div className="bg-gray-100 dark:bg-dark-700 p-3 rounded-t-lg border-b dark:border-dark-600">
            <h3 className="font-medium">
              {status} ({groupedTasks[status].length})
            </h3>
          </div>
          
          <div className="p-3 min-h-[200px]">
            {groupedTasks[status].length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center text-sm mt-4">
                No tasks in this status
              </p>
            ) : (
              // Continuing the TaskBoard.jsx component
              <ul className="space-y-2">
                {groupedTasks[status].map((task) => (
                  <li
                    key={task._id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task._id)}
                    className="bg-gray-50 dark:bg-dark-700 p-3 rounded-md border border-gray-200 dark:border-dark-600 cursor-grab hover:shadow-sm transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-sm">{task.title}</h4>
                      {task.dueDate && (
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          new Date(task.dueDate) < new Date() 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        }`}>
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    
                    {task.assignee && (
                      <div className="mt-2 flex items-center">
                        <img
                          src={task.assignee.photoURL || `https://ui-avatars.com/api/?name=${task.assignee.displayName}&background=random`}
                          alt={task.assignee.displayName}
                          className="w-5 h-5 rounded-full mr-1"
                        />
                        <span className="text-xs text-gray-600 dark:text-gray-300">
                          {task.assignee.displayName}
                        </span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div className="p-3 border-t dark:border-dark-600">
            <button 
              className="w-full py-1 bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 rounded-md text-sm text-gray-600 dark:text-gray-300 transition-colors"
            >
              + Add Task
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}