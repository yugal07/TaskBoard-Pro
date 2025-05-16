import { useState } from 'react';
import { useProjects } from '../contexts/ProjectContext';

export default function TaskFilter({ onFilterChange }) {
  const { currentProject } = useProjects();
  const [filters, setFilters] = useState({
    assignee: '',
    status: '',
    dueDate: '',
  });
  
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
  
  // Clear all filters
  const clearFilters = () => {
    const resetFilters = {
      assignee: '',
      status: '',
      dueDate: '',
    };
    
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };
  
  return (
    <div className="bg-white dark:bg-dark-800 p-4 rounded-lg shadow-sm mb-6 border border-gray-200 dark:border-dark-700">
      <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
        <div className="mb-4 md:mb-0 md:flex-1">
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
        
        <div className="mb-4 md:mb-0 md:flex-1">
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
        
        <div className="mb-4 md:mb-0 md:flex-1">
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
        
        <div className="mt-4 md:mt-6">
          <button
            onClick={clearFilters}
            className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
}