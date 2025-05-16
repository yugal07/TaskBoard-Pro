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
  
  // Make sure owner is always an Admin in the members array
  if (this.isNew) {
    const ownerIndex = this.members.findIndex(member => 
      member.user && member.user.toString() === this.owner.toString()
    );
    
    if (ownerIndex === -1) {
      // Owner not in members, add them
      this.members.push({
        user: this.owner,
        role: 'Admin',
        joinedAt: new Date()
      });
    } else {
      // Ensure owner has Admin role
      this.members[ownerIndex].role = 'Admin';
    }
  }
  
  next();
});

module.exports = mongoose.model('Project', projectSchema);