import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjects } from '../contexts/ProjectContext';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableStatusItem } from '../components/SortableStatusComponent';
import api from '../services/api';

export default function ProjectSettings() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { currentProject, setCurrentProject } = useProjects();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Project settings state
  const [projectDetails, setProjectDetails] = useState({
    title: '',
    description: ''
  });
  
  // Project statuses state
  const [statuses, setStatuses] = useState([]);
  const [newStatus, setNewStatus] = useState('');
  
  // Project members state
  const [members, setMembers] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  
  // Delete project state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  
  // Configure DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Initialize form with project data
  useEffect(() => {
    if (currentProject) {
      setProjectDetails({
        title: currentProject.title || '',
        description: currentProject.description || ''
      });
      
      // Initialize statuses
      if (currentProject.statuses) {
        setStatuses([...currentProject.statuses].sort((a, b) => a.order - b.order));
      }
      
      // Initialize members
      if (currentProject.members) {
        setMembers(currentProject.members);
      }
    }
  }, [currentProject]);
  
  // Handle text field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProjectDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle project update
  const handleUpdateProject = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!projectDetails.title.trim()) {
      setError('Project title is required');
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await api.put(`/projects/${projectId}`, {
        title: projectDetails.title,
        description: projectDetails.description
      });
      
      // Update current project in context
      setCurrentProject(prev => ({
        ...prev,
        title: response.data.title,
        description: response.data.description
      }));
      
      setSuccess('Project details updated successfully');
      setLoading(false);
    } catch (error) {
      console.error('Error updating project:', error);
      setError(error.response?.data?.message || 'Failed to update project');
      setLoading(false);
    }
  };
  
  // Handle status reordering
  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (!over) return;
    
    if (active.id !== over.id) {
      setStatuses((items) => {
        const oldIndex = items.findIndex(item => item.name === active.id);
        const newIndex = items.findIndex(item => item.name === over.id);
        
        const reorderedStatuses = arrayMove(items, oldIndex, newIndex);
        
        // Update order values
        return reorderedStatuses.map((status, index) => ({
          ...status,
          order: index + 1
        }));
      });
    }
  };
  
  // Handle adding a new status
  const handleAddStatus = () => {
    if (!newStatus.trim()) {
      setError('Status name cannot be empty');
      return;
    }
    
    // Check for duplicate status names
    if (statuses.some(status => status.name.toLowerCase() === newStatus.trim().toLowerCase())) {
      setError('Status with this name already exists');
      return;
    }
    
    const newStatuses = [
      ...statuses,
      {
        name: newStatus.trim(),
        order: statuses.length + 1
      }
    ];
    
    setStatuses(newStatuses);
    setNewStatus('');
    setError('');
  };
  
  // Handle deleting a status
  const handleDeleteStatus = (statusName) => {
    // Prevent deleting default statuses if they have tasks
    const isDefault = ['To Do', 'In Progress', 'Done'].includes(statusName);
    
    if (isDefault) {
      setError(`Cannot delete default status "${statusName}"`);
      return;
    }
    
    const updatedStatuses = statuses.filter(status => status.name !== statusName);
    
    // Reorder remaining statuses
    const reorderedStatuses = updatedStatuses.map((status, index) => ({
      ...status,
      order: index + 1
    }));
    
    setStatuses(reorderedStatuses);
    setError('');
  };
  
  // Handle saving status changes
  const handleSaveStatuses = async () => {
    setError('');
    setSuccess('');
    
    try {
      setLoading(true);
      
      const response = await api.post(`/projects/${projectId}/statuses`, {
        statuses
      });
      
      // Update current project in context
      setCurrentProject(prev => ({
        ...prev,
        statuses: response.data.statuses
      }));
      
      setSuccess('Project statuses updated successfully');
      setLoading(false);
    } catch (error) {
      console.error('Error updating statuses:', error);
      setError(error.response?.data?.message || 'Failed to update statuses');
      setLoading(false);
    }
  };
  
  // Handle inviting a user
  const handleInviteUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!inviteEmail.trim()) {
      setError('Email is required');
      return;
    }
    
    try {
      setInviteLoading(true);
      
      await api.post(`/projects/${projectId}/invite`, {
        email: inviteEmail
      });
      
      // Refresh project details to get updated members list
      const response = await api.get(`/projects/${projectId}`);
      setCurrentProject(response.data);
      setMembers(response.data.members);
      
      setSuccess(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      setInviteLoading(false);
    } catch (error) {
      console.error('Error inviting user:', error);
      setError(error.response?.data?.message || 'Failed to send invitation');
      setInviteLoading(false);
    }
  };
  
  // Handle project deletion
  const handleDeleteProject = async () => {
    if (deleteText !== currentProject.title) {
      setError('Project title does not match');
      return;
    }
    
    try {
      setLoading(true);
      
      await api.delete(`/projects/${projectId}`);
      
      // Navigate back to dashboard
      navigate('/');
    } catch (error) {
      console.error('Error deleting project:', error);
      setError(error.response?.data?.message || 'Failed to delete project');
      setLoading(false);
    }
  };
  
  if (!currentProject) {
    return (
      <div className="my-8 p-4 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-md">
        Project not found
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Project Settings
        </h1>
      </div>
      
      {/* Project Details Section */}
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm">
        <div className="px-4 py-3 border-b dark:border-dark-700">
          <h2 className="font-medium">Project Details</h2>
        </div>
        
        <div className="p-4">
          {error && (
            <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 p-3 rounded-md mb-4">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 p-3 rounded-md mb-4">
              {success}
            </div>
          )}
          
          <form onSubmit={handleUpdateProject}>
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Project Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={projectDetails.title}
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
                value={projectDetails.description}
                onChange={handleChange}
                className="input-field min-h-[100px]"
                placeholder="Project description"
              />
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary disabled:opacity-70"
              >
                {loading ? 'Saving...' : 'Save Project Details'}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Project Statuses Section */}
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm">
        <div className="px-4 py-3 border-b dark:border-dark-700">
          <h2 className="font-medium">Task Statuses</h2>
        </div>
        
        <div className="p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Customize the statuses that tasks can have in this project. Drag to reorder.
          </p>
          
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="mb-4 space-y-2">
              <SortableContext 
                items={statuses.map(status => status.name)}
                strategy={verticalListSortingStrategy}
              >
                {statuses.map((status) => (
                  <SortableStatusItem 
                    key={status.name} 
                    id={status.name}
                    onDelete={() => handleDeleteStatus(status.name)}
                  >
                    {status.name}
                  </SortableStatusItem>
                ))}
              </SortableContext>
            </div>
          </DndContext>
          
          <div className="flex mb-4">
            <input
              type="text"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              placeholder="New status name"
              className="input-field rounded-r-none"
            />
            <button
              type="button"
              onClick={handleAddStatus}
              className="px-4 py-2 bg-gray-200 dark:bg-dark-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-dark-500 rounded-r-md"
            >
              Add Status
            </button>
          </div>
          
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSaveStatuses}
              disabled={loading}
              className="btn-primary disabled:opacity-70"
            >
              {loading ? 'Saving...' : 'Save Statuses'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Project Members Section */}
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm">
        <div className="px-4 py-3 border-b dark:border-dark-700">
          <h2 className="font-medium">Team Members</h2>
        </div>
        
        <div className="p-4">
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Members</h3>
            
            <ul className="divide-y divide-gray-200 dark:divide-dark-700">
              {members.map(member => (
                <li key={member._id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center">
                    <img
                      src={member.photoURL || `https://ui-avatars.com/api/?name=${member.displayName}&background=random`}
                      alt={member.displayName}
                      className="w-8 h-8 rounded-full mr-3"
                    />
                    <div>
                      <h4 className="text-sm font-medium">{member.displayName}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{member.email}</p>
                    </div>
                  </div>
                  
                  {member._id === currentProject.owner._id ? (
                    <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-full">
                      Owner
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={true} // Implement remove member functionality if needed
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-800 dark:bg-dark-700 dark:text-gray-300 rounded-full"
                    >
                      Member
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
          
          {currentProject.owner._id === currentProject.members.find(m => m._id === currentProject.owner._id)?._id && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Invite New Members</h3>
              
              <form onSubmit={handleInviteUser} className="flex">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Email address"
                  className="input-field rounded-r-none"
                  required
                />
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-r-md disabled:opacity-70"
                >
                  {inviteLoading ? 'Sending...' : 'Send Invite'}
                </button>
              </form>
              
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                The user must already have an account in TaskBoard Pro
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Delete Project Section */}
      {currentProject.owner._id === currentProject.members.find(m => m._id === currentProject.owner._id)?._id && (
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm">
          <div className="px-4 py-3 border-b dark:border-dark-700">
            <h2 className="font-medium text-red-600 dark:text-red-400">Danger Zone</h2>
          </div>
          
          <div className="p-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-md p-4">
              <h3 className="text-lg font-medium text-red-800 dark:text-red-300 mb-2">Delete this project</h3>
              <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                Once you delete a project, there is no going back. All tasks and data will be permanently deleted.
              </p>
              
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
                >
                  Delete Project
                </button>
              ) : (
                <div>
                  <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                    Please type <span className="font-bold">{currentProject.title}</span> to confirm deletion:
                  </p>
                  
                  <div className="flex mb-4">
                    <input
                      type="text"
                      value={deleteText}
                      onChange={(e) => setDeleteText(e.target.value)}
                      className="input-field rounded-r-none"
                      placeholder="Project title"
                    />
                    <button
                      type="button"
                      onClick={handleDeleteProject}
                      disabled={loading || deleteText !== currentProject.title}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-r-md disabled:opacity-70"
                    >
                      {loading ? 'Deleting...' : 'Confirm Delete'}
                    </button>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteText('');
                    }}
                    className="text-sm text-gray-700 dark:text-gray-300 hover:underline"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}