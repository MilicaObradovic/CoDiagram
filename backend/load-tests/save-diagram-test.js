const axios = require('axios');

class DiagramUpdateLoadTester {
    constructor(baseURL, authToken) {
        this.baseURL = baseURL;
        this.authToken = authToken;
        this.metrics = {
            requests: 0,
            successes: 0,
            failures: 0,
            totalLatency: 0,
            timeouts: 0,
            serverErrors: 0
        };
        this.performanceLog = [];
        this.breakingPoint = null;
    }

    async findBreakingPoint(diagramId, updateType = 'node-move') {
        console.log('🚀 Finding Breaking Point for Diagram Update Route\n');
        
        const config = {
            startUsers: 10,
            increment: 10,
            maxUsers: 1000,
            requestsPerUser: 20,
            thinkTimeMs: 200,
            testDurationPerStep: 15000, // 15 seconds per step
            successThreshold: 95, // 95% success rate
            latencyThreshold: 5000, // 5 seconds max latency
            cooldownBetweenSteps: 3000
        };

        let currentUsers = config.startUsers;
        let maxStableUsers = 0;

        while (currentUsers <= config.maxUsers && !this.breakingPoint) {
            console.log(`\n🎯 Testing ${currentUsers} concurrent users...`);
            
            this.resetMetrics();
            const success = await this.runLoadTestStep(diagramId, {
                concurrentUsers: currentUsers,
                requestsPerUser: config.requestsPerUser,
                thinkTimeMs: config.thinkTimeMs,
                updateType: updateType,
                durationMs: config.testDurationPerStep
            });

            if (success) {
                maxStableUsers = currentUsers;
                console.log(`✅ System stable with ${currentUsers} users`);
                currentUsers += config.increment;
                
                // Increase increment as we go higher to speed up testing
                if (currentUsers > 100) config.increment = 25;
                if (currentUsers > 300) config.increment = 50;
            }

            await new Promise(resolve => setTimeout(resolve, config.cooldownBetweenSteps));
        }

        this.printBreakingPointResults(maxStableUsers, this.breakingPoint);
        return { maxStableUsers, breakingPoint: this.breakingPoint };
    }

