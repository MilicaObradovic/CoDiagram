const WebSocket = require('ws');
const Y = require('yjs');

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
                    client.connected = true;
                    resolve();
                });
                ws.on('message', (data) => {
                    Y.applyUpdate(client.doc, new Uint8Array(data));
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
                client.ws.send(update);
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
            await this.setupClients(2);
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
const conflictTester = new YjsConflictTester('ws://localhost:1234', 'test-room-1');
conflictTester.runTest();