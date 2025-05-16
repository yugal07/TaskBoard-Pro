const Task = require('../models/task');

exports.validateDependencies = async (taskId, dependencies) => {
  const errors = [];
  
  // Validate each dependency
  for (const dependency of dependencies) {
    // Check if dependency task exists
    const dependencyTask = await Task.findById(dependency.task);
    if (!dependencyTask) {
      errors.push(`Task with ID ${dependency.task} not found`);
      continue;
    }
    
    // Check if tasks belong to same project
    const sourceTask = await Task.findById(taskId);
    if (sourceTask.project.toString() !== dependencyTask.project.toString()) {
      errors.push('Dependencies must be within the same project');
    }
    
    // Check for circular dependencies
    if (dependency.type === 'blocked_by') {
      const isCircular = await isCircularDependency(taskId, dependency.task);
      if (isCircular) {
        errors.push('Circular dependency detected');
      }
    }
  }
  
  return errors;
};

async function isCircularDependency(sourceId, targetId, visited = new Set()) {
  if (sourceId === targetId) return true;
  if (visited.has(targetId)) return false;
  
  visited.add(targetId);
  
  const task = await Task.findById(targetId);
  if (!task || !task.dependencies) return false;
  
  for (const dep of task.dependencies) {
    if (dep.type === 'blocked_by') {
      const circular = await isCircularDependency(
        sourceId, 
        dep.task.toString(), 
        visited
      );
      if (circular) return true;
    }
  }
  
  return false;
}