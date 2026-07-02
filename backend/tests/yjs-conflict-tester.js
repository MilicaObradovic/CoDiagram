const WebSocket = require('ws');
const Y = require('yjs');
const syncProtocol = require('y-protocols/sync');
const encoding = require('lib0/encoding');
const decoding = require('lib0/decoding');

const messageSync = 0;
const messageAwareness = 1;

function createSyncStep1Message(doc) {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageSync);
    syncProtocol.writeSyncStep1(encoder, doc);
    return Buffer.from(encoding.toUint8Array(encoder));
}

function createUpdateMessage(update) {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageSync);
    syncProtocol.writeUpdate(encoder, update);
    return Buffer.from(encoding.toUint8Array(encoder));
}

function processServerMessage(doc, data) {
    const decoder = decoding.createDecoder(new Uint8Array(data));
    const messageType = decoding.readVarUint(decoder);

    if (messageType === messageSync) {
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, messageSync);
        syncProtocol.readSyncMessage(decoder, encoder, doc, null);
        const reply = encoding.toUint8Array(encoder);
        return reply.length > 1 ? Buffer.from(reply) : null;
    }

    if (messageType === messageAwareness) {
        decoding.readVarUint8Array(decoder);
        return null;
    }

    throw new Error(`Unsupported message type: ${messageType}`);
}

class YjsConflictTester {
    constructor(serverUrl, roomId) {
        this.serverUrl = serverUrl;
        this.roomId = roomId;
        this.clients = [];
        this.results = [];
    }

    async setupClients(count = 2) {
        console.log(`Initializing ${count} clients for conflict testing...`);
        for (let i = 0; i < count; i++) {
            const doc = new Y.Doc();
            const ws = new WebSocket(`${this.serverUrl}/${this.roomId}`);
            
            const client = {
                id: `user-${i}`,
                doc,
                ws,
                nodes: doc.getMap('nodes'),
                connected: false,
                lastReceivedState: null
            };

            await new Promise((resolve) => {
                ws.on('open', () => {
                    ws.send(createSyncStep1Message(doc));
                    client.connected = true;
                    resolve();
                });
                ws.on('message', (data) => {
                    const reply = processServerMessage(client.doc, data);
                    if (reply) {
                        ws.send(reply);
                    }
                    client.lastReceivedState = client.nodes.get('conflict-node');
                });
            });
            this.clients.push(client);
        }
        console.log('Clients ready.\n');
    }

    async triggerSimultaneousConflict() {
        console.log('Starting Simultaneous Update conflict test...');
        const nodeId = 'conflict-node';

        // Prepare different values that clients will attempt to set
        const updates = this.clients.map((client, index) => {
            return () => {
                console.log(`Client ${client.id} sending proposition: x=${index * 100}`);
                client.nodes.set(nodeId, {
                    id: nodeId,
                    position: { x: index * 100, y: index * 100 },
                    label: `Set by ${client.id}`
                });
                const update = Y.encodeStateAsUpdate(client.doc);
                client.ws.send(createUpdateMessage(update));
            };
        });

        // Executing all network requests in the same millisecond
        console.log('Broadcasting conflicting packets...');
        await Promise.all(updates.map(update => update()));

        // Wait for the server to process and sync the state
        await new Promise(resolve => setTimeout(resolve, 2000));
        this.verifyConvergence(nodeId);
    }

    verifyConvergence(nodeId) {
        console.log('\nAnalyzing state convergence:');
        const finalStates = this.clients.map(c => JSON.stringify(c.nodes.get(nodeId)));
        const allSame = finalStates.every(val => val === finalStates[0]);

        if (allSame) {
            console.log('✅ SUCCESS: All clients converged to an identical state.');
            console.log(`Final state: ${finalStates[0]}`);
        } else {
            console.log('❌ FAILURE: Clients have different states (Divergence)!');
            this.clients.forEach((c, i) => {
                console.log(`   Client ${i}: ${finalStates[i]}`);
            });
        }
    }

    async runTest() {
        try {
            await this.setupClients(4);
            await this.triggerSimultaneousConflict();
            this.cleanup();
        } catch (error) {
            console.error('Error during test execution:', error);
        }
    }

    cleanup() {
        this.clients.forEach(c => c.ws.close());
        console.log('\nTest execution finished.');
    }
}

// Running the test on the local server
const conflictTester = new YjsConflictTester('ws://localhost:5001/api/yjs', 'test-room-1');
conflictTester.runTest();
