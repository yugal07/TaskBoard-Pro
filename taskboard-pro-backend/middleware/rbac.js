const Project = require('../models/project');
const User = require('../models/user');

// Role-based permission definitions
const permissions = {
  Admin: {
    project: ['view', 'edit', 'delete', 'invite', 'manage-statuses', 'manage-roles'],
    task: ['view', 'create', 'edit', 'delete', 'assign', 'move'],
    automation: ['view', 'create', 'edit', 'delete', 'enable', 'disable']
  },
  Editor: {
    project: ['view'],
    task: ['view', 'create', 'edit', 'delete', 'assign', 'move'],
    automation: ['view', 'create', 'edit', 'delete', 'enable', 'disable']
  },
  Viewer: {
    project: ['view'],
    task: ['view'],
    automation: ['view']
  }
};

// Check if user has permission for a resource
const hasPermission = (role, resource, action) => {
  if (!role || !resource || !action) return false;
  
  // Get permissions for the role
  const rolePermissions = permissions[role];
  if (!rolePermissions) return false;
  
  // Get permissions for the resource
  const resourcePermissions = rolePermissions[resource];
  if (!resourcePermissions) return false;
  
  // Check if the action is allowed
  return resourcePermissions.includes(action);
};

// Get user's role in a project
const getUserRole = async (userId, projectId) => {
  try {
    // Find the project
    const project = await Project.findById(projectId);
    if (!project) return null;
    
    // Check if user is the project owner (always Admin)
    if (project.owner.toString() === userId.toString()) {
      return 'Admin';
    }
    
    // Find the user's membership in the project
    const member = project.members.find(
      member => member.user && member.user.toString() === userId.toString()
    );
    
    return member ? member.role : null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
};

// Middleware to check project permissions
exports.checkProjectPermission = (action) => {
  return async (req, res, next) => {
    try {
      const { projectId } = req.params;
      const user = await User.findOne({ uid: req.user.uid });
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      
      // Get user's role in the project
      const role = await getUserRole(user._id, projectId);
      
      if (!role) {
        return res.status(403).json({ message: 'Access denied: Not a project member' });
      }
      
      // Check if the user has the required permission
      if (!hasPermission(role, 'project', action)) {
        return res.status(403).json({ message: `Access denied: Insufficient permissions for this action` });
      }
      
      // Add role to the request for later use
      req.userRole = role;
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ message: 'Server error during permission check' });
    }
  };
};

// Middleware to check task permissions
exports.checkTaskPermission = (action) => {
  return async (req, res, next) => {
    try {
      // Get the task to find its project
      const taskId = req.params.taskId;
      const Task = require('../models/task'); // Import here to avoid circular dependency
      
      const task = await Task.findById(taskId);
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }
      
      const projectId = task.project;
      const user = await User.findOne({ uid: req.user.uid });
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      
      // Get user's role in the project
      const role = await getUserRole(user._id, projectId);
      
      if (!role) {
        return res.status(403).json({ message: 'Access denied: Not a project member' });
      }
      
      // Check if the user has the required permission
      if (!hasPermission(role, 'task', action)) {
        return res.status(403).json({ message: `Access denied: Insufficient permissions for this action` });
      }
      
      // Add role and project to the request for later use
      req.userRole = role;
      req.projectId = projectId;
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ message: 'Server error during permission check' });
    }
  };
};

// Middleware to check automation permissions
exports.checkAutomationPermission = (action) => {
  return async (req, res, next) => {
    try {
      // For creation, get project ID from body
      let projectId;
      
      if (req.params.automationId) {
        // For updates/deletes, get the automation to find its project
        const Automation = require('../models/Automation'); // Import here to avoid circular dependency
        const automation = await Automation.findById(req.params.automationId);
        
        if (!automation) {
          return res.status(404).json({ message: 'Automation not found' });
        }
        
        projectId = automation.project;
      } else {
        // For creation, get project ID from body
        projectId = req.body.project;
      }
      
      const user = await User.findOne({ uid: req.user.uid });
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      
      // Get user's role in the project
      const role = await getUserRole(user._id, projectId);
      
      if (!role) {
        return res.status(403).json({ message: 'Access denied: Not a project member' });
      }
      
      // Check if the user has the required permission
      if (!hasPermission(role, 'automation', action)) {
        return res.status(403).json({ message: `Access denied: Insufficient permissions for this action` });
      }
      
      // Add role to the request for later use
      req.userRole = role;
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ message: 'Server error during permission check' });
    }
  };
};

// Export the hasPermission and getUserRole functions for use in controllers
exports.hasPermission = hasPermission;
exports.getUserRole = getUserRole;