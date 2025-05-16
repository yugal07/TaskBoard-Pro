import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useProjects } from './ProjectContext';

const AutomationContext = createContext();

export function AutomationProvider({ children }) {
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentProject } = useProjects();
  
  // Fetch automations for the current project
  useEffect(() => {
    if (!currentProject) {
      setAutomations([]);
      setLoading(false);
      return;
    }
    
    const fetchAutomations = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/automations/project/${currentProject._id}`);
        setAutomations(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching automations:', error);
        setLoading(false);
      }
    };
    
    fetchAutomations();
  }, [currentProject]);
  
  // Create a new automation
  const createAutomation = async (automationData) => {
    try {
      const response = await api.post('/automations', {
        ...automationData,
        project: currentProject._id
      });
      
      setAutomations(prev => [...prev, response.data]);
      return response.data;
    } catch (error) {
      console.error('Error creating automation:', error);
      throw error;
    }
  };
  
  // Update an automation
  const updateAutomation = async (automationId, automationData) => {
    try {
      const response = await api.put(`/automations/${automationId}`, automationData);
      
      setAutomations(prev => 
        prev.map(automation => 
          automation._id === automationId ? response.data : automation
        )
      );
      
      return response.data;
    } catch (error) {
      console.error('Error updating automation:', error);
      throw error;
    }
  };
  
  // Delete an automation
  const deleteAutomation = async (automationId) => {
    try {
      await api.delete(`/automations/${automationId}`);
      
      setAutomations(prev => 
        prev.filter(automation => automation._id !== automationId)
      );
      
      return true;
    } catch (error) {
      console.error('Error deleting automation:', error);
      throw error;
    }
  };
  
  // Toggle automation active state
  const toggleAutomation = async (automationId, isActive) => {
    try {
      const automation = automations.find(a => a._id === automationId);
      if (!automation) throw new Error('Automation not found');
      
      const response = await api.put(`/automations/${automationId}`, {
        ...automation,
        active: isActive
      });
      
      setAutomations(prev => 
        prev.map(a => a._id === automationId ? response.data : a)
      );
      
      return response.data;
    } catch (error) {
      console.error('Error toggling automation:', error);
      throw error;
    }
  };
  
  const value = {
    automations,
    loading,
    createAutomation,
    updateAutomation,
    deleteAutomation,
    toggleAutomation
  };
  
  return (
    <AutomationContext.Provider value={value}>
      {children}
    </AutomationContext.Provider>
  );
}

export const useAutomations = () => useContext(AutomationContext);