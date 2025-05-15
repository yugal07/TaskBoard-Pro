const express = require('express');
const { check } = require('express-validator');
const { verifyToken } = require('../middleware/auth');
const authController = require('../controllers/authController');

const router = express.Router();

// @route   POST /api/auth/user-profile
// @desc    Create or update user profile after Firebase authentication
// @access  Private
router.post(
  '/user-profile',
  verifyToken,
  authController.createUserProfile
);

// @route   GET /api/auth/me
// @desc    Get current user's profile
// @access  Private
router.get(
  '/me',
  verifyToken,
  authController.getCurrentUser
);

module.exports = router;