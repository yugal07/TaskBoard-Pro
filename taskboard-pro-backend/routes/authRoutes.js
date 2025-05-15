const express = require('express');
const { check } = require('express-validator');
const { verifyToken, isProjectMember } = require('../middleware/auth');
const projectController = require('../controllers/projectController');

const router = express.Router();

// @route   GET /api/projects
// @desc    Get all projects for current user
// @access  Private
router.get(
  '/',
  verifyToken,
  projectController.getUserProjects
);

// @route   POST /api/projects
// @desc    Create a new project
// @access  Private
router.post(
  '/',
  [
    verifyToken,
    [
      check('title', 'Title is required').not().isEmpty(),
      check('description', 'Description is required').not().isEmpty()
    ]
  ],
  projectController.createProject
);

// @route   GET /api/projects/:projectId
// @desc    Get a project by ID
// @access  Private (project members only)
router.get(
  '/:projectId',
  [verifyToken, isProjectMember],
  projectController.getProjectById
);

// @route   PUT /api/projects/:projectId
// @desc    Update a project
// @access  Private (project owner only)
router.put(
  '/:projectId',
  [
    verifyToken,
    isProjectMember,
    [
      check('title', 'Title is required').not().isEmpty(),
      check('description', 'Description is required').not().isEmpty()
    ]
  ],
  projectController.updateProject
);

// @route   POST /api/projects/:projectId/invite
// @desc    Invite a user to a project
// @access  Private (project owner only)
router.post(
  '/:projectId/invite',
  [
    verifyToken,
    isProjectMember,
    [
      check('email', 'Valid email is required').isEmail()
    ]
  ],
  projectController.inviteUserToProject
);

// @route   POST /api/projects/:projectId/statuses
// @desc    Add or update project statuses
// @access  Private (project owner only)
router.post(
  '/:projectId/statuses',
  [
    verifyToken,
    isProjectMember,
    [
      check('statuses', 'Statuses must be an array').isArray(),
      check('statuses.*.name', 'Status name is required').not().isEmpty(),
      check('statuses.*.order', 'Status order is required').isNumeric()
    ]
  ],
  projectController.updateProjectStatuses
);

module.exports = router;