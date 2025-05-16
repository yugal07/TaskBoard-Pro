import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useTasks } from '../contexts/TaskContext';
import { useProjects } from '../contexts/ProjectContext';
import TaskCard from './TaskCard';
import CreateTaskModal from './CreateTaskModal';
import TaskDetailModal from './TaskDetailModal';

export default function TaskBoard() {
  const { tasks, loading, moveTask } = useTasks();
  const { currentProject } = useProjects();
  const [columns, setColumns] = useState({});
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalStatus, setCreateModalStatus] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  // Group tasks by status
  useEffect(() => {
    if (!tasks.length) return;
    
    const groupedColumns = {};
    
    // Initialize columns based on project statuses
    if (currentProject && currentProject.statuses) {
      currentProject.statuses.sort((a, b) => a.order - b.order).forEach(status => {
        groupedColumns[status.name] = {
          id: status.name,
          title: status.name,
          taskIds: [],
          order: status.order
        };
      });
    } else {
      // Default statuses
      groupedColumns['To Do'] = { id: 'To Do', title: 'To Do', taskIds: [], order: 1 };
      groupedColumns['In Progress'] = { id: 'In Progress', title: 'In Progress', taskIds: [], order: 2 };
      groupedColumns['Done'] = { id: 'Done', title: 'Done', taskIds: [], order: 3 };
    }
    
    // Populate columns with tasks
    tasks.forEach(task => {
      if (groupedColumns[task.status]) {
        groupedColumns[task.status].taskIds.push(task._id);
      } else {
        // Handle tasks with statuses that no longer exist in the project
        if (!groupedColumns['Other']) {
          groupedColumns['Other'] = { id: 'Other', title: 'Other', taskIds: [], order: 999 };
        }
        groupedColumns['Other'].taskIds.push(task._id);
      }
    });
    
    setColumns(groupedColumns);
  }, [tasks, currentProject]);
  
  // Handle drag end event
  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    
    // Dropped outside a droppable area
    if (!destination) return;
    
    // Dropped in the same place
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) return;
    
    // Handle drop in a different column (status change)
    if (destination.droppableId !== source.droppableId) {
      try {
        // Optimistic UI update
        const sourceColumn = columns[source.droppableId];
        const destColumn = columns[destination.droppableId];
        const sourceTaskIds = [...sourceColumn.taskIds];
        const destTaskIds = [...destColumn.taskIds];
        
        // Remove from source column
        sourceTaskIds.splice(source.index, 1);
        
        // Add to destination column
        destTaskIds.splice(destination.index, 0, draggableId);
        
        // Update columns state
        setColumns({
          ...columns,
          [source.droppableId]: {
            ...sourceColumn,
            taskIds: sourceTaskIds
          },
          [destination.droppableId]: {
            ...destColumn,
            taskIds: destTaskIds
          }
        });
        
        // Make API call to update task status
        await moveTask(draggableId, destination.droppableId);
      } catch (error) {
        console.error('Error moving task:', error);
        // Revert UI changes on error (could reload tasks)
      }
    } else {
      // Same column reordering (order change only)
      const column = columns[source.droppableId];
      const newTaskIds = [...column.taskIds];
      
      // Reorder within the column
      newTaskIds.splice(source.index, 1);
      newTaskIds.splice(destination.index, 0, draggableId);
      
      // Update columns state
      setColumns({
        ...columns,
        [source.droppableId]: {
          ...column,
          taskIds: newTaskIds
        }
      });
      
      // For future: implement task order saving to the backend
    }
  };
  
  // Open task creation modal
  const handleAddTask = (status) => {
    setCreateModalStatus(status);
    setIsCreateModalOpen(true);
  };
  
  // Open task detail modal
  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setIsDetailModalOpen(true);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center my-8">
        <div className="spinner"></div>
        <p className="ml-2">Loading tasks...</p>
      </div>
    );
  }
  
  // Sort columns by order
  const orderedColumns = Object.values(columns).sort((a, b) => a.order - b.order);
  
  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {orderedColumns.map((column) => (
            <div key={column.id} className="bg-white dark:bg-dark-800 rounded-lg shadow-md flex flex-col">
              {/* Column header */}
              <div className="bg-gray-100 dark:bg-dark-700 p-3 rounded-t-lg border-b dark:border-dark-600 flex justify-between items-center">
                <h3 className="font-medium">
                  {column.title} ({column.taskIds.length})
                </h3>
              </div>
              
              {/* Tasks container */}
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`p-3 flex-grow min-h-[200px] ${
                      snapshot.isDraggingOver ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                    }`}
                  >
                    {column.taskIds.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400 text-center text-sm mt-4">
                        No tasks in this status
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {column.taskIds.map((taskId, index) => {
                          const task = tasks.find(t => t._id === taskId);
                          if (!task) return null;
                          
                          return (
                            <Draggable key={task._id} draggableId={task._id} index={index}>
                              {(provided, snapshot) => (
                                <li
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`rounded-md border ${
                                    snapshot.isDragging
                                      ? 'bg-gray-100 dark:bg-dark-600 shadow-md'
                                      : 'bg-white dark:bg-dark-700 border-gray-200 dark:border-dark-600'
                                  }`}
                                  onClick={() => handleTaskClick(task)}
                                >
                                  <TaskCard task={task} />
                                </li>
                              )}
                            </Draggable>
                          );
                        })}
                      </ul>
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
              
              {/* Add task button */}
              <div className="p-3 border-t dark:border-dark-600">
                <button 
                  onClick={() => handleAddTask(column.id)}
                  className="w-full py-1 bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 rounded-md text-sm text-gray-600 dark:text-gray-300 transition-colors"
                >
                  + Add Task
                </button>
              </div>
            </div>
          ))}
        </div>
      </DragDropContext>
      
      {/* Create Task Modal */}
      {isCreateModalOpen && (
        <CreateTaskModal 
          isOpen={isCreateModalOpen} 
          onClose={() => setIsCreateModalOpen(false)}
          initialStatus={createModalStatus}
        />
      )}
      
      {/* Task Detail Modal */}
      {isDetailModalOpen && selectedTask && (
        <TaskDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          taskId={selectedTask._id}
        />
      )}
    </>
  );
}