import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import socketService from '../services/socketService';
import { useProjects } from './ProjectContext';

const TaskContext = createContext();

export function TaskProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentProject } = useProjects();
  
  // Fetch tasks for the current project
  useEffect(() => {
    if (!currentProject) {
      setTasks([]);
      setLoading(false);
      return;
    }
    
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/tasks/project/${currentProject._id}`);
        setTasks(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        setLoading(false);
      }
    };
    
    fetchTasks();
    
    // Join the project's socket room
    socketService.joinProject(currentProject._id);
    
    return () => {
      // Leave the project's socket room when component unmounts or project changes
      if (currentProject) {
        socketService.leaveProject(currentProject._id);
      }
    };
  }, [currentProject]);
  
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
  
  const value = {
    tasks,
    loading,
    createTask,
    updateTask,
    deleteTask,
    moveTask
  };
  
  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
}

export const useTasks = () => useContext(TaskContext);