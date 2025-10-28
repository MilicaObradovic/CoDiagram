const WebSocket = require('ws');
const { setupWSConnection } = require('y-websocket/bin/utils');
const mongoose = require('mongoose');
const Diagram = require('../models/Diagram');

const wss = new WebSocket.Server({ port: 1234 });

// save state in mongo
const persistence = {
  bindState: async (roomName, ydoc) => {
    try {
      const diagram = await Diagram.findById(roomName);
      if (diagram) {
        const savedState = Buffer.from(diagram.yjsState);
        Y.applyUpdate(ydoc, savedState);
      }
    } catch (error) {
      console.error('Error loading state:', error);
    }
  },
  
  writeState: async (roomName, ydoc) => {
    try {
      const state = Y.encodeStateAsUpdate(ydoc);
      await Diagram.findByIdAndUpdate(roomName, {
        yjsState: Buffer.from(state),
        lastModified: new Date()
      });
    } catch (error) {
      console.error('Error saving state:', error);
    }
  }
};

wss.on('connection', (ws, req) => {
  setupWSConnection(ws, req, { persistence });
});

console.log('Yjs WebSocket server running on port 1234');