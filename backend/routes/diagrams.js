const express = require('express');
const router = express.Router();
const Diagram = require('../model/diagram');
const { auth } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    console.log('User ID:', req.user.id);
    const diagrams = await Diagram.find({
      $or: [
        { createdBy: req.user.id },
        { collaborators: req.user.id }
      ]
    });
    
    res.json(diagrams);
  } catch (error) {
    console.error('Error fetching diagrams:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const diagram = new Diagram({
      name,
      description,
      createdBy: req.user.id,
      nodes: [],
      edges: []
    });
    
    await diagram.save();
    res.status(201).json(diagram);
  } catch (error) {
    console.error('Error creating diagram:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;