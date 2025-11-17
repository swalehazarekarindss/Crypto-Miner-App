# Backend Polling Update - Implementation Guide

## ✅ Backend Complete

### New Endpoint Response
`GET /api/user/mining/status` now returns:

```json
{
  "session": { /* existing session data */ },
  "computed": {
    "elapsedSeconds": 1234,
    "remainingSeconds": 2166,
    "currentEarned": 12.34,
    "isComplete": false,
    "totalSecondsPlanned": 3600
  }
}
```

**All calculations happen on backend:**
- `elapsedSeconds` - How long mining has been running
- `remainingSeconds` - Time left until completion
- `currentEarned` - Tokens earned so far
- `isComplete` - Whether mining is complete
- `totalSecondsPlanned` - Total duration in seconds

## 🔄 Frontend Changes Needed

### MiningScreen.tsx Changes:

**1. Remove all local time calculations:**
```typescript
// DELETE these calculations:
const now = Date.now();
const elapsed = Math.floor((now - startTime) / 1000);
const remaining = Math.max(0, planned - elapsed);
const earned = elapsed * BASE_RATE * multiplier;
```

**2. Change polling interval from 10s to 2s:**
```typescript
// CHANGE FROM:
const syncInterval = setInterval(() => {
  syncWithBackend();
}, 10000); // 10 seconds

// CHANGE TO:
const syncInterval = setInterval(() => {
  syncWithBackend();
}, 2000); // 2 seconds
```

**3. Remove the 1-second setInterval timer:**
```typescript
// DELETE this entire block:
intervalRef.current = setInterval(() => {
  const currentNow = Date.now();
  const currentElapsed = Math.floor((currentNow - startTime) / 1000);
  const currentRemaining = Math.max(0, planned - currentElapsed);
  setSecondsLeft(currentRemaining);
  setEarned(currentElapsed * BASE_RATE * multiplier);
  
  if (currentRemaining === 0) {
    clearInterval(intervalRef.current);
  }
}, 1000);
```

**4. Update syncWithBackend to use computed values:**
```typescript
const syncWithBackend = async () => {
  try {
    const statusResp = await miningAPI.getStatus();
    
    if (statusResp && statusResp.session && statusResp.computed) {
      const sess = statusResp.session;
      const computed = statusResp.computed;
      
      setSession(sess);
      setSecondsLeft(computed.remainingSeconds);
      setEarned(computed.currentEarned);
      
      // Check if complete
      if (computed.isComplete && sess.status !== 'claimed') {
        // Show claim button
        startClaimButtonAnimation();
        showRewardReadyNotification();
      }
      
      // Check if claimed
      if (sess.status === 'claimed') {
        setSecondsLeft(0);
        setEarned(sess.totalEarned || 0);
      }
    }
  } catch (err) {
    console.error('Sync error:', err);
  }
};
```

**5. Remove startLocalTimer function:**
```typescript
// DELETE the entire startLocalTimer function
// It's no longer needed since backend provides all values
```

**6. Update loadSession to use computed values:**
```typescript
const loadSession = async () => {
  try {
    const statusResp = await miningAPI.getStatus();
    
    if (statusResp && statusResp.session && statusResp.computed) {
      const sess = statusResp.session;
      const computed = statusResp.computed;
      
      setSession(sess);
      setSecondsLeft(computed.remainingSeconds);
      setEarned(computed.currentEarned);
      
      // Schedule notification if not complete
      if (!computed.isComplete && sess.status === 'mining') {
        const endTime = Date.now() + (computed.remainingSeconds * 1000);
        scheduleEndNotification(endTime, computed.currentEarned, sess._id);
      }
    }
  } catch (err) {
    console.error('Load error:', err);
  }
};
```

## 📊 Benefits

1. **Single Source of Truth**: Backend calculates everything
2. **No Time Drift**: Frontend can't get out of sync
3. **Accurate Calculations**: Server time is authoritative
4. **Easier Debugging**: All logic in one place
5. **Backend Changes Reflect Immediately**: When you change time in DB, frontend sees it within 2 seconds

## 🧪 Testing

1. Start mining
2. Check that timer updates every 2 seconds (not every 1 second)
3. Change `miningStartTime` in backend
4. Within 2 seconds, frontend should reflect the change
5. Timer should reach 00:00:00 accurately
6. Claim button should appear when backend says `isComplete: true`

## ⚠️ Important Notes

- **No more `intervalRef.current = setInterval(..., 1000)`** - This is removed
- **Only one interval**: The 2-second polling interval
- **No frontend calculations**: Everything comes from `computed` object
- **Notification scheduling**: Still uses `remainingSeconds` to calculate future time

## Files Modified

### Backend:
- `Server/controller/userController.js` - Added `getMiningStatusWithComputed`
- `Server/routes/userMinningroutes.js` - Updated route to use new function

### Frontend (Manual Changes Needed):
- `Component/MiningScreen.tsx` - Remove local timer, use polling only

The backend is ready. Frontend needs manual updates to remove all local time calculations and use only backend-provided values.
