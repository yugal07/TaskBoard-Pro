const { validationResult } = require('express-validator');
const Automation = require('../models/Automation');
const Project = require('../models/project');
const User = require('../models/user');

// Get all automations for a project
exports.getProjectAutomations = async (req, res) => {
  try {
    const automations = await Automation.find({ project: req.params.projectId })
      .populate('createdBy', 'displayName email');
      
    res.status(200).json(automations);
  } catch (error) {
    console.error('Error fetching automations:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new automation
exports.createAutomation = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { project: projectId, name, trigger, action, active } = req.body;
    const user = await User.findOne({ uid: req.user.uid });
    
    // Check if user is a member of the project
    const project = await Project.findById(projectId);
    if (!project || !project.members.includes(user._id)) {
      return res.status(403).json({ message: 'Not authorized to add automations to this project' });
    }
    
    // For status change actions, validate status
    if (action.type === 'change_status' && action.params && action.params.status) {
      const validStatus = project.statuses.some(s => s.name === action.params.status);
      if (!validStatus) {
        return res.status(400).json({ message: 'Invalid status in automation action' });
      }
    }
    
    const automation = new Automation({
      project: projectId,
      name,
      trigger,
      action,
      active: active !== undefined ? active : true,
      createdBy: user._id
    });
    
    await automation.save();
    
    res.status(201).json(automation);
  } catch (error) {
    console.error('Error creating automation:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update an automation
exports.updateAutomation = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { name, trigger, action, active } = req.body;
    
    // Find automation
    const automation = await Automation.findById(req.params.automationId);
    
    if (!automation) {
      return res.status(404).json({ message: 'Automation not found' });
    }
    
    // Check if user is a member of the project
    const user = await User.findOne({ uid: req.user.uid });
    const project = await Project.findById(automation.project);
    
    if (!project || !project.members.includes(user._id)) {
      return res.status(403).json({ message: 'Not authorized to update this automation' });
    }
    
    // For status change actions, validate status
    if (action.type === 'change_status' && action.params && action.params.status) {
      const validStatus = project.statuses.some(s => s.name === action.params.status);
      if (!validStatus) {
        return res.status(400).json({ message: 'Invalid status in automation action' });
      }
    }
    
    // Update automation fields
    automation.name = name;
    automation.trigger = trigger;
    automation.action = action;
    if (active !== undefined) {
      automation.active = active;
    }
    
    await automation.save();
    
    res.status(200).json(automation);
  } catch (error) {
    console.error('Error updating automation:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete an automation
exports.deleteAutomation = async (req, res) => {
  try {
    const automation = await Automation.findById(req.params.automationId);
    
    if (!automation) {
      return res.status(404).json({ message: 'Automation not found' });
    }
    
    // Check if user is a member of the project
    const user = await User.findOne({ uid: req.user.uid });
    const project = await Project.findById(automation.project);
    
    if (!project || !project.members.includes(user._id)) {
      return res.status(403).json({ message: 'Not authorized to delete this automation' });
    }
    
    await Automation.deleteOne({ _id: automation._id });
    
    res.status(200).json({ message: 'Automation deleted' });
  } catch (error) {
    console.error('Error deleting automation:', error);
    res.status(500).json({ message: 'Server error' });
  }
};