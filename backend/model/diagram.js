const mongoose = require('mongoose');

const nodeSchema = new mongoose.Schema({
  id: String,
  type: String,
  position: {
    x: Number,
    y: Number
  },
  width:Number,
  height:Number,
  data: mongoose.Schema.Types.Mixed
});

const edgeSchema = new mongoose.Schema({
  id: String,
  source: String,
  target: String,
  sourceHandle: String,
  targetHandle: String,
  type: String,
  data: {lineStyle: String}
});

const diagramSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  nodes: [nodeSchema],
  edges: [edgeSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  collaborators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Diagram', diagramSchema);