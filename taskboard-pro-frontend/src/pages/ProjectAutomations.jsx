import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAutomations } from '../contexts/AutomationContext';
import { useProjects } from '../contexts/ProjectContext';
import AutomationList from '../components/AutomationList';
import AutomationBuilder from '../components/AutomationBuilder';

export default function ProjectAutomations() {
  const { projectId } = useParams();
  const { currentProject } = useProjects();
  const { automations, loading } = useAutomations();
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState(null);
  
  const handleCreateNew = () => {
    setEditingAutomation(null);
    setIsBuilderOpen(true);
  };
  
  const handleEdit = (automation) => {
    setEditingAutomation(automation);
    setIsBuilderOpen(true);
  };
  
  const handleClose = () => {
    setIsBuilderOpen(false);
    setEditingAutomation(null);
  };
  
  if (!currentProject) {
    return (
      <div className="my-8 p-4 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-md">
        Project not found
      </div>
    );
  }
  
  return (
    <div>
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {currentProject.title} - Automations
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Create automation rules to streamline your workflow
            </p>
          </div>
          <button
            onClick={handleCreateNew}
            className="btn-primary"
          >
            Create Automation
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center my-8">
          <div className="spinner"></div>
          <p className="ml-2">Loading automations...</p>
        </div>
      ) : automations.length === 0 ? (
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow-md p-8 text-center">
          <h2 className="text-lg font-medium mb-2">No Automations Yet</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Create your first automation rule to automate repetitive tasks
          </p>
          <button
            onClick={handleCreateNew}
            className="btn-primary"
          >
            Create Your First Automation
          </button>
        </div>
      ) : (
        <AutomationList 
          automations={automations} 
          onEdit={handleEdit} 
        />
      )}
      
      {isBuilderOpen && (
        <AutomationBuilder
          isOpen={isBuilderOpen}
          onClose={handleClose}
          initialAutomation={editingAutomation}
        />
      )}
    </div>
  );
}