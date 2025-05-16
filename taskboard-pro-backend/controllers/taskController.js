const { validationResult } = require('express-validator');
const Task = require('../models/task');
const Project = require('../models/project');
const User = require('../models/user');
const automationService = require('../services/automationService');
const socketService = require('../services/socketService'); 
const notificationService = require("../services/notificationServices");

// Get all tasks for a project
exports.getProjectTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ project: req.params.projectId })
      .populate('assignee', 'displayName email photoURL')
      .populate('createdBy', 'displayName email');
      
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
    const { title, description, project: projectId, status, assignee, dueDate } = req.body;
    const user = await User.findOne({ uid: req.user.uid });
    
    // Check if user is a member of the project
    const project = await Project.findById(projectId);
    if (!project || !project.members.includes(user._id)) {
      return res.status(403).json({ message: 'Not authorized to add tasks to this project' });
    }
    
    // Validate status
    const validStatus = project.statuses.some(s => s.name === status);
    if (!validStatus) {
      return res.status(400).json({ message: 'Invalid status for this project' });
    }
    
    const task = new Task({
      title,
      description,
      project: projectId,
      status,
      assignee: assignee || null,
      dueDate: dueDate || null,
      createdBy: user._id
    });
    
    await task.save();
    if(assignee) {
        await notificationService.createTaskAssignmentNotification(task , user._id)
    }
    
    // Populate task data for response and socket
    const populatedTask = await Task.findById(task._id)
      .populate('assignee', 'displayName email photoURL')
      .populate('createdBy', 'displayName email');
    
    // Emit socket event for real-time update
    socketService.emitTaskCreated(projectId, populatedTask);
    
    // Check for automations to trigger
    if (assignee) {
      await automationService.processTaskAssignment(task);
    }
    
    res.status(201).json(populatedTask);
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
    const { title, description, status, assignee, dueDate } = req.body;
    
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
        await notificationService.createStatusChangeNotification(task , previousStatus);
    }
    
    // Check if assignee has changed to track for automations
    const assigneeChanged = 
      (assignee && (!task.assignee || task.assignee.toString() !== assignee)) ||
      (!assignee && task.assignee);
    
    if(assigneeChanged && task.assignee) {
        await notificationService.createTaskAssignmentNotification(task , user._id);
    }
    
    // Update task fields
    task.title = title;
    task.description = description;
    
    // Validate status if provided
    if (status) {
      const validStatus = project.statuses.some(s => s.name === status);
      if (!validStatus) {
        return res.status(400).json({ message: 'Invalid status for this project' });
      }
      task.status = status;
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
      .populate('createdBy', 'displayName email');
    
    // Emit socket event for real-time update
    socketService.emitTaskUpdate(task.project, populatedTask);
    
    // Process automations if needed
    if (statusChanged) {
      await automationService.processStatusChange(task, previousStatus);
    }
    
    if (assigneeChanged) {
      await automationService.processTaskAssignment(task);
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
    
    await Task.deleteOne({ _id: task._id });
    
    // Emit socket event for real-time update
    socketService.emitTaskDeleted(projectId, taskId);
    
    res.status(200).json({ message: 'Task deleted' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Server error' });
  }
};