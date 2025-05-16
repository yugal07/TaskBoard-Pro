import { useState, useEffect } from 'react';
import { useTasks } from '../contexts/TaskContext';
import { useProjects } from '../contexts/ProjectContext';
import { formatDistanceToNow } from 'date-fns';

export default function TaskDetailModal({ isOpen, onClose, taskId }) {
  const { tasks, updateTask, deleteTask } = useTasks();
  const { currentProject } = useProjects();
  const [task, setTask] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    status: '',
    dueDate: '',
    assignee: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Find the task when the component mounts or taskId changes
  useEffect(() => {
    if (taskId) {
      const foundTask = tasks.find(t => t._id === taskId);
      if (foundTask) {
        setTask(foundTask);
        setEditData({
          title: foundTask.title,
          description: foundTask.description || '',
          status: foundTask.status,
          dueDate: foundTask.dueDate ? new Date(foundTask.dueDate).toISOString().slice(0, 10) : '',
          assignee: foundTask.assignee?._id || '',
        });
      }
    }
  }, [taskId, tasks]);
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' (' + formatDistanceToNow(date, { addSuffix: true }) + ')';
  };
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!editData.title.trim()) {
      setError('Title is required');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError('');
      
      await updateTask(taskId, {
        title: editData.title,
        description: editData.description,
        status: editData.status,
        dueDate: editData.dueDate || null,
        assignee: editData.assignee || null,
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating task:', error);
      setError('Failed to update task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle task deletion
  const handleDelete = async () => {
    try {
      setIsSubmitting(true);
      await deleteTask(taskId);
      onClose();
    } catch (error) {
      console.error('Error deleting task:', error);
      setError('Failed to delete task. Please try again.');
      setIsSubmitting(false);
    }
  };
  
  if (!isOpen || !task) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b dark:border-dark-700">
          <h2 className="text-lg font-medium">
            {isEditing ? 'Edit Task' : 'Task Details'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 p-2 m-4 rounded-md">
            {error}
          </div>
        )}
        
        {isEditing ? (
          <form onSubmit={handleSubmit} className="p-4">
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={editData.title}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={editData.description}
                onChange={handleChange}
                className="input-field min-h-[100px]"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={editData.status}
                onChange={handleChange}
                className="input-field"
              >
                {currentProject?.statuses?.map((statusOption) => (
                  <option key={statusOption.name} value={statusOption.name}>
                    {statusOption.name}
                  </option>
                )) || (
                  <>
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </>
                )}
              </select>
            </div>
            
            <div className="mb-4">
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Due Date
              </label>
              <input
                type="date"
                id="dueDate"
                name="dueDate"
                value={editData.dueDate}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="assignee" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Assignee
              </label>
              <select
                id="assignee"
                name="assignee"
                value={editData.assignee}
                onChange={handleChange}
                className="input-field"
              >
                <option value="">Unassigned</option>
                {currentProject?.members?.map((member) => (
                  <option key={member._id} value={member._id}>
                    {member.displayName}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary disabled:opacity-70"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-4">
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Title</dt>
                <dd className="mt-1 text-gray-900 dark:text-white">{task.title}</dd>
              </div>
              
              {task.description && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</dt>
                  <dd className="mt-1 text-gray-900 dark:text-white whitespace-pre-line">{task.description}</dd>
                </div>
              )}
              
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
                <dd className="mt-1">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {task.status}
                  </span>
                </dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Assignee</dt>
                <dd className="mt-1 text-gray-900 dark:text-white">
                  {task.assignee ? (
                    <div className="flex items-center">
                      <img
                        src={task.assignee.photoURL || `https://ui-avatars.com/api/?name=${task.assignee.displayName}&background=random`}
                        alt={task.assignee.displayName}
                        className="w-6 h-6 rounded-full mr-2"
                      />
                      <span>{task.assignee.displayName}</span>
                    </div>
                  ) : (
                    'Unassigned'
                  )}
                </dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Due Date</dt>
                <dd className="mt-1 text-gray-900 dark:text-white">
                  {task.dueDate ? formatDate(task.dueDate) : 'Not set'}
                </dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Created By</dt>
                <dd className="mt-1 text-gray-900 dark:text-white">
                  {task.createdBy ? task.createdBy.displayName : 'Unknown'}
                </dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Created At</dt>
                <dd className="mt-1 text-gray-900 dark:text-white">
                  {formatDate(task.createdAt)}
                </dd>
              </div>
            </dl>
            
            <div className="mt-6 flex justify-between">
              <div>
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 border border-red-300 text-red-700 dark:border-red-800 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30"
                  >
                    Delete
                  </button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-red-600 dark:text-red-400">Are you sure?</span>
                    <button
                      onClick={handleDelete}
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-70"
                    >
                      {isSubmitting ? 'Deleting...' : 'Yes, Delete'}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-md text-gray-700 dark:text-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => setIsEditing(true)}
                className="btn-primary"
              >
                Edit Task
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}