#!/usr/bin/env python3
"""
GlucoXe Large Network Analysis with Geographical Constraints

This script analyzes message propagation in large networks (10K-1M nodes) 
with geographical constraints using optimized algorithms.

Features:
- Handles networks up to 1 million nodes
- Geographical constraints with distance-based connections
- Optimized algorithms for large-scale networks
- Statistical analysis and performance metrics
- Generates summary reports and visualizations
"""

import numpy as np
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
import matplotlib.pyplot as plt
import networkx as nx
import random
from collections import deque, defaultdict
import time
import math
from scipy.spatial.distance import pdist, squareform
import argparse
import json
from datetime import datetime

# ============================================================================
# CONFIGURATION VARIABLES
# ============================================================================

# Network Sizes to Test
NETWORK_SIZES = [10000, 100000, 1000000]
CONNECTIONS_PER_NODE = 20
SEED = 42

# Geographical Constraints
MAX_CONNECTION_DISTANCE = 0.3  # Fraction of canvas size
DISTANCE_WEIGHT = 0.7  # How strongly distance affects connection probability

# Performance Settings
BATCH_SIZE = 1000  # Process nodes in batches for memory efficiency
MAX_ANALYSIS_NODES = 10000  # Maximum nodes for detailed visualization

# Colors
COLORS = {
    'origin': '#2E8B57',
    'received': '#32CD32', 
    'pending': '#DC143C',
    'propagating': '#4169E1',
    'edge': '#808080'
}

# ============================================================================
# OPTIMIZED NETWORK GENERATION
# ============================================================================

class OptimizedNetworkGenerator:
    """Optimized network generator for large-scale geographical networks."""
    
    def __init__(self, total_nodes, connections_per_node, max_distance, distance_weight, seed=42):
        self.total_nodes = total_nodes
        self.connections_per_node = connections_per_node
        self.max_distance = max_distance
        self.distance_weight = distance_weight
        self.seed = seed
        random.seed(seed)
        np.random.seed(seed)
        
    def generate_positions(self):
        """Generate random positions for nodes."""
        print(f"Generating positions for {self.total_nodes} nodes...")
        positions = np.random.rand(self.total_nodes, 2)
        return positions
    
    def create_geographical_network_optimized(self, positions):
        """Create network with geographical constraints using optimized algorithms."""
        print(f"Creating geographical network with {self.total_nodes} nodes...")
        
        G = nx.Graph()
        G.add_nodes_from(range(self.total_nodes))
        
        # Set node positions
        pos_dict = {i: positions[i] for i in range(self.total_nodes)}
        nx.set_node_attributes(G, pos_dict, 'pos')
        
        connections_added = 0
        
        # Process nodes in batches for memory efficiency
        for batch_start in range(0, self.total_nodes, BATCH_SIZE):
            batch_end = min(batch_start + BATCH_SIZE, self.total_nodes)
            print(f"Processing nodes {batch_start}-{batch_end-1}...")
            
            for i in range(batch_start, batch_end):
                neighbors = self._find_geographical_neighbors(i, positions)
                connections_added += self._add_connections(G, i, neighbors)
        
        print(f"Total connections added: {connections_added}")
        return G
    
    def _find_geographical_neighbors(self, node_idx, positions):
        """Find potential neighbors within geographical constraints."""
        node_pos = positions[node_idx]
        candidates = []
        
        # Use vectorized operations for efficiency
        distances = np.sqrt(np.sum((positions - node_pos)**2, axis=1))
        nearby_mask = distances <= self.max_distance
        nearby_indices = np.where(nearby_mask)[0]
        
        # Remove self
        nearby_indices = nearby_indices[nearby_indices != node_idx]
        
        # Calculate probabilities and select connections
        if len(nearby_indices) > 0:
            nearby_distances = distances[nearby_indices]
            probabilities = np.power(1 - nearby_distances / self.max_distance, self.distance_weight)
            
            # Select connections based on probability
            selected_mask = np.random.random(len(nearby_indices)) < probabilities
            candidates = nearby_indices[selected_mask].tolist()
        
        # Limit to desired number of connections
        if len(candidates) > self.connections_per_node:
            candidates = random.sample(candidates, self.connections_per_node)
        
        return candidates
    
    def _add_connections(self, G, node_idx, neighbors):
        """Add connections to the graph."""
        connections_added = 0
        for neighbor in neighbors:
            if not G.has_edge(node_idx, neighbor):
                G.add_edge(node_idx, neighbor)
                connections_added += 1
        return connections_added

# ============================================================================
# MESSAGE PROPAGATION SIMULATION
# ============================================================================

