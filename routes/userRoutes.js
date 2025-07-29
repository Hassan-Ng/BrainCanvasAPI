const express = require('express');
const User = require('../models/User');

const router = express.Router();

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find({}, 'firstName lastName email avatar');
    const result = users.map(u => ({
      id: u._id,
      name: `${u.firstName} ${u.lastName}`,
      email: u.email,
      avatar: u.avatar
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id, 'firstName lastName email avatar');
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      id: user._id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      avatar: user.avatar
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

module.exports = router;
