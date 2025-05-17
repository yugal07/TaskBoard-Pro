import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import socketService from '../services/socketService';
import { useProjects } from './ProjectContext';
import { isAfter, isBefore, isToday, startOfDay, addDays, endOfWeek, startOfWeek } from 'date-fns';

const TaskContext = createContext();

export function TaskProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    assignee: '',
    status: '',
    dueDate: '',
  });
  const [fetchedProjects, setFetchedProjects] = useState({}); // Track which projects we've fetched tasks for
  const { currentProject } = useProjects();
  
  // Fetch tasks for the current project
  useEffect(() => {
    if (!currentProject) {
      setTasks([]);
      setFilteredTasks([]);
      setLoading(false);
      return;
    }
    
    const projectId = currentProject._id;
    
    // Only fetch if we haven't already fetched for this project
    if (!fetchedProjects[projectId]) {
      const fetchTasks = async () => {
        try {
          setLoading(true);
          const response = await api.get(`/tasks/project/${projectId}`);
          setTasks(response.data);
          setFilteredTasks(response.data);
          setLoading(false);
          
          // Mark this project as having been fetched
          setFetchedProjects(prev => ({
            ...prev,
            [projectId]: true
          }));
        } catch (error) {
          console.error('Error fetching tasks:', error);
          setLoading(false);
        }
      };
      
      fetchTasks();
    }
    
    // Join the project's socket room
    socketService.joinProject(projectId);
    
    return () => {
      // Leave the project's socket room when component unmounts or project changes
      if (projectId) {
        socketService.leaveProject(projectId);
      }
    };
  }, [currentProject, fetchedProjects]);
  
  // Apply filters to tasks
  useEffect(() => {
    if (!tasks.length) {
      setFilteredTasks([]);
      return;
    }
    
    let filtered = [...tasks];
    
    // Filter by assignee
    if (filters.assignee) {
      if (filters.assignee === 'unassigned') {
        filtered = filtered.filter(task => !task.assignee);
      } else {
        filtered = filtered.filter(task => 
          task.assignee && task.assignee._id === filters.assignee
        );
      }
    }
    
    // Filter by status
    if (filters.status) {
      filtered = filtered.filter(task => task.status === filters.status);
    }
    
    // Filter by due date
    if (filters.dueDate) {
      const today = startOfDay(new Date());
      const thisWeekEnd = endOfWeek(today);
      const thisWeekStart = startOfWeek(today);
      const nextWeekStart = addDays(thisWeekEnd, 1);
      const nextWeekEnd = endOfWeek(nextWeekStart);
      
      switch (filters.dueDate) {
        case 'overdue':
          filtered = filtered.filter(task => 
            task.dueDate && isBefore(new Date(task.dueDate), today)
          );
          break;
        case 'today':
          filtered = filtered.filter(task => 
            task.dueDate && isToday(new Date(task.dueDate))
          );
          break;
        case 'this-week':
          filtered = filtered.filter(task => {
            if (!task.dueDate) return false;
            const dueDate = new Date(task.dueDate);
            return !isBefore(dueDate, today) && !isAfter(dueDate, thisWeekEnd);
          });
          break;
        case 'next-week':
          filtered = filtered.filter(task => {
            if (!task.dueDate) return false;
            const dueDate = new Date(task.dueDate);
            return !isBefore(dueDate, nextWeekStart) && !isAfter(dueDate, nextWeekEnd);
          });
          break;
        case 'later':
          filtered = filtered.filter(task => 
            task.dueDate && isAfter(new Date(task.dueDate), nextWeekEnd)
          );
          break;
        case 'no-date':
          filtered = filtered.filter(task => !task.dueDate);
          break;
      }
    }
    
    setFilteredTasks(filtered);
  }, [tasks, filters]);
  
  // Set up real-time task updates
  useEffect(() => {
    if (!currentProject) return;
    
    // Handler for task updates
    const handleTaskUpdate = (updatedTask) => {
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task._id === updatedTask._id ? updatedTask : task
        )
      );
    };
    
    // Handler for new tasks
    const handleTaskCreated = (newTask) => {
      setTasks(prevTasks => [...prevTasks, newTask]);
    };
    
    // Handler for deleted tasks
    const handleTaskDeleted = (taskId) => {
      setTasks(prevTasks => 
        prevTasks.filter(task => task._id.toString() !== taskId.toString())
      );
    };
    
    // Subscribe to socket events
    socketService.subscribeToTaskUpdates(handleTaskUpdate);
    socketService.subscribeToTaskCreated(handleTaskCreated);
    socketService.subscribeToTaskDeleted(handleTaskDeleted);
    
    return () => {
      // Unsubscribe from socket events
      socketService.unsubscribeFromTaskUpdates();
      socketService.unsubscribeFromTaskCreated();
      socketService.unsubscribeFromTaskDeleted();
    };
  }, [currentProject]);
  
  // Apply task filters
  const applyFilters = (newFilters) => {
    setFilters(newFilters);
  };
  
  // Create a new task
  const createTask = async (taskData) => {
    try {
      const response = await api.post('/tasks', {
        ...taskData,
        project: currentProject._id
      });
      
      return response.data;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  };
  
  // Update a task
  const updateTask = async (taskId, taskData) => {
    try {
      const response = await api.put(`/tasks/${taskId}`, taskData);
      return response.data;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  };
  
  // Delete a task
  const deleteTask = async (taskId) => {
    try {
      await api.delete(`/tasks/${taskId}`);
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  };
  
  // Move a task to a different status
  const moveTask = async (taskId, newStatus) => {
    try {
      const task = tasks.find(t => t._id === taskId);
      if (!task) throw new Error('Task not found');
      
      const response = await api.put(`/tasks/${taskId}`, {
        ...task,
        status: newStatus
      });
      
      return response.data;
    } catch (error) {
      console.error('Error moving task:', error);
      throw error;
    }
  };
  
  // Add time tracking entry to task (simplified)
  const addTimeEntry = async (taskId, timeData) => {
    try {
      const response = await api.post(`/tasks/${taskId}/time`, timeData);
      return response.data;
    } catch (error) {
      console.error('Error adding time entry:', error);
      throw error;
    }
  };
  
  // Update task dependencies (simplified)
  const updateDependencies = async (taskId, dependencies) => {
    try {
      const response = await api.put(`/tasks/${taskId}/dependencies`, { dependencies });
      return response.data;
    } catch (error) {
      console.error('Error updating dependencies:', error);
      throw error;
    }
  };
  
  const value = {
    tasks: filteredTasks, // Use filtered tasks for rendering
    allTasks: tasks, // Keep original tasks for reference
    loading,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    applyFilters,
    filters,
    addTimeEntry,
    updateDependencies
  };
  
  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
}

export const useTasks = () => useContext(TaskContext);