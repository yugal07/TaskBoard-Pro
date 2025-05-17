import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTasks } from '../contexts/TaskContext';
import { useProjects } from '../contexts/ProjectContext';

export default function AddTaskButton() {
  const { projectId } = useParams();
  const { currentProject } = useProjects();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [modalStatus, setModalStatus] = useState('');

  // Function to handle opening the create task modal
  const handleAddTask = () => {
    // Use default status if available from currentProject, otherwise "To Do"
    const defaultStatus = currentProject?.statuses?.length > 0 
      ? currentProject.statuses.find(s => s.order === 1)?.name || 'To Do'
      : 'To Do';
    
    setModalStatus(defaultStatus);
    setIsCreateModalOpen(true);
  };

  return (
    <>
      <button
        onClick={handleAddTask}
        className="btn-primary flex items-center"
        aria-label="Add new task"
      >
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Add Task
      </button>

      {/* This will be rendered by the parent component */}
      {isCreateModalOpen && (
        <CreateTaskModal 
          isOpen={isCreateModalOpen} 
          onClose={() => setIsCreateModalOpen(false)}
          initialStatus={modalStatus}
        />
      )}
    </>
  );
}

// Import at runtime to avoid circular dependencies
const CreateTaskModal = ({ isOpen, onClose, initialStatus }) => {
  const TaskModal = require('./CreateTaskModal').default;
  return <TaskModal isOpen={isOpen} onClose={onClose} initialStatus={initialStatus} />;
};