#!/usr/bin/env python3
"""
Simplified Large Network Test (Standard Library Only)

This script demonstrates that large network analysis with geographical constraints
is possible, using only Python standard library modules.

It simulates the analysis process and shows expected performance metrics
for networks up to 1 million nodes.
"""

import random
import math
import time
import json
from collections import defaultdict, deque
from datetime import datetime

# ============================================================================
# CONFIGURATION
# ============================================================================

NETWORK_SIZES = [10000, 100000, 1000000]
CONNECTIONS_PER_NODE = 20
MAX_CONNECTION_DISTANCE = 0.3
DISTANCE_WEIGHT = 0.7
SEED = 42

# ============================================================================
# SIMPLIFIED NETWORK ANALYSIS
# ============================================================================

class SimpleNetworkAnalyzer:
    """Simplified network analyzer using only standard library."""
    
    def __init__(self, total_nodes, connections_per_node, seed=42):
        self.total_nodes = total_nodes
        self.connections_per_node = connections_per_node
        self.seed = seed
        random.seed(seed)
        
    def generate_positions(self):
        """Generate random positions for nodes."""
        print(f"Generating positions for {self.total_nodes:,} nodes...")
        positions = []
        for i in range(self.total_nodes):
            x = random.random()
            y = random.random()
            positions.append((x, y))
        return positions
    
    def calculate_distance(self, pos1, pos2):
        """Calculate Euclidean distance between two positions."""
        dx = pos1[0] - pos2[0]
        dy = pos1[1] - pos2[1]
        return math.sqrt(dx*dx + dy*dy)
    
    def find_geographical_neighbors(self, node_idx, positions):
        """Find neighbors within geographical constraints."""
        node_pos = positions[node_idx]
        candidates = []
        
        for j, other_pos in enumerate(positions):
            if j != node_idx:
                distance = self.calculate_distance(node_pos, other_pos)
                if distance <= MAX_CONNECTION_DISTANCE:
                    # Calculate connection probability based on distance
                    distance_factor = distance / MAX_CONNECTION_DISTANCE
                    probability = math.pow(1 - distance_factor, DISTANCE_WEIGHT)
                    
                    if random.random() < probability:
                        candidates.append(j)
        
        # Limit to desired number of connections
        if len(candidates) > self.connections_per_node:
            candidates = random.sample(candidates, self.connections_per_node)
        
        return candidates
    
    def create_network(self, positions):
        """Create network with geographical constraints."""
        print(f"Creating geographical network with {self.total_nodes:,} nodes...")
        
        network = defaultdict(list)
        total_connections = 0
        
        # Process nodes in batches for large networks
        batch_size = min(1000, self.total_nodes)
        
        for batch_start in range(0, self.total_nodes, batch_size):
            batch_end = min(batch_start + batch_size, self.total_nodes)
            print(f"Processing nodes {batch_start:,}-{batch_end-1:,}...")
            
            for i in range(batch_start, batch_end):
                neighbors = self.find_geographical_neighbors(i, positions)
                for neighbor in neighbors:
                    if neighbor not in network[i]:
                        network[i].append(neighbor)
                        network[neighbor].append(i)
                        total_connections += 1
        
        print(f"Total connections created: {total_connections:,}")
        return network
    
    def simulate_propagation(self, network, origin_node=0):
        """Simulate message propagation through the network."""
        print(f"Simulating message propagation from node {origin_node}...")
        
        received = set([origin_node])
        propagating = set([origin_node])
        steps = []
        
        step = 0
        start_time = time.time()
        
        while propagating and len(received) < self.total_nodes:
            step_start = time.time()
            new_propagating = set()
            
            # Each propagating node sends to its neighbors
            for node in propagating:
                for neighbor in network[node]:
                    if neighbor not in received:
                        received.add(neighbor)
                        new_propagating.add(neighbor)
            
            # Record step data
            step_data = {
                'step': step,
                'received_count': len(received),
                'propagating_count': len(propagating),
                'pending_count': self.total_nodes - len(received),
                'step_time': time.time() - step_start,
                'total_time': time.time() - start_time
            }
            steps.append(step_data)
            
            if step % 10 == 0 or len(propagating) == 0:
                print(f"Step {step}: {len(received):,}/{self.total_nodes:,} nodes received "
                      f"({len(propagating):,} propagating)")
            
            propagating = new_propagating
            step += 1
            
            # Safety check
            if step > self.total_nodes:
                print("Warning: Propagation exceeded node count, stopping...")
                break
        
        total_time = time.time() - start_time
        print(f"Propagation completed in {step} steps, {total_time:.2f} seconds")
        
        return steps
    
    def analyze_network_properties(self, network):
        """Analyze basic network properties."""
        print("Analyzing network properties...")
        
        total_edges = sum(len(neighbors) for neighbors in network.values()) // 2
        total_nodes = len(network)
        
        properties = {
            'total_nodes': total_nodes,
            'total_edges': total_edges,
            'average_degree': 2 * total_edges / total_nodes if total_nodes > 0 else 0,
            'density': 2 * total_edges / (total_nodes * (total_nodes - 1)) if total_nodes > 1 else 0,
            'is_connected': self.is_connected(network),
            'number_of_components': self.count_components(network)
        }
        
        return properties
    
    def is_connected(self, network):
        """Check if network is connected using BFS."""
        if not network:
            return False
        
        visited = set()
        queue = deque([0])  # Start from node 0
        
        while queue:
            node = queue.popleft()
            if node not in visited:
                visited.add(node)
                for neighbor in network[node]:
                    if neighbor not in visited:
                        queue.append(neighbor)
        
        return len(visited) == len(network)
    
    def count_components(self, network):
        """Count connected components using BFS."""
        if not network:
            return 0
        
        visited = set()
        components = 0
        
        for node in network:
            if node not in visited:
                components += 1
                queue = deque([node])
                
                while queue:
                    current = queue.popleft()
                    if current not in visited:
                        visited.add(current)
                        for neighbor in network[current]:
                            if neighbor not in visited:
                                queue.append(neighbor)
        
        return components

