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
            errors: 0
        };
        this.performanceLog = []
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
                // React Flow-like structure
                nodes: doc.getMap('nodes'),
                edges: doc.getMap('edges'),
                awareness: doc.getMap('awareness')
            };

            // Setup Yjs document with initial data
            this.initializeDocument(client);

            ws.on('open', () => {
                client.connected = true;
                this.metrics.activeConnections++;
                
                // Start simulating user actions
                this.startUserSimulation(client);
                resolve(client);
            });

            ws.on('message', (data) => {
                try {
                    // Apply incoming Yjs updates
                    Y.applyUpdate(doc, new Uint8Array(data));
                    this.metrics.updatesApplied++;
                } catch (error) {
                    this.metrics.errors++;
                }
            });

            ws.on('error', (error) => {
                this.metrics.errors++;
                console.error(`Client ${userId} error:`, error.message);
            });

            ws.on('close', () => {
                client.connected = false;
                this.metrics.activeConnections--;
            });

            this.clients.set(userId, client);
        });
    }

    initializeDocument(client) {
        // Create initial React Flow-like structure
        client.nodes.set('start-node', {
            id: 'start-node',
            type: 'input',
            position: { x: 100, y: 100 },
            data: { label: 'Start' }
        });

        // Set initial awareness (cursor position, user info)
        client.awareness.set(client.id, {
            user: { id: client.id, name: `User-${client.id}` },
            cursor: { x: 0, y: 0 },
            selection: []
        });
    }

    startUserSimulation(client) {
        // Simulate different user actions at random intervals
        const actions = [
            () => this.simulateNodeMove(client),
            () => this.simulateNodeCreate(client),
            () => this.simulateCursorMove(client),
        ];

        const scheduleNextAction = () => {
            const delay = 500 + Math.random() * 2000; // 0.5-2.5 seconds
            setTimeout(() => {
                if (client.connected) {
                    const action = actions[Math.floor(Math.random() * actions.length)];
                    action();
                    scheduleNextAction();
                }
            }, delay);
        };

        scheduleNextAction();
    }

    simulateNodeMove(client) {
        const nodeIds = Array.from(client.nodes.keys());
        if (nodeIds.length === 0) return;

        const nodeId = nodeIds[Math.floor(Math.random() * nodeIds.length)];
        const current = client.nodes.get(nodeId);
        
        client.nodes.set(nodeId, {
            ...current,
            position: {
                x: current.position.x + (Math.random() * 40 - 20),
                y: current.position.y + (Math.random() * 40 - 20)
            }
        });
        
        this.sendYjsUpdate(client);
    }

    simulateNodeCreate(client) {
        const nodeId = `node-${Date.now()}-${client.id}`;
        const nodeTypes = ['input', 'default', 'output', 'rectangle', 'circle'];
        
        client.nodes.set(nodeId, {
            id: nodeId,
            type: nodeTypes[Math.floor(Math.random() * nodeTypes.length)],
            position: { 
                x: Math.random() * 800, 
                y: Math.random() * 600 
            },
            data: { label: `Node ${nodeId}` }
        });
        
        this.sendYjsUpdate(client);
    }

    simulateCursorMove(client) {
        client.awareness.set(client.id, {
            user: { id: client.id, name: `User-${client.id}` },
            cursor: { 
                x: Math.random() * 1000, 
                y: Math.random() * 800 
            },
            selection: []
        });
        
        this.sendYjsUpdate(client);
    }

    sendYjsUpdate(client) {
        if (client.connected && client.ws.readyState === WebSocket.OPEN) {
            try {
                const update = Y.encodeStateAsUpdate(client.doc);
                client.ws.send(update);
                this.metrics.messagesSent++;
            } catch (error) {
                this.metrics.errors++;
            }
        }
    }
    async runScalabilityTest() {
        console.log('🚀 Starting Yjs Scalability Test Suite\n');
        
        const testScenarios = [
            { users: 50, duration: 30000, name: "Small Team" },
            { users: 100, duration: 30000, name: "Medium Team" },
            { users: 200, duration: 30000, name: "Large Team" },
            { users: 500, duration: 30000, name: "Enterprise" },
            { users: 1000, duration: 30000, name: "Stress Test" },
            { users: 2000, duration: 30000, name: "Break Point" }
        ];

        let maxSuccessfulUsers = 0;
        let breakingPoint = null;

        for (const scenario of testScenarios) {
            console.log(`\n📊 Testing: ${scenario.name} - ${scenario.users} users`);
            
            const success = await this.runSingleTest(scenario.users, scenario.duration);
            
            if (success) {
                maxSuccessfulUsers = scenario.users;
                console.log(`✅ SUCCESS: ${scenario.users} users handled well`);
            } else {
                breakingPoint = scenario.users;
                console.log(`❌ BREAKING POINT: ${scenario.users} users - system struggling`);
                break;
            }

            // Cool down between tests
            await new Promise(resolve => setTimeout(resolve, 5000));
        }

        this.printFinalResults(maxSuccessfulUsers, breakingPoint);
    }

    async runSingleTest(userCount, durationMs) {
        this.resetMetrics();
        
        try {
            // Connect users
            const connectStart = Date.now();
            await this.connectUsers(userCount);
            const connectTime = Date.now() - connectStart;

            console.log(`Connected ${userCount} users in ${connectTime}ms`);

            // Monitor during test
            const monitorInterval = setInterval(() => {
                this.logMetrics(userCount);
            }, 5000);

            // Run test
            await new Promise(resolve => setTimeout(resolve, durationMs));
            clearInterval(monitorInterval);

            // Calculate final metrics
            const avgLatency = this.metrics.latencyCount > 0 
                ? (this.metrics.latency / this.metrics.latencyCount).toFixed(2) 
                : 0;

            const errorRate = (this.metrics.errors / (this.metrics.messagesSent + this.metrics.errors)) * 100;

            // Store performance data
            this.performanceLog.push({
                users: userCount,
                messagesPerSecond: (this.metrics.messagesSent / (durationMs / 1000)).toFixed(2),
                avgLatency: avgLatency,
                errorRate: errorRate.toFixed(2),
                success: errorRate < 5 && avgLatency < 1000 // Success criteria
            });

            // Cleanup
            this.cleanup();

            return errorRate < 5 && avgLatency < 1000; // 5% error rate and 1s latency threshold

        } catch (error) {
            console.error(`Test failed for ${userCount} users:`, error.message);
            this.cleanup();
            return false;
        }
    }

    async connectUsers(userCount) {
        const connectionPromises = [];
        
        for (let i = 0; i < userCount; i++) {
            const roomId = `${this.baseRoom}-${Math.floor(i / 20)}`;
            const promise = this.createYjsClient(`user-${i}`, roomId);
            connectionPromises.push(promise);

            // Stagger connections to avoid storms
            if (i % 50 === 0) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        await Promise.all(connectionPromises);
    }

    logMetrics(userCount) {
        const avgLatency = this.metrics.latencyCount > 0 
            ? (this.metrics.latency / this.metrics.latencyCount).toFixed(2) 
            : 0;

        console.log(`
        📈 Live Metrics - ${userCount} Users:
        ├── Connections: ${this.metrics.activeConnections}/${userCount}
        ├── Message Rate: ${(this.metrics.messagesSent / 5).toFixed(1)}/sec
        ├── Avg Latency: ${avgLatency}ms
        ├── Updates Applied: ${this.metrics.updatesApplied}
        └── Errors: ${this.metrics.errors} (${((this.metrics.errors / (this.metrics.messagesSent + this.metrics.errors)) * 100).toFixed(2)}%)
                `);

        // Reset for next interval
        this.metrics.messagesSent = 0;
        this.metrics.updatesApplied = 0;
        this.metrics.errors = 0;
        this.metrics.latency = 0;
        this.metrics.latencyCount = 0;
    }

    resetMetrics() {
        this.metrics = {
            activeConnections: 0,
            messagesSent: 0,
            updatesApplied: 0,
            errors: 0,
            latency: 0,
            latencyCount: 0
        };
    }

    printFinalResults(maxSuccessfulUsers, breakingPoint) {
        console.log('\n🎯 ===== YJS SCALABILITY RESULTS =====\n');
        console.log(`🏆 Maximum Supported Users: ${maxSuccessfulUsers}`);
        console.log(`💥 Breaking Point: ${breakingPoint || 'Not reached'}`);
        
        console.log('\n📊 Performance Summary:');
        console.log('Users | Msg/sec | Latency | Error Rate | Status');
        console.log('------|---------|---------|------------|--------');
        
        this.performanceLog.forEach(log => {
            const status = log.success ? '✅ PASS' : '❌ FAIL';
            console.log(`${log.users.toString().padEnd(5)} | ${log.messagesPerSecond.padEnd(7)} | ${log.avgLatency.toString().padEnd(7)}ms | ${log.errorRate.toString().padEnd(9)}% | ${status}`);
        });

        console.log('\n💡 Recommendations:');
        if (maxSuccessfulUsers < 100) {
            console.log('❌ System needs optimization - consider better server hardware');
        } else if (maxSuccessfulUsers < 500) {
            console.log('⚠️  Good for small teams - consider scaling for larger organizations');
        } else {
            console.log('✅ Excellent scalability - ready for enterprise use');
        }
    }

    cleanup() {
        this.clients.forEach(client => {
            if (client.ws.readyState === WebSocket.OPEN) {
                client.ws.close();
            }
        });
        this.clients.clear();
    }
}

const tester = new YjsLoadTester('ws://localhost:1234', 'load-test');
tester.runScalabilityTest().catch(console.error);