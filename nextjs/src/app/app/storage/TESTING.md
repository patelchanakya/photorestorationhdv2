# Smart Polling System - Testing Guide

## Quick Configuration Changes

### Change Polling Speed

Edit `.env.local` and restart your dev server:

```bash
# Fast polling (1 second) - good for development
NEXT_PUBLIC_POLLING_INTERVAL_MS=1000

# Normal polling (3 seconds) - production default  
NEXT_PUBLIC_POLLING_INTERVAL_MS=3000

# Slow polling (10 seconds) - for testing timeouts
NEXT_PUBLIC_POLLING_INTERVAL_MS=10000
```

### Enable Debug Mode

```bash
# Show debug info in console and UI
NEXT_PUBLIC_POLLING_DEBUG=true

# Hide debug info (production)
NEXT_PUBLIC_POLLING_DEBUG=false
```

## Testing Scenarios

### 1. Test No Polling When Idle

1. Load the storage page with no jobs
2. Check console - should see "No active jobs, no polling needed"
3. No API calls should be made

### 2. Test Polling Starts with Active Jobs

1. Upload an image and click "Restore"
2. Check console - should see "Starting smart polling for 1 active jobs"
3. Should see polling requests every X seconds

### 3. Test Polling Stops When Jobs Complete

1. Wait for restoration to complete
2. Check console - should see "Stopping polling - cleanup"
3. No more API calls should be made

### 4. Test Different Intervals

```bash
# Ultra-fast for testing (500ms)
NEXT_PUBLIC_POLLING_INTERVAL_MS=500

# Test and watch console logs come very quickly
```

### 5. Test Multiple Jobs

1. Upload multiple images
2. Start several restorations quickly
3. Debug panel should show active job count
4. Polling should continue until all complete

## Debug Panel

When `NEXT_PUBLIC_POLLING_DEBUG=true`, you'll see:

- **Debug Mode: ON** - Confirms debug is enabled
- **Polling Interval: Xms** - Current interval setting
- **Active Jobs: X** - Number of jobs currently polling for

## Running Tests

```bash
# Run the polling test suite
npm test polling.test.ts

# Run specific test
npm test -- --testNamePattern="should start polling when jobs are processing"
```

## Test Configurations

### Development (Fast Feedback)
```bash
NEXT_PUBLIC_POLLING_INTERVAL_MS=1000
NEXT_PUBLIC_POLLING_DEBUG=true
```

### Production (Efficient)
```bash
NEXT_PUBLIC_POLLING_INTERVAL_MS=3000  
NEXT_PUBLIC_POLLING_DEBUG=false
```

### Testing (Rapid)
```bash
NEXT_PUBLIC_POLLING_INTERVAL_MS=500
NEXT_PUBLIC_POLLING_DEBUG=true
```

## Common Issues

### Infinite Loops
- Check console for rapid, continuous API calls
- Should only poll when jobs are active
- Should stop when jobs complete

### Missing Notifications  
- Check that status changes are detected
- Verify `previousJobsRef` is tracking changes correctly

### Performance
- Monitor network tab for excessive requests
- Should see ~5-10 requests per job lifecycle
- No requests when idle

## Expected Behavior

✅ **No active jobs** → Zero API calls  
✅ **Start restoration** → Polling begins  
✅ **Job completes** → Success notification + polling stops  
✅ **Job fails** → Error notification + polling stops  
✅ **Multiple jobs** → Continues until all complete  
✅ **Page refresh** → Loads current state + resumes polling if needed  

## Troubleshooting

1. **Not polling?** Check if jobs are actually "pending" or "processing"
2. **Too fast/slow?** Verify `.env.local` interval setting  
3. **No debug info?** Ensure `NEXT_PUBLIC_POLLING_DEBUG=true`
4. **Infinite loops?** Check console for circular dependency warnings