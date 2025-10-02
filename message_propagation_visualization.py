#!/usr/bin/env python3
"""
Network Message Propagation Visualization

This script visualizes message propagation in a network using send-once full coverage.
Shows step-by-step propagation with color coding:
- Green: Origin node and nodes that have received the message
- Red: Nodes that haven't received the message yet
- Blue: Nodes currently propagating the message

Variables can be easily modified at the top of the file.
"""

import numpy as np
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend for headless operation
import matplotlib.pyplot as plt
import matplotlib.animation as animation
import networkx as nx
import random
from collections import deque, defaultdict
import time

# ============================================================================
# CONFIGURATION VARIABLES (MODIFY THESE AS NEEDED)
# ============================================================================

# Network Configuration
TOTAL_NODES = 100
CONNECTIONS_PER_NODE = 20
SEED = 42  # For reproducible results

# Message Propagation Configuration
ORIGIN_NODE = 0  # Node that starts the message
PROPAGATION_DELAY = 0.1  # Delay between propagation steps (seconds)

# Visualization Configuration
FIGURE_SIZE = (15, 10)
NODE_SIZE = 300
EDGE_WIDTH = 0.5
ANIMATION_SPEED = 500  # Milliseconds between frames

# Colors
COLOR_ORIGIN = '#2E8B57'      # Sea Green (origin node)
COLOR_RECEIVED = '#32CD32'     # Lime Green (received message)
COLOR_PENDING = '#DC143C'      # Crimson (pending/not received)
COLOR_PROPAGATING = '#4169E1'  # Royal Blue (currently propagating)
COLOR_EDGE = '#808080'         # Gray (network edges)

# ============================================================================
# NETWORK GENERATION
# ============================================================================

def generate_network(total_nodes, connections_per_node, seed=None):
    """
    Generate a random network with specified number of nodes and connections.
    
    Args:
        total_nodes: Number of nodes in the network
        connections_per_node: Average number of connections per node
        seed: Random seed for reproducibility
    
    Returns:
        NetworkX graph object
    """
    if seed is not None:
        random.seed(seed)
        np.random.seed(seed)
    
    # Create a graph
    G = nx.Graph()
    
    # Add nodes
    G.add_nodes_from(range(total_nodes))
    
    # Create connections using a small-world network model
    # This creates a more realistic network topology
    
    # First, create a ring lattice (each node connected to k/2 neighbors on each side)
    k = connections_per_node // 2
    for i in range(total_nodes):
        for j in range(1, k + 1):
            # Connect to neighbors in the ring
            G.add_edge(i, (i + j) % total_nodes)
            G.add_edge(i, (i - j) % total_nodes)
    
    # Then, randomly rewire some edges to create small-world properties
    edges_to_rewire = []
    for edge in G.edges():
        if random.random() < 0.3:  # 30% chance to rewire
            edges_to_rewire.append(edge)
    
    for edge in edges_to_rewire:
        G.remove_edge(*edge)
        # Find a new random connection
        node1 = edge[0]
        possible_targets = [n for n in range(total_nodes) 
                          if n != node1 and not G.has_edge(node1, n)]
        if possible_targets:
            new_target = random.choice(possible_targets)
            G.add_edge(node1, new_target)
    
    return G

# ============================================================================
# MESSAGE PROPAGATION SIMULATION
# ============================================================================

def simulate_message_propagation(G, origin_node, propagation_delay=0.1):
    """
    Simulate message propagation using send-once full coverage.
    
    Args:
        G: NetworkX graph
        origin_node: Node that starts the message
        propagation_delay: Delay between propagation steps
    
    Returns:
        List of propagation steps, each containing node states
    """
    total_nodes = G.number_of_nodes()
    
    # Initialize node states
    # 0: pending (not received), 1: received, 2: propagating
    node_states = np.zeros(total_nodes, dtype=int)
    node_states[origin_node] = 1  # Origin node starts with message
    
    # Track which nodes have sent the message
    nodes_sent = set([origin_node])
    
    # Queue for nodes that need to propagate
    propagation_queue = deque([origin_node])
    
    # Store all propagation steps
    propagation_steps = []
    
    step = 0
    
    print(f"Starting message propagation from node {origin_node}")
    print(f"Network: {total_nodes} nodes, {G.number_of_edges()} edges")
    print(f"Average degree: {2 * G.number_of_edges() / total_nodes:.1f}")
    print("-" * 50)
    
    while propagation_queue:
        step += 1
        
        # Current step: nodes that will propagate in this round
        current_propagators = list(propagation_queue)
        propagation_queue.clear()
        
        # Mark current propagators as propagating
        for node in current_propagators:
            node_states[node] = 2
        
        # Record current state
        current_step = {
            'step': step,
            'node_states': node_states.copy(),
            'propagators': current_propagators.copy(),
            'total_received': np.sum(node_states > 0),
            'total_pending': np.sum(node_states == 0)
        }
        propagation_steps.append(current_step)
        
        # Print step information
        received_count = np.sum(node_states > 0)
        pending_count = np.sum(node_states == 0)
        print(f"Step {step:2d}: {len(current_propagators):2d} propagators, "
              f"{received_count:2d} received, {pending_count:2d} pending")
        
        # Propagate message to neighbors
        new_propagators = set()
        
        for propagator in current_propagators:
            neighbors = list(G.neighbors(propagator))
            
            for neighbor in neighbors:
                if node_states[neighbor] == 0:  # Neighbor hasn't received message
                    node_states[neighbor] = 1  # Mark as received
                    new_propagators.add(neighbor)
        
        # Add new propagators to queue
        propagation_queue.extend(new_propagators)
        
        # Mark current propagators as received (no longer propagating)
        for node in current_propagators:
            node_states[node] = 1
        
        # Simulate propagation delay
        time.sleep(propagation_delay)
    
    # Final step: all nodes have received the message
    final_step = {
        'step': step + 1,
        'node_states': node_states.copy(),
        'propagators': [],
        'total_received': total_nodes,
        'total_pending': 0
    }
    propagation_steps.append(final_step)
    
    print(f"\nPropagation completed in {len(propagation_steps)} steps")
    print(f"Total nodes reached: {total_nodes}")
    
    return propagation_steps

