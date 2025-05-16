const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['Admin', 'Editor', 'Viewer'],
      default: 'Editor'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  statuses: [{
    name: {
      type: String,
      required: true
    },
    order: {
      type: Number,
      required: true
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to add default statuses if not provided
projectSchema.pre('save', function(next) {
  if (this.isNew && (!this.statuses || this.statuses.length === 0)) {
    this.statuses = [
      { name: 'To Do', order: 1 },
      { name: 'In Progress', order: 2 },
      { name: 'Done', order: 3 }
    ];
  }
  next();
});

module.exports = mongoose.model('Project', projectSchema);