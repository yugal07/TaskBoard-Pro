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

exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Check if user exists in our database
    const user = await User.findOne({ email });
    
    if (!user) {
      // For security reasons, don't reveal if email exists or not
      return res.status(200).json({ message: 'If your email is registered, you will receive a password reset link' });
    }
    
    // Use Firebase Admin to generate password reset link
    const resetLink = await admin.auth().generatePasswordResetLink(email, {
      url: process.env.FRONTEND_URL + '/reset-password',
      handleCodeInApp: true
    });
    
    // You can implement your own email sending logic here
    // For example, using nodemailer or a service like SendGrid
    // await sendEmail(email, 'Password Reset', `Click this link to reset your password: ${resetLink}`);
    
    res.status(200).json({ message: 'If your email is registered, you will receive a password reset link' });
  } catch (error) {
    console.error('Error generating password reset link:', error);
    res.status(500).json({ message: 'Failed to process password reset request' });
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