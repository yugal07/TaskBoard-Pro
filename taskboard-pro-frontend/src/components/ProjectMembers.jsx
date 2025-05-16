import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { useProjects } from '../contexts/ProjectContext';

export default function ProjectMembers() {
  const { projectId } = useParams();
  const { currentProject } = useProjects();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Editor');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  
  // Fetch project members
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        
        const response = await api.get(`/projects/${projectId}/members`);
        setMembers(response.data);
        
        // Find current user's role
        const userId = localStorage.getItem('userId');
        const currentMember = response.data.find(m => m.id === userId);
        
        if (currentMember) {
          setUserRole(currentMember.role);
          setIsAdmin(currentMember.role === 'Admin' || currentMember.isOwner);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching members:', error);
        setError('Failed to load project members');
        setLoading(false);
      }
    };
    
    if (projectId) {
      fetchMembers();
    }
  }, [projectId]);
  
  // Handle inviting a user
  const handleInvite = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setInviteError('Email is required');
      return;
    }
    
    try {
      setInviteLoading(true);
      setInviteError('');
      setInviteSuccess('');
      
      const response = await api.post(`/projects/${projectId}/invite`, {
        email,
        role
      });
      
      setInviteSuccess(`Invitation sent to ${email} with ${role} role`);
      setEmail('');
      
      // Refresh member list
      const membersResponse = await api.get(`/projects/${projectId}/members`);
      setMembers(membersResponse.data);
      
    } catch (error) {
      console.error('Error inviting user:', error);
      setInviteError(error.response?.data?.message || 'Failed to send invitation');
    } finally {
      setInviteLoading(false);
    }
  };
  
  // Handle updating a member's role
  const handleUpdateRole = async () => {
    try {
      setInviteLoading(true);
      setInviteError('');
      setInviteSuccess('');
      
      await api.put(`/projects/${projectId}/members/${selectedMember.id}/role`, {
        role
      });
      
      setInviteSuccess(`${selectedMember.displayName}'s role updated to ${role}`);
      
      // Update member in local state
      setMembers(members.map(m => 
        m.id === selectedMember.id ? { ...m, role } : m
      ));
      
      setShowRoleModal(false);
    } catch (error) {
      console.error('Error updating role:', error);
      setInviteError(error.response?.data?.message || 'Failed to update role');
    } finally {
      setInviteLoading(false);
    }
  };
  
  // Handle removing a member
  const handleRemoveMember = async (memberId) => {
    if (!confirm('Are you sure you want to remove this member from the project?')) {
      return;
    }
    
    try {
      await api.delete(`/projects/${projectId}/members/${memberId}`);
      
      // Remove member from local state
      setMembers(members.filter(m => m.id !== memberId));
      
    } catch (error) {
      console.error('Error removing member:', error);
      alert(error.response?.data?.message || 'Failed to remove member');
    }
  };
  
  // Open role modal for a member
  const openRoleModal = (member) => {
    setSelectedMember(member);
    setRole(member.role);
    setShowRoleModal(true);
  };
  
  const getRoleBadgeColor = (role, isOwner) => {
    if (isOwner) return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    
    switch (role) {
      case 'Admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'Editor':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Viewer':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center my-8">
        <div className="spinner"></div>
        <p className="ml-2">Loading project members...</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm">
      <div className="px-4 py-3 border-b dark:border-dark-700 flex justify-between items-center">
        <h2 className="font-medium">Project Members</h2>
        {isAdmin && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="btn-primary text-sm py-1 px-3"
          >
            Invite Member
          </button>
        )}
      </div>
      
      <div className="p-4">
        {error && (
          <div className="mb-4 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 p-3 rounded-md">
            {error}
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-700">
            <thead className="bg-gray-50 dark:bg-dark-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Joined
                </th>
                {isAdmin && (
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-700">
              {members.map(member => (
                <tr key={member.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        className="h-10 w-10 rounded-full"
                        src={member.photoURL || `https://ui-avatars.com/api/?name=${member.displayName}&background=random`}
                        alt={member.displayName}
                      />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {member.displayName}
                          {member.isOwner && (
                            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                              Owner
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {member.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getRoleBadgeColor(member.role, member.isOwner)}`}>
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(member.joinedAt).toLocaleDateString()}
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {!member.isOwner && (
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => openRoleModal(member)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            disabled={member.isOwner}
                          >
                            Change Role
                          </button>
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            disabled={member.isOwner}
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-4 border-b dark:border-dark-700">
              <h2 className="text-lg font-medium">Invite Team Member</h2>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleInvite} className="p-4">
              {inviteError && (
                <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 p-2 rounded-md mb-4">
                  {inviteError}
                </div>
              )}
              
              {inviteSuccess && (
                <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 p-2 rounded-md mb-4">
                  {inviteSuccess}
                </div>
              )}
              
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="colleague@example.com"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role
                </label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="input-field"
                >
                  <option value="Admin">Admin</option>
                  <option value="Editor">Editor</option>
                  <option value="Viewer">Viewer</option>
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  <span className="font-medium">Admin:</span> Can manage project settings, members, and all tasks
                  <br />
                  <span className="font-medium">Editor:</span> Can create and edit tasks, but cannot change project settings
                  <br />
                  <span className="font-medium">Viewer:</span> Can only view tasks, but cannot make changes
                </p>
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="btn-primary disabled:opacity-70"
                >
                  {inviteLoading ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Change Role Modal */}
      {showRoleModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-4 border-b dark:border-dark-700">
              <h2 className="text-lg font-medium">Change Role for {selectedMember.displayName}</h2>
              <button
                onClick={() => setShowRoleModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4">
              {inviteError && (
                <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 p-2 rounded-md mb-4">
                  {inviteError}
                </div>
              )}
              
              {inviteSuccess && (
                <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 p-2 rounded-md mb-4">
                  {inviteSuccess}
                </div>
              )}
              
              <div className="mb-6">
                <label htmlFor="change-role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role
                </label>
                <select
                  id="change-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="input-field"
                >
                  <option value="Admin">Admin</option>
                  <option value="Editor">Editor</option>
                  <option value="Viewer">Viewer</option>
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  <span className="font-medium">Admin:</span> Can manage project settings, members, and all tasks
                  <br />
                  <span className="font-medium">Editor:</span> Can create and edit tasks, but cannot change project settings
                  <br />
                  <span className="font-medium">Viewer:</span> Can only view tasks, but cannot make changes
                </p>
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowRoleModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdateRole}
                  disabled={inviteLoading}
                  className="btn-primary disabled:opacity-70"
                >
                  {inviteLoading ? 'Updating...' : 'Update Role'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}