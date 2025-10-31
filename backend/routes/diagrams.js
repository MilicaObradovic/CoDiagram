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
    console.log('🟡 Creating diagram with body:', req.body);
    const { name, description, nodes = [], edges = [] } = req.body;
    
    // Validate nodes and edges structure
    const validatedNodes = nodes.map(node => ({
      id: node.id,
      type: node.type || 'default',
      position: {
        x: node.position?.x || 0,
        y: node.position?.y || 0
      },
      data: node.data || {},
      width: node.width || 200,
      height: node.height || 100,
      selected: node.selected || false,
      dragging: node.dragging || false
    }));

    const validatedEdges = edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle || null,
      targetHandle: edge.targetHandle || null,
      type: edge.type || 'default',
      data: edge.data || {},
      selected: edge.selected || false
    }));
    
    const diagram = new Diagram({
      name,
      description,
      createdBy: req.user.id,
      nodes: validatedNodes,
      edges: validatedEdges
    });
    
    await diagram.save();
    res.status(201).json(diagram);
  } catch (error) {
    console.error('Error creating diagram:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;