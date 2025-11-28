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
                nodes: doc.getMap('nodes'),
                edges: doc.getMap('edges'),
                awareness: doc.getMap('awareness')
            };

            this.initializeDocument(client);

            // Set timeout for connection (detect hanging connections)
            const connectionTimeout = setTimeout(() => {
                if (!client.connected) {
                    this.metrics.connectionFailures++;
                    reject(new Error(`Connection timeout for ${userId}`));
                }
            }, 10000);

            ws.on('open', () => {
                clearTimeout(connectionTimeout);
                client.connected = true;
                this.metrics.activeConnections++;
                console.log(`✅ Client ${userId} connected to ${roomId}`);
                
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

            ws.on('error', (error) => {
                clearTimeout(connectionTimeout);
                this.metrics.errors++;
                this.metrics.connectionFailures++;
                console.error(`❌ Client ${userId} error:`, error.message);
                this.checkSystemHealth();
                reject(error);
            });

            ws.on('close', () => {
                client.connected = false;
                this.metrics.activeConnections--;
            });

            this.clients.set(userId, client);
        });
    }

    checkSystemHealth() {
        // Check if system is becoming unstable
        const totalOperations = this.metrics.messagesSent + this.metrics.errors;
        const errorRate = totalOperations > 0 ? (this.metrics.errors / totalOperations) * 100 : 0;
        
        if (errorRate > 10 || this.metrics.connectionFailures > this.metrics.activeConnections * 0.1) {
            this.isSystemStable = false;
            console.log('🚨 SYSTEM UNSTABLE - High error rate detected');
        }
    }

    initializeDocument(client) {
        client.nodes.set('start-node', {
            id: 'start-node',
            type: 'input',
            position: { x: 100, y: 100 },
            data: { label: 'Start' }
        });

        client.awareness.set(client.id, {
            user: { id: client.id, name: `User-${client.id}` },
            cursor: { x: 0, y: 0 },
            selection: []
        });
    }

    startUserSimulation(client) {
        const actions = [
            () => this.simulateNodeMove(client),
            () => this.simulateNodeCreate(client),
            () => this.simulateCursorMove(client),
        ];

        const scheduleNextAction = () => {
            if (!this.isSystemStable) return; // Stop if system unstable
            
            const delay = 500 + Math.random() * 2000;
            setTimeout(() => {
                if (client.connected && this.isSystemStable) {
                    const action = actions[Math.floor(Math.random() * actions.length)];
                    action();
                    scheduleNextAction();
                }
            }, delay);
        };

        scheduleNextAction();
    }

    simulateNodeMove(client) {
        if (!this.isSystemStable) return;
        
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
        if (!this.isSystemStable) return;
        
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
        if (!this.isSystemStable) return;
        
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
        if (client.connected && client.ws.readyState === WebSocket.OPEN && this.isSystemStable) {
            try {
                const update = Y.encodeStateAsUpdate(client.doc);
                client.ws.send(update);
                this.metrics.messagesSent++;
            } catch (error) {
                this.metrics.errors++;
                this.checkSystemHealth();
            }
        }
    }

    async runIncrementalLoadTest() {
        console.log('🚀 Starting Incremental Yjs Load Test\n');
        console.log('📈 Will gradually add users until system breaks\n');

        const config = {
            initialUsers: 50,
            incrementStep: 50,
            maxUsers: 1000,
            testDurationPerStep: 10000, // 10 seconds per step
            stabilityThreshold: 5, // 5% error rate
            cooldownBetweenSteps: 2000
        };

        let currentUsers = config.initialUsers;
        let maxStableUsers = 0;
        let breakingPoint = null;

        while (currentUsers <= config.maxUsers && this.isSystemStable) {
            console.log(`\n🎯 Testing ${currentUsers} users...`);
            
            const success = await this.runSingleTest(currentUsers, config.testDurationPerStep);
            
            if (success) {
                maxStableUsers = currentUsers;
                console.log(`✅ System stable with ${currentUsers} users`);
                currentUsers += config.incrementStep;
            } else {
                breakingPoint = currentUsers;
                console.log(`❌ System broke at ${currentUsers} users`);
                break;
            }

            // Cool down
            await new Promise(resolve => setTimeout(resolve, config.cooldownBetweenSteps));
        }

        this.printFinalResults(maxStableUsers, breakingPoint);
    }

    async runSingleTest(userCount, durationMs) {
        this.resetMetrics();
        this.isSystemStable = true;
        
        try {
            // Connect users with progress tracking
            console.log(`🔗 Connecting ${userCount} users...`);
            const connectStart = Date.now();
            await this.connectUsersWithProgress(userCount);
            const connectTime = Date.now() - connectStart;

            const connectedCount = this.metrics.activeConnections;
            const connectionSuccessRate = (connectedCount / userCount) * 100;
            
            console.log(`✅ Connected ${connectedCount}/${userCount} users in ${connectTime}ms (${connectionSuccessRate.toFixed(1)}% success)`);

            // If less than 80% connected, consider it a failure
            if (connectionSuccessRate < 80) {
                console.log('❌ Connection success rate too low');
                this.cleanup();
                return false;
            }

            // Run test with live monitoring
            console.log(`🔄 Running test for ${durationMs/1000} seconds...`);
            const testInterval = setInterval(() => {
                this.logLiveMetrics(userCount);
            }, 2000);

            await new Promise(resolve => setTimeout(resolve, durationMs));
            clearInterval(testInterval);

            // Calculate final metrics
            const testDurationSeconds = durationMs / 1000;
            const messagesPerSecond = (this.metrics.messagesSent / testDurationSeconds).toFixed(2);
            const errorRate = (this.metrics.errors / (this.metrics.messagesSent + this.metrics.errors)) * 100;
            const success = errorRate < 5 && this.isSystemStable;

            // Store results
            this.performanceLog.push({
                users: userCount,
                messagesPerSecond: messagesPerSecond,
                errorRate: errorRate.toFixed(2),
                connectionSuccessRate: connectionSuccessRate.toFixed(1),
                success: success
            });

            console.log(`📊 Final: ${messagesPerSecond} msg/sec, ${errorRate.toFixed(2)}% errors, System stable: ${this.isSystemStable}`);

            this.cleanup();
            return success;

        } catch (error) {
            console.error(`❌ Test failed for ${userCount} users:`, error.message);
            this.cleanup();
            return false;
        }
    }

    async connectUsersWithProgress(userCount) {
        const connectionPromises = [];
        let successfulConnections = 0;
        let failedConnections = 0;

        for (let i = 0; i < userCount; i++) {
            const roomId = `${this.baseRoom}-${Math.floor(i / 10)}`;
            const userId = `user-${i}`;
            
            const promise = this.createYjsClient(userId, roomId)
                .then(() => {
                    successfulConnections++;
                    if ((successfulConnections + failedConnections) % 50 === 0) {
                        console.log(`   ... ${successfulConnections + failedConnections}/${userCount} connections attempted`);
                    }
                })
                .catch(() => {
                    failedConnections++;
                });

            connectionPromises.push(promise);

            // Stagger connections
            if (i % 20 === 0) {
                await new Promise(resolve => setTimeout(resolve, 50));
            }

            // Stop if system is becoming unstable
            if (!this.isSystemStable) {
                console.log('🛑 Stopping connections due to system instability');
                break;
            }
        }

        await Promise.allSettled(connectionPromises);
    }

    logLiveMetrics(userCount) {
        const testDurationSoFar = 10; // approximate
        const currentMessagesPerSecond = (this.metrics.messagesSent / testDurationSoFar).toFixed(2);
        const errorRate = ((this.metrics.errors / (this.metrics.messagesSent + this.metrics.errors)) * 100).toFixed(2);
        const healthStatus = this.isSystemStable ? '✅ STABLE' : '🚨 UNSTABLE';

        console.log(`   ${healthStatus} | Msg: ${currentMessagesPerSecond}/sec | Errors: ${errorRate}% | Active: ${this.metrics.activeConnections}/${userCount}`);
    }

    resetMetrics() {
        this.metrics = {
            activeConnections: 0,
            messagesSent: 0,
            updatesApplied: 0,
            errors: 0,
            connectionFailures: 0
        };
    }

    printFinalResults(maxStableUsers, breakingPoint) {
        console.log('\n🎯 ===== YJS LOAD TEST RESULTS =====\n');
        console.log(`🏆 Maximum Stable Users: ${maxStableUsers}`);
        console.log(`💥 Breaking Point: ${breakingPoint || 'Not reached'}`);
        
        console.log('\n📊 Performance Summary:');
        console.log('Users | Msg/sec | Error Rate | Conn Success | Status');
        console.log('------|---------|------------|--------------|--------');
        
        this.performanceLog.forEach(log => {
            const status = log.success ? '✅ PASS' : '❌ FAIL';
            console.log(
                `${log.users.toString().padEnd(5)} | ${log.messagesPerSecond.padEnd(7)} | ${log.errorRate.toString().padEnd(9)}% | ${log.connectionSuccessRate.toString().padEnd(11)}% | ${status}`
            );
        });

        console.log('\n💡 Recommendations:');
        if (maxStableUsers < 50) {
            console.log('❌ System needs major optimization');
        } else if (maxStableUsers < 200) {
            console.log('⚠️  Suitable for small teams, consider scaling solutions');
        } else if (maxStableUsers < 500) {
            console.log('✅ Good for medium organizations');
        } else {
            console.log('🎉 Excellent! Ready for large-scale enterprise use');
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

// Run the test
const tester = new YjsLoadTester('ws://localhost:1234', 'load-test');
tester.runIncrementalLoadTest().catch(console.error);