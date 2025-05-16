import { useState, useEffect } from 'react';
import { useAutomations } from '../contexts/AutomationContext';
import { useProjects } from '../contexts/ProjectContext';
import TriggerConfiguration from './automation/TriggerConfiguration';
import ActionConfiguration from './automation/ActionConfiguration';

export default function AutomationBuilder({ isOpen, onClose, initialAutomation }) {
  const { createAutomation, updateAutomation } = useAutomations();
  const { currentProject } = useProjects();
  const [step, setStep] = useState(1); // 1: Name, 2: Trigger, 3: Action, 4: Review
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Form state
  const [automationData, setAutomationData] = useState({
    name: '',
    trigger: {
      type: 'task_status_change',
      condition: {
        fromStatus: '',
        toStatus: ''
      }
    },
    action: {
      type: 'change_status',
      params: {
        status: ''
      }
    },
    active: true
  });
  
  // Initialize form with existing automation data if editing
  useEffect(() => {
    if (initialAutomation) {
      setAutomationData(initialAutomation);
    }
  }, [initialAutomation]);
  
  // Handle form field changes
  const handleNameChange = (e) => {
    setAutomationData(prev => ({
      ...prev,
      name: e.target.value
    }));
  };
  
  // Handle trigger configuration changes
  const handleTriggerChange = (triggerData) => {
    setAutomationData(prev => ({
      ...prev,
      trigger: triggerData
    }));
  };
  
  // Handle action configuration changes
  const handleActionChange = (actionData) => {
    setAutomationData(prev => ({
      ...prev,
      action: actionData
    }));
  };
  
  // Navigate to next step
  const handleNext = () => {
    if (step === 1 && !automationData.name.trim()) {
      setError('Automation name is required');
      return;
    }
    
    setError('');
    setStep(prev => prev + 1);
  };
  
  // Navigate to previous step
  const handleBack = () => {
    setStep(prev => prev - 1);
  };
  
  // Submit the form
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError('');
      
      if (initialAutomation) {
        // Update existing automation
        await updateAutomation(initialAutomation._id, automationData);
      } else {
        // Create new automation
        await createAutomation(automationData);
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving automation:', error);
      setError('Failed to save automation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Format trigger description for review
  const formatTriggerDescription = () => {
    const { trigger } = automationData;
    
    switch (trigger.type) {
      case 'task_status_change':
        return `When a task moves from ${trigger.condition.fromStatus || 'any status'} to ${trigger.condition.toStatus || 'any status'}`;
      case 'task_assignment':
        return `When a task is assigned to ${trigger.condition.assigneeId ? 'a specific user' : 'anyone'}`;
      case 'due_date_passed':
        return 'When a task due date passes';
      default:
        return 'Unknown trigger';
    }
  };
  
  // Format action description for review
  const formatActionDescription = () => {
    const { action } = automationData;
    
    switch (action.type) {
      case 'change_status':
        return `Change task status to "${action.params.status}"`;
      case 'assign_badge':
        return `Award "${action.params.badgeName}" badge`;
      case 'send_notification':
        return `Send notification: "${action.params.message || 'Custom notification'}"`;
      default:
        return 'Unknown action';
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b dark:border-dark-700">
          <h2 className="text-lg font-medium">
            {initialAutomation ? 'Edit Automation' : 'Create Automation'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Steps indicator */}
        <div className="p-4 border-b dark:border-dark-700">
          <div className="flex items-center justify-between">
            {['Name', 'Trigger', 'Action', 'Review'].map((stepName, index) => (
              <div 
                key={stepName}
                className={`flex flex-col items-center ${
                  index < step ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-600'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium mb-1 ${
                  index + 1 === step 
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300' 
                    : index + 1 < step 
                      ? 'bg-primary-600 text-white dark:bg-primary-700' 
                      : 'bg-gray-200 text-gray-500 dark:bg-dark-700'
                }`}>
                  {index + 1 < step ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <span className="text-xs">{stepName}</span>
              </div>
            ))}
          </div>
        </div>
        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 p-2 m-4 rounded-md">
            {error}
          </div>
        )}
        
        <div className="p-6">
          {/* Step 1: Name */}
          {step === 1 && (
            <div>
              <h3 className="text-lg font-medium mb-4">Name Your Automation</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Give your automation a descriptive name to help you remember what it does.
              </p>
              
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Automation Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={automationData.name}
                  onChange={handleNameChange}
                  className="input-field"
                  placeholder="e.g., Move to In Progress when assigned"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={automationData.active}
                    onChange={() => setAutomationData(prev => ({ ...prev, active: !prev.active }))}
                    className="h-4 w-4 text-primary-600 dark:text-primary-500 rounded"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">
                    Enable this automation
                  </span>
                </label>
              </div>
            </div>
          )}
          
          {/* Step 2: Trigger */}
          {step === 2 && (
            <div>
              <h3 className="text-lg font-medium mb-4">Configure Trigger</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Select when this automation should run.
              </p>
              
              <TriggerConfiguration
                trigger={automationData.trigger}
                onChange={handleTriggerChange}
                projectStatuses={currentProject?.statuses || []}
                projectMembers={currentProject?.members || []}
              />
            </div>
          )}
          
          {/* Step 3: Action */}
          {step === 3 && (
            <div>
              <h3 className="text-lg font-medium mb-4">Configure Action</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Choose what happens when the trigger conditions are met.
              </p>
              
              <ActionConfiguration
                action={automationData.action}
                onChange={handleActionChange}
                projectStatuses={currentProject?.statuses || []}
              />
            </div>
          )}
          
          {/* Step 4: Review */}
          {step === 4 && (
            <div>
              <h3 className="text-lg font-medium mb-4">Review Your Automation</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Please review your automation before saving.
              </p>
              
              <div className="bg-gray-50 dark:bg-dark-700 p-4 rounded-md mb-6">
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</dt>
                    <dd className="mt-1 text-gray-900 dark:text-white">{automationData.name}</dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Trigger</dt>
                    <dd className="mt-1 text-gray-900 dark:text-white">{formatTriggerDescription()}</dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Action</dt>
                    <dd className="mt-1 text-gray-900 dark:text-white">{formatActionDescription()}</dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
                    <dd className="mt-1">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        automationData.active 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : 'bg-gray-100 text-gray-800 dark:bg-dark-600 dark:text-gray-400'
                      }`}>
                        {automationData.active ? 'Active' : 'Inactive'}
                      </span>
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t dark:border-dark-700 flex justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700"
            >
              Back
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700"
            >
              Cancel
            </button>
          )}
          
          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="btn-primary"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="btn-primary disabled:opacity-70"
            >
              {isSubmitting ? 'Saving...' : 'Save Automation'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}