# ============================================================================
# MAIN ANALYSIS FUNCTION
# ============================================================================

def analyze_network_size(network_size):
    """Analyze a specific network size."""
    print(f"\n{'='*60}")
    print(f"ANALYZING NETWORK SIZE: {network_size:,} NODES")
    print(f"{'='*60}")
    
    start_time = time.time()
    
    # Create analyzer
    analyzer = SimpleNetworkAnalyzer(
        total_nodes=network_size,
        connections_per_node=CONNECTIONS_PER_NODE,
        seed=SEED
    )
    
    # Generate positions
    positions = analyzer.generate_positions()
    
    # Create network
    network = analyzer.create_network(positions)
    
    # Simulate propagation
    propagation_steps = analyzer.simulate_propagation(network, origin_node=0)
    
    # Analyze properties
    network_properties = analyzer.analyze_network_properties(network)
    
    # Calculate performance metrics
    if propagation_steps:
        final_step = propagation_steps[-1]
        propagation_performance = {
            'total_steps': len(propagation_steps),
            'total_time': final_step['total_time'],
            'coverage_percentage': (final_step['received_count'] / network_size) * 100,
            'average_step_time': sum(step['step_time'] for step in propagation_steps) / len(propagation_steps),
            'max_propagating_nodes': max(step['propagating_count'] for step in propagation_steps),
            'propagation_efficiency': final_step['received_count'] / len(propagation_steps) if len(propagation_steps) > 0 else 0
        }
    else:
        propagation_performance = {}
    
    # Save results
    results = {
        'network_size': network_size,
        'analysis_time': time.time() - start_time,
        'network_properties': network_properties,
        'propagation_performance': propagation_performance,
        'propagation_steps': propagation_steps,
        'timestamp': datetime.now().isoformat()
    }
    
    filename = f'simple_network_{network_size}_results.json'
    with open(filename, 'w') as f:
        json.dump(results, f, indent=2)
    
    # Print summary
    print(f"\nSUMMARY FOR {network_size:,} NODES:")
    print(f"- Analysis time: {results['analysis_time']:.2f} seconds")
    print(f"- Total edges: {network_properties['total_edges']:,}")
    print(f"- Average degree: {network_properties['average_degree']:.2f}")
    print(f"- Network density: {network_properties['density']:.6f}")
    print(f"- Is connected: {network_properties['is_connected']}")
    print(f"- Components: {network_properties['number_of_components']}")
    if propagation_performance:
        print(f"- Propagation steps: {propagation_performance['total_steps']}")
        print(f"- Coverage: {propagation_performance['coverage_percentage']:.1f}%")
        print(f"- Total time: {propagation_performance['total_time']:.2f} seconds")
    
    print(f"- Results saved to: {filename}")
    
    return results

def main():
    """Main analysis function."""
    print("Large Network Analysis - Simplified Version")
    print("=" * 60)
    print("This demonstrates that large networks with geographical constraints")
    print("are computationally feasible, even with basic algorithms.")
    print()
    
    all_results = []
    
    for network_size in NETWORK_SIZES:
        try:
            print(f"\nStarting analysis for {network_size:,} nodes...")
            print("This may take several minutes for large networks...")
            
            results = analyze_network_size(network_size)
            all_results.append(results)
            
        except Exception as e:
            print(f"Error analyzing {network_size:,} nodes: {e}")
            continue
    
    # Generate comparison report
    if len(all_results) > 1:
        print(f"\n{'='*60}")
        print("COMPARISON REPORT")
        print(f"{'='*60}")
        
        print(f"{'Network Size':<15} {'Analysis Time':<15} {'Total Steps':<12} {'Coverage %':<12} {'Total Time':<12}")
        print("-" * 70)
        
        for result in all_results:
            size = f"{result['network_size']:,}"
            analysis_time = f"{result['analysis_time']:.2f}s"
            
            perf = result['propagation_performance']
            if perf:
                steps = perf['total_steps']
                coverage = f"{perf['coverage_percentage']:.1f}%"
                total_time = f"{perf['total_time']:.2f}s"
            else:
                steps = "N/A"
                coverage = "N/A"
                total_time = "N/A"
            
            print(f"{size:<15} {analysis_time:<15} {steps:<12} {coverage:<12} {total_time:<12}")
        
        # Save comparison results
        with open('simple_large_network_comparison.json', 'w') as f:
            json.dump(all_results, f, indent=2)
        
        print(f"\nComparison results saved to 'simple_large_network_comparison.json'")

if __name__ == "__main__":
    main()
