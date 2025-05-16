
const Automation = require('../models/Automation');
const Task = require('../models/task');
const User = require('../models/user');
const notificationService = require('./notificationService');

// Process automations when a task's status changes
exports.processStatusChange = async (task, previousStatus) => {
  try {
    // Find all active automations with status change trigger
    const automations = await Automation.find({
      project: task.project,
      'trigger.type': 'task_status_change',
      active: true
    });
    
    for (const automation of automations) {
      // Check if the automation condition matches
      const condition = automation.trigger.condition;
      
      // Check if the status change matches the trigger condition
      const fromStatusMatches = !condition.fromStatus || condition.fromStatus === previousStatus;
      const toStatusMatches = !condition.toStatus || condition.toStatus === task.status;
      
      if (fromStatusMatches && toStatusMatches) {
        await executeAutomationAction(automation, task);
      }
    }
  } catch (error) {
    console.error('Error processing status change automations:', error);
  }
};

// Process automations when a task is assigned
exports.processTaskAssignment = async (task) => {
  try {
    if (!task.assignee) return;
    
    // Find all active automations with assignment trigger
    const automations = await Automation.find({
      project: task.project,
      'trigger.type': 'task_assignment',
      active: true
    });
    
    for (const automation of automations) {
      // Check if the automation condition matches
      const condition = automation.trigger.condition;
      
      // Check if the assignee matches the condition (if specified)
      const assigneeMatches = !condition.assigneeId || 
        condition.assigneeId === task.assignee.toString();
      
      if (assigneeMatches) {
        await executeAutomationAction(automation, task);
      }
    }
  } catch (error) {
    console.error('Error processing task assignment automations:', error);
  }
};

// Process automations for due date passed
exports.processDueDatePassed = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find tasks with due dates that have passed
    const tasks = await Task.find({
      dueDate: { $lt: today },
      status: { $ne: 'Done' } // Only consider tasks not marked as done
    }).populate('project');
    
    for (const task of tasks) {
      // Find all active automations with due date passed trigger
      const automations = await Automation.find({
        project: task.project._id,
        'trigger.type': 'due_date_passed',
        active: true
      });
      
      for (const automation of automations) {
        // Due date passed automations don't usually have additional conditions
        await executeAutomationAction(automation, task);
      }
    }
  } catch (error) {
    console.error('Error processing due date automations:', error);
  }
};

// Helper function to execute automation actions
const executeAutomationAction = async (automation, task) => {
  try {
    const action = automation.action;
    
    switch (action.type) {
      case 'change_status':
        // Update task status
        await Task.findByIdAndUpdate(task._id, {
          status: action.params.status
        });
        console.log(`Automation: Changed task ${task._id} status to ${action.params.status}`);
        break;
        
      case 'assign_badge':
        // Assign badge to user
        if (task.assignee) {
          const user = await User.findById(task.assignee);
          
          // Initialize badges array if it doesn't exist
          if (!user.badges) {
            user.badges = [];
          }
          
          // Check if user already has this badge
          const hasBadge = user.badges.some(badge => 
            badge.name === action.params.badgeName
          );
          
          if (!hasBadge) {
            // Add the badge
            user.badges.push({
              name: action.params.badgeName,
              awardedAt: new Date(),
              projectId: task.project
            });
            
            await user.save();
            
            // Create notification for badge
            await notificationService.createBadgeNotification(
              user._id,
              action.params.badgeName,
              task.project
            );
            
            console.log(`Automation: Assigned badge ${action.params.badgeName} to user ${user._id}`);
          }
        }
        break;
        
      case 'send_notification':
        // Send notification
        if (task.assignee) {
          await notificationService.createCustomNotification(
            task.assignee,
            action.params.message || 'Automated notification',
            'automation',
            task.project,
            task._id
          );
          
          console.log(`Automation: Sent notification to user ${task.assignee}`);
        }
        break;
        
      default:
        console.log(`Unsupported automation action type: ${action.type}`);
    }
  } catch (error) {
    console.error('Error executing automation action:', error);
  }
};

// Process automations when a task is created
exports.processTaskCreation = async (task) => {
  try {
    // Find all active automations with task creation trigger
    const automations = await Automation.find({
      project: task.project,
      'trigger.type': 'task_creation',
      active: true
    });
    
    for (const automation of automations) {
      // Check if conditions match (e.g., specific assignee, specific tags)
      const condition = automation.trigger.condition;
      
      let conditionMet = true;
      
      // Check assignee condition if specified
      if (condition.assigneeId && 
          (!task.assignee || task.assignee.toString() !== condition.assigneeId)) {
        conditionMet = false;
      }
      
      // Check tags condition if specified
      if (condition.tags && condition.tags.length > 0) {
        const hasAllTags = condition.tags.every(tag => 
          task.tags && task.tags.includes(tag)
        );
        if (!hasAllTags) {
          conditionMet = false;
        }
      }
      
      // Execute automation if conditions are met
      if (conditionMet) {
        await executeAutomationAction(automation, task);
      }
    }
  } catch (error) {
    console.error('Error processing task creation automations:', error);
  }
};