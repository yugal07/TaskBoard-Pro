const admin = require('../config/firebase-admin');
const User = require('../models/user');

module.exports = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }
    
    // Verify token with Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Get user from database
    const user = await User.findOne({ uid: decodedToken.uid });
    
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }
    
    // Attach user to socket
    socket.user = user;
    
    // Join user's personal room for notifications
    socket.join(`user:${user._id}`);
    
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication error: Invalid token'));
  }
};