# Network Message Propagation - Interactive Web Visualization

## Overview

This is an interactive web-based visualization of network message propagation using send-once full coverage strategy. The web version provides real-time control over network parameters, playback controls, and step-by-step timing analysis.

## Files

- `index.html` - Main web interface
- `network-visualization.js` - Interactive visualization engine
- `web-README.md` - This documentation

## Features

### 🎛️ **Interactive Controls**
- **Network Configuration**: Adjust total nodes, connections, origin node, and random seed
- **Timing Parameters**: Modify processing time, network latency, and animation speed
- **Visualization Options**: Change node size, layout type (spring, circular, random)

### ⏯️ **Playback Controls**
- **Play/Pause**: Start and stop animation
- **Step Forward/Backward**: Navigate step by step
- **Jump to Start/End**: Quick navigation to beginning or end
- **Progress Bar**: Visual indication of current position

### 📊 **Real-Time Statistics**
- **Total Nodes**: Current network size
- **Total Steps**: Number of propagation steps
- **Total Time**: Complete propagation time in milliseconds
- **Max Propagators**: Peak simultaneous propagators

### 🎨 **Visual Features**
- **Color-Coded Nodes**:
  - 🟢 **Green (Origin)**: Node that started the message
  - 🟢 **Green (Received)**: Nodes that have received the message
  - 🔵 **Blue (Propagating)**: Nodes currently sending the message
  - 🔴 **Red (Pending)**: Nodes that haven't received the message yet
- **Multiple Layouts**: Spring, circular, and random network layouts
- **Responsive Design**: Works on desktop and mobile devices

## Usage

### Quick Start
1. **Open** `index.html` in a web browser
2. **Configure** network parameters in the left panel
3. **Click** "Generate Network" to create the network
4. **Use** playback controls to visualize propagation

### Configuration Options

#### Network Configuration
- **Total Nodes**: 10-500 nodes (default: 100)
- **Connections per Node**: 2-50 connections (default: 20)
- **Origin Node**: Starting node for message propagation (default: 0)
- **Random Seed**: For reproducible network generation (default: 42)

#### Timing Parameters
- **Processing Time**: Time per node to process message (default: 1.0ms)
- **Network Latency**: Network delay per step (default: 5.0ms)
- **Animation Speed**: Delay between animation frames (default: 500ms)

#### Visualization
- **Node Size**: Visual size of nodes (3-15, default: 8)
- **Layout Type**: Network arrangement algorithm
  - **Spring Layout**: Force-directed positioning (default)
  - **Circular Layout**: Nodes arranged in circle
  - **Random Layout**: Random positioning

### Controls

#### Playback Controls
- **▶ Play**: Start animation from current step
- **⏸ Pause**: Stop animation
- **⏭ Step Forward**: Move to next propagation step
- **⏮ Step Backward**: Move to previous step
- **⏮⏮ Start**: Jump to first step
- **⏭⏭ End**: Jump to last step

#### Time Display
- Shows current step number and total steps
- Displays cumulative time in milliseconds
- Progress bar shows animation position

## Technical Details

### Algorithm
The visualization implements the same **send-once full coverage** algorithm as the Python version:

1. **Network Generation**: Creates small-world networks using ring lattice + random rewiring
2. **Propagation Simulation**: 
   - Origin node starts with message
   - Each step: propagators send to all connected neighbors
   - Neighbors become propagators in next step
   - Process continues until all nodes receive message
3. **Timing Calculation**: `step_time = (propagators × processing_time) + network_latency`

### Network Topology
- **Small-World Network**: Combines local clustering with long-range connections
- **Ring Lattice Base**: Each node connected to k/2 neighbors on each side
- **Random Rewiring**: 30% of edges randomly rewired for small-world properties
- **Reproducible**: Same seed produces identical networks

### Performance
- **Real-time Rendering**: Canvas-based visualization for smooth animation
- **Responsive Design**: Adapts to different screen sizes
- **Memory Efficient**: Optimized for networks up to 500 nodes
- **Browser Compatible**: Works in all modern browsers

## Examples

### Small Network (50 nodes)
- **Configuration**: 50 nodes, 10 connections per node
- **Result**: ~4 steps, 70ms total time, 34 max propagators

### Medium Network (100 nodes)
- **Configuration**: 100 nodes, 20 connections per node
- **Result**: ~3 steps, 115ms total time, 76 max propagators

### Large Network (200 nodes)
- **Configuration**: 200 nodes, 20 connections per node
- **Result**: ~4 steps, 220ms total time, 149 max propagators

## Comparison with Python Version

| Feature | Python Version | Web Version |
|---------|---------------|-------------|
| **Network Size** | 50-500 nodes | 10-500 nodes |
| **Animation** | Static frames + GIF | Real-time interactive |
| **Controls** | Script parameters | Live UI controls |
| **Layouts** | Fixed spring layout | Multiple layout options |
| **Statistics** | Console output | Real-time display |
| **Export** | PNG/GIF files | Browser-based only |

## Browser Requirements

- **Modern Browser**: Chrome, Firefox, Safari, Edge (latest versions)
- **JavaScript**: Must be enabled
- **Canvas Support**: Required for visualization
- **No Plugins**: Pure HTML5/CSS3/JavaScript

## Troubleshooting

### Common Issues
1. **Canvas not displaying**: Check JavaScript is enabled
2. **Animation too fast/slow**: Adjust "Animation Speed" parameter
3. **Nodes too small/large**: Adjust "Node Size" slider
4. **Network not generating**: Check node count limits (10-500)

### Performance Tips
- **Smaller networks** (50-100 nodes) for smoother animation
- **Reduce animation speed** for better step-by-step analysis
- **Use circular layout** for fastest rendering
- **Close other browser tabs** for better performance

## Future Enhancements

Potential improvements for future versions:
- **Export functionality**: Save images and data
- **Network metrics**: Additional statistics and analysis
- **Different algorithms**: Other propagation strategies
- **3D visualization**: Three-dimensional network layouts
- **Real-time editing**: Modify network during visualization
- **Comparison mode**: Side-by-side network comparison

---

## Quick Reference

**Start**: Open `index.html` in browser  
**Generate**: Click "Generate Network"  
**Animate**: Click "Play" or use step controls  
**Configure**: Adjust parameters in left panel  
**Navigate**: Use playback controls or progress bar  

The web visualization provides an intuitive, interactive way to explore network message propagation algorithms with real-time control and immediate visual feedback.
