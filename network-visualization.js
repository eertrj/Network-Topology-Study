/**
 * Network Message Propagation Visualization
 * Interactive web-based network visualization with playback controls
 */

class NetworkVisualization {
    constructor() {
        // Display version info for new session
        console.log('Network Message Propagation Visualization v15 - Session started at 2025-01-01 18:00:00');
        
        this.canvas = null;
        this.ctx = null;
        this.network = null;
        this.propagationSteps = [];
        this.currentStep = 0;
        this.animationId = null;
        this.isPlaying = false;
        this.nodePositions = [];
        this.colors = {
            origin: '#2E8B57',
            received: '#32CD32',
            propagating: '#4169E1',
            pending: '#DC143C',
            edge: '#808080',
            diagnostic: '#FF8C00'  // Orange for diagnostic nodes
        };
        
        // Diagnostic properties
        this.stoppedNodes = []; // Nodes that have stopped (received message twice)
        this.diagnosticConfirmations = []; // Confirmations received by origin
        this.confirmationPaths = new Map(); // Maps confirmation ID to path
        this.diagnosticChart = null;
        this.diagnosticChartCtx = null;
        this.currentNodeCount = 100; // Track current node count for canvas sizing
        
        this.initializeCanvas();
        this.setupEventListeners();
        // Set initial canvas size based on default node count (100)
        this.updateCanvasSize(100);
    }

    initializeCanvas() {
        const container = document.getElementById('canvasContainer');
        
        const canvas = document.createElement('canvas');
        // Initial size will be set by updateCanvasSize after initialization
        canvas.width = 800;
        canvas.height = 600;
        // Remove all size constraints to allow canvas to grow beyond container
        canvas.style.maxWidth = 'none';
        canvas.style.maxHeight = 'none';
        canvas.style.minWidth = 'none';
        canvas.style.minHeight = 'none';
        canvas.style.width = 'auto';
        canvas.style.height = 'auto';
        
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        container.innerHTML = '';
        container.appendChild(canvas);
        
        // Initialize diagnostic chart
        this.initializeDiagnosticChart();
    }

