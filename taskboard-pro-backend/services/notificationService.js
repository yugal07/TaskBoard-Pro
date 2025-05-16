const notificationController = require('../controllers/notificationController');

// Create a task assignment notification
exports.createTaskAssignmentNotification = async (task, assignerId) => {
  try {
    if (!task.assignee) return;
    
    // Don't send notification if user assigns to themself
    if (task.assignee.toString() === assignerId.toString()) return;
    
    const message = `You have been assigned to the task "${task.title}"`;
    
    await notificationController.createNotification(
      task.assignee,
      message,
      'task_assignment',
      task.project,
      task._id
    );
  } catch (error) {
    console.error('Error creating task assignment notification:', error);
  }
};

// Create a status change notification
exports.createStatusChangeNotification = async (task, oldStatus) => {
  try {
    if (!task.assignee) return;
    
    const message = `Task "${task.title}" has been moved from "${oldStatus}" to "${task.status}"`;
    
    await notificationController.createNotification(
      task.assignee,
      message,
      'status_change',
      task.project,
      task._id
    );
  } catch (error) {
    console.error('Error creating status change notification:', error);
  }
};

// Create a due date notification
exports.createDueDateNotification = async (task) => {
  try {
    if (!task.assignee || !task.dueDate) return;
    
    const dueDate = new Date(task.dueDate).toLocaleDateString();
    const message = `Task "${task.title}" is due soon (${dueDate})`;
    
    await notificationController.createNotification(
      task.assignee,
      message,
      'due_date',
      task.project,
      task._id
    );
  } catch (error) {
    console.error('Error creating due date notification:', error);
  }
};

// Create a project invitation notification
exports.createProjectInvitationNotification = async (project, invitedUserId) => {
  try {
    const message = `You have been invited to join the project "${project.title}"`;
    
    await notificationController.createNotification(
      invitedUserId,
      message,
      'project_invitation',
      project._id,
      null
    );
  } catch (error) {
    console.error('Error creating project invitation notification:', error);
  }
};

// Create a custom notification from automation
exports.createCustomNotification = async (userId, message, type, projectId, taskId = null) => {
  try {
    const content = message;
    
    await notificationController.createNotification(
      userId,
      content,
      type,
      projectId,
      taskId
    );
  } catch (error) {
    console.error('Error creating custom notification:', error);
  }
};

// Create a badge notification
exports.createBadgeNotification = async (userId, badgeName, projectId) => {
  try {
    const message = `Congratulations! You've earned the "${badgeName}" badge`;
    
    await notificationController.createNotification(
      userId,
      message,
      'badge',
      projectId,
      null
    );
  } catch (error) {
    console.error('Error creating badge notification:', error);
  }
};