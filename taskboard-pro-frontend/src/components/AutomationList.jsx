import { useAutomations } from '../contexts/AutomationContext';

export default function AutomationList({ automations, onEdit }) {
  const { toggleAutomation, deleteAutomation } = useAutomations();
  
  const handleToggle = async (automationId, currentState) => {
    try {
      await toggleAutomation(automationId, !currentState);
    } catch (error) {
      console.error('Error toggling automation:', error);
      // Handle error (show toast, etc.)
    }
  };
  
  const handleDelete = async (automationId) => {
    if (window.confirm('Are you sure you want to delete this automation?')) {
      try {
        await deleteAutomation(automationId);
      } catch (error) {
        console.error('Error deleting automation:', error);
        // Handle error (show toast, etc.)
      }
    }
  };
  
  // Helper function to format trigger description
  const formatTrigger = (trigger) => {
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
  
  // Helper function to format action description
  const formatAction = (action) => {
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
  
  return (
    <div className="grid gap-4">
      {automations.map((automation) => (
        <div
          key={automation._id}
          className={`bg-white dark:bg-dark-800 rounded-lg shadow-sm border ${
            automation.active 
              ? 'border-green-200 dark:border-green-900' 
              : 'border-gray-200 dark:border-dark-700'
          }`}
        >
          <div className="p-4 flex justify-between items-start">
            <div>
              <div className="flex items-center mb-2">
                <h3 className="font-medium">{automation.name}</h3>
                <span className={`ml-3 px-2 py-0.5 text-xs rounded-full ${
                  automation.active 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : 'bg-gray-100 text-gray-800 dark:bg-dark-700 dark:text-gray-400'
                }`}>
                  {automation.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <div className="mt-3 space-y-2">
                <div className="flex items-start text-sm">
                  <div className="flex-shrink-0 w-24 text-gray-500 dark:text-gray-400">Trigger:</div>
                  <div>{formatTrigger(automation.trigger)}</div>
                </div>
                
                <div className="flex items-start text-sm">
                  <div className="flex-shrink-0 w-24 text-gray-500 dark:text-gray-400">Action:</div>
                  <div>{formatAction(automation.action)}</div>
                </div>
                
                <div className="flex items-start text-sm">
                  <div className="flex-shrink-0 w-24 text-gray-500 dark:text-gray-400">Created:</div>
                  <div>{new Date(automation.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => handleToggle(automation._id, automation.active)}
                className={`p-2 rounded-md ${
                  automation.active 
                    ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-200 dark:hover:bg-green-900/50' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-dark-700 dark:text-gray-300 dark:hover:bg-dark-600'
                }`}
                title={automation.active ? 'Disable' : 'Enable'}
              >
                {automation.active ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
              
              <button
                onClick={() => onEdit(automation)}
                className="p-2 bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:hover:bg-blue-900/50 rounded-md"
                title="Edit"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              
              <button
                onClick={() => handleDelete(automation._id)}
                className="p-2 bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-200 dark:hover:bg-red-900/50 rounded-md"
                title="Delete"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}