    async runLoadTestStep(diagramId, testConfig) {
        const { concurrentUsers, requestsPerUser, thinkTimeMs, updateType, durationMs } = testConfig;
        
        const userPromises = [];
        const startTime = Date.now();
        
        // Create a controller to stop the test after duration
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), durationMs);
        
        try {
            for (let i = 0; i < concurrentUsers; i++) {
                userPromises.push(
                    this.simulateUserUpdates(diagramId, i, requestsPerUser, thinkTimeMs, updateType, controller)
                );
            }
            
            await Promise.all(userPromises);
        } catch (error) {
            // Test was aborted due to timeout - this is expected
        } finally {
            clearTimeout(timeout);
        }
        
        const totalTime = Date.now() - startTime;
        return this.evaluateStepSuccess(testConfig, totalTime);
    }

    async simulateUserUpdates(diagramId, userId, requestsPerUser, thinkTimeMs, updateType, controller) {
        let requestsMade = 0;
        
        while (requestsMade < requestsPerUser && !controller.signal.aborted) {
            const updateData = this.generateUpdateData(userId, requestsMade, updateType);
            
            try {
                const startTime = Date.now();
                
                const response = await axios.put(
                    `${this.baseURL}/api/diagrams/${diagramId}`,
                    updateData,
                    {
                        headers: {
                            'Authorization': `Bearer ${this.authToken}`,
                            'Content-Type': 'application/json'
                        },
                        timeout: 10000,
                        signal: controller.signal
                    }
                );
                
                const latency = Date.now() - startTime;
                
                this.metrics.requests++;
                this.metrics.successes++;
                this.metrics.totalLatency += latency;
                
                requestsMade++;
                
                if (thinkTimeMs > 0 && !controller.signal.aborted) {
                    await new Promise(resolve => setTimeout(resolve, thinkTimeMs));
                }
                
            } catch (error) {
                this.metrics.requests++;
                this.metrics.failures++;
                
                if (error.code === 'ECONNABORTED') {
                    this.metrics.timeouts++;
                } else if (error.response && error.response.status >= 500) {
                    this.metrics.serverErrors++;
                }
                
                // If we're getting consistent errors, break early
                if (this.metrics.failures > this.metrics.requests * 0.3) {
                    break;
                }
                
                requestsMade++;
            }
        }
    }

    evaluateStepSuccess(testConfig, totalTime) {
        const avgLatency = this.metrics.requests > 0 
            ? (this.metrics.totalLatency / this.metrics.requests) 
            : 0;
        
        const successRate = this.metrics.requests > 0 
            ? (this.metrics.successes / this.metrics.requests) * 100 
            : 0;
        
        const requestsPerSecond = (this.metrics.requests / (totalTime / 1000));
        
        // Log current step results
        console.log(`
        📊 Step Results:
        ├── Success Rate: ${successRate.toFixed(2)}%
        ├── Avg Latency: ${avgLatency.toFixed(2)}ms
        ├── Requests/Sec: ${requestsPerSecond.toFixed(2)}
        ├── Timeouts: ${this.metrics.timeouts}
        └── Server Errors: ${this.metrics.serverErrors}
        `);
        
        // Store for analysis
        this.performanceLog.push({
            ...testConfig,
            avgLatency: avgLatency.toFixed(2),
            successRate: successRate.toFixed(2),
            requestsPerSecond: requestsPerSecond.toFixed(2),
            totalRequests: this.metrics.requests,
            timeouts: this.metrics.timeouts,
            serverErrors: this.metrics.serverErrors
        });
        
        // Success criteria
        const isSuccess = successRate >= 95 && avgLatency < 5000;
        
        if (!isSuccess) {
            console.log('❌ Step failed - system struggling');
            if (successRate < 80) {
                console.log('   → Too many failures');
            }
            if (avgLatency >= 5000) {
                console.log('   → Latency too high');
            }
        }
        
        return isSuccess;
    }

    generateUpdateData(userId, requestIndex, updateType) {
        const baseData = {
            description: `Updated by user ${userId} at ${new Date().toISOString()}`,
            updatedAt: new Date().toISOString()
        };

        switch (updateType) {
            case 'node-move':
                return {
                    ...baseData,
                    nodes: this.generateNodes(5, 10, true),
                    viewport: { x: Math.random() * 100, y: Math.random() * 100, zoom: 1 }
                };
            
            case 'node-create':
                return {
                    ...baseData,
                    nodes: this.generateNodes(15, 25, false),
                    edges: this.generateEdges(10, 20)
                };
            
            default:
                return baseData;
        }
    }

    generateNodes(minCount, maxCount, isMovement) {
        const nodeCount = minCount + Math.floor(Math.random() * (maxCount - minCount));
        const nodes = [];
        
        for (let i = 0; i < nodeCount; i++) {
            nodes.push({
                id: `node-${Date.now()}-${i}`,
                type: ['input', 'default', 'output', 'rectangle', 'circle'][i % 5],
                position: {
                    x: (isMovement ? i * 120 : Math.random() * 1000),
                    y: (isMovement ? 100 : Math.random() * 800)
                },
                data: { 
                    label: `Node ${i}`,
                    customData: Math.random().toString(36).substring(7)
                },
                width: 200 + (i % 3) * 50,
                height: 100 + (i % 2) * 30,
                selected: i === 0,
                dragging: false
            });
        }
        
        return nodes;
    }

    generateEdges(minCount, maxCount) {
        const edgeCount = minCount + Math.floor(Math.random() * (maxCount - minCount));
        const edges = [];
        
        for (let i = 0; i < edgeCount; i++) {
            edges.push({
                id: `edge-${Date.now()}-${i}`,
                source: `node-${i % 15}`,
                target: `node-${(i + 3) % 15}`,
                sourceHandle: `handle-${i % 4}`,
                targetHandle: `handle-${(i + 2) % 4}`,
                type: ['default', 'smoothstep', 'step'][i % 3],
                data: { lineStyle: ['solid', 'dashed', 'dotted'][i % 3] },
                selected: i === 0
            });
        }
        
        return edges;
    }

    resetMetrics() {
        this.metrics = {
            requests: 0,
            successes: 0,
            failures: 0,
            totalLatency: 0,
            timeouts: 0,
            serverErrors: 0
        };
    }

    printBreakingPointResults(maxStableUsers, breakingPoint) {
        console.log('\n🎯 ===== BREAKING POINT ANALYSIS =====\n');
        console.log(`🏆 Maximum Stable Users: ${maxStableUsers}`);
        console.log(`💥 Breaking Point: ${breakingPoint || 'Not reached (test stopped at max limit)'}`);
        
        console.log('\n📊 Performance Progression:');
        console.log('Users | Success Rate | Avg Latency | Req/Sec | Status');
        console.log('------|--------------|-------------|---------|--------');
        
        this.performanceLog.forEach((log, index) => {
            const isStable = parseFloat(log.successRate) >= 95 && parseFloat(log.avgLatency) < 5000;
            const status = isStable ? '✅ STABLE' : '❌ FAILED';
            console.log(
                `${log.concurrentUsers.toString().padEnd(5)} | ${log.successRate.toString().padEnd(12)}% | ${log.avgLatency.toString().padEnd(11)}ms | ${log.requestsPerSecond.toString().padEnd(7)} | ${status}`
            );
        });

        console.log('\n💡 Capacity Analysis:');
        if (maxStableUsers >= 500) {
            console.log('✅ EXCELLENT - Can handle enterprise-scale loads');
        } else if (maxStableUsers >= 200) {
            console.log('✅ GOOD - Suitable for medium to large teams');
        } else if (maxStableUsers >= 100) {
            console.log('⚠️  ADEQUATE - Works for small to medium teams');
        } else {
            console.log('❌ LIMITED - Needs optimization for production use');
        }

        // Show performance degradation
        if (this.performanceLog.length > 1) {
            const first = this.performanceLog[0];
            const lastStable = this.performanceLog.find(log => 
                parseFloat(log.successRate) >= 95
            ) || first;
            
            const latencyIncrease = ((parseFloat(lastStable.avgLatency) - parseFloat(first.avgLatency)) / parseFloat(first.avgLatency)) * 100;
            console.log(`📈 Latency increased by ${latencyIncrease.toFixed(1)}% at maximum load`);
        }
    }
}

// Usage - Find the actual breaking point
const tester = new DiagramUpdateLoadTester(
    'http://localhost:5001',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTAzZTJjY2Y2Yzk3MDBiYTlhZjM1YjciLCJpYXQiOjE3NjQyNjMxNzcsImV4cCI6MTc2NDg2Nzk3N30.M-ckd6hMK1sEtuqI1RNb0PPijtMrYlVWHOvgDQ8rFFQ'
);

async function main() {
    const diagramId = '690b7347ff0e876e51c3ae79';
    
    // Test node movements (most common operation)
    await tester.findBreakingPoint(diagramId, 'node-move');

}

main().catch(console.error);