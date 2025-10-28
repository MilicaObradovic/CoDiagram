const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../model/user');
const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    user = new User({
      name,
      email,
      password
    });
    
    await user.save();
    
    const token = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
    try {
      console.log('🟡 Login attempt for:', req.body.email);
      
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password required' });
      }
      const user = await User.findOne({ email }).select('+password');
      
      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
      
      let isMatch;
      isMatch = await bcrypt.compare(password, user.password);
      
      
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
  
      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET || 'fallback-secret-key',
        { expiresIn: '7d' }
      );
      
      console.log('✅ Login successful for:', user.email);
      
      res.json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        }
      });
      
    } catch (error) {
      console.error('❌ Login error details:', error);
      res.status(500).json({ 
        message: 'Server error',
        error: error.message 
      });
    }
  });

module.exports = router;