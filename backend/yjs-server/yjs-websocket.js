const WebSocket = require('ws');

const DEFAULT_ROUTE = '/api/yjs';

function attachYjsWebSocketServer(server, options = {}) {
    const route = options.route || DEFAULT_ROUTE;
    const rooms = new Map();
    const wss = new WebSocket.Server({ noServer: true });

    const statsInterval = setInterval(() => {
        console.log(`Active Yjs rooms: ${rooms.size}`);
    }, 30000);
    statsInterval.unref();

    const getRoomName = (pathname) => {
        const roomPath = pathname.startsWith(route) ? pathname.slice(route.length) : '';
        const normalizedPath = roomPath.replace(/^\/+/, '');

        return normalizedPath ? decodeURIComponent(normalizedPath) : 'default-room';
    };

    wss.on('connection', (ws, req, roomName) => {
        console.log(`New Yjs client connected to room "${roomName}"`);

        if (!rooms.has(roomName)) {
            rooms.set(roomName, new Set());
        }

        const room = rooms.get(roomName);
        room.add(ws);

        ws.on('message', (data) => {
            room.forEach((client) => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(data);
                }
            });
        });

        ws.on('close', () => {
            console.log(`Yjs client disconnected from room "${roomName}"`);
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

    server.on('upgrade', (req, socket, head) => {
        const pathname = new URL(req.url, `http://${req.headers.host || 'localhost'}`).pathname;

        if (!(pathname === route || pathname.startsWith(`${route}/`))) {
            return;
        }

        const roomName = getRoomName(pathname);

        wss.handleUpgrade(req, socket, head, (ws) => {
            wss.emit('connection', ws, req, roomName);
        });
    });

    console.log(`Yjs WebSocket route mounted at ${route}/:roomName`);

    return { wss, rooms, route };
}

module.exports = {
    attachYjsWebSocketServer,
    DEFAULT_ROUTE
};
