const express = require('express');
const router = express.Router();
const User = require('../model/user');
const { auth } = require('../middleware/auth');

// Search users by email or name (for collaborators)
router.get('/search', auth, async (req, res) => {
  try {
    const { q: searchQuery, limit = 10 } = req.query;
    
    if (!searchQuery || searchQuery.length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }

    // Search by email or name, exclude current user
    const users = await User.find({
      _id: { $ne: req.user.id }, // Exclude current user
      $or: [
        { email: { $regex: searchQuery, $options: 'i' } },
        { name: { $regex: searchQuery, $options: 'i' } }
      ]
    })
    .select('id name email avatar') // Only return necessary fields
    .limit(parseInt(limit));

    res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;