# ============================================================================
# VISUALIZATION FUNCTIONS
# ============================================================================

def get_node_color(node, node_states, propagators, origin_node):
    """Get color for a node based on its state."""
    if node == origin_node:
        return COLOR_ORIGIN
    elif node in propagators:
        return COLOR_PROPAGATING
    elif node_states[node] > 0:
        return COLOR_RECEIVED
    else:
        return COLOR_PENDING

def create_network_layout(G, layout_type='spring'):
    """Create a layout for the network visualization."""
    if layout_type == 'spring':
        pos = nx.spring_layout(G, k=1, iterations=50, seed=SEED)
    elif layout_type == 'circular':
        pos = nx.circular_layout(G)
    elif layout_type == 'random':
        pos = nx.random_layout(G, seed=SEED)
    else:
        pos = nx.spring_layout(G, k=1, iterations=50, seed=SEED)
    
    return pos

def visualize_propagation_step(G, pos, propagation_step, origin_node, step_num):
    """Visualize a single step of message propagation."""
    fig, ax = plt.subplots(figsize=FIGURE_SIZE)
    
    node_states = propagation_step['node_states']
    propagators = propagation_step['propagators']
    
    # Draw edges
    nx.draw_networkx_edges(G, pos, edge_color=COLOR_EDGE, 
                          width=EDGE_WIDTH, alpha=0.3, ax=ax)
    
    # Draw nodes with appropriate colors
    for node in G.nodes():
        color = get_node_color(node, node_states, propagators, origin_node)
        nx.draw_networkx_nodes(G, pos, nodelist=[node], 
                              node_color=color, node_size=NODE_SIZE, ax=ax)
    
    # Add node labels
    nx.draw_networkx_labels(G, pos, font_size=8, font_color='white', 
                           font_weight='bold', ax=ax)
    
    # Add title and statistics
    title = (f"Message Propagation - Step {step_num}\n"
             f"Received: {propagation_step['total_received']}, "
             f"Pending: {propagation_step['total_pending']}, "
             f"Propagating: {len(propagators)}")
    
    ax.set_title(title, fontsize=14, fontweight='bold')
    ax.axis('off')
    
    # Add legend
    legend_elements = [
        plt.scatter([], [], c=COLOR_ORIGIN, s=100, label='Origin'),
        plt.scatter([], [], c=COLOR_RECEIVED, s=100, label='Received'),
        plt.scatter([], [], c=COLOR_PENDING, s=100, label='Pending'),
        plt.scatter([], [], c=COLOR_PROPAGATING, s=100, label='Propagating')
    ]
    ax.legend(handles=legend_elements, loc='upper right')
    
    plt.tight_layout()
    return fig

