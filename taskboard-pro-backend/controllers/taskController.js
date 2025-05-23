const { validationResult } = require('express-validator');
const Task = require('../models/task');
const Project = require('../models/project');
const User = require('../models/user');
const automationService = require('../services/automationService');
const socketService = require('../services/socketService'); 
const notificationService = require("../services/notificationService");

// Get all tasks for a project
exports.getProjectTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ project: req.params.projectId })
      .populate('assignee', 'displayName email photoURL')
      .populate('createdBy', 'displayName email')
      .populate('dependencies.task', 'title status');
      
    res.status(200).json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new task

exports.createTask = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { 
      title, 
      description, 
      project: projectId, 
      status, 
      assignee, 
      dueDate,
      priority,
      tags,
      dependencies,
      timeTracking 
    } = req.body;
    
    console.log('Creating task with data:', { 
      title, 
      projectId,
      status,
      userUid: req.user.uid 
    });
    
    const user = await User.findOne({ uid: req.user.uid });
    console.log('User from auth:', user ? { 
      _id: user._id,
      uid: user.uid,
      email: user.email
    } : 'User not found');
    
    // Check if user is a member of the project
    const project = await Project.findById(projectId);
    console.log('Project found:', project ? { 
      _id: project._id, 
      title: project.title,
      memberCount: project.members.length 
    } : 'Project not found');
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Log project members for debugging
    console.log('Project members:', project.members.map(member => ({
      user: member.user,
      role: member.role
    })));
    
    // Check membership with proper comparison
    const isMember = project.members.some(member => 
      member.user && member.user.toString() === user._id.toString()
    );
    console.log('Is user a member?', isMember);
    
    if (!isMember) {
      console.log('Membership check failed:', {
        userObjectId: user._id.toString(),
        memberIds: project.members.map(m => m.user ? m.user.toString() : 'undefined')
      });
      return res.status(403).json({ message: 'Not authorized to add tasks to this project' });
    }
    
    // Validate status
    const validStatus = project.statuses.some(s => s.name === status);
    if (!validStatus) {
      return res.status(400).json({ message: 'Invalid status for this project' });
    }
    
    // Create task with all fields
    const task = new Task({
      title,
      description,
      project: projectId,
      status,
      assignee: assignee || null,
      dueDate: dueDate || null,
      priority: priority || 'Medium',
      tags: tags || [],
      dependencies: dependencies || [],
      timeTracking: timeTracking || { estimate: null, logged: 0, history: [] },
      createdBy: user._id
    });
    
    await task.save();
    console.log('Task created successfully:', { id: task._id, title: task.title });
    
    // Rest of your function (notifications, socket events, etc.)
    
    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a task
