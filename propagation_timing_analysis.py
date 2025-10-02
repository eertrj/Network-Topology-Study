#!/usr/bin/env python3
"""
GlucoXe Message Propagation Timing Analysis

This script analyzes the timing characteristics of message propagation
in different network configurations and provides step-by-step timing estimates.
"""

import numpy as np
import matplotlib.pyplot as plt
import networkx as nx
import random
from collections import deque
import time

# ============================================================================
# CONFIGURATION VARIABLES
# ============================================================================

# Network Configurations to Test
NETWORK_CONFIGS = [
    {'nodes': 50, 'connections': 10, 'name': 'Small Network'},
    {'nodes': 100, 'connections': 20, 'name': 'Medium Network'},
    {'nodes': 200, 'connections': 20, 'name': 'Large Network'},
    {'nodes': 500, 'connections': 25, 'name': 'Very Large Network'},
]

# Timing Parameters (in milliseconds)
MESSAGE_PROCESSING_TIME = 1.0    # Time to process and send message
NETWORK_LATENCY = 5.0            # Average network latency
PROPAGATION_OVERHEAD = 0.5       # Overhead per propagation step

# ============================================================================
# PROPAGATION SIMULATION WITH TIMING
# ============================================================================

def simulate_propagation_with_timing(G, origin_node, processing_time=1.0, latency=5.0):
    """
    Simulate message propagation with realistic timing estimates.
    
    Returns:
        List of propagation steps with timing information
    """
    total_nodes = G.number_of_nodes()
    
    # Initialize node states
    node_states = np.zeros(total_nodes, dtype=int)
    node_states[origin_node] = 1  # Origin node starts with message
    
    # Queue for nodes that need to propagate
    propagation_queue = deque([origin_node])
    
    # Store propagation steps with timing
    propagation_steps = []
    
    step = 0
    total_time = 0.0
    
    while propagation_queue:
        step += 1
        step_start_time = total_time
        
        # Current propagators
        current_propagators = list(propagation_queue)
        propagation_queue.clear()
        
        # Calculate step timing
        # Time = (number of propagators × processing time) + network latency
        step_time = (len(current_propagators) * processing_time) + latency
        total_time += step_time
        
        # Record step information
        step_info = {
            'step': step,
            'propagators': len(current_propagators),
            'step_time_ms': step_time,
            'cumulative_time_ms': total_time,
            'step_start_time': step_start_time,
            'step_end_time': total_time,
            'total_received': np.sum(node_states > 0),
            'total_pending': np.sum(node_states == 0)
        }
        propagation_steps.append(step_info)
        
        # Propagate to neighbors
        new_propagators = set()
        for propagator in current_propagators:
            neighbors = list(G.neighbors(propagator))
            for neighbor in neighbors:
                if node_states[neighbor] == 0:
                    node_states[neighbor] = 1
                    new_propagators.add(neighbor)
        
        propagation_queue.extend(new_propagators)
        
        # Mark propagators as received
        for node in current_propagators:
            node_states[node] = 1
    
    return propagation_steps

# ============================================================================
# NETWORK GENERATION
# ============================================================================

def generate_network(nodes, connections, seed=42):
    """Generate a small-world network."""
    random.seed(seed)
    np.random.seed(seed)
    
    G = nx.Graph()
    G.add_nodes_from(range(nodes))
    
    # Create ring lattice
    k = connections // 2
    for i in range(nodes):
        for j in range(1, k + 1):
            G.add_edge(i, (i + j) % nodes)
            G.add_edge(i, (i - j) % nodes)
    
    # Random rewiring
    edges_to_rewire = []
    for edge in G.edges():
        if random.random() < 0.3:
            edges_to_rewire.append(edge)
    
    for edge in edges_to_rewire:
        G.remove_edge(*edge)
        node1 = edge[0]
        possible_targets = [n for n in range(nodes) 
                          if n != node1 and not G.has_edge(node1, n)]
        if possible_targets:
            new_target = random.choice(possible_targets)
            G.add_edge(node1, new_target)
    
    return G

# ============================================================================
# ANALYSIS AND VISUALIZATION
# ============================================================================

