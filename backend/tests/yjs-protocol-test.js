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
            nodeUpdatesSent: 0,
            cursorUpdatesSent: 0,
            updatesApplied: 0,
            errors: 0,
            connectionFailures: 0
        };
        this.performanceLog = [];
        this.isSystemStable = true;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    sendUpdate(client, kind = 'node') {
        if (client.ws.readyState !== WebSocket.OPEN) return false;

        const update = Y.encodeStateAsUpdate(client.doc);
        client.ws.send(update);

        this.metrics.messagesSent++;
        if (kind === 'node') this.metrics.nodeUpdatesSent++;
        if (kind === 'cursor') this.metrics.cursorUpdatesSent++;

        return true;
    }

    async createYjsClient(userId, roomId, config) {
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
                cursors: doc.getMap('cursors'),
                timers: []
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
                this.startUserSimulation(client, config);
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
                clearTimeout(connectionTimeout);
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

        // Stability criteria: error rate > 5% or ANY connection failure
        if (errorRate > 5 || this.metrics.connectionFailures > 0) {
            console.log(`\n[!] INSTABILITY DETECTED: Errors: ${errorRate.toFixed(2)}%, Failures: ${this.metrics.connectionFailures}`);
            this.isSystemStable = false;
        }
    }

    startUserSimulation(client, config) {
        const canvasWidth = config.canvasWidth || 1920;
        const canvasHeight = config.canvasHeight || 1080;

        const simulateNodeChange = () => {
            if (!this.isSystemStable || !client.connected) return;

            try {
                // Simulate a diagram node update
                client.nodes.set(`node-${client.id}`, {
                    x: Math.random(),
                    y: Math.random()
                });

                this.sendUpdate(client, 'node');
            } catch (e) {
                this.metrics.errors++;
                this.checkSystemHealth();
            }

            const timer = setTimeout(
                simulateNodeChange,
                1000 + Math.random() * 2000
            );
            client.timers.push(timer);
        };

        const simulateCursorMove = () => {
            if (!this.isSystemStable || !client.connected) return;

            try {
                // Simulate cursor movement in the diagram area
                const cursorPosition = {
                    x: Math.floor(Math.random() * canvasWidth),
                    y: Math.floor(Math.random() * canvasHeight),
                    userId: client.id,
                    timestamp: Date.now()
                };

                client.cursors.set(client.id.toString(), cursorPosition);
                this.sendUpdate(client, 'cursor');
            } catch (e) {
                this.metrics.errors++;
                this.checkSystemHealth();
            }

            // Cursor changes are more frequent than node changes
            const timer = setTimeout(
                simulateCursorMove,
                100 + Math.random() * 250
            );
            client.timers.push(timer);
        };

        simulateNodeChange();
        simulateCursorMove();
    }

    async runIncrementalLoadTest() {
        console.log('--- STARTING YJS LOAD TEST ---\n');

        const config = {
            initial: 50,
            step: 50,
            max: 5000,
            duration: 10000,
            rooms: 3,
            repetitions: 3,      // broj ponavljanja po scenariju
            canvasWidth: 1920,   // simulacija kursora
            canvasHeight: 1080
        };

        let current = config.initial;

        while (current <= config.max && this.isSystemStable) {
            console.log(`\nTESTING: ${current} Users`);

            const summary = await this.runAveragedTest(
                current,
                config.duration,
                config.rooms,
                config.repetitions,
                config
            );

            if (!summary.success) {
                console.log(`\n❌ SYSTEM FAILED AT ${current} USERS.`);
                break;
            }
            this.performanceLog.push(summary);

            console.log(`✅ SUCCESS: ${current} users stable (average of ${config.repetitions} runs).`);
            current += config.step;
            await this.sleep(2000);
        }

        this.printFinalResults();
    }

    async runAveragedTest(userCount, durationMs, rooms, repetitions, config) {
        const results = [];

        for (let i = 0; i < repetitions; i++) {
            console.log(`   Run ${i + 1}/${repetitions}`);
            const result = await this.runSingleTest(userCount, durationMs, rooms, config);

            if (!result.success) {
                return {
                    success: false,
                    users: userCount,
                    rooms,
                    mps: 0,
                    nodeMps: 0,
                    cursorMps: 0,
                    errors: 0,
                    repetitions: i + 1
                };
            }

            results.push(result);

            // mali razmak između ponavljanja
            if (i < repetitions - 1) {
                await this.sleep(1500);
            }
        }

        const avg = (key) =>
            results.reduce((sum, item) => sum + Number(item[key]), 0) / results.length;

        return {
            success: true,
            users: userCount,
            rooms: results[0].rooms,
            mps: avg('mps').toFixed(2),
            nodeMps: avg('nodeMps').toFixed(2),
            cursorMps: avg('cursorMps').toFixed(2),
            errors: avg('errors').toFixed(2),
            repetitions
        };
    }

    async runSingleTest(userCount, durationMs, rooms, config) {
        await this.cleanup();
        this.resetMetrics();
        this.isSystemStable = true;

        try {
            const connectionPromises = [];
            const roomIds = new Set();

            for (let i = 0; i < userCount; i++) {
                const roomIndex = Math.floor(i % rooms);
                const roomId = `${this.baseRoom}-${roomIndex}`;
                roomIds.add(roomId);

                connectionPromises.push(
                    this.createYjsClient(`u-${i}-${Date.now()}`, roomId, config)
                );

                if (i % 20 === 0) await this.sleep(50);
            }

            console.log(`   Target Rooms: ${roomIds.size}`);
            await Promise.all(connectionPromises);
            console.log(`   All ${userCount} clients connected. Simulation running...`);

            const startTime = Date.now();
            while (Date.now() - startTime < durationMs) {
                if (!this.isSystemStable) {
                    return { success: false };
                }
                await this.sleep(200);
            }

            const totalSeconds = durationMs / 1000;

            const mps = (this.metrics.messagesSent / totalSeconds).toFixed(2);
            const nodeMps = (this.metrics.nodeUpdatesSent / totalSeconds).toFixed(2);
            const cursorMps = (this.metrics.cursorUpdatesSent / totalSeconds).toFixed(2);
            const errorRate =
                (this.metrics.errors / (this.metrics.messagesSent + this.metrics.errors)) * 100 || 0;

            const success = errorRate < 5 && this.isSystemStable;

            // this.performanceLog.push({
            //     users: userCount,
            //     rooms: roomIds.size,
            //     mps,
            //     nodeMps,
            //     cursorMps,
            //     errors: this.metrics.errors,
            //     success
            // });

            return {
                users: userCount,
                rooms: roomIds.size,
                mps,
                nodeMps,
                cursorMps,
                errors: this.metrics.errors,
                success
            };
        } catch (e) {
            console.log(`   Critical error during test: ${e.message}`);
            return { success: false };
        }
    }

    resetMetrics() {
        this.metrics = {
            activeConnections: 0,
            messagesSent: 0,
            nodeUpdatesSent: 0,
            cursorUpdatesSent: 0,
            updatesApplied: 0,
            errors: 0,
            connectionFailures: 0
        };
    }

    async cleanup() {
        this.clients.forEach((c) => {
            if (c.timers && Array.isArray(c.timers)) {
                c.timers.forEach(clearTimeout);
            }
            c.ws.terminate();
        });

        this.clients.clear();
        await this.sleep(1000);
    }

    printFinalResults() {
        console.log('\n--- PERFORMANCE SUMMARY ---');
        console.log('Users | Rooms | Avg Msg/sec | Errors | Status');
        console.log('----------------------------------------------');
        this.performanceLog.forEach((l) => {
            console.log(
                `${l.users.toString().padEnd(5)} | ` +
                `${l.rooms.toString().padEnd(5)} | ` +
                `${l.mps.toString().padEnd(7)}    | ` +
                `${l.errors.toString().padEnd(6)} | ` +
                `${l.success ? '✅ PASS' : '❌ FAIL'}`
            );
        });
    }
}

const tester = new YjsLoadTester('ws://localhost:1234', 'load-test');
tester.runIncrementalLoadTest().then(() => {
    console.log('\nLoad test process completed.');
    process.exit(0);
});