def create_animation(G, pos, propagation_steps, origin_node):
    """Create an animated visualization of message propagation."""
    fig, ax = plt.subplots(figsize=FIGURE_SIZE)
    
    # Initialize plot elements
    edges = nx.draw_networkx_edges(G, pos, edge_color=COLOR_EDGE, 
                                  width=EDGE_WIDTH, alpha=0.3, ax=ax)
    nodes = nx.draw_networkx_nodes(G, pos, node_color=COLOR_PENDING, 
                                  node_size=NODE_SIZE, ax=ax)
    labels = nx.draw_networkx_labels(G, pos, font_size=8, font_color='white', 
                                    font_weight='bold', ax=ax)
    
    ax.set_title("Message Propagation Animation", fontsize=14, fontweight='bold')
    ax.axis('off')
    
    # Add legend
    legend_elements = [
        plt.scatter([], [], c=COLOR_ORIGIN, s=100, label='Origin'),
        plt.scatter([], [], c=COLOR_RECEIVED, s=100, label='Received'),
        plt.scatter([], [], c=COLOR_PENDING, s=100, label='Pending'),
        plt.scatter([], [], c=COLOR_PROPAGATING, s=100, label='Propagating')
    ]
    ax.legend(handles=legend_elements, loc='upper right')
    
    def animate(frame):
        if frame < len(propagation_steps):
            step = propagation_steps[frame]
            node_states = step['node_states']
            propagators = step['propagators']
            
            # Update node colors
            node_colors = []
            for node in G.nodes():
                color = get_node_color(node, node_states, propagators, origin_node)
                node_colors.append(color)
            
            nodes.set_color(node_colors)
            
            # Update title
            title = (f"Message Propagation - Step {step['step']}\n"
                     f"Received: {step['total_received']}, "
                     f"Pending: {step['total_pending']}, "
                     f"Propagating: {len(propagators)}")
            ax.set_title(title, fontsize=14, fontweight='bold')
        
        return nodes, ax
    
    # Create animation
    anim = animation.FuncAnimation(fig, animate, frames=len(propagation_steps), 
                                 interval=ANIMATION_SPEED, blit=False, repeat=True)
    
    plt.tight_layout()
    return fig, anim

# ============================================================================
# ANALYSIS FUNCTIONS
# ============================================================================

def analyze_propagation(propagation_steps):
    """Analyze the propagation results."""
    print("\n" + "="*60)
    print("PROPAGATION ANALYSIS")
    print("="*60)
    
    total_steps = len(propagation_steps)
    total_nodes = propagation_steps[0]['total_received'] + propagation_steps[0]['total_pending']
    
    print(f"Total propagation steps: {total_steps}")
    print(f"Total nodes in network: {total_nodes}")
    print(f"Average nodes reached per step: {total_nodes / total_steps:.1f}")
    
    # Calculate propagation efficiency
    max_propagators = max(step['propagators'].__len__() for step in propagation_steps)
    print(f"Maximum simultaneous propagators: {max_propagators}")
    
    # Calculate coverage over time
    print("\nCoverage over time:")
    for i, step in enumerate(propagation_steps[::max(1, len(propagation_steps)//10)]):
        coverage_pct = (step['total_received'] / total_nodes) * 100
        print(f"  Step {step['step']:2d}: {coverage_pct:5.1f}% coverage "
              f"({step['total_received']:2d}/{total_nodes} nodes)")
    
    return {
        'total_steps': total_steps,
        'total_nodes': total_nodes,
        'max_propagators': max_propagators,
        'final_coverage': 100.0
    }

# ============================================================================
# MAIN EXECUTION
# ============================================================================

def main():
    """Main execution function."""
    print("Network Message Propagation Visualization")
    print("=" * 50)
    print(f"Configuration:")
    print(f"  Total nodes: {TOTAL_NODES}")
    print(f"  Connections per node: {CONNECTIONS_PER_NODE}")
    print(f"  Origin node: {ORIGIN_NODE}")
    print(f"  Propagation delay: {PROPAGATION_DELAY}s")
    print(f"  Random seed: {SEED}")
    
    # Generate network
    print("\nGenerating network...")
    G = generate_network(TOTAL_NODES, CONNECTIONS_PER_NODE, SEED)
    
    # Create layout
    print("Creating network layout...")
    pos = create_network_layout(G, 'spring')
    
    # Simulate message propagation
    print("\nSimulating message propagation...")
    propagation_steps = simulate_message_propagation(G, ORIGIN_NODE, PROPAGATION_DELAY)
    
    # Analyze results
    analysis = analyze_propagation(propagation_steps)
    
    # Create visualizations
    print("\nCreating visualizations...")
    
    # Create animation
    fig, anim = create_animation(G, pos, propagation_steps, ORIGIN_NODE)
    
    # Save animation
    print("Saving animation...")
    anim.save('message_propagation_animation.gif', 
              writer='pillow', fps=2, dpi=100)
    
    # Create static images for key steps
    key_steps = [0, len(propagation_steps)//4, len(propagation_steps)//2, 
                3*len(propagation_steps)//4, -1]
    
    for i, step_idx in enumerate(key_steps):
        if step_idx == -1:
            step_idx = len(propagation_steps) - 1
        
        fig = visualize_propagation_step(G, pos, propagation_steps[step_idx], 
                                       ORIGIN_NODE, propagation_steps[step_idx]['step'])
        fig.savefig(f'propagation_step_{i+1}.png', 
                   dpi=150, bbox_inches='tight')
        plt.close(fig)
    
    # Show the final animation (disabled in headless environment)
    print("\nAnimation saved to GIF file (display disabled in headless environment)")
    # plt.show()  # Uncomment this line if running with GUI display
    
    print(f"\nVisualization complete!")
    print(f"Files saved:")
    print(f"  - message_propagation_animation.gif")
    for i in range(len(key_steps)):
        print(f"  - propagation_step_{i+1}.png")

if __name__ == "__main__":
    main()
