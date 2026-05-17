const WebSocket = require('ws');
const Y = require('yjs');

class YjsLoadTester {
    constructor(serverUrl, baseRoom) {
        this.serverUrl = serverUrl;
        this.baseRoom = baseRoom;
        this.clients = new Map();
        this.metrics = {
            activeConnections: 0,
            messagesSent: 0,
            updatesApplied: 0,
            errors: 0,
            connectionFailures: 0
        };
        this.performanceLog = [];
        this.isSystemStable = true;
    }

    async createYjsClient(userId, roomId) {
        return new Promise((resolve, reject) => {
            const doc = new Y.Doc();
            const ws = new WebSocket(`${this.serverUrl}/${roomId}`);
            
            const client = {
                id: userId,
                doc,
                ws,
                connected: false,
                roomId,
                nodes: doc.getMap('nodes')
            };

            const connectionTimeout = setTimeout(() => {
                if (!client.connected) {
                    this.metrics.connectionFailures++;
                    this.checkSystemHealth();
                    ws.terminate();
                    reject(new Error(`Connection timeout: ${userId}`));
                }
            }, 10000);

            ws.on('open', () => {
                clearTimeout(connectionTimeout);
                client.connected = true;
                this.metrics.activeConnections++;
                this.startUserSimulation(client);
                resolve(client);
            });

            ws.on('message', (data) => {
                try {
                    Y.applyUpdate(doc, new Uint8Array(data));
                    this.metrics.updatesApplied++;
                } catch (error) {
                    this.metrics.errors++;
                    this.checkSystemHealth();
                }
            });

            ws.on('error', () => {
                clearTimeout(connectionTimeout);
                this.metrics.errors++;
                this.metrics.connectionFailures++;
                this.checkSystemHealth();
                reject(new Error('WebSocket Error'));
            });

            ws.on('close', () => {
                if (client.connected) {
                    client.connected = false;
                    this.metrics.activeConnections--;
                }
            });

            this.clients.set(userId, client);
        });
    }

    checkSystemHealth() {
        if (!this.isSystemStable) return;

        const totalOps = this.metrics.messagesSent + this.metrics.errors;
        const errorRate = totalOps > 0 ? (this.metrics.errors / totalOps) * 100 : 0;
        
        // Stability criteria: Error rate > 5% or ANY connection failure
        if (errorRate > 5 || this.metrics.connectionFailures > 0) {
            console.log(`\n[!] INSTABILITY DETECTED: Errors: ${errorRate.toFixed(2)}%, Failures: ${this.metrics.connectionFailures}`);
            this.isSystemStable = false;
        }
    }

    startUserSimulation(client) {
        const action = () => {
            if (!this.isSystemStable || !client.connected) return;
            
            try {
                // Simulate a simple data change
                client.nodes.set(`node-${client.id}`, { x: Math.random(), y: Math.random() });
                const update = Y.encodeStateAsUpdate(client.doc);
                if (client.ws.readyState === WebSocket.OPEN) {
                    client.ws.send(update);
                    this.metrics.messagesSent++;
                }
            } catch (e) {
                this.metrics.errors++;
                this.checkSystemHealth();
            }

            setTimeout(action, 1000 + Math.random() * 2000);
        };
        action();
    }

    async runIncrementalLoadTest() {
        console.log('--- STARTING YJS LOAD TEST ---\n');
        
        const config = { 
            initial: 50, 
            step: 50, 
            max: 5000, 
            duration: 10000,
            rooms: 3
        };

        let current = config.initial;

        while (current <= config.max && this.isSystemStable) {
            console.log(`\nTESTING: ${current} Users`);
            const success = await this.runSingleTest(current, config.duration, config.rooms);
            
            if (!success) {
                console.log(`\n❌ SYSTEM FAILED AT ${current} USERS.`);
                break;
            }
            
            console.log(`✅ SUCCESS: ${current} users stable.`);
            current += config.step;
            await new Promise(r => setTimeout(r, 2000));
        }

        this.printFinalResults();
    }

    async runSingleTest(userCount, durationMs, rooms) {
        await this.cleanup();
        this.resetMetrics();
        this.isSystemStable = true;

        try {
            const connectionPromises = [];
            const roomIds = new Set();
            
            for (let i = 0; i < userCount; i++) {
                // Logic: room changes every X users. 
                // If usersPerRoom is 2000, it stays as room-0 for the whole test.
                const roomIndex = Math.floor(i % rooms);
                const roomId = `${this.baseRoom}-${roomIndex}`;
                roomIds.add(roomId);

                connectionPromises.push(this.createYjsClient(`u-${i}-${Date.now()}`, roomId));
                
                if (i % 20 === 0) await new Promise(r => setTimeout(r, 50));
            }

            console.log(`   Target Rooms: ${roomIds.size}`);
            await Promise.all(connectionPromises);
            console.log(`   All ${userCount} clients connected. Simulation running...`);

            const startTime = Date.now();
            while (Date.now() - startTime < durationMs) {
                if (!this.isSystemStable) {
                    return false; 
                }
                await new Promise(r => setTimeout(r, 200));
            }
            const mps = (this.metrics.messagesSent / (durationMs / 1000)).toFixed(2);
            const errorRate = (this.metrics.errors / (this.metrics.messagesSent + this.metrics.errors)) * 100 || 0;

            // CRITICAL: Success must be false if background stability is lost
            const success = errorRate < 5 && this.isSystemStable;
            this.performanceLog.push({ 
                users: userCount, 
                rooms: roomIds.size,
                mps: mps,
                errors: this.metrics.errors,
                success: success 
            });
            return success;

        } catch (e) {
            console.log(`   Critical error during test: ${e.message}`);
            return false;
        }
    }

    resetMetrics() {
        this.metrics = { activeConnections: 0, messagesSent: 0, updatesApplied: 0, errors: 0, connectionFailures: 0 };
    }

    async cleanup() {
        this.clients.forEach(c => c.ws.terminate());
        this.clients.clear();
        await new Promise(r => setTimeout(r, 1000));
    }

    printFinalResults() {
        console.log('\n--- PERFORMANCE SUMMARY ---');
        console.log('Users | Rooms | Msg/sec | Errors | Status');
        console.log('-----------------------------------------');
        this.performanceLog.forEach(l => {
            console.log(`${l.users.toString().padEnd(5)} | ${l.rooms.toString().padEnd(5)} | ${l.mps.padEnd(7)} | ${l.errors.toString().padEnd(6)} | ${l.success ? '✅ PASS' : '❌ FAIL'}`);
        });
    }
}

const tester = new YjsLoadTester('ws://localhost:1234', 'load-test');
tester.runIncrementalLoadTest().then(() => {
    console.log('\nLoad test process completed.');
    process.exit(0);
});