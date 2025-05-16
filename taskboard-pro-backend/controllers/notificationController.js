const { validationResult } = require('express-validator');
const Notification = require('../models/notification');
const User = require('../models/user');
const socketService = require('../services/socketService');

// Get all notifications for the current user
exports.getUserNotifications = async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid });
    
    const notifications = await Notification.find({ recipient: user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('relatedProject', 'title')
      .populate('relatedTask', 'title');
      
    res.status(200).json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark a notification as read
exports.markAsRead = async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid });
    const notification = await Notification.findById(req.params.notificationId);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    // Check if notification belongs to user
    if (notification.recipient.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to modify this notification' });
    }
    
    notification.isRead = true;
    await notification.save();
    
    res.status(200).json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid });
    
    await Notification.updateMany(
      { recipient: user._id, isRead: false },
      { isRead: true }
    );
    
    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a notification (internal use only)
exports.createNotification = async (recipientId, content, type, relatedProject = null, relatedTask = null) => {
  try {
    const notification = new Notification({
      recipient: recipientId,
      content,
      type,
      relatedProject,
      relatedTask,
      isRead: false
    });
    
    await notification.save();
    
    // Populate notification data for socket
    const populatedNotification = await Notification.findById(notification._id)
      .populate('relatedProject', 'title')
      .populate('relatedTask', 'title');
    
    // Emit socket event for real-time update
    socketService.emitNotification(recipientId, populatedNotification);
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};