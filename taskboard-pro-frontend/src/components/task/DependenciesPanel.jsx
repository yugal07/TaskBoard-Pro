import { useState, useEffect } from 'react';

export default function DependenciesPanel({ task, projectTasks, onUpdate, isLoading }) {
  const [dependencies, setDependencies] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState('');
  const [selectedType, setSelectedType] = useState('blocks');
  
  // Initialize dependencies
  useEffect(() => {
    if (task && task.dependencies) {
      setDependencies(task.dependencies);
    }
  }, [task]);
  
  // Filter available tasks - exclude those already in dependencies
  const availableTasks = projectTasks.filter(
    t => !dependencies.some(dep => dep.task._id === t._id || dep.task === t._id)
  );
  
  // Get dependency task object (populated) from ID if needed
  const getDependencyTask = (dependencyTask) => {
    if (typeof dependencyTask === 'string') {
      return projectTasks.find(t => t._id === dependencyTask) || { _id: dependencyTask, title: 'Unknown Task' };
    }
    return dependencyTask;
  };
  
  // Handle adding new dependency
  const handleAddDependency = () => {
    if (!selectedTask) return;
    
    const newDependency = {
      task: selectedTask,
      type: selectedType
    };
    
    const updatedDependencies = [...dependencies, newDependency];
    setDependencies(updatedDependencies);
    onUpdate(updatedDependencies);
    
    // Reset form
    setSelectedTask('');
    setSelectedType('blocks');
    setShowAddForm(false);
  };
  
  // Handle removing dependency
  const handleRemoveDependency = (index) => {
    const updatedDependencies = dependencies.filter((_, i) => i !== index);
    setDependencies(updatedDependencies);
    onUpdate(updatedDependencies);
  };
  
  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'Done':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'To Do':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };
  
  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-medium">Dependencies</h3>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary text-sm py-1.5"
            disabled={availableTasks.length === 0}
          >
            Add Dependency
          </button>
        )}
      </div>
      
      {/* Add dependency form */}
      {showAddForm && (
        <div className="mb-6 p-4 border border-gray-200 dark:border-dark-700 rounded-lg">
          <h4 className="font-medium mb-3">Add New Dependency</h4>
          
          <div className="mb-4">
            <label htmlFor="task" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Task
            </label>
            <select
              id="task"
              value={selectedTask}
              onChange={(e) => setSelectedTask(e.target.value)}
              className="input-field"
              required
            >
              <option value="">Select a task</option>
              {availableTasks.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Relationship Type
            </label>
            <div className="flex space-x-4 mt-1">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="blocks"
                  checked={selectedType === 'blocks'}
                  onChange={() => setSelectedType('blocks')}
                  className="h-4 w-4 text-primary-600 dark:text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="ml-2">
                  This task blocks selected task
                </span>
              </label>
              
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="blocked_by"
                  checked={selectedType === 'blocked_by'}
                  onChange={() => setSelectedType('blocked_by')}
                  className="h-4 w-4 text-primary-600 dark:text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="ml-2">
                  This task is blocked by selected task
                </span>
              </label>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddDependency}
              disabled={!selectedTask || isLoading}
              className="btn-primary disabled:opacity-70"
            >
              {isLoading ? 'Adding...' : 'Add Dependency'}
            </button>
          </div>
        </div>
      )}
      
      {/* Dependencies list */}
      {dependencies.length > 0 ? (
        <div className="space-y-3">
          {dependencies.map((dependency, index) => {
            const depTask = getDependencyTask(dependency.task);
            const isBlocks = dependency.type === 'blocks';
            
            return (
              <div 
                key={index} 
                className="p-3 border border-gray-200 dark:border-dark-700 rounded-lg flex justify-between items-center"
              >
                <div>
                  <div className="flex items-center">
                    {isBlocks ? (
                      <>
                        <span className="font-medium">{task.title}</span>
                        <svg className="w-5 h-5 mx-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                        </svg>
                        <span>{depTask.title}</span>
                      </>
                    ) : (
                      <>
                        <span>{depTask.title}</span>
                        <svg className="w-5 h-5 mx-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                        </svg>
                        <span className="font-medium">{task.title}</span>
                      </>
                    )}
                  </div>
                  <div className="mt-1 flex items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {isBlocks ? 'Blocks' : 'Blocked by'}
                    </span>
                    {depTask.status && (
                      <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${getStatusBadgeColor(depTask.status)}`}>
                        {depTask.status}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveDependency(index)}
                  disabled={isLoading}
                  className="p-1 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 rounded-full hover:bg-gray-100 dark:hover:bg-dark-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <p>No dependencies</p>
          <p className="text-sm mt-1">Add dependencies to define task relationships</p>
        </div>
      )}
    </div>
  );
}