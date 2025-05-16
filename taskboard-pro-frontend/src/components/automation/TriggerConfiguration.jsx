import { useState, useEffect } from 'react';

export default function TriggerConfiguration({ trigger, onChange, projectStatuses, projectMembers }) {
  const [triggerType, setTriggerType] = useState(trigger.type || 'task_status_change');
  const [condition, setCondition] = useState(trigger.condition || {});
  
  // Initialize condition based on trigger type
  useEffect(() => {
    if (triggerType === 'task_status_change' && !condition.fromStatus && !condition.toStatus) {
      setCondition({
        fromStatus: '',
        toStatus: ''
      });
    } else if (triggerType === 'task_assignment' && !condition.assigneeId) {
      setCondition({
        assigneeId: ''
      });
    } else if (triggerType === 'due_date_passed') {
      // No specific conditions needed for due date passed
      setCondition({});
    }
  }, [triggerType]);
  
  // Send updated trigger data to parent component
  useEffect(() => {
    onChange({
      type: triggerType,
      condition
    });
  }, [triggerType, condition, onChange]);
  
  // Handle trigger type change
  const handleTriggerTypeChange = (e) => {
    setTriggerType(e.target.value);
  };
  
  // Handle condition field change
  const handleConditionChange = (field, value) => {
    setCondition(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  return (
    <div>
      <div className="mb-4">
        <label htmlFor="triggerType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Trigger Type
        </label>
        <select
          id="triggerType"
          value={triggerType}
          onChange={handleTriggerTypeChange}
          className="input-field"
        >
          <option value="task_status_change">Task Status Change</option>
          <option value="task_assignment">Task Assignment</option>
          <option value="due_date_passed">Due Date Passed</option>
        </select>
      </div>
      
      {/* Render different condition fields based on trigger type */}
      {triggerType === 'task_status_change' && (
        <div className="space-y-4">
          <div>
            <label htmlFor="fromStatus" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              From Status
            </label>
            <select
              id="fromStatus"
              value={condition.fromStatus || ''}
              onChange={(e) => handleConditionChange('fromStatus', e.target.value)}
              className="input-field"
            >
              <option value="">Any Status</option>
              {projectStatuses.map((status) => (
                <option key={status.name} value={status.name}>{status.name}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Leave as "Any Status" to trigger from any status
            </p>
          </div>
          
          <div>
            <label htmlFor="toStatus" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              To Status
            </label>
            <select
              id="toStatus"
              value={condition.toStatus || ''}
              onChange={(e) => handleConditionChange('toStatus', e.target.value)}
              className="input-field"
            >
              <option value="">Any Status</option>
              {projectStatuses.map((status) => (
                <option key={status.name} value={status.name}>{status.name}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Leave as "Any Status" to trigger to any status
            </p>
          </div>
        </div>
      )}
      
      {triggerType === 'task_assignment' && (
        <div>
          <label htmlFor="assigneeId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Assigned To
          </label>
          <select
            id="assigneeId"
            value={condition.assigneeId || ''}
            onChange={(e) => handleConditionChange('assigneeId', e.target.value)}
            className="input-field"
          >
            <option value="">Any Team Member</option>
            {projectMembers.map((member) => (
              <option key={member._id} value={member._id}>{member.displayName}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Leave as "Any Team Member" to trigger for any assignment
          </p>
        </div>
      )}
      
      {triggerType === 'due_date_passed' && (
        <p className="text-gray-600 dark:text-gray-400">
          This automation will trigger when a task's due date passes and the task is not completed.
        </p>
      )}
    </div>
  );
}