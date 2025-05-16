import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

// Role permissions definition
const rolePermissions = {
  Admin: {
    project: ['view', 'edit', 'delete', 'invite', 'manage-statuses', 'manage-roles'],
    task: ['view', 'create', 'edit', 'delete', 'assign', 'move'],
    automation: ['view', 'create', 'edit', 'delete', 'enable', 'disable']
  },
  Editor: {
    project: ['view'],
    task: ['view', 'create', 'edit', 'delete', 'assign', 'move'],
    automation: ['view', 'create', 'edit', 'delete', 'enable', 'disable']
  },
  Viewer: {
    project: ['view'],
    task: ['view'],
    automation: ['view']
  },
  Owner: {
    project: ['view', 'edit', 'delete', 'invite', 'manage-statuses', 'manage-roles', 'transfer-ownership'],
    task: ['view', 'create', 'edit', 'delete', 'assign', 'move'],
    automation: ['view', 'create', 'edit', 'delete', 'enable', 'disable']
  }
};

const PermissionContext = createContext();

export function PermissionProvider({ children }) {
  const [userRole, setUserRole] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  
  // Update current project ID when navigating to a different project
  const updateCurrentProject = (projectId) => {
    setCurrentProjectId(projectId);
    
    // Reset role when changing projects
    setUserRole(null);
    setIsOwner(false);
    setIsLoading(true);
    
    // Fetch role for the new project
    if (projectId) {
      fetchUserRole(projectId);
    }
  };
  
  // Fetch user's role in the current project
  const fetchUserRole = async (projectId) => {
    try {
      const response = await api.get(`/projects/${projectId}/members`);
      const members = response.data;
      
      // Get current user's ID from local storage or context
      const userId = localStorage.getItem('userId');
      
      // Find the user in the members list
      const currentMember = members.find(m => m.id === userId);
      
      if (currentMember) {
        setUserRole(currentMember.role);
        setIsOwner(currentMember.isOwner);
      } else {
        // Default to viewer if user is not found
        setUserRole('Viewer');
        setIsOwner(false);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching user role:', error);
      // Default to viewer on error
      setUserRole('Viewer');
      setIsOwner(false);
      setIsLoading(false);
    }
  };
  
  // Check if user has permission for an action
  const hasPermission = (resource, action) => {
    if (isLoading) return false;
    if (!userRole) return false;
    
    // Owner has all permissions
    if (isOwner) {
      return rolePermissions.Owner[resource]?.includes(action) || false;
    }
    
    // Check role permissions
    return rolePermissions[userRole]?.[resource]?.includes(action) || false;
  };
  
  const value = {
    userRole,
    isOwner,
    isLoading,
    currentProjectId,
    updateCurrentProject,
    hasPermission
  };
  
  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

export const usePermissions = () => useContext(PermissionContext);