const express = require('express');
const { verifyToken } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get all notifications for current user
// @access  Private
router.get(
  '/',
  verifyToken,
  notificationController.getUserNotifications
);

// @route   PUT /api/notifications/:notificationId/read
// @desc    Mark a notification as read
// @access  Private
router.put(
  '/:notificationId/read',
  verifyToken,
  notificationController.markAsRead
);

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put(
  '/read-all',
  verifyToken,
  notificationController.markAllAsRead
);

module.exports = router;