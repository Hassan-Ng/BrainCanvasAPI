const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Signup
router.post('/signup', async (req, res) => {
  const { email, password, firstName, lastName } = req.body;
  console.log(email, password, firstName, lastName);
  
  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: 'Email already in use' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName
    });

    const token = generateToken(user);
    res.status(201).json({
      token,
      user
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Signin
router.post('/signin', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const token = generateToken(user);
    res.json({
      token,
      user
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get Authenticated User
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'No user with that email' });

    // Create a short-lived token (15 minutes)
    const resetToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Reset link (frontend page should handle this)
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Email content
    const html = `
      <h3>Password Reset Request</h3>
      <p>You requested to reset your password. Click below link:</p>
      <a href="${resetUrl}" target="_blank">${resetUrl}</a>
      <p>If you didn’t request this, ignore this email.</p>
    `;

    // Send email
    await sendEmail(user.email, 'Password Reset Request', html);

    res.json({ message: 'Password reset link sent to your email' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reset Password
router.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) return res.status(400).json({ error: 'Invalid token or user not found' });

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Password has been reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(400).json({ error: 'Invalid or expired token' });
  }
});

module.exports = router;
