const admin = require('../config/firebase-admin');
const User = require('../models/user');

// Middleware to validate Firebase auth token
exports.verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    const token = authHeader.split('Bearer ')[1];
    
    // Verify token with Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    
    // Get user from database
    const user = await User.findOne({ uid: decodedToken.uid });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    req.dbUser = user;
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Middleware to check project membership
exports.isProjectMember = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const user = req.dbUser;
    
    // Check if user is a member of the project
    const isMember = user.projects.includes(projectId);
    
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied: Not a project member' });
    }
    
    next();
  } catch (error) {
    console.error('Error checking project membership:', error);
    res.status(500).json({ message: 'Server error' });
  }
};