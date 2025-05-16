const automationService = require('./automationService');

// Initialize scheduler
exports.init = () => {
  // Check for due date automations every day at midnight
  scheduleJob('0 0 * * *', async () => {
    console.log('Running scheduled due date automation check');
    await automationService.processDueDatePassed();
  });
};

// Simple scheduler function (for production you might want to use a proper scheduler like node-cron)
function scheduleJob(cronExpression, callback) {
  const [minute, hour, dayOfMonth, month, dayOfWeek] = cronExpression.split(' ');
  
  setInterval(() => {
    const now = new Date();
    
    // Very simple cron matcher - only checking for daily midnight runs
    // In production, use a proper scheduler library
    if (now.getHours() === parseInt(hour) && now.getMinutes() === parseInt(minute)) {
      callback();
    }
  }, 60000); // Check every minute
}