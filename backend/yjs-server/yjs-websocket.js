const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 1234 });
console.log('Simple Relay WebSocket server running on port 1234');

const rooms = new Map();

wss.on('connection', (ws, req) => {
    console.log('New client connected');
    
    const roomName = req.url?.slice(1) || 'default-room';
    console.log(`Client joined room: "${roomName}"`);
    
    if (!rooms.has(roomName)) {
        rooms.set(roomName, new Set());
    }
    const room = rooms.get(roomName);
    room.add(ws);
    
    ws.room = roomName;
    
    // Simple message forwarding
    ws.on('message', (data) => {
        console.log(`Received ${data.length} bytes in room "${roomName}"`);
        
        // broadcast others in room
        room.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    });
    
    ws.on('close', () => {
        console.log(`Client disconnected from room "${roomName}"`);
        room.delete(ws);
        if (room.size === 0) {
            rooms.delete(roomName);
        }
    });
    
    ws.on('error', (error) => {
        console.error(`WebSocket error in room "${roomName}":`, error);
    });
    
    console.log(`Room "${roomName}" now has ${room.size} clients`);
});

setInterval(() => {
    console.log(`Active rooms: ${rooms.size}`);
}, 30000);