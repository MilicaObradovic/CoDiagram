const express = require('express');
const router = express.Router();
const Diagram = require('../model/diagram');
const { auth } = require('../middleware/auth');
const User = require('../model/user');

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
    console.log('Creating diagram with body:', req.body);
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
      width: node.measured.width || 200,
      height: node.measured.height || 100,
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

router.delete('/:id', auth, async (req, res) => {
  try {
    console.log('Deleting diagram:', req.params.id);
    
    const diagram = await Diagram.findById(req.params.id);
    
    if (!diagram) {
      return res.status(404).json({ message: 'Diagram not found' });
    }
    
    // Check if user is the owner of the diagram
    if (diagram.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this diagram' });
    }
    
    await Diagram.findByIdAndDelete(req.params.id);
    
    console.log('Diagram deleted:', req.params.id);
    res.json({ message: 'Diagram deleted successfully' });
  } catch (error) {
    console.error('Error deleting diagram:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
router.get('/:id', auth, async (req, res) => {
  try {
    console.log('Fetching diagram by ID:', req.params.id);
    
    const diagram = await Diagram.findById(req.params.id);
    
    if (!diagram) {
      return res.status(404).json({ message: 'Diagram not found' });
    }
    
    // Check if user has access to this diagram
    if (diagram.createdBy.toString() !== req.user.id && 
        !diagram.collaborators?.includes(req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    console.log('Diagram found:', diagram.name);
    res.json(diagram);
  } catch (error) {
    console.error('Error fetching diagram:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid diagram ID' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    console.log('Updating diagram:', req.params.id);
    console.log('Update data:', req.body);
    
    const { name, description, nodes, edges, viewport } = req.body;
    
    const diagram = await Diagram.findById(req.params.id);
    
    if (!diagram) {
      return res.status(404).json({ message: 'Diagram not found' });
    }
    
    // Check if user has access to this diagram
    if (diagram.createdBy.toString() !== req.user.id && 
        !diagram.collaborators?.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized to update this diagram' });
    }
    
    // Build update object with only provided fields
    const updateData = {};
    
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (nodes !== undefined) {
      // Validate and structure nodes
      updateData.nodes = nodes.map(node => ({
        id: node.id,
        type: node.type || 'default',
        position: {
          x: node.position?.x || 0,
          y: node.position?.y || 0
        },
        data: node.data || {},
        width: node.measured.width || 200,
        height: node.measured.height || 100,
        selected: node.selected || false,
        dragging: node.dragging || false
      }));
    }
    
    if (edges !== undefined) {
      // Validate and structure edges
      updateData.edges = edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle || null,
        targetHandle: edge.targetHandle || null,
        type: edge.type || 'default',
        data: {lineStyle:edge.data.lineStyle || ""},
        selected: edge.selected || false
      }));
    }
    console.log(edges)
    
    if (viewport !== undefined) {
      updateData.viewport = {
        x: viewport.x || 0,
        y: viewport.y || 0,
        zoom: viewport.zoom || 1
      };
    }
    
    // Update the diagram
    const updatedDiagram = await Diagram.findByIdAndUpdate(
      req.params.id,
      { 
        ...updateData,
        updatedAt: new Date() // Force update timestamp
      },
      { new: true } // Return the updated document
    );
    
    console.log('Diagram updated:', updatedDiagram.name);
    res.json(updatedDiagram);
  } catch (error) {
    console.error('Error updating diagram:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid diagram ID' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id/collaborators', auth, async (req, res) => {
  try {
    console.log('Updating collaborators for diagram:', req.params.id);
    console.log('Collaborators data:', req.body);
    
    const { collaborators } = req.body;
    
    const diagram = await Diagram.findById(req.params.id);
    
    if (!diagram) {
      return res.status(404).json({ message: 'Diagram not found' });
    }
    
    // Check if user is the owner of the diagram
    if (diagram.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only diagram owner can manage collaborators' });
    }
    
    // Validate that collaborators are valid user IDs
    if (!Array.isArray(collaborators)) {
      return res.status(400).json({ message: 'Collaborators must be an array' });
    }
    
    // Update collaborators
    diagram.collaborators = collaborators;
    await diagram.save();
    
    // Populate collaborator details for response
    await diagram.populate('collaborators', 'id name email avatar');
    
    console.log('Collaborators updated for diagram:', diagram.name);
    res.json(diagram);
  } catch (error) {
    console.error('Error updating collaborators:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid user ID in collaborators' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id/collaborators', auth, async (req, res) => {
  try {
    console.log('Fetching diagram with collaborators:', req.params.id);
    
    const diagram = await Diagram.findById(req.params.id)
      .populate('collaborators', 'id name email avatar'); // Populate collaborator details
    
    if (!diagram) {
      return res.status(404).json({ message: 'Diagram not found' });
    }
    
    // Check if user has access to this diagram
    if (diagram.createdBy.toString() !== req.user.id && 
        !diagram.collaborators.some(collab => collab._id.toString() === req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const owner = await User.findById(diagram.createdBy).select('id name email avatar');
    
    console.log('Diagram with collaborators found:', diagram.name);
    res.json({
      diagram: {
        id: diagram._id,
        name: diagram.name,
        createdBy: owner
      },
      collaborators: diagram.collaborators
    });
  } catch (error) {
    console.error('Error fetching diagram collaborators:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid diagram ID' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;