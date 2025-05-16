const { validationResult } = require('express-validator');
const Project = require('../models/project');
const User = require('../models/user');
const notificationService = require("../services/notificationService");

// Get all projects for current user
exports.getUserProjects = async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid });
    
    const projects = await Project.find({
      _id: { $in: user.projects }
    })
      .select('title description owner createdAt')
      .populate('owner', 'displayName email photoURL');
      
    res.status(200).json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new project
exports.createProject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { title, description } = req.body;
    const user = await User.findOne({ uid: req.user.uid });
    
    const project = new Project({
      title,
      description,
      owner: user._id,
      members: [user._id]
    });
    
    await project.save();
    
    // Add project to user's projects
    user.projects.push(project._id);
    await user.save();
    
    res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a project by ID
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId)
      .populate('owner', 'displayName email photoURL')
      .populate('members', 'displayName email photoURL');
      
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    res.status(200).json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a project
exports.updateProject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { title, description } = req.body;
    const user = await User.findOne({ uid: req.user.uid });
    
    const project = await Project.findById(req.params.projectId);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if user is the project owner
    if (project.owner.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Only the project owner can update the project' });
    }
    
    project.title = title;
    project.description = description;
    
    await project.save();
    
    res.status(200).json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Invite a user to a project
exports.inviteUserToProject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { email } = req.body;
    const user = await User.findOne({ uid: req.user.uid });
    
    const project = await Project.findById(req.params.projectId);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if user is the project owner
    if (project.owner.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Only the project owner can invite users' });
    }
    
    // Find user by email
    const invitedUser = await User.findOne({ email });
    
    if (!invitedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user is already a member
    if (project.members.includes(invitedUser._id)) {
      return res.status(400).json({ message: 'User is already a project member' });
    }
    
    // Add user to project members
    project.members.push(invitedUser._id);
    await project.save();
    await notificationService.createProjectInvitationNotification(project , invitedUser._id)
    
    // Add project to user's projects
    invitedUser.projects.push(project._id);
    await invitedUser.save();
    
    res.status(200).json({ message: 'User invited successfully' });
  } catch (error) {
    console.error('Error inviting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update project statuses
exports.updateProjectStatuses = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { statuses } = req.body;
    const user = await User.findOne({ uid: req.user.uid });
    
    const project = await Project.findById(req.params.projectId);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if user is the project owner
    if (project.owner.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Only the project owner can update statuses' });
    }
    
    project.statuses = statuses;
    await project.save();
    
    res.status(200).json(project);
  } catch (error) {
    console.error('Error updating statuses:', error);
    res.status(500).json({ message: 'Server error' });
  }
};