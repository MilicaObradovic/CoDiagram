const WebSocket = require('ws');
const Y = require('yjs');
const syncProtocol = require('y-protocols/sync');
const awarenessProtocol = require('y-protocols/awareness');
const encoding = require('lib0/encoding');
const decoding = require('lib0/decoding');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Diagram = require('../model/diagram');
const User = require('../model/user');

const DEFAULT_ROUTE = '/api/yjs';
const messageSync = 0;
const messageAwareness = 1;
const PERSIST_DEBOUNCE_MS = 750;

function normalizeNode(node = {}) {
    return {
        id: node.id,
        type: node.type || 'default',
        position: {
            x: node.position?.x || 0,
            y: node.position?.y || 0
        },
        data: node.data || {},
        width: node.width || node.measured?.width || 200,
        height: node.height || node.measured?.height || 100,
        selected: node.selected || false,
        dragging: node.dragging || false
    };
}

function normalizeEdge(edge = {}) {
    return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle || null,
        targetHandle: edge.targetHandle || null,
        type: edge.type || 'default',
        data: edge.data || {},
        selected: edge.selected || false
    };
}

function snapshotDoc(doc) {
    const yNodes = doc.getMap('nodes');
    const yEdges = doc.getMap('edges');

    return {
        nodes: Array.from(yNodes.values()).map(normalizeNode),
        edges: Array.from(yEdges.values()).map(normalizeEdge)
    };
}

function sendMessage(ws, payload) {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(Buffer.from(payload));
    }
}

function writeSyncStep1(doc) {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageSync);
    syncProtocol.writeSyncStep1(encoder, doc);
    return encoding.toUint8Array(encoder);
}

function writeAwarenessUpdate(awareness, clients) {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageAwareness);
    encoding.writeVarUint8Array(
        encoder,
        awarenessProtocol.encodeAwarenessUpdate(awareness, clients)
    );
    return encoding.toUint8Array(encoder);
}

function writeUpdateMessage(update) {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageSync);
    syncProtocol.writeUpdate(encoder, update);
    return encoding.toUint8Array(encoder);
}

function parseAwarenessClientIds(update) {
    const decoder = decoding.createDecoder(update);
    const count = decoding.readVarUint(decoder);
    const entries = [];

    for (let index = 0; index < count; index += 1) {
        const clientId = decoding.readVarUint(decoder);
        decoding.readVarUint(decoder);
        const state = JSON.parse(decoding.readVarString(decoder));
        entries.push({ clientId, state });
    }

    return entries;
}

function rejectUpgrade(socket, statusCode, message) {
    socket.write(
        `HTTP/1.1 ${statusCode} ${message}\r\n` +
        'Connection: close\r\n' +
        'Content-Type: text/plain\r\n' +
        `Content-Length: ${Buffer.byteLength(message)}\r\n\r\n` +
        message
    );
    socket.destroy();
}

async function authenticateRoomAccess(roomName, requestUrl) {
    const isPersistentRoom = mongoose.Types.ObjectId.isValid(roomName);

    if (!isPersistentRoom) {
        return {
            persistent: false,
            user: null,
            diagram: null
        };
    }

    const token = requestUrl.searchParams.get('token');
    if (!token) {
        throw new Error('Missing websocket auth token');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId);

    if (!user) {
        throw new Error('Token is not valid');
    }

    const diagram = await Diagram.findById(roomName);
    if (!diagram) {
        throw new Error('Diagram not found');
    }

    const collaboratorIds = (diagram.collaborators || []).map((collaborator) => collaborator.toString());
    const hasAccess =
        diagram.createdBy?.toString() === user._id.toString() ||
        collaboratorIds.includes(user._id.toString());

    if (!hasAccess) {
        throw new Error('Access denied');
    }

    return {
        persistent: true,
        user,
        diagram
    };
}

function schedulePersist(room) {
    if (!room.persistent || room.destroyed) {
        return;
    }

    clearTimeout(room.persistTimer);
    room.persistTimer = setTimeout(async () => {
        room.persistTimer = null;
        await persistRoom(room);
    }, PERSIST_DEBOUNCE_MS);
}

async function persistRoom(room) {
    try {
        const { nodes, edges } = snapshotDoc(room.doc);

        await Diagram.findByIdAndUpdate(
            room.name,
            {
                nodes,
                edges,
                updatedAt: new Date()
            },
            { new: false }
        );

        console.log(`Persisted diagram "${room.name}" from websocket state`);
    } catch (error) {
        console.error(`Failed to persist diagram "${room.name}":`, error);
    }
}

async function hydrateRoomFromDiagram(room, diagram) {
    room.doc.transact(() => {
        const yNodes = room.doc.getMap('nodes');
        const yEdges = room.doc.getMap('edges');

        yNodes.clear();
        yEdges.clear();

        (diagram.nodes || []).forEach((node) => {
            yNodes.set(node.id, normalizeNode(node));
        });

        (diagram.edges || []).forEach((edge) => {
            yEdges.set(edge.id, normalizeEdge(edge));
        });
    }, 'db-load');
}

