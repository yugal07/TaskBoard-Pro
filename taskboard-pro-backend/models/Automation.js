const mongoose = require('mongoose');

const automationSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  trigger: {
    type: {
      type: String,
      enum: ['task_status_change', 'task_assignment', 'due_date_passed'],
      required: true
    },
    condition: {
      type: Object,
      required: true
    }
  },
  action: {
    type: {
      type: String,
      enum: ['assign_badge', 'change_status', 'send_notification'],
      required: true
    },
    params: {
      type: Object,
      required: true
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  trigger: {
    type: {
      type: String,
      enum: [
        'task_status_change', 
        'task_assignment', 
        'due_date_passed',
        'task_creation',
        'comment_added',
        'priority_change'
      ],
      required: true
    },
    condition: {
      type: Object,
      required: true
    },
    // Add conditional logic
    conditional: {
      operator: {
        type: String,
        enum: ['and', 'or', 'not']
      },
      conditions: [Object]
    }
  },
  actions: [{
    type: {
      type: String,
      enum: [
        'change_status', 
        'assign_badge', 
        'send_notification',
        'reassign_task',
        'add_comment',
        'change_priority',
        'apply_label',
        'remove_label'
      ],
      required: true
    },
    params: {
      type: Object,
      required: true
    }
  }]
});

// Update the updatedAt field before saving
automationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Automation', automationSchema);