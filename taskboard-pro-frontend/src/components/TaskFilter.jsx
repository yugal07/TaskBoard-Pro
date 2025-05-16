import { useState, useEffect } from 'react';
import { useProjects } from '../contexts/ProjectContext';

export default function TaskFilter({ onFilterChange }) {
  const { currentProject } = useProjects();
  const [filters, setFilters] = useState({
    assignee: '',
    status: '',
    dueDate: '',
    priority: '',
    tags: [],
    search: ''
  });
  
  // Keep track of available tags from tasks
  const [availableTags, setAvailableTags] = useState([]);
  
  // Extract all tags from tasks in the current project
  useEffect(() => {
    if (!currentProject || !currentProject.tasks) return;
    
    // Collect all unique tags
    const tagSet = new Set();
    currentProject.tasks.forEach(task => {
      if (task.tags && Array.isArray(task.tags)) {
        task.tags.forEach(tag => tagSet.add(tag));
      }
    });
    
    setAvailableTags(Array.from(tagSet).sort());
  }, [currentProject]);
  
  // Handle filter changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    const newFilters = {
      ...filters,
      [name]: value
    };
    
    setFilters(newFilters);
    onFilterChange(newFilters);
  };
  
  // Handle tag selection
  const handleTagChange = (e) => {
    const selectedTags = Array.from(e.target.selectedOptions, option => option.value);
    
    const newFilters = {
      ...filters,
      tags: selectedTags
    };
    
    setFilters(newFilters);
    onFilterChange(newFilters);
  };
  
  // Clear all filters
  const clearFilters = () => {
    const resetFilters = {
      assignee: '',
      status: '',
      dueDate: '',
      priority: '',
      tags: [],
      search: ''
    };
    
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  // Handle search input
  const handleSearch = (e) => {
    const value = e.target.value;
    
    const newFilters = {
      ...filters,
      search: value
    };
    
    setFilters(newFilters);
    onFilterChange(newFilters);
  };
  
  return (
    <div className="bg-white dark:bg-dark-800 p-4 rounded-lg shadow-sm mb-6 border border-gray-200 dark:border-dark-700">
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            className="input-field pl-10"
            placeholder="Search tasks..."
            value={filters.search}
            onChange={handleSearch}
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={filters.status}
            onChange={handleChange}
            className="input-field"
          >
            <option value="">All Statuses</option>
            {currentProject?.statuses?.map((status) => (
              <option key={status.name} value={status.name}>{status.name}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="assignee" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Assignee
          </label>
          <select
            id="assignee"
            name="assignee"
            value={filters.assignee}
            onChange={handleChange}
            className="input-field"
          >
            <option value="">All Assignees</option>
            <option value="unassigned">Unassigned</option>
            {currentProject?.members?.map((member) => (
              <option key={member._id} value={member._id}>{member.displayName}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Due Date
          </label>
          <select
            id="dueDate"
            name="dueDate"
            value={filters.dueDate}
            onChange={handleChange}
            className="input-field"
          >
            <option value="">All Due Dates</option>
            <option value="overdue">Overdue</option>
            <option value="today">Due Today</option>
            <option value="this-week">Due This Week</option>
            <option value="next-week">Due Next Week</option>
            <option value="later">Due Later</option>
            <option value="no-date">No Due Date</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Priority
          </label>
          <select
            id="priority"
            name="priority"
            value={filters.priority}
            onChange={handleChange}
            className="input-field"
          >
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tags
          </label>
          <select
            id="tags"
            name="tags"
            multiple
            value={filters.tags}
            onChange={handleTagChange}
            className="input-field h-24"
          >
            {availableTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Hold Ctrl/Cmd to select multiple</p>
        </div>
        
        <div className="flex items-end">
          <button
            onClick={clearFilters}
            className="px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 w-full"
          >
            Clear All Filters
          </button>
        </div>
      </div>
    </div>
  );
}