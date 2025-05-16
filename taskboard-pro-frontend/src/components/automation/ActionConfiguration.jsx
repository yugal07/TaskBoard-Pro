import { useState, useEffect } from 'react';

export default function ActionConfiguration({ action, onChange, projectStatuses }) {
  const [actionType, setActionType] = useState(action.type || 'change_status');
  const [params, setParams] = useState(action.params || {});
  
  // Initialize params based on action type
  useEffect(() => {
    if (actionType === 'change_status' && !params.status) {
      setParams({
        status: ''
      });
    } else if (actionType === 'assign_badge' && !params.badgeName) {
      setParams({
        badgeName: ''
      });
    } else if (actionType === 'send_notification' && !params.message) {
      setParams({
        message: ''
      });
    }
  }, [actionType]);
  
  // Send updated action data to parent component
  useEffect(() => {
    onChange({
      type: actionType,
      params
    });
  }, [actionType, params, onChange]);
  
  // Handle action type change
  const handleActionTypeChange = (e) => {
    setActionType(e.target.value);
  };
  
  // Handle params field change
  const handleParamsChange = (field, value) => {
    setParams(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  return (
    <div>
      <div className="mb-4">
        <label htmlFor="actionType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Action Type
        </label>
        <select
          id="actionType"
          value={actionType}
          onChange={handleActionTypeChange}
          className="input-field"
        >
          <option value="change_status">Change Task Status</option>
          <option value="assign_badge">Award Badge</option>
          <option value="send_notification">Send Notification</option>
        </select>
      </div>
      
      {/* Render different params fields based on action type */}
      {actionType === 'change_status' && (
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Status
          </label>
          <select
            id="status"
            value={params.status || ''}
            onChange={(e) => handleParamsChange('status', e.target.value)}
            className="input-field"
            required
          >
            <option value="" disabled>Select a status</option>
            {projectStatuses.map((status) => (
              <option key={status.name} value={status.name}>{status.name}</option>
            ))}
          </select>
        </div>
      )}
      
      {actionType === 'assign_badge' && (
        <div>
          <label htmlFor="badgeName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Badge Name
          </label>
          <select
            id="badgeName"
            value={params.badgeName || ''}
            onChange={(e) => handleParamsChange('badgeName', e.target.value)}
            className="input-field"
            required
          >
            <option value="" disabled>Select a badge</option>
            <option value="Task Master">Task Master</option>
            <option value="Deadline Crusher">Deadline Crusher</option>
            <option value="First Task">First Task</option>
            <option value="Team Player">Team Player</option>
            <option value="Project Champion">Project Champion</option>
          </select>
        </div>
      )}
      
      {actionType === 'send_notification' && (
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notification Message
          </label>
          <textarea
            id="message"
            value={params.message || ''}
            onChange={(e) => handleParamsChange('message', e.target.value)}
            className="input-field min-h-[100px]"
            placeholder="Enter notification message"
            required
          />
        </div>
      )}
    </div>
  );
}