def analyze_timing_results(results):
    """Analyze timing results and create visualizations."""
    
    # Create timing analysis plot
    fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(15, 10))
    
    colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728']
    
    # Plot 1: Step times vs step number
    for i, (config, result) in enumerate(zip(NETWORK_CONFIGS, results)):
        steps = [s['step'] for s in result]
        step_times = [s['step_time_ms'] for s in result]
        
        ax1.plot(steps, step_times, 'o-', color=colors[i], 
                label=f"{config['name']} ({config['nodes']} nodes)", linewidth=2, markersize=6)
    
    ax1.set_xlabel('Propagation Step')
    ax1.set_ylabel('Step Time (ms)')
    ax1.set_title('Step Time vs Propagation Step')
    ax1.legend()
    ax1.grid(True, alpha=0.3)
    
    # Plot 2: Cumulative time vs coverage
    for i, (config, result) in enumerate(zip(NETWORK_CONFIGS, results)):
        cumulative_times = [s['cumulative_time_ms'] for s in result]
        coverage_pct = [(s['total_received'] / config['nodes']) * 100 for s in result]
        
        ax2.plot(coverage_pct, cumulative_times, 'o-', color=colors[i],
                label=f"{config['name']} ({config['nodes']} nodes)", linewidth=2, markersize=6)
    
    ax2.set_xlabel('Network Coverage (%)')
    ax2.set_ylabel('Cumulative Time (ms)')
    ax2.set_title('Time to Achieve Coverage')
    ax2.legend()
    ax2.grid(True, alpha=0.3)
    
    # Plot 3: Total propagation time vs network size
    network_sizes = [config['nodes'] for config in NETWORK_CONFIGS]
    total_times = [result[-1]['cumulative_time_ms'] for result in results]
    
    ax3.plot(network_sizes, total_times, 'o-', color='#2ca02c', 
            linewidth=3, markersize=8)
    ax3.set_xlabel('Network Size (nodes)')
    ax3.set_ylabel('Total Propagation Time (ms)')
    ax3.set_title('Total Time vs Network Size')
    ax3.grid(True, alpha=0.3)
    
    # Add trend line
    z = np.polyfit(network_sizes, total_times, 1)
    p = np.poly1d(z)
    ax3.plot(network_sizes, p(network_sizes), '--', color='red', alpha=0.7,
            label=f'Linear fit: y = {z[0]:.2f}x + {z[1]:.1f}')
    ax3.legend()
    
    # Plot 4: Maximum simultaneous propagators
    max_propagators = [max(s['propagators'] for s in result) for result in results]
    
    ax4.plot(network_sizes, max_propagators, 'o-', color='#ff7f0e',
            linewidth=3, markersize=8)
    ax4.set_xlabel('Network Size (nodes)')
    ax4.set_ylabel('Max Simultaneous Propagators')
    ax4.set_title('Peak Propagation Load vs Network Size')
    ax4.grid(True, alpha=0.3)
    
    plt.tight_layout()
    plt.savefig('propagation_timing_analysis.png', dpi=150, bbox_inches='tight')
    plt.close()
    
    return {
        'network_sizes': network_sizes,
        'total_times': total_times,
        'max_propagators': max_propagators,
        'linear_fit': z
    }

def print_detailed_results(results):
    """Print detailed timing analysis results."""
    
    print("="*80)
    print("GLUCOXE MESSAGE PROPAGATION TIMING ANALYSIS")
    print("="*80)
    
    for i, (config, result) in enumerate(zip(NETWORK_CONFIGS, results)):
        print(f"\n{config['name']} ({config['nodes']} nodes, {config['connections']} connections per node)")
        print("-" * 60)
        
        total_time = result[-1]['cumulative_time_ms']
        total_steps = len(result)
        max_propagators = max(s['propagators'] for s in result)
        
        print(f"Total propagation time: {total_time:.1f} ms ({total_time/1000:.3f} seconds)")
        print(f"Total propagation steps: {total_steps}")
        print(f"Average time per step: {total_time/total_steps:.1f} ms")
        print(f"Maximum simultaneous propagators: {max_propagators}")
        print(f"Average propagators per step: {np.mean([s['propagators'] for s in result]):.1f}")
        
        print(f"\nStep-by-step breakdown:")
        for step in result:
            print(f"  Step {step['step']:2d}: {step['propagators']:2d} propagators, "
                  f"{step['step_time_ms']:6.1f}ms step time, "
                  f"{step['cumulative_time_ms']:7.1f}ms total, "
                  f"{step['total_received']:3d}/{config['nodes']} nodes reached")
    
    # Summary statistics
    print(f"\n{'='*80}")
    print("SUMMARY STATISTICS")
    print("="*80)
    
    network_sizes = [config['nodes'] for config in NETWORK_CONFIGS]
    total_times = [result[-1]['cumulative_time_ms'] for result in results]
    
    print(f"Network sizes tested: {network_sizes}")
    print(f"Total propagation times: {[f'{t:.1f}ms' for t in total_times]}")
    print(f"Time scaling factor: {total_times[-1]/total_times[0]:.2f}x for {network_sizes[-1]/network_sizes[0]:.2f}x nodes")
    
    # Linear scaling analysis
    z = np.polyfit(network_sizes, total_times, 1)
    print(f"Linear scaling: {z[0]:.3f} ms per node + {z[1]:.1f} ms base time")
    print(f"Predicted time for 1000 nodes: {z[0]*1000 + z[1]:.1f} ms ({z[0]*1000 + z[1]:.3f} seconds)")
    print(f"Predicted time for 10000 nodes: {z[0]*10000 + z[1]:.1f} ms ({z[0]*10000 + z[1]:.1f} seconds)")

# ============================================================================
# MAIN EXECUTION
# ============================================================================

def main():
    """Main execution function."""
    
    print("GlucoXe Message Propagation Timing Analysis")
    print("=" * 50)
    print(f"Processing time per node: {MESSAGE_PROCESSING_TIME} ms")
    print(f"Network latency per step: {NETWORK_LATENCY} ms")
    print(f"Propagation overhead: {PROPAGATION_OVERHEAD} ms")
    
    # Run simulations for all network configurations
    results = []
    
    for config in NETWORK_CONFIGS:
        print(f"\nSimulating {config['name']}...")
        
        # Generate network
        G = generate_network(config['nodes'], config['connections'])
        
        # Simulate propagation
        result = simulate_propagation_with_timing(
            G, origin_node=0, 
            processing_time=MESSAGE_PROCESSING_TIME,
            latency=NETWORK_LATENCY
        )
        
        results.append(result)
    
    # Analyze and visualize results
    print("\nAnalyzing results...")
    analysis = analyze_timing_results(results)
    
    # Print detailed results
    print_detailed_results(results)
    
    print(f"\nVisualization saved: propagation_timing_analysis.png")

if __name__ == "__main__":
    main()
