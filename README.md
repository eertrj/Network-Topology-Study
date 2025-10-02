# GlucoXe Message Propagation Visualization

This directory contains tools for visualizing message propagation in the GlucoXe network using send-once full coverage strategy.

**Date**: September 29, 2025  
**Location**: `docs/Analysis/250929_Message_Propagation/`

## Files

### Python Version
- `message_propagation_visualization.py` - Main visualization script
- `propagation_timing_analysis.py` - Timing analysis script
- `requirements.txt` - Python dependencies
- `Message_Propagation_Visualization_Results.md` - Complete analysis results

### Web Version (NEW!)
- `index.html` - Interactive web interface
- `network-visualization.js` - Web visualization engine
- `web-README.md` - Web version documentation

### Generated Files
- `message_propagation_animation.gif` - Animated visualization
- `propagation_step_*.png` - Static visualization frames
- `propagation_timing_analysis.png` - Timing analysis charts

## Setup

### Web Version (Recommended)
1. **Navigate to the directory:**
   ```bash
   cd docs/Analysis/250929_Message_Propagation/
   ```

2. **Open in browser:**
   ```bash
   open index.html
   ```
   Or simply double-click `index.html` in your file explorer.

3. **Start visualizing:**
   - Configure network parameters in the left panel
   - Click "Generate Network" to create the network
   - Use playback controls to animate propagation

### Python Version
1. **Navigate to the directory:**
   ```bash
   cd docs/Analysis/250929_Message_Propagation/
   ```

2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the visualization:**
   ```bash
   python message_propagation_visualization.py
   python propagation_timing_analysis.py
   ```

## Web vs Python Version

| Feature | Web Version | Python Version |
|---------|-------------|----------------|
| **Setup** | Open in browser | Install dependencies |
| **Interaction** | Real-time controls | Script parameters |
| **Animation** | Live playback | Static frames + GIF |
| **Layouts** | Multiple options | Fixed spring layout |
| **Statistics** | Real-time display | Console output |
| **Export** | Browser-based | PNG/GIF files |
| **Performance** | Real-time | Batch processing |

**Recommendation**: Use the **web version** for interactive exploration and the **Python version** for batch analysis and documentation.

## Configuration

### Web Version
All parameters are adjustable through the web interface:
- Network configuration (nodes, connections, origin, seed)
- Timing parameters (processing time, latency, animation speed)
- Visualization options (node size, layout type)

### Python Version
The script is highly configurable through variables at the top of the file:

### Network Configuration
- `TOTAL_NODES = 100` - Number of nodes in the network
- `CONNECTIONS_PER_NODE = 20` - Average connections per node
- `SEED = 42` - Random seed for reproducible results

### Message Propagation
- `ORIGIN_NODE = 0` - Node that starts the message
- `PROPAGATION_DELAY = 0.1` - Delay between steps (seconds)

### Visualization
- `FIGURE_SIZE = (15, 10)` - Size of visualization window
- `NODE_SIZE = 300` - Size of nodes in visualization
- `ANIMATION_SPEED = 500` - Milliseconds between animation frames

### Colors
- `COLOR_ORIGIN` - Sea Green (origin node)
- `COLOR_RECEIVED` - Lime Green (received message)
- `COLOR_PENDING` - Crimson (pending/not received)
- `COLOR_PROPAGATING` - Royal Blue (currently propagating)

## Output

The script generates:

1. **Animated GIF**: `message_propagation_animation.gif`
   - Shows step-by-step propagation
   - Displays in a popup window
   - Saves as GIF file

2. **Static Images**: `propagation_step_1.png` through `propagation_step_5.png`
   - Key moments in propagation
   - Useful for documentation

## Network Topology

The script generates a **small-world network** with:
- Ring lattice base structure
- 30% random edge rewiring
- Realistic connectivity patterns
- Reproducible results (with seed)

## Message Propagation Algorithm

**Send-Once Full Coverage**:
1. Origin node starts with message
2. Each node propagates message to all connected neighbors
3. Nodes that receive message become propagators in next step
4. Process continues until all nodes receive message
5. Each node sends message only once

## Color Coding

- 🟢 **Green (Origin)**: Node that started the message
- 🟢 **Green (Received)**: Nodes that have received the message
- 🔵 **Blue (Propagating)**: Nodes currently sending message
- 🔴 **Red (Pending)**: Nodes that haven't received message yet

## Example Output

```
GlucoXe Network Message Propagation Visualization
==================================================
Configuration:
  Total nodes: 100
  Connections per node: 20
  Origin node: 0
  Propagation delay: 0.1s
  Random seed: 42

Generating network...
Creating network layout...
Simulating message propagation...
Starting message propagation from node 0
Network: 100 nodes, 1000 edges
Average degree: 20.0
--------------------------------------------------
Step  1:  1 propagators,  1 received, 99 pending
Step  2: 20 propagators, 21 received, 79 pending
Step  3: 79 propagators, 100 received,  0 pending

Propagation completed in 4 steps
Total nodes reached: 100

============================================================
PROPAGATION ANALYSIS
============================================================
Total propagation steps: 4
Total nodes in network: 100
Average nodes reached per step: 25.0
Maximum simultaneous propagators: 79

Coverage over time:
  Step  1:  1.0% coverage ( 1/100 nodes)
  Step  2: 21.0% coverage (21/100 nodes)
  Step  3:100.0% coverage (100/100 nodes)
```

## Customization

### Changing Network Size
```python
TOTAL_NODES = 50          # Smaller network
CONNECTIONS_PER_NODE = 10 # Fewer connections
```

### Different Propagation Strategy
Modify the `simulate_message_propagation()` function to implement:
- Kill signal partial coverage
- Intelligent message propagation
- Selective forwarding

### Different Network Topologies
Change the `generate_network()` function to use:
- Random network: `nx.erdos_renyi_graph()`
- Scale-free network: `nx.barabasi_albert_graph()`
- Grid network: `nx.grid_2d_graph()`

## Performance Notes

- **100 nodes**: Runs in ~1 second
- **1000 nodes**: Runs in ~10 seconds  
- **10000 nodes**: Runs in ~2 minutes

For larger networks, consider:
- Reducing `PROPAGATION_DELAY` to 0
- Disabling animation display
- Using static visualization only

## Troubleshooting

**Import Errors**: Install requirements with `pip install -r requirements.txt`

**Display Issues**: The script works on macOS, Linux, and Windows. If display issues occur, the GIF file will still be generated.

**Memory Issues**: For very large networks (>1000 nodes), consider reducing visualization quality or using static images only.