exports.updateTask = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { 
      title, 
      description, 
      status, 
      assignee, 
      dueDate,
      priority,
      tags,
      dependencies,
      timeTracking 
    } = req.body;
    
    // Find task and populate project for permissions check
    const task = await Task.findById(req.params.taskId);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check if user is a member of the project
    const user = await User.findOne({ uid: req.user.uid });
    const project = await Project.findById(task.project);
    
    if (!project || !project.members.includes(user._id)) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }
    
    // Check if status has changed to track for automations
    const statusChanged = task.status !== status;
    const previousStatus = task.status;

    if(statusChanged) {
        await notificationService.createStatusChangeNotification(task, previousStatus);
    }
    
    // Check if priority has changed
    const priorityChanged = priority && task.priority !== priority;
    
    // Check if assignee has changed to track for automations
    const assigneeChanged = 
      (assignee && (!task.assignee || task.assignee.toString() !== assignee)) ||
      (!assignee && task.assignee);
    
    if(assigneeChanged && task.assignee) {
        await notificationService.createTaskAssignmentNotification(task, user._id);
    }
    
    // Process dependencies if provided
    let processedDependencies = task.dependencies;
    if (dependencies) {
      processedDependencies = [];
      // Validate that all dependency tasks exist and belong to the same project
      for (const dependency of dependencies) {
        const dependencyTask = await Task.findById(dependency.task);
        if (!dependencyTask) {
          return res.status(400).json({ message: `Dependency task ${dependency.task} not found` });
        }
        if (dependencyTask.project.toString() !== task.project.toString()) {
          return res.status(400).json({ message: 'Dependency tasks must belong to the same project' });
        }
        processedDependencies.push({
          task: dependency.task,
          type: dependency.type
        });
      }
    }
    
    // Update task fields
    task.title = title;
    task.description = description;
    
    // Update time tracking if provided
    if (timeTracking) {
      if (timeTracking.estimate !== undefined) {
        task.timeTracking.estimate = timeTracking.estimate;
      }
      if (timeTracking.history) {
        task.timeTracking.history = timeTracking.history;
      } else if (timeTracking.newEntry) {
        // Add a new time tracking entry
        task.timeTracking.history.push(timeTracking.newEntry);
      }
    }
    
    // Validate status if provided
    if (status) {
      const validStatus = project.statuses.some(s => s.name === status);
      if (!validStatus) {
        return res.status(400).json({ message: 'Invalid status for this project' });
      }
      task.status = status;
    }
    
    // Update priority if provided
    if (priority) {
      task.priority = priority;
    }
    
    // Update tags if provided
    if (tags) {
      task.tags = tags;
    }
    
    // Update dependencies if provided
    if (dependencies) {
      task.dependencies = processedDependencies;
    }
    
    // Update assignee if provided
    if (assignee) {
      // Check if assignee is a project member
      const assigneeMember = project.members.includes(assignee);
      if (!assigneeMember) {
        return res.status(400).json({ message: 'Assignee must be a project member' });
      }
      task.assignee = assignee;
    } else if (assignee === null) {
      task.assignee = null;
    }
    
    // Update due date if provided
    if (dueDate) {
      task.dueDate = dueDate;
    } else if (dueDate === null) {
      task.dueDate = null;
    }
    
    await task.save();
    
    // Populate task data for response and socket
    const populatedTask = await Task.findById(task._id)
      .populate('assignee', 'displayName email photoURL')
      .populate('createdBy', 'displayName email')
      .populate('dependencies.task', 'title status');
    
    // Emit socket event for real-time update
    socketService.emitTaskUpdate(task.project, populatedTask);
    
    // Process automations if needed
    if (statusChanged) {
      await automationService.processStatusChange(task, previousStatus);
    }
    
    if (assigneeChanged) {
      await automationService.processTaskAssignment(task);
    }
    
    if (priorityChanged) {
      // If you add priority change automations in the future
      // await automationService.processPriorityChange(task, previousPriority);
    }
    
    res.status(200).json(populatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a task
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check if user is a member of the project
    const user = await User.findOne({ uid: req.user.uid });
    const project = await Project.findById(task.project);
    
    if (!project || !project.members.includes(user._id)) {
      return res.status(403).json({ message: 'Not authorized to delete this task' });
    }
    
    const projectId = task.project;
    const taskId = task._id;
    
    // Remove this task from any dependencies in other tasks
    await Task.updateMany(
      { 'dependencies.task': taskId },
      { $pull: { dependencies: { task: taskId } } }
    );
    
    await Task.deleteOne({ _id: task._id });
    
    // Emit socket event for real-time update
    socketService.emitTaskDeleted(projectId, taskId);
    
    res.status(200).json({ message: 'Task deleted' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add a new time tracking entry to a task
exports.addTimeTrackingEntry = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { duration } = req.body;
    
    const task = await Task.findById(req.params.taskId);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check if user is a member of the project
    const user = await User.findOne({ uid: req.user.uid });
    const project = await Project.findById(task.project);
    
    if (!project || !project.members.includes(user._id)) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }
    
    // Add duration to total logged time
    task.timeLogged = (task.timeLogged || 0) + parseInt(duration);
    
    await task.save();
    
    // Populate task data for response
    const populatedTask = await Task.findById(task._id)
      .populate('assignee', 'displayName email photoURL')
      .populate('createdBy', 'displayName email');
    
    // Emit socket event for real-time update
    socketService.emitTaskUpdate(task.project, populatedTask);
    
    res.status(200).json(populatedTask);
  } catch (error) {
    console.error('Error adding time entry:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get tasks by various filters
exports.getFilteredTasks = async (req, res) => {
  try {
    const { 
      projectId, 
      status, 
      assignee, 
      priority,
      dueDate,
      tags, 
      search
    } = req.query;
    
    // Build query
    const query = { project: projectId };
    
    if (status) {
      query.status = status;
    }
    
    if (assignee) {
      if (assignee === 'unassigned') {
        query.assignee = null;
      } else {
        query.assignee = assignee;
      }
    }
    
    if (priority) {
      query.priority = priority;
    }
    
    if (tags) {
      const tagArray = tags.split(',');
      query.tags = { $in: tagArray };
    }
    
    if (dueDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      switch (dueDate) {
        case 'overdue':
          query.dueDate = { $lt: today };
          break;
        case 'today':
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          query.dueDate = { $gte: today, $lt: tomorrow };
          break;
        case 'this-week':
          const nextWeek = new Date(today);
          nextWeek.setDate(nextWeek.getDate() + 7);
          query.dueDate = { $gte: today, $lt: nextWeek };
          break;
        case 'no-date':
          query.dueDate = null;
          break;
      }
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const tasks = await Task.find(query)
      .populate('assignee', 'displayName email photoURL')
      .populate('createdBy', 'displayName email')
      .populate('dependencies.task', 'title status');
    
    res.status(200).json(tasks);
  } catch (error) {
    console.error('Error fetching filtered tasks:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add to taskController.js
exports.updateTaskDependencies = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { dependencies } = req.body;
    
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Validate dependencies to prevent circular dependencies
    if (dependencies && dependencies.length > 0) {
      for (const dependency of dependencies) {
        // Check for self-dependency
        if (dependency.task === taskId) {
          return res.status(400).json({ message: 'A task cannot depend on itself' });
        }
        
        // Check for circular dependencies
        if (dependency.type === 'blocked_by') {
          const circularCheck = await checkCircularDependency(taskId, dependency.task);
          if (circularCheck) {
            return res.status(400).json({ message: 'Circular dependency detected' });
          }
        }
      }
    }
    
    task.dependencies = dependencies || [];
    await task.save();
    
    const populatedTask = await Task.findById(taskId)
      .populate('dependencies.task', 'title status');
      
    res.status(200).json(populatedTask);
  } catch (error) {
    console.error('Error updating task dependencies:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to check for circular dependencies
const checkCircularDependency = async (sourceTaskId, targetTaskId, visited = new Set()) => {
  if (sourceTaskId === targetTaskId) return true;
  if (visited.has(targetTaskId)) return false;
  
  visited.add(targetTaskId);
  
  const targetTask = await Task.findById(targetTaskId);
  if (!targetTask) return false;
  
  for (const dependency of targetTask.dependencies) {
    if (dependency.type === 'blocked_by') {
      const isCircular = await checkCircularDependency(
        sourceTaskId, 
        dependency.task.toString(),
        visited
      );
      if (isCircular) return true;
    }
  }
  
  return false;
};