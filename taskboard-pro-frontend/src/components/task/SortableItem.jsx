import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export function SortableItem({ id, containerId, children, onClick }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id,
    data: {
      sortable: {
        containerId
      }
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`rounded-md border ${
        isDragging
          ? 'bg-gray-100 dark:bg-dark-600 shadow-md'
          : 'bg-white dark:bg-dark-700 border-gray-200 dark:border-dark-600'
      }`}
    >
      {children}
    </li>
  );
}