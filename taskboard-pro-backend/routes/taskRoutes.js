const express = require('express');
const { check } = require('express-validator');
const { verifyToken, isProjectMember } = require('../middleware/auth');
const taskController = require('../controllers/taskController');

const router = express.Router();

// @route   GET /api/tasks/project/:projectId
// @desc    Get all tasks for a project
// @access  Private (project members only)
router.get(
  '/project/:projectId',
  [verifyToken, isProjectMember],
  taskController.getProjectTasks
);

// @route   POST /api/tasks
// @desc    Create a new task
// @access  Private (project members only)
router.post(
  '/',
  [
    verifyToken,
    [
      check('title', 'Title is required').not().isEmpty(),
      check('project', 'Project ID is required').not().isEmpty(),
      check('status', 'Status is required').not().isEmpty()
    ]
  ],
  taskController.createTask
);

// @route   PUT /api/tasks/:taskId
// @desc    Update a task
// @access  Private (project members only)
router.put(
  '/:taskId',
  [
    verifyToken,
    [
      check('title', 'Title is required').not().isEmpty()
    ]
  ],
  taskController.updateTask
);

// @route   DELETE /api/tasks/:taskId
// @desc    Delete a task
// @access  Private (project members only)
router.delete(
  '/:taskId',
  verifyToken,
  taskController.deleteTask
);

module.exports = router;