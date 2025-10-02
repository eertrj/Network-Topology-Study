#!/usr/bin/env python3
"""
Quick test script for large network analysis with geographical constraints.

Usage:
    python test_large_networks.py 10000    # Test 10K nodes
    python test_large_networks.py 100000   # Test 100K nodes  
    python test_large_networks.py 1000000  # Test 1M nodes
    python test_large_networks.py all      # Test all sizes
"""

import sys
import time
from large_network_analysis import analyze_network_size, generate_comparison_report

def main():
    if len(sys.argv) != 2:
        print("Usage: python test_large_networks.py <size|all>")
        print("Examples:")
        print("  python test_large_networks.py 10000")
        print("  python test_large_networks.py 100000")
        print("  python test_large_networks.py 1000000")
        print("  python test_large_networks.py all")
        sys.exit(1)
    
    arg = sys.argv[1]
    
    if arg == "all":
        # Test all sizes
        sizes = [10000, 100000, 1000000]
        results = []
        
        print("Testing all network sizes: 10K, 100K, 1M nodes")
        print("This will take a significant amount of time...")
        
        for size in sizes:
            print(f"\nStarting analysis for {size:,} nodes...")
            start_time = time.time()
            
            try:
                result = analyze_network_size(size)
                results.append(result)
                
                elapsed = time.time() - start_time
                print(f"Completed {size:,} nodes in {elapsed:.2f} seconds")
                
            except Exception as e:
                print(f"Failed to analyze {size:,} nodes: {e}")
                continue
        
        if len(results) > 1:
            generate_comparison_report(results)
    
    else:
        # Test specific size
        try:
            size = int(arg)
            if size < 1000:
                print("Warning: Network size is quite small. Consider using 10000+ for meaningful results.")
            
            print(f"Testing network with {size:,} nodes...")
            print("This may take several minutes for large networks...")
            
            start_time = time.time()
            result = analyze_network_size(size)
            elapsed = time.time() - start_time
            
            print(f"\nAnalysis completed in {elapsed:.2f} seconds")
            print(f"Results saved to: network_{size}_results.json")
            
        except ValueError:
            print(f"Error: '{arg}' is not a valid number")
            sys.exit(1)

if __name__ == "__main__":
    main()
