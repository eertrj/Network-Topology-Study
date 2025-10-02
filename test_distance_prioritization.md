# Distance-Based Prioritization Test

## Test Scenarios

To verify that the distance-based prioritization is working correctly, test these scenarios:

### Scenario 1: 0% Long Distance Connections
- **Settings**: 20 nodes, 5 connections, 50px max distance, 0.7 weight, 0% long distance
- **Expected**: Step 2 should show 5 nearby nodes turning green (radial pattern)
- **Debug**: Check console logs for "neighbors sorted by distance" - should show mostly short distances

### Scenario 2: 20% Long Distance Connections  
- **Settings**: 20 nodes, 5 connections, 50px max distance, 0.7 weight, 20% long distance
- **Expected**: Step 2 should show 4 nearby + 1 distal node turning green (mixed pattern)
- **Debug**: Check console logs for "neighbors sorted by distance" - should show mix of short and long distances

### Scenario 3: 100% Long Distance Connections
- **Settings**: 20 nodes, 5 connections, 50px max distance, 0.7 weight, 100% long distance  
- **Expected**: Step 2 should show all 5 distal nodes turning green (non-radial pattern)
- **Debug**: Check console logs for "neighbors sorted by distance" - should show mostly long distances

## Debug Logs to Monitor

1. **Network Generation**: Look for connection distance statistics (min, max, median)
2. **Message Sending**: Look for "neighbors sorted by distance" logs
3. **Message Receiving**: Look for "received message first time via LONGEST DISTANCE" logs

## Expected Console Output Examples

### 0% Long Distance:
```
DEBUG: Node 0 neighbors sorted by distance: [45.2, 38.7, 32.1, 28.9, 25.3]
DEBUG: Node 1 received message first time via LONGEST DISTANCE 45.2 from node 0
```

### 100% Long Distance:
```
DEBUG: Node 0 neighbors sorted by distance: [156.8, 142.3, 128.7, 115.2, 98.4]
DEBUG: Node 15 received message first time via LONGEST DISTANCE 156.8 from node 0
```

## Verification Steps

1. Open browser console (F12)
2. Generate network with test settings
3. Step through propagation manually
4. Check that Step 2 shows the expected pattern
5. Verify debug logs show distance-based prioritization
