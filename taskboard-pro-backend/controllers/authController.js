const { validationResult } = require('express-validator');
const User = require('../models/user');

// Create or update user profile after Firebase authentication
exports.createUserProfile = async (req, res) => {
  try {
    const { uid, displayName, email, photoURL } = req.body;
    
    // Check if user exists
    let user = await User.findOne({ uid });
    
    if (!user) {
      // Create new user
      user = new User({
        uid,
        displayName,
        email,
        photoURL,
        projects: []
      });
      
      await user.save();
    } else {
      // Update existing user
      user.displayName = displayName || user.displayName;
      user.photoURL = photoURL || user.photoURL;
      
      await user.save();
    }
    
    res.status(200).json(user);
  } catch (error) {
    console.error('Error creating/updating user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get current user's profile
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid })
      .select('-__v')
      .populate('projects', 'title');
      
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};