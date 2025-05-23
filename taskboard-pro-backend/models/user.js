const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    unique: true
  },
  displayName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  photoURL: {
    type: String
  },
  projects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  badges: [{
    name: {
      type: String,
      required: true
    },
    awardedAt: {
      type: Date,
      default: Date.now
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project'
    }
  }]
});

module.exports = mongoose.model('User', userSchema);