class MessagePropagationSimulator:
    """Simulates message propagation through the network."""
    
    def __init__(self, graph, origin_node=0):
        self.graph = graph
        self.origin_node = origin_node
        self.total_nodes = len(graph.nodes())
        
    def simulate_propagation(self):
        """Simulate send-once full coverage propagation."""
        print(f"Simulating message propagation from node {self.origin_node}...")
        
        # Track propagation state
        received = set([self.origin_node])
        propagating = set([self.origin_node])
        steps = []
        
        step = 0
        start_time = time.time()
        
        while propagating:
            step_start = time.time()
            new_propagating = set()
            
            # Each propagating node sends to its neighbors
            for node in propagating:
                neighbors = list(self.graph.neighbors(node))
                for neighbor in neighbors:
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
            
            print(f"Step {step}: {len(received)}/{self.total_nodes} nodes received "
                  f"({len(propagating)} propagating)")
            
            propagating = new_propagating
            step += 1
            
            # Safety check to prevent infinite loops
            if step > self.total_nodes:
                print("Warning: Propagation exceeded node count, stopping...")
                break
        
        total_time = time.time() - start_time
        print(f"Propagation completed in {step} steps, {total_time:.2f} seconds")
        
        return steps

# ============================================================================
# ANALYSIS AND VISUALIZATION
# ============================================================================

class NetworkAnalyzer:
    """Analyzes network properties and propagation results."""
    
    def __init__(self, graph, propagation_steps):
        self.graph = graph
        self.propagation_steps = propagation_steps
        self.total_nodes = len(graph.nodes())
        
    def analyze_network_properties(self):
        """Analyze basic network properties."""
        print("Analyzing network properties...")
        
        properties = {
            'total_nodes': self.total_nodes,
            'total_edges': len(self.graph.edges()),
            'average_degree': 2 * len(self.graph.edges()) / self.total_nodes if self.total_nodes > 0 else 0,
            'density': nx.density(self.graph),
            'is_connected': nx.is_connected(self.graph),
            'number_of_components': nx.number_connected_components(self.graph)
        }
        
        if nx.is_connected(self.graph):
            try:
                properties['average_clustering'] = nx.average_clustering(self.graph)
                properties['average_path_length'] = nx.average_shortest_path_length(self.graph)
            except:
                properties['average_clustering'] = 0
                properties['average_path_length'] = float('inf')
        
        return properties
    
    def analyze_propagation_performance(self):
        """Analyze propagation performance metrics."""
        if not self.propagation_steps:
            return {}
        
        final_step = self.propagation_steps[-1]
        
        performance = {
            'total_steps': len(self.propagation_steps),
            'total_time': final_step['total_time'],
            'coverage_percentage': (final_step['received_count'] / self.total_nodes) * 100,
            'average_step_time': np.mean([step['step_time'] for step in self.propagation_steps]),
            'max_propagating_nodes': max(step['propagating_count'] for step in self.propagation_steps),
            'propagation_efficiency': final_step['received_count'] / len(self.propagation_steps) if len(self.propagation_steps) > 0 else 0
        }
        
        return performance
    
    def create_visualization(self, output_prefix):
        """Create visualizations for the network and propagation."""
        if self.total_nodes > MAX_ANALYSIS_NODES:
            print(f"Network too large ({self.total_nodes} nodes) for detailed visualization. "
                  f"Skipping visualization (max: {MAX_ANALYSIS_NODES})")
            return
        
        print(f"Creating visualizations...")
        
        # Network topology visualization
        self._plot_network_topology(output_prefix)
        
        # Propagation timeline
        self._plot_propagation_timeline(output_prefix)
        
        # Performance metrics
        self._plot_performance_metrics(output_prefix)
    
    def _plot_network_topology(self, output_prefix):
        """Plot network topology."""
        fig, ax = plt.subplots(1, 1, figsize=(12, 8))
        
        # Get positions
        pos = nx.get_node_attributes(self.graph, 'pos')
        
        # Draw network
        nx.draw(self.graph, pos, 
                node_size=50,
                node_color='lightblue',
                edge_color='gray',
                alpha=0.6,
                ax=ax)
        
        ax.set_title(f'Network Topology ({self.total_nodes} nodes)')
        ax.set_aspect('equal')
        
        plt.tight_layout()
        plt.savefig(f'{output_prefix}_topology.png', dpi=150, bbox_inches='tight')
        plt.close()
    
    def _plot_propagation_timeline(self, output_prefix):
        """Plot propagation timeline."""
        if not self.propagation_steps:
            return
        
        steps = [step['step'] for step in self.propagation_steps]
        received = [step['received_count'] for step in self.propagation_steps]
        propagating = [step['propagating_count'] for step in self.propagation_steps]
        
        fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(12, 8))
        
        # Received nodes over time
        ax1.plot(steps, received, 'g-', linewidth=2, label='Received')
        ax1.set_xlabel('Propagation Step')
        ax1.set_ylabel('Nodes Received')
        ax1.set_title('Message Propagation Progress')
        ax1.grid(True, alpha=0.3)
        ax1.legend()
        
        # Propagating nodes over time
        ax2.plot(steps, propagating, 'b-', linewidth=2, label='Propagating')
        ax2.set_xlabel('Propagation Step')
        ax2.set_ylabel('Nodes Propagating')
        ax2.set_title('Propagation Activity')
        ax2.grid(True, alpha=0.3)
        ax2.legend()
        
        plt.tight_layout()
        plt.savefig(f'{output_prefix}_propagation.png', dpi=150, bbox_inches='tight')
        plt.close()
    
    def _plot_performance_metrics(self, output_prefix):
        """Plot performance metrics comparison."""
        # This would be used for comparing multiple network sizes
        pass

