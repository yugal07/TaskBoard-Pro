const express = require('express');
const path = require('path');
const { verifyToken, isProjectMember } = require('../middleware/auth');
const fileUploadService = require('../services/fileUploadService');
const Task = require('../models/task');
const User = require('../models/user');

const router = express.Router();

// @route   POST /api/files/upload/:taskId
// @desc    Upload file attachment to a task
// @access  Private (project members only)
router.post(
  '/upload/:taskId',
  verifyToken,
  async (req, res, next) => {
    try {
      // Find the task to verify project membership
      const task = await Task.findById(req.params.taskId);
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }
      
      // Add projectId to request for the isProjectMember middleware
      req.params.projectId = task.project;
      next();
    } catch (error) {
      console.error('Error preparing upload:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },
  isProjectMember, // Check if user is a project member
  fileUploadService.upload.single('file'), // Handle file upload
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      const task = await Task.findById(req.params.taskId);
      const user = await User.findOne({ uid: req.user.uid });
      
      // Create file attachment data
      const attachment = {
        name: req.file.originalname,
        url: fileUploadService.getFileUrl(req.file.filename),
        type: req.file.mimetype,
        size: req.file.size,
        uploadedAt: new Date(),
        uploadedBy: user._id
      };
      
      // Add attachment to task
      task.attachments = task.attachments || [];
      task.attachments.push(attachment);
      await task.save();
      
      res.status(200).json(attachment);
    } catch (error) {
      console.error('Error saving file attachment:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   GET /api/files/:filename
// @desc    Download a file
// @access  Private (requires authentication)
router.get(
  '/:filename',
  verifyToken,
  async (req, res) => {
    try {
      const filename = req.params.filename;
      const filePath = path.join(__dirname, '../uploads', filename);
      
      // Security check: Make sure the user has access to this file
      // This requires finding a task that has this attachment
      const user = await User.findOne({ uid: req.user.uid });
      const tasks = await Task.find({
        'attachments.url': fileUploadService.getFileUrl(filename)
      }).populate('project');
      
      if (tasks.length === 0) {
        return res.status(404).json({ message: 'File not found' });
      }
      
      // Check if user is a member of any of the projects containing this file
      const hasAccess = tasks.some(task => 
        task.project.members.includes(user._id)
      );
      
      if (!hasAccess) {
        return res.status(403).json({ message: 'Not authorized to access this file' });
      }
      
      // Send the file
      res.sendFile(filePath);
    } catch (error) {
      console.error('Error downloading file:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   DELETE /api/files/:taskId/:attachmentId
// @desc    Delete a file attachment
// @access  Private (project members only)
router.delete(
  '/:taskId/:attachmentId',
  verifyToken,
  async (req, res) => {
    try {
      const { taskId, attachmentId } = req.params;
      
      // Find the task
      const task = await Task.findById(taskId);
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }
      
      // Check if user is a member of the project
      const user = await User.findOne({ uid: req.user.uid });
      const projectId = task.project;
      const project = await Project.findById(projectId);
      
      if (!project || !project.members.includes(user._id)) {
        return res.status(403).json({ message: 'Not authorized to modify this task' });
      }
      
      // Find the attachment
      const attachment = task.attachments.id(attachmentId);
      if (!attachment) {
        return res.status(404).json({ message: 'Attachment not found' });
      }
      
      // Extract filename from URL
      const urlParts = attachment.url.split('/');
      const filename = urlParts[urlParts.length - 1];
      const filePath = path.join(__dirname, '../uploads', filename);
      
      // Delete the file
      await fileUploadService.deleteFile(filePath);
      
      // Remove attachment from task
      task.attachments.pull(attachmentId);
      await task.save();
      
      res.status(200).json({ message: 'Attachment deleted successfully' });
    } catch (error) {
      console.error('Error deleting attachment:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;