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
      .populate({
        path: 'members.user',
        select: 'displayName email photoURL'
      });
      
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
    
    // Check if user is a project member
    if (!project.members.includes(user._id)) {
      return res.status(403).json({ message: 'Only project members can update the project' });
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

// Invite a user to a project - simplified permission check
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
    
    // Check if user is a project member
    if (!project.members.includes(user._id)) {
      return res.status(403).json({ message: 'Only project members can invite users' });
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
    await notificationService.createProjectInvitationNotification(project, invitedUser._id)
    
    // Add project to user's projects
    invitedUser.projects.push(project._id);
    await invitedUser.save();
    
    res.status(200).json({ message: 'User invited successfully' });
  } catch (error) {
    console.error('Error inviting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update project statuses - simplified permission check
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
    
    // Check if user is a project member
    if (!project.members.includes(user._id)) {
      return res.status(403).json({ message: 'Only project members can update statuses' });
    }
    
    project.statuses = statuses;
    await project.save();
    
    res.status(200).json(project);
  } catch (error) {
    console.error('Error updating statuses:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateMemberRole = async (req, res) => {
  try {
    const { projectId, memberId } = req.params;
    const { role } = req.body;
    
    // Find the project
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Find the member in the project
    const memberIndex = project.members.findIndex(
      member => member.user && member.user.toString() === memberId
    );
    
    if (memberIndex === -1) {
      return res.status(404).json({ message: 'Member not found in project' });
    }
    
    // Prevent changing the role of the project owner
    if (project.owner.toString() === memberId) {
      return res.status(403).json({ message: 'Cannot change the role of the project owner' });
    }
    
    // Prevent changing own role if admin
    const user = await User.findOne({ uid: req.user.uid });
    if (user._id.toString() === memberId) {
      return res.status(403).json({ message: 'Cannot change your own role' });
    }
    
    // Update the member's role
    project.members[memberIndex].role = role;
    
    await project.save();
    
    res.status(200).json({
      message: 'Member role updated successfully',
      member: project.members[memberIndex]
    });
  } catch (error) {
    console.error('Error updating member role:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Remove a member from a project
exports.removeMember = async (req, res) => {
  try {
    const { projectId, memberId } = req.params;
    
    // Find the project
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Prevent removing the project owner
    if (project.owner.toString() === memberId) {
      return res.status(403).json({ message: 'Cannot remove the project owner' });
    }
    
    // Check if trying to remove self (not allowed if last admin)
    const user = await User.findOne({ uid: req.user.uid });
    if (user._id.toString() === memberId) {
      // Count admins in the project
      const adminCount = project.members.filter(member => member.role === 'Admin').length;
      
      if (adminCount <= 1) {
        return res.status(403).json({ message: 'Cannot leave project as the last admin. Transfer ownership or delete the project instead.' });
      }
    }
    
    // Remove member from project
    project.members = project.members.filter(
      member => member.user && member.user.toString() !== memberId
    );
    
    await project.save();
    
    // Remove project from user's projects list
    await User.findByIdAndUpdate(memberId, {
      $pull: { projects: projectId }
    });
    
    res.status(200).json({ message: 'Member removed from project successfully' });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all members of a project with their roles
exports.getProjectMembers = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Find the project and populate member details
    const project = await Project.findById(projectId)
      .populate('members.user', 'displayName email photoURL');
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Format the response
    const members = project.members.map(member => ({
      id: member.user._id,
      displayName: member.user.displayName,
      email: member.user.email,
      photoURL: member.user.photoURL,
      role: member.role,
      joinedAt: member.joinedAt,
      isOwner: project.owner.toString() === member.user._id.toString()
    }));
    
    res.status(200).json(members);
  } catch (error) {
    console.error('Error fetching project members:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update inviteUserToProject to include role assignment
exports.inviteUserToProject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { email, role = 'Editor' } = req.body; // Default to Editor if no role specified
    const user = await User.findOne({ uid: req.user.uid });
    
    const project = await Project.findById(req.params.projectId);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Find user by email
    const invitedUser = await User.findOne({ email });
    
    if (!invitedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user is already a member
    if (project.members.some(member => 
      member.user && member.user.toString() === invitedUser._id.toString()
    )) {
      return res.status(400).json({ message: 'User is already a project member' });
    }
    
    // Add user to project members with specified role
    project.members.push({
      user: invitedUser._id,
      role: role,
      joinedAt: new Date()
    });
    
    await project.save();
    await notificationService.createProjectInvitationNotification(project, invitedUser._id)
    
    // Add project to user's projects
    invitedUser.projects.push(project._id);
    await invitedUser.save();
    
    res.status(200).json({ 
      message: 'User invited successfully',
      role: role
    });
  } catch (error) {
    console.error('Error inviting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a project
exports.deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Get all users who have this project
    const users = await User.find({ projects: projectId });
    
    // Remove project from all users' projects array
    for (const user of users) {
      user.projects = user.projects.filter(p => p.toString() !== projectId);
      await user.save();
    }
    
    // Delete all related data (tasks, automations, etc.)
    await Task.deleteMany({ project: projectId });
    await Automation.deleteMany({ project: projectId });
    
    // Finally delete the project
    await Project.findByIdAndDelete(projectId);
    
    res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ message: 'Server error' });
  }
};