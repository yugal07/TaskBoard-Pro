const express = require('express');
const { check } = require('express-validator');
const { verifyToken, isProjectMember } = require('../middleware/auth');
const automationController = require('../controllers/automationController');

const router = express.Router();

// @route   GET /api/automations/project/:projectId
// @desc    Get all automations for a project
// @access  Private (project members only)
router.get(
  '/project/:projectId',
  [verifyToken, isProjectMember],
  automationController.getProjectAutomations
);

// @route   POST /api/automations
// @desc    Create a new automation
// @access  Private (project members only)
router.post(
  '/',
  [
    verifyToken,
    [
      check('project', 'Project ID is required').not().isEmpty(),
      check('name', 'Automation name is required').not().isEmpty(),
      check('trigger.type', 'Trigger type is required').isIn(['task_status_change', 'task_assignment', 'due_date_passed']),
      check('trigger.condition', 'Trigger condition is required').not().isEmpty(),
      check('action.type', 'Action type is required').isIn(['assign_badge', 'change_status', 'send_notification']),
      check('action.params', 'Action parameters are required').not().isEmpty()
    ]
  ],
  automationController.createAutomation
);

// @route   PUT /api/automations/:automationId
// @desc    Update an automation
// @access  Private (project members only)
router.put(
  '/:automationId',
  [
    verifyToken,
    [
      check('name', 'Automation name is required').not().isEmpty(),
      check('trigger.type', 'Trigger type is required').isIn(['task_status_change', 'task_assignment', 'due_date_passed']),
      check('trigger.condition', 'Trigger condition is required').not().isEmpty(),
      check('action.type', 'Action type is required').isIn(['assign_badge', 'change_status', 'send_notification']),
      check('action.params', 'Action parameters are required').not().isEmpty()
    ]
  ],
  automationController.updateAutomation
);

// @route   DELETE /api/automations/:automationId
// @desc    Delete an automation
// @access  Private (project members only)
router.delete(
  '/:automationId',
  verifyToken,
  automationController.deleteAutomation
);

module.exports = router;