import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { SortableItem } from './task/SortableItem';
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
  const [activeId, setActiveId] = useState(null);
  
  // Configure DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
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
  
  // Find which column contains a task
  const findColumnForTask = (taskId) => {
    return Object.keys(columns).find(columnId => 
      columns[columnId].taskIds.includes(taskId)
    );
  };
  
  // Handle drag start event
  const handleDragStart = (event) => {
    const { active } = event;
    setActiveId(active.id);
  };
  
  // Handle drag end event
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const activeId = active.id;
    const overId = over.id;
    
    // Extract column IDs from the droppable IDs
    // Format: column-{columnId} or task-{taskId}
    const activeDroppableId = active.data.current?.sortable?.containerId;
    const overDroppableId = over.data.current?.sortable?.containerId;
    
    // If dropping on another task, extract the column from the task
    let sourceColumnId = activeDroppableId;
    let destColumnId = overDroppableId;
    
    if (activeId === overId) return;
    
    if (sourceColumnId === destColumnId) {
      // Same column reordering
      const column = columns[sourceColumnId];
      const oldIndex = column.taskIds.indexOf(activeId);
      const newIndex = column.taskIds.indexOf(overId);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newTaskIds = arrayMove(column.taskIds, oldIndex, newIndex);
        
        // Update columns state
        setColumns({
          ...columns,
          [sourceColumnId]: {
            ...column,
            taskIds: newTaskIds
          }
        });
      }
    } else {
      // Moving between columns (status change)
      try {
        // Optimistic UI update
        const sourceColumn = columns[sourceColumnId];
        const destColumn = columns[destColumnId];
        
        if (!sourceColumn || !destColumn) return;
        
        const sourceTaskIds = [...sourceColumn.taskIds];
        const destTaskIds = [...destColumn.taskIds];
        
        const sourceIndex = sourceTaskIds.indexOf(activeId);
        
        // Remove from source column
        if (sourceIndex !== -1) {
          sourceTaskIds.splice(sourceIndex, 1);
        }
        
        // Add to destination column
        // If dropping on a task, find its index
        const overIndex = destTaskIds.indexOf(overId);
        if (overIndex !== -1) {
          destTaskIds.splice(overIndex, 0, activeId);
        } else {
          // Dropping at the end of the column
          destTaskIds.push(activeId);
        }
        
        // Update columns state
        setColumns({
          ...columns,
          [sourceColumnId]: {
            ...sourceColumn,
            taskIds: sourceTaskIds
          },
          [destColumnId]: {
            ...destColumn,
            taskIds: destTaskIds
          }
        });
        
        // Make API call to update task status
        await moveTask(activeId, destColumnId);
      } catch (error) {
        console.error('Error moving task:', error);
        // Revert UI changes on error (could reload tasks)
      }
    }
    
    setActiveId(null);
  };
  
  // Handle dropping directly over a column
  const handleDragOver = (event) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const activeId = active.id;
    const overId = over.id;
    
    // If not dropping on a task (dropping on column area)
    if (overId.startsWith('column-')) {
      const columnId = overId.replace('column-', '');
      const sourceColumnId = findColumnForTask(activeId);
      
      if (sourceColumnId && sourceColumnId !== columnId) {
        // Different column drop
        const sourceColumn = columns[sourceColumnId];
        const destColumn = columns[columnId];
        
        if (!sourceColumn || !destColumn) return;
        
        const sourceTaskIds = [...sourceColumn.taskIds];
        const destTaskIds = [...destColumn.taskIds];
        
        const sourceIndex = sourceTaskIds.indexOf(activeId);
        
        // Remove from source column
        if (sourceIndex !== -1) {
          sourceTaskIds.splice(sourceIndex, 1);
        }
        
        // Add to destination column at the end
        destTaskIds.push(activeId);
        
        // Update columns state
        setColumns({
          ...columns,
          [sourceColumnId]: {
            ...sourceColumn,
            taskIds: sourceTaskIds
          },
          [columnId]: {
            ...destColumn,
            taskIds: destTaskIds
          }
        });
      }
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
  
  // Find the active task
  const activeTask = activeId ? tasks.find(task => task._id === activeId) : null;
  
  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {orderedColumns.map((column) => (
            <div 
              key={column.id} 
              className="bg-white dark:bg-dark-800 rounded-lg shadow-md flex flex-col"
            >
              {/* Column header */}
              <div className="bg-gray-100 dark:bg-dark-700 p-3 rounded-t-lg border-b dark:border-dark-600 flex justify-between items-center">
                <h3 className="font-medium">
                  {column.title} ({column.taskIds.length})
                </h3>
              </div>
              
              {/* Tasks container */}
              <div
                id={`column-${column.id}`}
                className="p-3 flex-grow min-h-[200px]"
              >
                {column.taskIds.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center text-sm mt-4">
                    No tasks in this status
                  </p>
                ) : (
                  <SortableContext
                    id={column.id}
                    items={column.taskIds}
                    strategy={verticalListSortingStrategy}
                  >
                    <ul className="space-y-2">
                      {column.taskIds.map((taskId) => {
                        const task = tasks.find(t => t._id === taskId);
                        if (!task) return null;
                        
                        return (
                          <SortableItem 
                            key={task._id} 
                            id={task._id}
                            containerId={column.id}
                            onClick={() => handleTaskClick(task)}
                          >
                            <TaskCard task={task} />
                          </SortableItem>
                        );
                      })}
                    </ul>
                  </SortableContext>
                )}
              </div>
              
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
        
        <DragOverlay>
          {activeId && activeTask ? (
            <div className="bg-white dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-md shadow-lg opacity-80">
              <TaskCard task={activeTask} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      
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