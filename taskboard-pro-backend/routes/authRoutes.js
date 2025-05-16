const express = require('express');
const { check } = require('express-validator');
const { verifyToken } = require('../middleware/auth');
const authController = require('../controllers/authController');
const admin = require('../config/firebase-admin'); // Add this

const router = express.Router();

// New route for first-time user creation (without verifyToken middleware)
// @route   POST /api/auth/register
// @desc    Create user profile for first-time users
// @access  Private (verifies token but doesn't require user in database)
router.post(
  '/register',
  async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
      }
      
      const token = authHeader.split('Bearer ')[1];
      
      // Verify token with Firebase Admin
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.user = decodedToken;
      
      // Don't check for user in database - this is for first-time registration
      next();
    } catch (error) {
      console.error('Error verifying token for registration:', error);
      res.status(401).json({ message: 'Invalid token' });
    }
  },
  authController.createUserProfile
);

// Original routes
router.post(
  '/user-profile',
  verifyToken,
  authController.createUserProfile
);

router.get(
  '/me',
  verifyToken,
  authController.getCurrentUser
);

module.exports = router;