    setupEventListeners() {
        // Node size slider
        document.getElementById('nodeSize').addEventListener('input', (e) => {
            document.getElementById('nodeSizeValue').textContent = e.target.value;
            if (this.network) {
                this.drawNetwork();
            }
        });

        // Geographical constraints sliders
        document.getElementById('maxConnectionDistance').addEventListener('input', (e) => {
            document.getElementById('maxConnectionDistanceValue').textContent = e.target.value + ' pixels';
        });

        document.getElementById('distanceWeight').addEventListener('input', (e) => {
            document.getElementById('distanceWeightValue').textContent = e.target.value;
        });

        document.getElementById('longDistancePercentage').addEventListener('input', (e) => {
            document.getElementById('longDistanceValue').textContent = e.target.value + '%';
        });

        // Update canvas size on window resize
        window.addEventListener('resize', () => {
            // Use stored node count to maintain proper sizing
            this.updateCanvasSize(this.currentNodeCount);
        });

        // Update canvas size when total nodes changes
        document.getElementById('totalNodes').addEventListener('input', (e) => {
            const totalNodes = parseInt(e.target.value);
            if (totalNodes >= 10 && totalNodes <= 10000) {
                this.currentNodeCount = totalNodes; // Store the current node count
                this.updateCanvasSize(totalNodes);
                // Redraw network if it exists
                if (this.network) {
                    this.drawNetwork();
                }
            }
        });

        // Add keyboard navigation
        document.addEventListener('keydown', (e) => {
            // Only handle arrow keys if no input field is focused
            if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT') {
                return;
            }
            
            switch(e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    if (this.propagationSteps && this.propagationSteps.length > 0) {
                        this.stepBackward();
                    }
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    if (this.propagationSteps && this.propagationSteps.length > 0) {
                        this.stepForward();
                    }
                    break;
            }
        });
    }

    calculateOptimalCanvasSize(totalNodes) {
        // Density: 3 nodes per 50x50 pixel square = 833.33 square pixels per node
        // This ensures good spacing without overlap
        
        const pixelsPerNode = (50 * 50) / 3; // 833.33 square pixels per node
        const aspectRatio = 4/3; // width/height ratio
        
        // Calculate total area needed
        const totalArea = totalNodes * pixelsPerNode;
        
        // Calculate dimensions maintaining aspect ratio
        const height = Math.sqrt(totalArea / aspectRatio);
        const width = height * aspectRatio;
        
        // Apply reasonable bounds - allow much larger canvas for high node counts
        // Use smaller minSize to allow proper scaling for small networks
        const minSize = 200; // Minimum canvas size for small networks
        const maxSize = 8000; // Increased to support up to 10000 nodes with proper density
        
        const finalWidth = Math.max(minSize, Math.min(maxSize, width));
        const finalHeight = Math.max(minSize * 3/4, Math.min(maxSize * 3/4, height));
        
        return {
            width: finalWidth,
            height: finalHeight
        };
    }

    updateCanvasSize(totalNodes = null) {
        if (totalNodes) {
            // Dynamic sizing based on node count - no container constraints
            const optimalSize = this.calculateOptimalCanvasSize(totalNodes);
            this.canvas.width = optimalSize.width;
            this.canvas.height = optimalSize.height;
            
            // Adjust container size for very large networks
            this.adjustContainerForLargeNetworks(optimalSize.width, totalNodes);
            
            // Force a reflow to ensure the canvas dimensions are updated
            this.canvas.offsetHeight;
        } else {
            // Fallback to fixed sizing for window resize
            this.canvas.width = 800;
            this.canvas.height = 600;
        }
        
        if (this.network) {
            this.drawNetwork();
        }
    }
    
    adjustContainerForLargeNetworks(canvasWidth, totalNodes) {
        // For networks larger than 1000 nodes, ensure the container can accommodate the canvas
        if (totalNodes > 1000) {
            const container = document.querySelector('.container');
            const minRequiredWidth = canvasWidth + 350 + 60; // canvas + control panel + padding
            
            console.log(`Large network detected (${totalNodes} nodes): Adjusting container width`);
            console.log(`Canvas width: ${canvasWidth}px, Required container width: ${minRequiredWidth}px`);
            
            // For very large networks (>5000 nodes), use almost full viewport width
            if (totalNodes > 5000) {
                container.style.maxWidth = '98vw';
                console.log(`Very large network (${totalNodes} nodes): Using 98vw container width`);
            } else {
                // Ensure container is wide enough for the canvas
                if (container.style.maxWidth && parseInt(container.style.maxWidth) < minRequiredWidth) {
                    const newMaxWidth = Math.max(minRequiredWidth, window.innerWidth * 0.95);
                    container.style.maxWidth = newMaxWidth + 'px';
                    console.log(`Container max-width adjusted to: ${newMaxWidth}px`);
                }
            }
        }
    }

    generateNetwork() {
        const totalNodes = parseInt(document.getElementById('totalNodes').value);
        const connectionsPerNode = parseInt(document.getElementById('connectionsPerNode').value);
        const seed = parseInt(document.getElementById('randomSeed').value);
        const enableGeographical = document.getElementById('enableGeographical').checked;

        // Display network generation settings in console
        console.log('=== NETWORK GENERATION SETTINGS ===');
        console.log('Basic Configuration:');
        console.log(`  Total Nodes: ${totalNodes}`);
        console.log(`  Connections per Node: ${connectionsPerNode}`);
        console.log(`  Random Seed: ${seed}`);
        console.log(`  Geographical Constraints: ${enableGeographical ? 'Enabled' : 'Disabled'}`);
        
        // Calculate estimated generation time
        const estimatedTime = this.calculateProcessingTime(totalNodes, connectionsPerNode, enableGeographical);
        console.log(`  Estimated Generation Time: ${estimatedTime}`);
        
        if (enableGeographical) {
            const maxConnectionDistance = parseInt(document.getElementById('maxConnectionDistance').value);
            const distanceWeight = parseFloat(document.getElementById('distanceWeight').value);
            const longDistancePercentage = parseInt(document.getElementById('longDistancePercentage').value);
            const enableBridging = document.getElementById('enableBridging').checked;
            
            console.log('Geographical Settings:');
            console.log(`  Max Connection Distance: ${maxConnectionDistance} pixels`);
            console.log(`  Distance Weight: ${distanceWeight}`);
            console.log(`  Long Distance Percentage: ${longDistancePercentage}%`);
            console.log(`  Bridging Connections: ${enableBridging ? 'Enabled' : 'Disabled'}`);
        }
        
        const originNode = parseInt(document.getElementById('originNode').value);
        const processingTime = parseFloat(document.getElementById('processingTime').value);
        const networkLatency = parseFloat(document.getElementById('networkLatency').value);
        const enableDiagnostics = document.getElementById('enableDiagnostics').checked;
        const diagnosticDelay = parseFloat(document.getElementById('diagnosticDelay').value);
        const animationSpeed = parseInt(document.getElementById('animationSpeed').value);
        const nodeSize = parseInt(document.getElementById('nodeSize').value);
        const layoutType = document.getElementById('layoutType').value;
        
        console.log('Simulation Settings:');
        console.log(`  Origin Node: ${originNode}`);
        console.log(`  Processing Time: ${processingTime} ms`);
        console.log(`  Network Latency: ${networkLatency} ms`);
        console.log(`  Diagnostics: ${enableDiagnostics ? 'Enabled' : 'Disabled'}`);
        if (enableDiagnostics) {
            console.log(`  Diagnostic Delay: ${diagnosticDelay} ms`);
        }
        console.log(`  Animation Speed: ${animationSpeed} ms`);
        console.log(`  Node Size: ${nodeSize} pixels`);
        console.log(`  Layout Type: ${layoutType}`);
        console.log('=====================================');

        // Store the current node count for later use
        this.currentNodeCount = totalNodes;

        if (totalNodes < 10 || totalNodes > 10000) {
            this.showError('Total nodes must be between 10 and 10000');
            return;
        }

        if (connectionsPerNode >= totalNodes) {
            this.showError('Connections per node must be less than total nodes');
            return;
        }

        // Calculate estimated processing time for geographical networks
        if (enableGeographical) {
            const estimatedTime = this.calculateProcessingTime(totalNodes, connectionsPerNode, enableGeographical);
            
            // Show confirmation dialog for large networks
            // Skip confirmation dialog for large networks - proceed automatically
        }

        try {
            // Show progress message with estimated time
            const estimatedTime = this.calculateProcessingTime(totalNodes, connectionsPerNode, enableGeographical);
            this.showStatusMessage(`Generating network... Estimated time: ${estimatedTime}`);
            
            // Reset all state for new network
            this.network = null;
            this.propagationSteps = [];
            this.currentStep = 0;
            this.nodePositions = [];
            this.geographicalPositions = null;
            this.isPlaying = false;
            
            // Clear any existing canvas content and reinitialize
            const container = document.getElementById('canvasContainer');
            container.innerHTML = '<div class="loading" id="loadingMessage">Generating network...</div>';
            this.initializeCanvas();
            
            // CRITICAL: Update canvas size BEFORE network generation to ensure correct dimensions
            this.updateCanvasSize(totalNodes);
            
            // Generate network asynchronously to prevent UI freezing
            setTimeout(() => {
                try {
                    const generationStartTime = performance.now();
                    console.log('%cStarting network generation...', 'color: #00FF00; font-weight: bold;');
                    console.log(`%cUsing algorithm: ${totalNodes <= 100 ? 'Full Geographical' : 'Simplified Geographical'} (threshold: 100 nodes)`, 'color: #87CEEB; font-weight: bold;');
                    
                    if (totalNodes > 1000) {
                        if (totalNodes > 5000) {
                            console.log(`%c⚠️ Very large network (${totalNodes} nodes): Generation may take 10+ seconds`, 'color: #FF6B6B; font-weight: bold; background: #2D1B1B; padding: 2px 4px; border-radius: 3px;');
                            console.log(`%cCanvas size: ${this.canvas.width}x${this.canvas.height} pixels`, 'color: #FFA500; font-weight: bold;');
                            console.log(`%cConsider using smaller networks for better performance`, 'color: #FFB6C1; font-style: italic;');
                        } else {
                            console.log(`%c⚠️ Large network (${totalNodes} nodes): Generation may take several seconds`, 'color: #FFA500; font-weight: bold; background: #2D2B1B; padding: 2px 4px; border-radius: 3px;');
                            console.log(`%cCanvas size: ${this.canvas.width}x${this.canvas.height} pixels`, 'color: #87CEEB; font-weight: bold;');
                        }
                    }
                    
                    this.network = this.createSmallWorldNetwork(totalNodes, connectionsPerNode, seed);
                    
                    const generationEndTime = performance.now();
                    const generationTime = generationEndTime - generationStartTime;
                    
                    console.log('%cNetwork generation completed!', 'color: #00FF00; font-weight: bold; background: #1B2D1B; padding: 2px 4px; border-radius: 3px;');
                    console.log(`%cGeneration time: ${generationTime.toFixed(2)} ms`, 'color: #FFD700; font-weight: bold; background: #333; padding: 2px 4px; border-radius: 3px;');
                    
                    // Compare with estimated time
                    const estimatedTime = this.calculateProcessingTime(totalNodes, connectionsPerNode, enableGeographical);
                    const estimatedMs = parseFloat(estimatedTime.replace('ms', '').replace('s', '')) * (estimatedTime.includes('s') ? 1000 : 1);
                    const accuracy = ((generationTime / estimatedMs) * 100).toFixed(1);
                    console.log(`Estimated time: ${estimatedTime}, Accuracy: ${accuracy}%`);
                    
                    console.log(`Generated network with ${this.network.nodes.length} nodes and ${this.network.edges.length} edges`);
                    console.log(`Average connections per node: ${(this.network.edges.length * 2 / this.network.nodes.length).toFixed(2)}`);
                    
                    // Canvas is already sized correctly, proceed with node positioning
                    this.nodePositions = this.calculateNodePositions();
                    
                    this.showStatusMessage('Running propagation simulation...');
                    
                    // Automatically run propagation simulation
                    this.simulatePropagation();
                    
                    this.hideLoading();
                    this.hideStatusMessage();
                    this.drawNetwork();
                    this.updateStats();
                    this.updateControls();
                    
                } catch (error) {
                    this.showError('Error generating network: ' + error.message);
                }
            }, 50); // Small delay to allow UI to update
            
        } catch (error) {
            this.showError('Error generating network: ' + error.message);
        }
    }

    calculateProcessingTime(numNodes, connectionsPerNode, enableGeographical) {
        let estimatedTime = 0;
        
        if (enableGeographical) {
            // Geographical network calculation
            const totalPossibleConnections = numNodes * (numNodes - 1) / 2;
            const maxConnections = numNodes * connectionsPerNode;
            
            if (numNodes <= 100) {
                // Full calculation for small networks
                estimatedTime = Math.max(1, Math.round(totalPossibleConnections / 1000000)); // 1M calculations per second
            } else {
                // Optimized calculation for large networks
                const candidateNodes = Math.min(50, numNodes - 1); // Limited candidate nodes
                const calculationsPerNode = candidateNodes * connectionsPerNode;
                estimatedTime = Math.max(1, Math.round((calculationsPerNode * numNodes) / 500000)); // 500K calculations per second
            }
            
            // Add overhead for geographical calculations
            estimatedTime += Math.round(numNodes / 1000); // 1ms per 1000 nodes overhead
            
            // Additional scaling factor for very large networks (>1000 nodes)
            if (numNodes > 1000) {
                estimatedTime += Math.round((numNodes - 1000) / 500); // Extra 1ms per 500 nodes above 1000
            }
            
            // Extra scaling for extremely large networks (>5000 nodes)
            if (numNodes > 5000) {
                estimatedTime += Math.round((numNodes - 5000) / 1000); // Extra 1ms per 1000 nodes above 5000
            }
            
        } else {
            // Small world network calculation
            const totalConnections = numNodes * connectionsPerNode;
            estimatedTime = Math.max(1, Math.round(totalConnections / 1000000)); // 1M connections per second
        }
        
        // Convert to human-readable format
        if (estimatedTime < 1000) {
            return `${estimatedTime}ms`;
        } else if (estimatedTime < 60000) {
            return `${(estimatedTime / 1000).toFixed(1)}s`;
        } else {
            return `${(estimatedTime / 60000).toFixed(1)}m`;
        }
    }

    createSmallWorldNetwork(totalNodes, connectionsPerNode, seed) {
        // Simple random number generator with seed
        let rng = this.seededRandom(seed);
        
        // Get geographical constraints
        const enableGeographical = document.getElementById('enableGeographical').checked;
        const maxConnectionDistance = parseInt(document.getElementById('maxConnectionDistance').value);
        const distanceWeight = parseFloat(document.getElementById('distanceWeight').value);
        const longDistancePercentage = parseInt(document.getElementById('longDistancePercentage').value);
        
        const network = {
            nodes: Array.from({length: totalNodes}, (_, i) => ({id: i, connections: []})),
            edges: []
        };

        if (enableGeographical) {
            // Create geographical network
            const enableBridging = document.getElementById('enableBridging').checked;
            return this.createGeographicalNetwork(totalNodes, connectionsPerNode, rng, maxConnectionDistance, distanceWeight, longDistancePercentage, enableBridging);
        } else {
            // Original small-world network generation
            const k = Math.floor(connectionsPerNode / 2);
            for (let i = 0; i < totalNodes; i++) {
                for (let j = 1; j <= k; j++) {
                    const neighbor1 = (i + j) % totalNodes;
                    const neighbor2 = (i - j + totalNodes) % totalNodes;
                    
                    if (!network.nodes[i].connections.includes(neighbor1)) {
                        network.nodes[i].connections.push(neighbor1);
                        network.nodes[neighbor1].connections.push(i);
                        network.edges.push([i, neighbor1]);
                    }
                    
                    if (!network.nodes[i].connections.includes(neighbor2)) {
                        network.nodes[i].connections.push(neighbor2);
                        network.nodes[neighbor2].connections.push(i);
                        network.edges.push([i, neighbor2]);
                    }
                }
            }

            // Random rewiring
            const edgesToRewire = [];
            for (const edge of network.edges) {
                if (rng() < 0.3) {
                    edgesToRewire.push(edge);
                }
            }

            for (const edge of edgesToRewire) {
                const [node1, node2] = edge;
                
                // Remove existing connection
                network.nodes[node1].connections = network.nodes[node1].connections.filter(n => n !== node2);
                network.nodes[node2].connections = network.nodes[node2].connections.filter(n => n !== node1);
                network.edges = network.edges.filter(e => !(e[0] === node1 && e[1] === node2));
                
                // Find new random connection
                const possibleTargets = [];
                for (let i = 0; i < totalNodes; i++) {
                    if (i !== node1 && !network.nodes[node1].connections.includes(i)) {
                        possibleTargets.push(i);
                    }
                }
                
                if (possibleTargets.length > 0) {
                    const newTarget = possibleTargets[Math.floor(rng() * possibleTargets.length)];
                    network.nodes[node1].connections.push(newTarget);
                    network.nodes[newTarget].connections.push(node1);
                    network.edges.push([node1, newTarget]);
                }
            }
        }

        return network;
    }

    generateNonOverlappingPositions(totalNodes) {
        const positions = [];
        const margin = 25; // Minimum margin from canvas edge
        const nodeRadius = 8; // Node radius for collision detection
        const minDistance = nodeRadius * 2 + 4; // Minimum distance between node centers (16px + 4px buffer)
        const maxAttempts = 1000; // Maximum attempts per node to find a valid position
        
        // Force DOM reflow to ensure we get the latest dimensions
        this.canvas.offsetWidth;
        this.canvas.offsetHeight;
        
        // Get current canvas dimensions - these should be updated by updateCanvasSize()
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        
        for (let i = 0; i < totalNodes; i++) {
            let position = null;
            let attempts = 0;
            
            // Try to find a non-overlapping position
            while (position === null && attempts < maxAttempts) {
                const candidate = {
                    x: margin + nodeRadius + Math.random() * (canvasWidth - 2 * margin - 2 * nodeRadius),
                    y: margin + nodeRadius + Math.random() * (canvasHeight - 2 * margin - 2 * nodeRadius)
                };
                
                // Check if this position conflicts with existing nodes
                let hasCollision = false;
                for (const existingPos of positions) {
                    const distance = Math.sqrt(
                        Math.pow(candidate.x - existingPos.x, 2) + 
                        Math.pow(candidate.y - existingPos.y, 2)
                    );
                    if (distance < minDistance) {
                        hasCollision = true;
                        break;
                    }
                }
                
                if (!hasCollision) {
                    position = candidate;
                }
                
                attempts++;
            }
            
            // If we couldn't find a non-overlapping position, place it anyway
            // (this might happen with very dense networks)
            if (position === null) {
                console.warn(`Could not find non-overlapping position for node ${i} after ${maxAttempts} attempts`);
                position = {
                    x: margin + nodeRadius + Math.random() * (canvasWidth - 2 * margin - 2 * nodeRadius),
                    y: margin + nodeRadius + Math.random() * (canvasHeight - 2 * margin - 2 * nodeRadius)
                };
            }
            
            positions.push(position);
        }
        
        return positions;
    }

    createGeographicalNetwork(totalNodes, connectionsPerNode, rng, maxConnectionDistance, distanceWeight, longDistancePercentage, enableBridging) {
        const network = {
            nodes: Array.from({length: totalNodes}, (_, i) => ({id: i, connections: []})),
            edges: []
        };

        // Generate random positions for nodes with collision detection
        const positions = this.generateNonOverlappingPositions(totalNodes);

        // Create shared connection matrix to prevent duplicates across all algorithms
        const connectionMatrix = new Array(totalNodes).fill(null).map(() => new Array(totalNodes).fill(false));

        // Choose algorithm based on network size
        if (totalNodes <= 100) {
            // Full geographical algorithm for small networks
            this.createGeographicalConnectionsFull(network, positions, totalNodes, connectionsPerNode, rng, maxConnectionDistance, distanceWeight, longDistancePercentage, connectionMatrix, enableBridging);
        } else {
            // Simplified algorithm for larger networks
            this.createGeographicalConnectionsSimple(network, positions, totalNodes, connectionsPerNode, rng, maxConnectionDistance, distanceWeight, longDistancePercentage, connectionMatrix, enableBridging);
        }

        // Check connectivity and repair if fractured
        const isConnected = this.isNetworkConnected(network, totalNodes);
        if (!isConnected) {
            console.warn('WARNING: Network is fractured! Attempting to repair connectivity...');
            this.repairNetworkConnectivity(network, positions, totalNodes, connectionsPerNode, connectionMatrix);
            
            // Check again after repair
            const isConnectedAfterRepair = this.isNetworkConnected(network, totalNodes);
            if (isConnectedAfterRepair) {
                console.log('SUCCESS: Network connectivity repaired!');
            } else {
                console.error('ERROR: Failed to repair network connectivity!');
            }
        }

        // Store positions for later use
        this.geographicalPositions = positions;
        
        // Debug: Log actual connection distances and connection counts per node
        let connectionDistances = [];
        let connectionCounts = [];
        for (const edge of network.edges) {
            const [node1, node2] = edge;
            const pos1 = positions[node1];
            const pos2 = positions[node2];
            const dx = pos1.x - pos2.x;
            const dy = pos1.y - pos2.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            connectionDistances.push(distance);
        }
        connectionDistances.sort((a, b) => a - b);
        
        // Check connection counts per node
        for (let i = 0; i < totalNodes; i++) {
            connectionCounts.push(network.nodes[i].connections.length);
        }
        connectionCounts.sort((a, b) => b - a); // Sort descending to see max first
        
        
        // Check for nodes exceeding connection limit
        const exceededLimit = connectionCounts.filter(count => count > connectionsPerNode);
        if (exceededLimit.length > 0) {
            console.warn(`WARNING: ${exceededLimit.length} nodes exceed connection limit! Max connections: ${Math.max(...exceededLimit)}`);
        }
        
        return network;
    }


    isNetworkConnected(network, totalNodes) {
        if (totalNodes === 0) return true;
        
        const visited = new Array(totalNodes).fill(false);
        const queue = [0];
        visited[0] = true;
        let visitedCount = 1;
        
        while (queue.length > 0) {
            const current = queue.shift();
            for (const neighbor of network.nodes[current].connections) {
                if (!visited[neighbor]) {
                    visited[neighbor] = true;
                    visitedCount++;
                    queue.push(neighbor);
                }
            }
        }
        
        return visitedCount === totalNodes;
    }

    findConnectedComponents(network, totalNodes) {
        const visited = new Array(totalNodes).fill(false);
        const components = [];
        
        for (let i = 0; i < totalNodes; i++) {
            if (!visited[i]) {
                const component = [];
                const queue = [i];
                visited[i] = true;
                component.push(i);
                
                while (queue.length > 0) {
                    const current = queue.shift();
                    for (const neighbor of network.nodes[current].connections) {
                        if (!visited[neighbor]) {
                            visited[neighbor] = true;
                            component.push(neighbor);
                            queue.push(neighbor);
                        }
                    }
                }
                components.push(component);
            }
        }
        
        return components;
    }

    repairNetworkConnectivity(network, positions, totalNodes, connectionsPerNode, connectionMatrix) {
        
        // Step 1: Fix isolated nodes (nodes with 0 connections)
        const isolatedNodes = [];
        for (let i = 0; i < totalNodes; i++) {
            if (network.nodes[i].connections.length === 0) {
                isolatedNodes.push(i);
            }
        }
        
        if (isolatedNodes.length > 0) {
            
            // For each isolated node, connect it to the nearest connected node
            for (const isolatedNode of isolatedNodes) {
                const pos1 = positions[isolatedNode];
                let nearestNode = -1;
                let nearestDistance = Infinity;
                
                // Find the nearest connected node
                for (let j = 0; j < totalNodes; j++) {
                    if (j !== isolatedNode && network.nodes[j].connections.length > 0) {
                        const pos2 = positions[j];
                        const dx = pos1.x - pos2.x;
                        const dy = pos1.y - pos2.y;
                        const distance = dx * dx + dy * dy; // Use squared distance for efficiency
                        
                        if (distance < nearestDistance) {
                            nearestDistance = distance;
                            nearestNode = j;
                        }
                    }
                }
                
                if (nearestNode !== -1) {
                    // Create bidirectional connection
                    connectionMatrix[isolatedNode][nearestNode] = true;
                    connectionMatrix[nearestNode][isolatedNode] = true;
                    network.nodes[isolatedNode].connections.push(nearestNode);
                    network.nodes[nearestNode].connections.push(isolatedNode);
                    network.edges.push([isolatedNode, nearestNode]);
                    
                }
            }
        }
        
        // Step 2: Check if network is still fractured and connect components if needed
        const components = this.findConnectedComponents(network, totalNodes);
        
        if (components.length > 1) {
            
            // Connect the largest component to other components
            const sortedComponents = components.sort((a, b) => b.length - a.length);
            const mainComponent = sortedComponents[0];
            
            for (let i = 1; i < sortedComponents.length; i++) {
                const component = sortedComponents[i];
                
                // Find the closest pair of nodes between main component and this component
                let closestPair = null;
                let closestDistance = Infinity;
                
                for (const node1 of mainComponent) {
                    for (const node2 of component) {
                        const pos1 = positions[node1];
                        const pos2 = positions[node2];
                        const dx = pos1.x - pos2.x;
                        const dy = pos1.y - pos2.y;
                        const distance = dx * dx + dy * dy; // Use squared distance for efficiency
                        
                        if (distance < closestDistance) {
                            closestDistance = distance;
                            closestPair = [node1, node2];
                        }
                    }
                }
                
                if (closestPair) {
                    const [node1, node2] = closestPair;
                    
                    // Create bidirectional connection
                    connectionMatrix[node1][node2] = true;
                    connectionMatrix[node2][node1] = true;
                    network.nodes[node1].connections.push(node2);
                    network.nodes[node2].connections.push(node1);
                    network.edges.push([node1, node2]);
                    
                }
            }
        }
        
        // Step 3: Final connectivity check
        const finalComponents = this.findConnectedComponents(network, totalNodes);
        
        // Log connection count statistics
        const connectionCounts = network.nodes.map(node => node.connections.length);
        const maxConnections = Math.max(...connectionCounts);
        const minConnections = Math.min(...connectionCounts);
        const avgConnections = connectionCounts.reduce((sum, count) => sum + count, 0) / totalNodes;
        
    }

    createGeographicalConnectionsFull(network, positions, totalNodes, connectionsPerNode, rng, maxConnectionDistance, distanceWeight, longDistancePercentage, connectionMatrix, enableBridging) {
        // Full geographical algorithm for small networks (≤100 nodes)
        
        for (let i = 0; i < totalNodes; i++) {
            // Update progress for large networks
            if (totalNodes > 50 && i % 10 === 0) {
                this.showStatusMessage(`Generating network... ${Math.round((i / totalNodes) * 100)}% complete`);
            }
            
            const pos1 = positions[i];
            const connections = [];
            
            // Calculate distances to all other nodes
            const candidates = [];
            const longDistanceThreshold = maxConnectionDistance * 20; // Much larger range
            
            for (let j = 0; j < totalNodes; j++) {
                if (i !== j && !connectionMatrix[i][j]) { // Don't include already connected nodes
                    const pos2 = positions[j];
                    const dx = pos1.x - pos2.x;
                    const dy = pos1.y - pos2.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    // Include nodes based on bridging setting
                    if (enableBridging) {
                        // Include all nodes for bridging (no distance limit)
                        candidates.push({node: j, distance: distance});
                    } else {
                        // Include only nodes within long distance threshold
                        if (distance <= longDistanceThreshold) {
                            candidates.push({node: j, distance: distance});
                        }
                    }
                }
            }
            
            // Sort by distance
            candidates.sort((a, b) => a.distance - b.distance);
            
            // Separate short and long distance candidates
            const shortDistanceCandidates = candidates.filter(c => c.distance <= maxConnectionDistance);
            const longDistanceCandidates = candidates.filter(c => c.distance > maxConnectionDistance && c.distance <= longDistanceThreshold);
            
            // Calculate target connections (ensure we don't exceed the limit)
            const currentConnections = network.nodes[i].connections.length;
            const remainingConnections = Math.max(0, connectionsPerNode - currentConnections);
            const targetConnections = Math.min(remainingConnections, candidates.length);
            
            // Calculate how many long vs short distance connections to make
            const longDistanceConnections = Math.floor(targetConnections * longDistancePercentage / 100);
            const shortDistanceConnections = targetConnections - longDistanceConnections;
            
            let connectionsAdded = 0;
            
            // PRIORITIZE LONG DISTANCE CONNECTIONS when percentage is high
            if (longDistancePercentage >= 50) {
                // Add long distance connections first when percentage is high
                if (longDistanceConnections > 0 && longDistanceCandidates.length > 0) {
                    // Sort long distance candidates by distance (furthest first for true long distance)
                    const sortedLongDistance = [...longDistanceCandidates].sort((a, b) => b.distance - a.distance);
                    
                    for (const candidate of sortedLongDistance) {
                        if (connectionsAdded >= longDistanceConnections) break;
                        
                        // High probability for long distance when percentage is high
                        const longDistanceProbability = longDistancePercentage >= 80 ? 1.0 : (longDistancePercentage / 100);
                        
                        if (rng() < longDistanceProbability && !connections.includes(candidate.node)) {
                            connections.push(candidate.node);
                            connectionsAdded++;
                        }
                    }
                }
                
                // Then add short distance connections
                if (shortDistanceConnections > 0 && shortDistanceCandidates.length > 0) {
                    for (const candidate of shortDistanceCandidates) {
                        if (connectionsAdded >= targetConnections) break;
                        
                        // Probability based on distance and weight
                        const distanceFactor = candidate.distance / maxConnectionDistance;
                        const probability = Math.pow(1 - distanceFactor, distanceWeight);
                        
                        // Ensure minimum probability to prevent complete isolation
                        const minProbability = Math.max(0.05, Math.min(0.3, maxConnectionDistance / 1000));
                        const finalProbability = Math.max(probability, minProbability);
                        
                        if (rng() < finalProbability && !connections.includes(candidate.node)) {
                            connections.push(candidate.node);
                            connectionsAdded++;
                        }
                    }
                }
            } else {
                // Original logic for low long distance percentages
                // First, add short distance connections
                for (const candidate of shortDistanceCandidates) {
                    if (connectionsAdded >= shortDistanceConnections) break;
                    
                    // Probability based on distance and weight
                    const distanceFactor = candidate.distance / maxConnectionDistance;
                    const probability = Math.pow(1 - distanceFactor, distanceWeight);
                    
                    // Ensure minimum probability to prevent complete isolation
                    const minProbability = Math.max(0.05, Math.min(0.3, maxConnectionDistance / 1000));
                    const finalProbability = Math.max(probability, minProbability);
                    
                    if (rng() < finalProbability && !connections.includes(candidate.node)) {
                        connections.push(candidate.node);
                        connectionsAdded++;
                    }
                }
                
                // Then, add long distance connections if available and needed
                if (longDistanceConnections > 0 && longDistanceCandidates.length > 0) {
                    const shuffledLongDistance = [...longDistanceCandidates].sort(() => rng() - 0.5);
                    
                    for (const candidate of shuffledLongDistance) {
                        if (connectionsAdded >= targetConnections) break;
                        
                        // Long distance connections probability scales with percentage
                        const longDistanceProbability = Math.min(0.8, longDistancePercentage / 100);
                        
                        if (rng() < longDistanceProbability && !connections.includes(candidate.node)) {
                            connections.push(candidate.node);
                            connectionsAdded++;
                        }
                    }
                }
            }
            
            // Fill remaining connections if we haven't reached target (deterministic fallback)
            if (connectionsAdded < targetConnections) {
                const remainingCandidates = candidates.filter(c => !connections.includes(c.node));
                for (const candidate of remainingCandidates) {
                    if (connectionsAdded >= targetConnections) break;
                    connections.push(candidate.node);
                    connectionsAdded++;
                }
            }
            
            // Add bidirectional connections with strict connection limit enforcement
            for (const neighbor of connections) {
                if (!connectionMatrix[i][neighbor]) {
                    // STRICT ENFORCEMENT: Check both nodes' current connection counts
                    const currentConnectionsI = network.nodes[i].connections.length;
                    const currentConnectionsNeighbor = network.nodes[neighbor].connections.length;
                    
                    // Skip if either node would exceed the limit
                    if (currentConnectionsI >= connectionsPerNode) {
                        continue;
                    }
                    
                    if (currentConnectionsNeighbor >= connectionsPerNode) {
                        continue;
                    }
                    
                    // Mark connection in both directions FIRST
                    connectionMatrix[i][neighbor] = true;
                    connectionMatrix[neighbor][i] = true;
                    
                    // Add to network structure
                    network.nodes[i].connections.push(neighbor);
                    network.nodes[neighbor].connections.push(i);
                    network.edges.push([i, neighbor]);
                    
                    // Debug: Log connection creation
                }
            }
            
            // Debug: Log final connection count for this node
            const finalConnections = network.nodes[i].connections.length;
            if (finalConnections > connectionsPerNode) {
                console.error(`ERROR: Node ${i} has ${finalConnections} connections, exceeding limit of ${connectionsPerNode}!`);
            }
        }
    }

    createGeographicalConnectionsSimple(network, positions, totalNodes, connectionsPerNode, rng, maxConnectionDistance, distanceWeight, longDistancePercentage, connectionMatrix, enableBridging) {
        // Simplified algorithm for larger networks (>100 nodes)
        const maxCandidates = 50; // Limit candidates to prevent freezing
        
        for (let i = 0; i < totalNodes; i++) {
            // Update progress for large networks
            if (totalNodes > 100) {
                const updateInterval = totalNodes > 500 ? 50 : 25; // More frequent updates for very large networks
                if (i % updateInterval === 0) {
                    this.showStatusMessage(`Generating network... ${Math.round((i / totalNodes) * 100)}% complete`);
                }
            }
            
            const pos1 = positions[i];
            const connections = [];
            
            // Calculate distances to all nodes (simplified approach for large networks)
            const candidates = [];
            const longDistanceThreshold = maxConnectionDistance * 20; // Much larger range
            
            // Sample nodes to avoid performance issues
            const sampleSize = Math.min(totalNodes - 1, maxCandidates * 2);
            const step = Math.max(1, Math.floor((totalNodes - 1) / sampleSize));
            
            for (let j = 0; j < totalNodes; j += step) {
                if (i !== j && !connectionMatrix[i][j]) { // Don't include already connected nodes
                    const pos2 = positions[j];
                    const dx = pos1.x - pos2.x;
                    const dy = pos1.y - pos2.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    // Include nodes based on bridging setting
                    if (enableBridging) {
                        // Include all sampled nodes for bridging (no distance limit)
                        candidates.push({node: j, distance: distance});
                    } else {
                        // Include only nodes within long distance threshold
                        if (distance <= longDistanceThreshold) {
                            candidates.push({node: j, distance: distance});
                        }
                    }
                }
            }
            
            // Sort by distance
            candidates.sort((a, b) => a.distance - b.distance);
            
            // Separate short and long distance candidates
            const shortDistanceCandidates = candidates.filter(c => c.distance <= maxConnectionDistance);
            const longDistanceCandidates = candidates.filter(c => c.distance > maxConnectionDistance && c.distance <= longDistanceThreshold);
            
            // Calculate target connections (ensure we don't exceed the limit)
            const currentConnections = network.nodes[i].connections.length;
            const remainingConnections = Math.max(0, connectionsPerNode - currentConnections);
            const targetConnections = Math.min(remainingConnections, candidates.length);
            
            // Calculate how many long vs short distance connections to make
            const longDistanceConnections = Math.floor(targetConnections * longDistancePercentage / 100);
            const shortDistanceConnections = targetConnections - longDistanceConnections;
            
            let connectionsAdded = 0;
            
            // PRIORITIZE LONG DISTANCE CONNECTIONS when percentage is high
            if (longDistancePercentage >= 50) {
                // Add long distance connections first when percentage is high
                if (longDistanceConnections > 0 && longDistanceCandidates.length > 0) {
                    // Sort long distance candidates by distance (furthest first for true long distance)
                    const sortedLongDistance = [...longDistanceCandidates].sort((a, b) => b.distance - a.distance);
                    
                    for (const candidate of sortedLongDistance) {
                        if (connectionsAdded >= longDistanceConnections) break;
                        
                        // High probability for long distance when percentage is high
                        const longDistanceProbability = longDistancePercentage >= 80 ? 1.0 : (longDistancePercentage / 100);
                        
                        if (rng() < longDistanceProbability && !connections.includes(candidate.node)) {
                            connections.push(candidate.node);
                            connectionsAdded++;
                        }
                    }
                }
                
                // Then add short distance connections
                if (shortDistanceConnections > 0 && shortDistanceCandidates.length > 0) {
                    for (const candidate of shortDistanceCandidates) {
                        if (connectionsAdded >= targetConnections) break;
                        
                        // Simplified probability (less computation)
                        const distanceFactor = candidate.distance / maxConnectionDistance;
                        const probability = 1 - distanceFactor * distanceWeight;
                        
                        // Ensure minimum probability to prevent complete isolation
                        const minProbability = Math.max(0.05, Math.min(0.3, maxConnectionDistance / 1000));
                        const finalProbability = Math.max(probability, minProbability);
                        
                        if (rng() < finalProbability && !connections.includes(candidate.node)) {
                            connections.push(candidate.node);
                            connectionsAdded++;
                        }
                    }
                }
            } else {
                // Original logic for low long distance percentages
                // First, add short distance connections
                for (const candidate of shortDistanceCandidates) {
                    if (connectionsAdded >= shortDistanceConnections) break;
                    
                    // Simplified probability (less computation)
                    const distanceFactor = candidate.distance / maxConnectionDistance;
                    const probability = 1 - distanceFactor * distanceWeight;
                    
                    // Ensure minimum probability to prevent complete isolation
                    const minProbability = Math.max(0.05, Math.min(0.3, maxConnectionDistance / 1000));
                    const finalProbability = Math.max(probability, minProbability);
                    
                    if (rng() < finalProbability && !connections.includes(candidate.node)) {
                        connections.push(candidate.node);
                        connectionsAdded++;
                    }
                }
                
                // Then, add long distance connections if available and needed
                if (longDistanceConnections > 0 && longDistanceCandidates.length > 0) {
                    const shuffledLongDistance = [...longDistanceCandidates].sort(() => rng() - 0.5);
                    
                    for (const candidate of shuffledLongDistance) {
                        if (connectionsAdded >= targetConnections) break;
                        
                        // Long distance connections probability scales with percentage
                        const longDistanceProbability = Math.min(0.8, longDistancePercentage / 100);
                        
                        if (rng() < longDistanceProbability && !connections.includes(candidate.node)) {
                            connections.push(candidate.node);
                            connectionsAdded++;
                        }
                    }
                }
            }
            
            // Fill remaining connections if we haven't reached target (deterministic fallback)
            if (connectionsAdded < targetConnections) {
                const remainingCandidates = candidates.filter(c => !connections.includes(c.node));
                for (const candidate of remainingCandidates) {
                    if (connectionsAdded >= targetConnections) break;
                    connections.push(candidate.node);
                    connectionsAdded++;
                }
            }
            
            // Add bidirectional connections with strict connection limit enforcement
            for (const neighbor of connections) {
                if (!connectionMatrix[i][neighbor]) {
                    // STRICT ENFORCEMENT: Check both nodes' current connection counts
                    const currentConnectionsI = network.nodes[i].connections.length;
                    const currentConnectionsNeighbor = network.nodes[neighbor].connections.length;
                    
                    // Skip if either node would exceed the limit
                    if (currentConnectionsI >= connectionsPerNode) {
                        continue;
                    }
                    
                    if (currentConnectionsNeighbor >= connectionsPerNode) {
                        continue;
                    }
                    
                    // Mark connection in both directions FIRST
                    connectionMatrix[i][neighbor] = true;
                    connectionMatrix[neighbor][i] = true;
                    
                    // Add to network structure
                    network.nodes[i].connections.push(neighbor);
                    network.nodes[neighbor].connections.push(i);
                    network.edges.push([i, neighbor]);
                    
                    // Debug: Log connection creation
                }
            }
            
            // Debug: Log final connection count for this node
            const finalConnections = network.nodes[i].connections.length;
            if (finalConnections > connectionsPerNode) {
                console.error(`ERROR: Node ${i} has ${finalConnections} connections, exceeding limit of ${connectionsPerNode}!`);
            }
        }
    }

    seededRandom(seed) {
        let x = Math.sin(seed) * 10000;
        return function() {
            x = Math.sin(x) * 10000;
            return x - Math.floor(x);
        };
    }

    calculateNodePositions() {
        // If we have geographical positions, use them
        if (this.geographicalPositions) {
            return this.geographicalPositions;
        }
        
        const layoutType = document.getElementById('layoutType').value;
        
        if (layoutType === 'circular') {
            return this.calculateCircularLayout();
        } else {
            // Default to random layout
            return this.calculateRandomLayout();
        }
    }

    calculateCircularLayout() {
        const positions = [];
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.min(centerX, centerY) * 0.8;
        
        for (let i = 0; i < this.network.nodes.length; i++) {
            const angle = (2 * Math.PI * i) / this.network.nodes.length;
            positions.push({
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle)
            });
        }
        
        return positions;
    }

    calculateRandomLayout() {
        // Force DOM reflow before calling generateNonOverlappingPositions
        this.canvas.offsetWidth;
        this.canvas.offsetHeight;
        
        // Use the same collision-aware positioning for random layout
        return this.generateNonOverlappingPositions(this.network.nodes.length);
    }


    initializeDiagnosticChart() {
        const chartCanvas = document.getElementById('diagnosticChart');
        if (chartCanvas) {
            this.diagnosticChart = chartCanvas;
            this.diagnosticChartCtx = chartCanvas.getContext('2d');
        }
    }

    simulatePropagation() {
        if (!this.network) return;

        // Show status message
        this.showStatusMessage('Running propagation simulation...');

        const originNode = parseInt(document.getElementById('originNode').value);
        const processingTime = parseFloat(document.getElementById('processingTime').value);
        const networkLatency = parseFloat(document.getElementById('networkLatency').value);
        const enableDiagnostics = document.getElementById('enableDiagnostics').checked;
        const diagnosticDelay = parseFloat(document.getElementById('diagnosticDelay').value);

        // Display simulation settings
        console.log('=== SIMULATION SETTINGS ===');
        console.log(`Origin Node: ${originNode}`);
        console.log(`Processing Time: ${processingTime} ms (parallel processing)`);
        console.log(`Network Latency: ${networkLatency} ms (parallel transmission)`);
        console.log(`Step Time Formula: ${processingTime}ms + ${networkLatency}ms = ${processingTime + networkLatency}ms per step`);
        console.log(`Diagnostics: ${enableDiagnostics ? 'Enabled' : 'Disabled'}`);
        if (enableDiagnostics) {
            console.log(`Diagnostic Delay: ${diagnosticDelay} ms`);
        }
        console.log('============================');

        if (originNode >= this.network.nodes.length) {
            this.showError('Origin node must be less than total nodes');
            return;
        }

        // Initialize diagnostic data
        if (enableDiagnostics) {
            this.stoppedNodes = [];
            this.diagnosticConfirmations = [];
            this.confirmationPaths.clear();
        }

        // Run simulation asynchronously to prevent UI freezing
        setTimeout(() => {
            // Initialize propagation with diagnostic logic
            const totalNodes = this.network.nodes.length;
            const nodeStates = new Array(totalNodes).fill(0); // 0: pending, 1: received, 3: stopped
            const nodePaths = new Array(totalNodes).fill(null); // Track path from origin to each node
            const messageCount = new Array(totalNodes).fill(0); // Track how many times each node received message
            const stepMessageArrivals = new Array(totalNodes).fill(null); // Track message arrivals to each node in current step: [{sender, pathLength}, ...]
            const stoppingConfirmations = []; // Track confirmations from stopping nodes
            const confirmedNodes = new Set(); // Track nodes that have already sent confirmations
            const messageSent = new Array(totalNodes).fill(false); // Track if node sent forward message
            const confirmationSent = new Array(totalNodes).fill(false); // Track if node sent confirmation
            
            nodeStates[originNode] = 1;
            nodePaths[originNode] = [originNode]; // Path to origin is just itself
            messageCount[originNode] = 1; // Origin starts with message
            
            const propagationQueue = [originNode];
            const steps = [];
            let totalTime = 0;
            let step = 0;

            while (propagationQueue.length > 0) {
                step++;
                const currentPropagators = [...propagationQueue];
                propagationQueue.length = 0;

                // Note: Propagators are already state 1 (received) from previous step
                // No need to mark them as state 2 since we're removing persistent state 2

                // Calculate step timing - PARALLEL PROCESSING
                // All propagators work simultaneously, so processing time is constant regardless of count
                // All network transmissions happen simultaneously, so latency is constant
                const stepTime = processingTime + networkLatency;
                totalTime += stepTime;

                // Record step DURING propagation (showing propagating state)
                const stepData = {
                    step: step,
                    propagators: currentPropagators,
                    nodeStates: [...nodeStates], // Current state with propagators marked as 2
                    stepTime: stepTime,
                    totalTime: totalTime,
                    totalReceived: nodeStates.filter(s => s === 1).length, // Only count received (state 1)
                    totalPending: nodeStates.filter(s => s === 0).length
                };
                steps.push(stepData);

                // Propagate to neighbors with ALL NODES diagnostic logic
                const newPropagators = new Set();
                const newStoppingNodes = new Set(); // Track nodes that will stop in this step
                
                // Reset step message arrivals tracking
                stepMessageArrivals.fill(null);
                
                // Colony propagation removed - colonies should form naturally through network topology

                // Collect all message arrivals from current propagators with distance-based prioritization
                for (const propagator of currentPropagators) {
                    // Mark that this node has sent a message
                    messageSent[propagator] = true;
                    
                    // Get all neighbors and sort them by distance (long-distance first)
                    const neighbors = this.network.nodes[propagator].connections;
                    const neighborsWithDistance = [];
                    
                    for (const neighbor of neighbors) {
                        if (nodeStates[neighbor] !== 3) { // Don't process already stopped nodes
                            let connectionDistance = 0;
                            if (this.geographicalPositions && this.geographicalPositions[propagator] && this.geographicalPositions[neighbor]) {
                                const dx = this.geographicalPositions[propagator].x - this.geographicalPositions[neighbor].x;
                                const dy = this.geographicalPositions[propagator].y - this.geographicalPositions[neighbor].y;
                                connectionDistance = Math.sqrt(dx * dx + dy * dy);
                            }
                            neighborsWithDistance.push({neighbor, connectionDistance});
                        }
                    }
                    
                    // Sort neighbors by connection distance (longest first for early propagation)
                    neighborsWithDistance.sort((a, b) => b.connectionDistance - a.connectionDistance);
                    
                    
                    // Send messages to neighbors in order of distance (long-distance first)
                    for (const {neighbor, connectionDistance} of neighborsWithDistance) {
                        const pathLength = nodePaths[propagator].length + 1; // Path length from origin
                        
                        if (stepMessageArrivals[neighbor] === null) {
                            stepMessageArrivals[neighbor] = [];
                        }
                        
                        stepMessageArrivals[neighbor].push({
                            sender: propagator,
                            pathLength: pathLength,
                            path: [...nodePaths[propagator], neighbor],
                            connectionDistance: connectionDistance
                        });
                    }
                }
                
                // Process arrivals by path length (shortest first)
                let hasNewPropagators = true;
                while (hasNewPropagators) {
                    hasNewPropagators = false;
                    
                    for (let node = 0; node < totalNodes; node++) {
                        const arrivals = stepMessageArrivals[node];
                        if (arrivals && arrivals.length > 0) {
                            // Sort by connection distance (longest first for early propagation) then by path length
                            arrivals.sort((a, b) => {
                                // First priority: long-distance connections (higher connectionDistance)
                                if (Math.abs(a.connectionDistance - b.connectionDistance) > 5) {
                                    return b.connectionDistance - a.connectionDistance;
                                }
                                // Second priority: shorter path length
                                return a.pathLength - b.pathLength;
                            });
                            
                            
                            if (nodeStates[node] === 0) {
                                // First time receiving message - use longest distance connection first
                                const firstArrival = arrivals[0];
                                nodeStates[node] = 1;
                                messageCount[node] = 1;
                                nodePaths[node] = firstArrival.path;
                                newPropagators.add(node);
                                hasNewPropagators = true;
                                
                                // Immediate colony propagation removed - colonies form naturally through network topology
                                
                                // Check for second arrival (confirmation trigger)
                                if (arrivals.length >= 2 && arrivals[1].pathLength > firstArrival.pathLength) {
                                    messageCount[node] = 2;
                                    nodeStates[node] = 3; // Mark as stopped (state 3)
                                    newStoppingNodes.add(node); // Track for confirmation creation
                                }
                            } else if (nodeStates[node] === 1) {
                                // Already received once - check for second arrival
                                const firstArrival = arrivals[0];
                                if (firstArrival.pathLength > nodePaths[node].length) {
                                    // This is a longer path - treat as second arrival
                                    messageCount[node] = 2;
                                    nodeStates[node] = 3; // Mark as stopped (state 3)
                                    newStoppingNodes.add(node); // Track for confirmation creation
                                }
                                // If pathLength <= current path length, ignore (redundant)
                            }
                        }
                    }
                }
                
                // Create confirmations for stopping nodes (once per node, not per neighbor encounter)
                for (const stoppingNode of newStoppingNodes) {
                    if (!confirmedNodes.has(stoppingNode)) {
                        confirmedNodes.add(stoppingNode);
                        this.stoppedNodes.push(stoppingNode);
                        
                        // Send confirmation back to origin through the path
                        const confirmation = {
                            id: stoppingConfirmations.length + 1,
                            stoppingNode: stoppingNode,
                            path: [...nodePaths[stoppingNode]], // Path back to origin
                            step: step,
                            time: totalTime,
                            pathLength: nodePaths[stoppingNode].length - 1
                        };
                        stoppingConfirmations.push(confirmation);
                        
                        // Mark that this node has sent a confirmation
                        confirmationSent[stoppingNode] = true;
                        
                    }
                }

                // Add new propagators to queue
                propagationQueue.push(...newPropagators);

                // Mark current propagators as received (but don't overwrite stopped or confirmed nodes)
                for (const node of currentPropagators) {
                    if (nodeStates[node] !== 3 && !confirmedNodes.has(node)) { // Don't overwrite stopped nodes or confirmed nodes
                        nodeStates[node] = 1; // Mark as received for next step
                    }
                }
            }

            // Add final step showing completed state
            const finalStepData = {
                step: step + 1,
                propagators: [],
                nodeStates: [...nodeStates], // All nodes are now received (state 1)
                stepTime: 0,
                totalTime: totalTime,
                totalReceived: nodeStates.filter(s => s > 0).length,
                totalPending: 0
            };
            steps.push(finalStepData);
            

            this.propagationSteps = steps;
            this.currentStep = 0;
            
            // Process diagnostic confirmations if enabled
            if (enableDiagnostics) {
                this.processDiagnosticConfirmations(stoppingConfirmations, diagnosticDelay);
            }
            
            // Display simulation results
            console.log('%c=== SIMULATION RESULTS ===', 'color: #32CD32; font-weight: bold; font-size: 14px; background: #1B2D1B; padding: 4px 8px; border-radius: 5px;');
            console.log(`%cTotal Steps: ${steps.length}`, 'color: #87CEEB; font-weight: bold;');
            console.log(`%cTotal Time: ${totalTime.toFixed(2)} ms`, 'color: #FFD700; font-weight: bold; background: #333; padding: 2px 4px; border-radius: 3px;');
            console.log(`Network Size: ${totalNodes} nodes`);
            console.log(`Final Coverage: ${nodeStates.filter(s => s > 0).length}/${totalNodes} nodes (${((nodeStates.filter(s => s > 0).length / totalNodes) * 100).toFixed(1)}%)`);
            
            // Calculate propagation statistics
            const maxPropagators = Math.max(...steps.map(s => s.propagators.length));
            const avgStepTime = steps.length > 0 ? totalTime / steps.length : 0;
            const stoppedNodes = nodeStates.filter(s => s === 3).length;
            
            console.log(`Max Propagators: ${maxPropagators}`);
            console.log(`Average Step Time: ${avgStepTime.toFixed(2)} ms`);
            console.log(`Stopped Nodes (received twice): ${stoppedNodes}`);
            console.log(`Propagation Efficiency: ${(totalNodes / totalTime * 1000).toFixed(0)} nodes/second`);
            
            // Diagnostic results
            if (enableDiagnostics) {
                console.log('--- DIAGNOSTIC FEEDBACK ---');
                console.log(`Confirmations Generated: ${stoppingConfirmations.length}`);
                console.log(`Stopped Nodes: ${this.stoppedNodes.length}`);
                if (this.stoppedNodes.length > 0) {
                    console.log(`Stopped Node IDs: [${this.stoppedNodes.slice(0, 20).join(', ')}${this.stoppedNodes.length > 20 ? '...' : ''}]`);
                }
                
                if (this.diagnosticConfirmations.length > 0) {
                    const firstConfirmationTime = this.diagnosticConfirmations[0]?.arrivalTime || 0;
                    const lastConfirmationTime = this.diagnosticConfirmations[this.diagnosticConfirmations.length - 1]?.arrivalTime || 0;
                    const totalFeedbackTime = lastConfirmationTime - firstConfirmationTime;
                    
                    console.log(`First Confirmation: ${firstConfirmationTime.toFixed(1)} ms`);
                    console.log(`Last Confirmation: ${lastConfirmationTime.toFixed(1)} ms`);
                    console.log(`Total Feedback Time: ${totalFeedbackTime.toFixed(1)} ms`);
                    console.log(`Average Confirmation Time: ${(lastConfirmationTime / this.diagnosticConfirmations.length).toFixed(1)} ms`);
                }
            }
            
            // Step-by-step breakdown
            console.log('--- STEP BREAKDOWN ---');
            steps.forEach((step, index) => {
                console.log(`Step ${index}: ${step.propagators.length} propagators, ${step.totalReceived} received, ${step.totalPending} pending, ${step.totalTime.toFixed(1)}ms total`);
            });
            
            console.log('========================');
            
            // Hide status message
            this.hideStatusMessage();
            
            this.updateControls();
            this.updateStats();
            this.updateDiagnosticStats();
            this.drawNetwork();
        }, 100); // Small delay to allow UI to update
    }


    processDiagnosticConfirmations(stoppingConfirmations, diagnosticDelay) {
        
        console.log('Processing diagnostic confirmations...');
        console.log(`Input confirmations: ${stoppingConfirmations.length}`);
        console.log(`Diagnostic delay: ${diagnosticDelay} ms (parallel processing)`);
        
        // Calculate arrival times for confirmations - PARALLEL PROCESSING
        // Diagnostic confirmations travel back in parallel, so only add diagnosticDelay once
        for (let i = 0; i < stoppingConfirmations.length; i++) {
            const confirmation = stoppingConfirmations[i];
            const pathLength = confirmation.pathLength;
            const confirmationArrivalTime = confirmation.time + diagnosticDelay; // Parallel travel, not sequential
            
            // Update confirmation with arrival time
            confirmation.arrivalTime = confirmationArrivalTime;
            confirmation.delay = diagnosticDelay;
            
            this.diagnosticConfirmations.push(confirmation);
            this.confirmationPaths.set(confirmation.id, confirmation.path);
        }
        
        // Sort confirmations by arrival time
        this.diagnosticConfirmations.sort((a, b) => a.arrivalTime - b.arrivalTime);
        
        console.log(`Processed ${this.diagnosticConfirmations.length} diagnostic confirmations`);
        if (this.diagnosticConfirmations.length > 0) {
            const firstArrival = this.diagnosticConfirmations[0].arrivalTime;
            const lastArrival = this.diagnosticConfirmations[this.diagnosticConfirmations.length - 1].arrivalTime;
            console.log(`Confirmation time range: ${firstArrival.toFixed(1)}ms - ${lastArrival.toFixed(1)}ms`);
        }
        
        
        
        this.drawDiagnosticChart();
    }

    drawDiagnosticChart() {
        if (!this.diagnosticChart || !this.diagnosticChartCtx || this.diagnosticConfirmations.length === 0) {
            return;
        }
        
        const ctx = this.diagnosticChartCtx;
        const width = this.diagnosticChart.width;
        const height = this.diagnosticChart.height;
        
        // Clear chart
        ctx.clearRect(0, 0, width, height);
        
        // Set up chart dimensions
        const margin = { top: 20, right: 20, bottom: 40, left: 60 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;
        
        // Find data bounds
        const maxTime = Math.max(...this.diagnosticConfirmations.map(c => c.arrivalTime));
        const maxConfirmations = this.diagnosticConfirmations.length;
        
        // Draw axes
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        
        // Y-axis (confirmations count)
        ctx.beginPath();
        ctx.moveTo(margin.left, margin.top);
        ctx.lineTo(margin.left, margin.top + chartHeight);
        ctx.stroke();
        
        // X-axis (time)
        ctx.beginPath();
        ctx.moveTo(margin.left, margin.top + chartHeight);
        ctx.lineTo(margin.left + chartWidth, margin.top + chartHeight);
        ctx.stroke();
        
        // Draw data points and line
        ctx.strokeStyle = '#2E8B57';
        ctx.lineWidth = 2;
        ctx.fillStyle = '#2E8B57';
        
        let path = new Path2D();
        let firstPoint = true;
        
        for (let i = 0; i < this.diagnosticConfirmations.length; i++) {
            const confirmation = this.diagnosticConfirmations[i];
            const x = margin.left + (confirmation.arrivalTime / maxTime) * chartWidth;
            const y = margin.top + chartHeight - ((i + 1) / maxConfirmations) * chartHeight;
            
            // Draw point (larger radius to make overlapping points more visible)
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, 2 * Math.PI);
            ctx.fill();
            
            // Draw line to next point
            if (firstPoint) {
                path.moveTo(x, y);
                firstPoint = false;
            } else {
                path.lineTo(x, y);
            }
        }
        
        ctx.stroke(path);
        
        // Draw labels
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        
        // X-axis label
        ctx.fillText('Time (ms)', margin.left + chartWidth / 2, height - 10);
        
        // Y-axis label
        ctx.save();
        ctx.translate(15, margin.top + chartHeight / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Confirmations Received', 0, 0);
        ctx.restore();
        
        // Draw tick marks and labels
        ctx.textAlign = 'center';
        ctx.font = '10px Arial';
        
        // Y-axis ticks
        for (let i = 0; i <= 5; i++) {
            const y = margin.top + chartHeight - (i / 5) * chartHeight;
            const value = Math.round((i / 5) * maxConfirmations);
            
            ctx.beginPath();
            ctx.moveTo(margin.left - 5, y);
            ctx.lineTo(margin.left, y);
            ctx.stroke();
            
            ctx.fillText(value.toString(), margin.left - 10, y + 3);
        }
        
        // X-axis ticks
        for (let i = 0; i <= 5; i++) {
            const x = margin.left + (i / 5) * chartWidth;
            const value = Math.round((i / 5) * maxTime);
            
            ctx.beginPath();
            ctx.moveTo(x, margin.top + chartHeight);
            ctx.lineTo(x, margin.top + chartHeight + 5);
            ctx.stroke();
            
            ctx.fillText(value.toString(), x, margin.top + chartHeight + 18);
        }
    }

    updateDiagnosticStats() {
        const enableDiagnostics = document.getElementById('enableDiagnostics').checked;
        
        if (enableDiagnostics) {
            document.getElementById('diagnosticContainer').style.display = 'block';
            
            const confirmationsReceived = this.diagnosticConfirmations.length;
            const confirmationsExpected = this.stoppedNodes.length;
            const totalFeedbackTime = this.diagnosticConfirmations.length > 0 ? 
                Math.max(...this.diagnosticConfirmations.map(c => c.arrivalTime)) : 0;
            
            document.getElementById('confirmationsReceivedStat').textContent = confirmationsReceived;
            document.getElementById('confirmationsExpectedStat').textContent = confirmationsExpected;
            document.getElementById('feedbackTimeStat').textContent = totalFeedbackTime.toFixed(1) + ' ms';
        } else {
            document.getElementById('diagnosticContainer').style.display = 'none';
        }
    }

    drawNetwork() {
        if (!this.network || !this.nodePositions.length) return;

        const ctx = this.ctx;
        const nodeSize = parseInt(document.getElementById('nodeSize').value);
        
        // Clear canvas
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw edges
        ctx.strokeStyle = this.colors.edge;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3;
        
        for (const edge of this.network.edges) {
            const [node1, node2] = edge;
            const pos1 = this.nodePositions[node1];
            const pos2 = this.nodePositions[node2];
            
            ctx.beginPath();
            ctx.moveTo(pos1.x, pos1.y);
            ctx.lineTo(pos2.x, pos2.y);
            ctx.stroke();
        }
        
        // Draw nodes
        ctx.globalAlpha = 1;
        const originNode = parseInt(document.getElementById('originNode').value);
        let orangeNodeCount = 0;
        
        for (let i = 0; i < this.network.nodes.length; i++) {
            const pos = this.nodePositions[i];
            let color = this.colors.pending;
            
            if (this.propagationSteps.length > 0 && this.currentStep < this.propagationSteps.length) {
                const currentStepData = this.propagationSteps[this.currentStep];
                
                if (i === originNode) {
                    color = this.colors.origin;
                } else if (currentStepData.nodeStates[i] === 3) {
                    // Node has stopped (state 3) - received message twice
                    color = this.colors.diagnostic;
                    orangeNodeCount++;
                } else if (currentStepData.nodeStates[i] === 1) {
                    // Node has received the message (state 1)
                    color = this.colors.received;
                } else {
                    // Node hasn't received the message yet (state 0)
                    color = this.colors.pending;
                }
            } else if (i === originNode) {
                color = this.colors.origin;
            }
            
            // Draw node
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, nodeSize, 0, 2 * Math.PI);
            ctx.fill();
            
            // Draw regular node border (white)
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw node number
            ctx.fillStyle = 'white';
            ctx.font = `${Math.max(8, nodeSize - 2)}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(i.toString(), pos.x, pos.y);
        }
        
        // Draw distance reference/legend
        this.drawDistanceReference();
    }

    drawDistanceReference() {
        const ctx = this.ctx;
        
        // Only draw reference if geographical constraints are enabled
        const enableGeographical = document.getElementById('enableGeographical').checked;
        if (!enableGeographical) return;
        
        // Position the reference in the top-left corner
        const referenceX = 20;
        const referenceY = 30;
        const referenceLength = 50; // 50px reference line
        
        // Draw reference line
        ctx.strokeStyle = '#FF6B6B'; // Red color for visibility
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(referenceX, referenceY);
        ctx.lineTo(referenceX + referenceLength, referenceY);
        ctx.stroke();
        
        // Draw reference markers (small vertical lines at ends)
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(referenceX, referenceY - 5);
        ctx.lineTo(referenceX, referenceY + 5);
        ctx.moveTo(referenceX + referenceLength, referenceY - 5);
        ctx.lineTo(referenceX + referenceLength, referenceY + 5);
        ctx.stroke();
        
        // Draw reference text
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('50px', referenceX + referenceLength/2, referenceY - 10);
    }

    updateControls() {
        const playBtn = document.getElementById('playBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const stepForwardBtn = document.getElementById('stepForwardBtn');
        const stepBackwardBtn = document.getElementById('stepBackwardBtn');
        const startBtn = document.getElementById('startBtn');
        const endBtn = document.getElementById('endBtn');
        
        const hasSteps = this.propagationSteps.length > 0;
        const isAtStart = this.currentStep === 0;
        const isAtEnd = this.currentStep >= this.propagationSteps.length - 1;
        
        // Enable/disable buttons based on state
        if (hasSteps) {
            playBtn.disabled = this.isPlaying || isAtEnd;
            pauseBtn.disabled = !this.isPlaying;
            stepForwardBtn.disabled = isAtEnd;
            stepBackwardBtn.disabled = isAtStart;
            startBtn.disabled = isAtStart;
            endBtn.disabled = isAtEnd;
        } else {
            // If no steps, disable all controls except play (which will run simulation)
            playBtn.disabled = false;
            pauseBtn.disabled = true;
            stepForwardBtn.disabled = true;
            stepBackwardBtn.disabled = true;
            startBtn.disabled = true;
            endBtn.disabled = true;
        }
    }

    updateTimeDisplay() {
        const timeDisplay = document.getElementById('timeDisplay');
        const progressFill = document.getElementById('progressFill');
        
        if (this.propagationSteps.length === 0) {
            timeDisplay.innerHTML = 'Step 0 / 0<br>0.0 ms';
            progressFill.style.width = '0%';
            return;
        }
        
        const currentStepNum = this.currentStep + 1;
        const totalSteps = this.propagationSteps.length;
        const currentTime = this.currentStep < this.propagationSteps.length ? 
            this.propagationSteps[this.currentStep].totalTime : 
            this.propagationSteps[this.propagationSteps.length - 1].totalTime;
        
        timeDisplay.innerHTML = `Step ${currentStepNum} / ${totalSteps}<br>${currentTime.toFixed(1)} ms`;
        
        const progress = this.propagationSteps.length > 1 ? 
            (this.currentStep / (this.propagationSteps.length - 1)) * 100 : 0;
        progressFill.style.width = progress + '%';
    }

    updateStats() {
        const statsContainer = document.getElementById('statsContainer');
        
        if (!this.network) {
            statsContainer.style.display = 'none';
            return;
        }
        
        statsContainer.style.display = 'grid';
        
        document.getElementById('totalNodesStat').textContent = this.network.nodes.length;
        
        if (this.propagationSteps.length > 0) {
            const totalSteps = this.propagationSteps.length;
            const totalTime = this.propagationSteps[this.propagationSteps.length - 1].totalTime;
            const maxPropagators = Math.max(...this.propagationSteps.map(s => s.propagators.length));
            
            document.getElementById('totalStepsStat').textContent = totalSteps;
            document.getElementById('totalTimeStat').textContent = totalTime.toFixed(1) + ' ms';
            document.getElementById('maxPropagatorsStat').textContent = maxPropagators;
        } else {
            document.getElementById('totalStepsStat').textContent = '0';
            document.getElementById('totalTimeStat').textContent = '0 ms';
            document.getElementById('maxPropagatorsStat').textContent = '0';
        }
    }

    startAnimation() {
        if (this.propagationSteps.length === 0) {
            if (this.network) {
                this.simulatePropagation();
                this.drawNetwork();
                this.updateControls();
                this.updateTimeDisplay();
            } else {
                this.showError('Please generate a network first');
                return;
            }
        }
        
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        this.updateControls();
        
        const animationSpeed = parseInt(document.getElementById('animationSpeed').value);
        
        const animate = () => {
            if (!this.isPlaying) return;
            
            if (this.currentStep < this.propagationSteps.length - 1) {
                this.currentStep++;
                this.drawNetwork();
                this.updateControls();
                this.updateTimeDisplay();
                
                setTimeout(() => {
                    this.animationId = requestAnimationFrame(animate);
                }, animationSpeed);
            } else {
                this.isPlaying = false;
                this.updateControls();
            }
        };
        
        this.animationId = requestAnimationFrame(animate);
    }

    pauseAnimation() {
        this.isPlaying = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.updateControls();
    }

    stepForward() {
        if (this.propagationSteps.length === 0) {
            if (this.network) {
                this.simulatePropagation();
                this.drawNetwork();
                this.updateControls();
                this.updateTimeDisplay();
            } else {
                this.showError('Please generate a network first');
                return;
            }
        }
        
        if (this.currentStep < this.propagationSteps.length - 1) {
            this.currentStep++;
            this.drawNetwork();
            this.updateControls();
            this.updateTimeDisplay();
        }
    }

    stepBackward() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.drawNetwork();
            this.updateControls();
            this.updateTimeDisplay();
        }
    }

    goToStart() {
        this.currentStep = 0;
        this.drawNetwork();
        this.updateControls();
        this.updateTimeDisplay();
    }

    goToEnd() {
        this.currentStep = Math.max(0, this.propagationSteps.length - 1);
        this.drawNetwork();
        this.updateControls();
        this.updateTimeDisplay();
    }

    resetVisualization() {
        this.pauseAnimation();
        this.propagationSteps = [];
        this.currentStep = 0;
        this.drawNetwork();
        this.updateControls();
        this.updateTimeDisplay();
        this.updateStats();
    }

    clearCanvas() {
        this.pauseAnimation();
        this.network = null;
        this.propagationSteps = [];
        this.currentStep = 0;
        this.nodePositions = [];
        this.geographicalPositions = null; // Clear geographical positions
        
        // Clear diagnostic data
        this.stoppedNodes = [];
        this.diagnosticConfirmations = [];
        this.confirmationPaths.clear();
        
        const container = document.getElementById('canvasContainer');
        container.innerHTML = '<div class="loading" id="loadingMessage">Click "Generate Network" to start visualization</div>';
        
        this.updateControls();
        this.updateTimeDisplay();
        this.updateStats();
        this.updateDiagnosticStats();
        this.hideError();
        this.hideStatusMessage();
        
        // Clear diagnostic chart
        if (this.diagnosticChart && this.diagnosticChartCtx) {
            this.diagnosticChartCtx.clearRect(0, 0, this.diagnosticChart.width, this.diagnosticChart.height);
        }
        
        // Reinitialize canvas for next network
        this.initializeCanvas();
    }

    hideLoading() {
        const loadingMessage = document.getElementById('loadingMessage');
        if (loadingMessage) {
            loadingMessage.style.display = 'none';
        }
    }

    showStatusMessage(message) {
        const statusMessage = document.getElementById('statusMessage');
        const loadingMessage = document.getElementById('loadingMessage');
        
        if (loadingMessage) {
            loadingMessage.style.display = 'none';
        }
        
        if (statusMessage) {
            statusMessage.querySelector('.loading').textContent = message;
            statusMessage.style.display = 'block';
        }
    }

    hideStatusMessage() {
        const statusMessage = document.getElementById('statusMessage');
        if (statusMessage) {
            statusMessage.style.display = 'none';
        }
    }

    showError(message) {
        const container = document.getElementById('canvasContainer');
        container.innerHTML = `<div class="error">${message}</div>`;
    }

    hideError() {
        // Error display is handled by clearing and reinitializing canvas
        // This method exists for compatibility with clearCanvas()
    }
}

// Global functions for HTML buttons
let visualization = null;

function initializeVisualization() {
    visualization = new NetworkVisualization();
}

function generateNetwork() {
    visualization.generateNetwork();
}

function resetVisualization() {
    visualization.resetVisualization();
}

function clearCanvas() {
    visualization.clearCanvas();
}

function startAnimation() {
    visualization.startAnimation();
}

function pauseAnimation() {
    visualization.pauseAnimation();
}

function stepForward() {
    visualization.stepForward();
}

function stepBackward() {
    visualization.stepBackward();
}

function goToStart() {
    visualization.goToStart();
}

function goToEnd() {
    visualization.goToEnd();
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initializeVisualization);