async function createRoom(roomName, context) {
    const doc = new Y.Doc();
    const awareness = new awarenessProtocol.Awareness(doc);

    const room = {
        name: roomName,
        persistent: context.persistent,
        doc,
        awareness,
        clients: new Set(),
        persistTimer: null,
        destroyed: false,
        readyPromise: Promise.resolve()
    };

    doc.on('update', (update, origin) => {
        if (origin !== 'db-load') {
            const payload = writeUpdateMessage(update);
            room.clients.forEach((client) => {
                if (client !== origin) {
                    sendMessage(client, payload);
                }
            });
            schedulePersist(room);
        }
    });

    awareness.on('update', ({ added, updated, removed }, origin) => {
        const changedClients = added.concat(updated, removed);

        if (changedClients.length === 0) {
            return;
        }

        const payload = writeAwarenessUpdate(awareness, changedClients);
        room.clients.forEach((client) => {
            if (client !== origin) {
                sendMessage(client, payload);
            }
        });
    });

    if (context.persistent && context.diagram) {
        room.readyPromise = hydrateRoomFromDiagram(room, context.diagram);
        await room.readyPromise;
        console.log(`Hydrated Yjs room "${roomName}" from MongoDB`);
    }

    return room;
}

function cleanupClient(ws, room, rooms) {
    if (!room || room.destroyed) {
        return;
    }

    if (ws.awarenessClientIds.size > 0) {
        awarenessProtocol.removeAwarenessStates(
            room.awareness,
            Array.from(ws.awarenessClientIds),
            ws
        );
    }

    room.clients.delete(ws);
    console.log(`Yjs client disconnected from room "${room.name}"`);

    if (room.clients.size === 0) {
        clearTimeout(room.persistTimer);
        if (room.persistent) {
            persistRoom(room);
        }
        room.destroyed = true;
        room.awareness.destroy();
        room.doc.destroy();
        rooms.delete(room.name);
        console.log(`Closed empty Yjs room "${room.name}"`);
    }
}

function handleConnection(ws, room, rooms) {
    ws.awarenessClientIds = new Set();
    room.clients.add(ws);

    console.log(`New Yjs client connected to room "${room.name}"`);
    console.log(`Room "${room.name}" now has ${room.clients.size} clients`);

    sendMessage(ws, writeSyncStep1(room.doc));

    const awarenessClients = Array.from(room.awareness.getStates().keys());
    if (awarenessClients.length > 0) {
        sendMessage(ws, writeAwarenessUpdate(room.awareness, awarenessClients));
    }

    ws.on('message', (data) => {
        try {
            const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
            const decoder = decoding.createDecoder(bytes);
            const messageType = decoding.readVarUint(decoder);

            if (messageType === messageSync) {
                const encoder = encoding.createEncoder();
                encoding.writeVarUint(encoder, messageSync);
                syncProtocol.readSyncMessage(decoder, encoder, room.doc, ws);
                const reply = encoding.toUint8Array(encoder);

                if (reply.length > 1) {
                    sendMessage(ws, reply);
                }
                return;
            }

            if (messageType === messageAwareness) {
                const update = decoding.readVarUint8Array(decoder);
                const entries = parseAwarenessClientIds(update);

                entries.forEach(({ clientId, state }) => {
                    if (state === null) {
                        ws.awarenessClientIds.delete(clientId);
                    } else {
                        ws.awarenessClientIds.add(clientId);
                    }
                });

                awarenessProtocol.applyAwarenessUpdate(room.awareness, update, ws);
                return;
            }

            console.warn(`Unsupported Yjs websocket message type ${messageType} in room "${room.name}"`);
        } catch (error) {
            console.error(`Failed to process websocket message for room "${room.name}":`, error);
        }
    });

    ws.on('close', () => {
        cleanupClient(ws, room, rooms);
    });

    ws.on('error', (error) => {
        console.error(`WebSocket error in room "${room.name}":`, error);
    });
}

function attachYjsWebSocketServer(server, options = {}) {
    const route = options.route || DEFAULT_ROUTE;
    const rooms = new Map();
    const wss = new WebSocket.Server({ noServer: true });

    const statsInterval = setInterval(() => {
        console.log(`Active Yjs rooms: ${rooms.size}`);
    }, 30000);
    statsInterval.unref();

    server.on('upgrade', async (req, socket, head) => {
        const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        const pathname = requestUrl.pathname;

        if (!(pathname === route || pathname.startsWith(`${route}/`))) {
            return;
        }

        const roomName = decodeURIComponent(pathname.slice(route.length).replace(/^\/+/, '') || 'default-room');

        try {
            const context = await authenticateRoomAccess(roomName, requestUrl);

            let room = rooms.get(roomName);
            if (!room) {
                room = await createRoom(roomName, context);
                rooms.set(roomName, room);
            } else if (room.readyPromise) {
                await room.readyPromise;
            }

            wss.handleUpgrade(req, socket, head, (ws) => {
                handleConnection(ws, room, rooms);
            });
        } catch (error) {
            console.error(`Rejected Yjs websocket upgrade for room "${roomName}":`, error.message);
            rejectUpgrade(socket, 401, error.message);
        }
    });

    console.log(`Yjs WebSocket route mounted at ${route}/:roomName`);

    return { rooms, route, wss };
}

module.exports = {
    attachYjsWebSocketServer,
    DEFAULT_ROUTE
};