# ============================================================================
# MAIN ANALYSIS FUNCTION
# ============================================================================

def analyze_network_size(network_size):
    """Analyze a specific network size."""
    print(f"\n{'='*60}")
    print(f"ANALYZING NETWORK SIZE: {network_size:,} NODES")
    print(f"{'='*60}")
    
    start_time = time.time()
    
    # Generate network
    generator = OptimizedNetworkGenerator(
        total_nodes=network_size,
        connections_per_node=CONNECTIONS_PER_NODE,
        max_distance=MAX_CONNECTION_DISTANCE,
        distance_weight=DISTANCE_WEIGHT,
        seed=SEED
    )
    
    positions = generator.generate_positions()
    graph = generator.create_geographical_network_optimized(positions)
    
    # Simulate propagation
    simulator = MessagePropagationSimulator(graph, origin_node=0)
    propagation_steps = simulator.simulate_propagation()
    
    # Analyze results
    analyzer = NetworkAnalyzer(graph, propagation_steps)
    network_properties = analyzer.analyze_network_properties()
    propagation_performance = analyzer.analyze_propagation_performance()
    
    # Create output prefix
    output_prefix = f"network_{network_size}"
    
    # Generate visualizations (if network is small enough)
    analyzer.create_visualization(output_prefix)
    
    # Save results
    results = {
        'network_size': network_size,
        'analysis_time': time.time() - start_time,
        'network_properties': network_properties,
        'propagation_performance': propagation_performance,
        'propagation_steps': propagation_steps,
        'timestamp': datetime.now().isoformat()
    }
    
    with open(f'{output_prefix}_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    # Print summary
    print(f"\nSUMMARY FOR {network_size:,} NODES:")
    print(f"- Analysis time: {results['analysis_time']:.2f} seconds")
    print(f"- Total edges: {network_properties['total_edges']:,}")
    print(f"- Average degree: {network_properties['average_degree']:.2f}")
    print(f"- Network density: {network_properties['density']:.4f}")
    print(f"- Is connected: {network_properties['is_connected']}")
    print(f"- Propagation steps: {propagation_performance['total_steps']}")
    print(f"- Coverage: {propagation_performance['coverage_percentage']:.1f}%")
    print(f"- Total time: {propagation_performance['total_time']:.2f} seconds")
    
    return results

def main():
    """Main analysis function."""
    print("GlucoXe Large Network Analysis with Geographical Constraints")
    print("=" * 60)
    
    all_results = []
    
    for network_size in NETWORK_SIZES:
        try:
            results = analyze_network_size(network_size)
            all_results.append(results)
        except Exception as e:
            print(f"Error analyzing {network_size} nodes: {e}")
            continue
    
    # Generate comparison report
    if len(all_results) > 1:
        generate_comparison_report(all_results)

def generate_comparison_report(results):
    """Generate a comparison report across network sizes."""
    print(f"\n{'='*60}")
    print("COMPARISON REPORT")
    print(f"{'='*60}")
    
    # Create comparison table
    print(f"{'Network Size':<15} {'Analysis Time':<15} {'Total Steps':<12} {'Coverage %':<12} {'Total Time':<12}")
    print("-" * 70)
    
    for result in results:
        size = f"{result['network_size']:,}"
        analysis_time = f"{result['analysis_time']:.2f}s"
        steps = result['propagation_performance']['total_steps']
        coverage = f"{result['propagation_performance']['coverage_percentage']:.1f}%"
        total_time = f"{result['propagation_performance']['total_time']:.2f}s"
        
        print(f"{size:<15} {analysis_time:<15} {steps:<12} {coverage:<12} {total_time:<12}")
    
    # Save comparison results
    with open('large_network_comparison.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\nComparison results saved to 'large_network_comparison.json'")

if __name__ == "__main__":
    main()
