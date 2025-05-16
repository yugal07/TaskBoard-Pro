import { useState, useEffect, useRef } from 'react';
import { useTasks } from '../contexts/TaskContext';
import { useProjects } from '../contexts/ProjectContext';
import { formatDistanceToNow } from 'date-fns';
import AttachmentList from './task/AttachmentList';
import TimeTrackingPanel from './task/TimeTrackingPanel';
import DependenciesPanel from './task/DependenciesPanel';

export default function TaskDetailModal({ isOpen, onClose, taskId }) {
  const { tasks, updateTask, deleteTask, uploadAttachment, deleteAttachment, addTimeEntry } = useTasks();
  const { currentProject } = useProjects();
  const [task, setTask] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    status: '',
    priority: 'Medium',
    dueDate: '',
    assignee: '',
    tags: [],
  });
  const [newTag, setNewTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef(null);
  
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
          priority: foundTask.priority || 'Medium',
          dueDate: foundTask.dueDate ? new Date(foundTask.dueDate).toISOString().slice(0, 10) : '',
          assignee: foundTask.assignee?._id || '',
          tags: foundTask.tags || [],
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
  
  // Handle tag changes
  const handleAddTag = () => {
    if (newTag.trim() && !editData.tags.includes(newTag.trim())) {
      setEditData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };
  
  const handleRemoveTag = (tagToRemove) => {
    setEditData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };
  
  // Handle file upload trigger
  const handleFileUploadClick = () => {
    fileInputRef.current.click();
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
        priority: editData.priority,
        dueDate: editData.dueDate || null,
        assignee: editData.assignee || null,
        tags: editData.tags,
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
  
  // Handle file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      setIsSubmitting(true);
      setError('');
      
      await uploadAttachment(taskId, file);
      // The task will be updated automatically via the socket connection
      
    } catch (error) {
      console.error('Error uploading file:', error);
      setError('Failed to upload file. Please try again.');
    } finally {
      setIsSubmitting(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  if (!isOpen || !task) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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
        
        {/* Tab Navigation */}
        <div className="border-b dark:border-dark-700">
          <nav className="flex space-x-4 px-4">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-3 px-2 border-b-2 ${
                activeTab === 'details'
                  ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('attachments')}
              className={`py-3 px-2 border-b-2 ${
                activeTab === 'attachments'
                  ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Attachments
              {task.attachments?.length > 0 && (
                <span className="ml-1 bg-gray-100 text-gray-700 dark:bg-dark-700 dark:text-gray-300 px-1.5 py-0.5 rounded-full text-xs">
                  {task.attachments.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('time-tracking')}
              className={`py-3 px-2 border-b-2 ${
                activeTab === 'time-tracking'
                  ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Time Tracking
            </button>
            <button
              onClick={() => setActiveTab('dependencies')}
              className={`py-3 px-2 border-b-2 ${
                activeTab === 'dependencies'
                  ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Dependencies
              {task.dependencies?.length > 0 && (
                <span className="ml-1 bg-gray-100 text-gray-700 dark:bg-dark-700 dark:text-gray-300 px-1.5 py-0.5 rounded-full text-xs">
                  {task.dependencies.length}
                </span>
              )}
            </button>
          </nav>
        </div>
        
        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 p-2 m-4 rounded-md">
            {error}
          </div>
        )}
        
        {/* Task Details Tab */}
        {activeTab === 'details' && (
          isEditing ? (
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
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
                
                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Priority
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    value={editData.priority}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
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
                
                <div>
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
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {editData.tags.map((tag, index) => (
                    <div 
                      key={index}
                      className="inline-flex items-center bg-gray-100 dark:bg-dark-700 text-gray-800 dark:text-gray-200 rounded px-2 py-1"
                    >
                      <span className="text-sm">{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    className="input-field rounded-r-none"
                    placeholder="Add a tag"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-4 py-2 bg-gray-200 dark:bg-dark-600 text-gray-700 dark:text-gray-300 rounded-r-md"
                  >
                    Add
                  </button>
                </div>
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
                    <dd className="mt-1">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {task.status}
                      </span>
                    </dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Priority</dt>
                    <dd className="mt-1">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        task.priority === 'Low' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : task.priority === 'Medium'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : task.priority === 'High'
                              ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {task.priority || 'Medium'}
                      </span>
                    </dd>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>
                
                {task.tags && task.tags.length > 0 && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Tags</dt>
                    <dd className="mt-1">
                      <div className="flex flex-wrap gap-2">
                        {task.tags.map((tag, index) => (
                          <span 
                            key={index}
                            className="inline-block px-2 py-1 bg-gray-100 dark:bg-dark-700 text-gray-800 dark:text-gray-200 rounded text-sm"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </dd>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          )
        )}
        
        {/* Attachments Tab */}
        {activeTab === 'attachments' && (
          <div className="p-4">
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-lg font-medium">Attachments</h3>
              <button
                onClick={handleFileUploadClick}
                className="btn-primary text-sm py-1.5"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Uploading...' : 'Upload File'}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            
            <AttachmentList 
              attachments={task.attachments || []} 
              onDelete={(attachmentId) => deleteAttachment(taskId, attachmentId)}
              isLoading={isSubmitting}
            />
          </div>
        )}
        
        {/* Time Tracking Tab */}
        {activeTab === 'time-tracking' && (
          <div className="p-4">
            <TimeTrackingPanel
              task={task}
              onAddTimeEntry={(timeData) => addTimeEntry(taskId, timeData)}
              isLoading={isSubmitting}
            />
          </div>
        )}
        
        {/* Dependencies Tab */}
        {activeTab === 'dependencies' && (
          <div className="p-4">
            <DependenciesPanel
              task={task}
              projectTasks={tasks.filter(t => t._id !== taskId)}
              onUpdate={(dependencies) => updateTask(taskId, { ...task, dependencies })}
              isLoading={isSubmitting}
            />
          </div>
        )}
      </div>
    </div>
  );
}