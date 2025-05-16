const express = require('express');
const { check } = require('express-validator');
const { verifyToken, isProjectMember } = require('../middleware/auth');
const { checkProjectPermission } = require('../middleware/rbac');
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
// @access  Private (Admin only)
router.put(
  '/:projectId',
  [
    verifyToken,
    isProjectMember,
    checkProjectPermission('edit'),
    [
      check('title', 'Title is required').not().isEmpty(),
      check('description', 'Description is required').not().isEmpty()
    ]
  ],
  projectController.updateProject
);

// @route   POST /api/projects/:projectId/invite
// @desc    Invite a user to a project
// @access  Private (Admin only)
router.post(
  '/:projectId/invite',
  [
    verifyToken,
    isProjectMember,
    checkProjectPermission('invite'),
    [
      check('email', 'Valid email is required').isEmail(),
      check('role', 'Valid role is required').optional().isIn(['Admin', 'Editor', 'Viewer'])
    ]
  ],
  projectController.inviteUserToProject
);

// @route   PUT /api/projects/:projectId/members/:memberId/role
// @desc    Update a member's role in a project
// @access  Private (Admin only)
router.put(
  '/:projectId/members/:memberId/role',
  [
    verifyToken,
    isProjectMember,
    checkProjectPermission('manage-roles'),
    [
      check('role', 'Valid role is required').isIn(['Admin', 'Editor', 'Viewer'])
    ]
  ],
  projectController.updateMemberRole
);

// @route   DELETE /api/projects/:projectId/members/:memberId
// @desc    Remove a member from a project
// @access  Private (Admin only, can't remove self if last admin)
router.delete(
  '/:projectId/members/:memberId',
  [
    verifyToken,
    isProjectMember,
    checkProjectPermission('manage-roles')
  ],
  projectController.removeMember
);

// @route   POST /api/projects/:projectId/statuses
// @desc    Add or update project statuses
// @access  Private (Admin only)
router.post(
  '/:projectId/statuses',
  [
    verifyToken,
    isProjectMember,
    checkProjectPermission('manage-statuses'),
    [
      check('statuses', 'Statuses must be an array').isArray(),
      check('statuses.*.name', 'Status name is required').not().isEmpty(),
      check('statuses.*.order', 'Status order is required').isNumeric()
    ]
  ],
  projectController.updateProjectStatuses
);

// @route   DELETE /api/projects/:projectId
// @desc    Delete a project
// @access  Private (Admin only)
router.delete(
  '/:projectId',
  [
    verifyToken,
    isProjectMember,
    checkProjectPermission('delete')
  ],
  projectController.deleteProject
);

// @route   GET /api/projects/:projectId/members
// @desc    Get all members of a project with their roles
// @access  Private (project members only)
router.get(
  '/:projectId/members',
  [
    verifyToken,
    isProjectMember
  ],
  projectController.getProjectMembers
);

module.exports = router;