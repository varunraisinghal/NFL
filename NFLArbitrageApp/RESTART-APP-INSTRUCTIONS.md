# How to Restart the App to See Jacksonville Arbitrage

## The Issue
All code changes are saved, but your running app has the **old code** cached.

## The Solution
**Restart the app to load the new changes:**

### Option 1: Quick Restart (Expo)
```bash
# In your terminal where the app is running:
# Press 'r' to reload
# OR press Ctrl+C to stop, then:
npm start
```

### Option 2: Force Clean Restart
```bash
# Stop the app (Ctrl+C in terminal)

# Clear cache and restart
npx expo start --clear

# Then reload on your device/simulator
```

### Option 3: Hard Reset
```bash
# Stop the app
# Clear ALL caches
rm -rf node_modules/.cache
npx expo start --clear
```

## What You Should See After Restart

The app will now show **ALL arbitrage opportunities including Jacksonville:**

```
✅ Jaguars vs. Texans - Texans
   1.50% profit = $150 on $10k stake
   = $15,000 with $1M balance

✅ Jaguars vs. Texans - Jaguars
   0.50% profit = $50 on $10k stake
   = $5,000 with $1M balance
```

## Verify Settings in App

After restart, check that you see:
- **Profit Threshold:** 0.01%
- **Include Fees:** OFF (unchecked)
- **Target Payout:** $10,000

## If Still Not Showing

1. **Check console logs** - Look for errors in the terminal
2. **Verify API fetch** - You should see:
   - "✅ Successfully fetched X NFL moneyline markets"
   - "Found X NFL game events"
3. **Check network** - Make sure APIs are accessible

## Troubleshooting

If Jacksonville still doesn't show:
1. Open browser DevTools/React Native Debugger
2. Check console for these logs:
   ```
   🔍 Looking for arbitrage opportunities...
      Polymarket: 13 moneylines
      Kalshi: XX markets (2 per game)
      Kalshi games identified: XX
   ```
3. Look for "Jacksonville" or "Jaguars" in the output
4. If found, you should see "💰 Found opportunity"

## Test Script Verification

Before running the app, verify it works:
```bash
node test-real-jax-detection.js
```

You should see:
```
✅ FOUND 2 ARBITRAGE OPPORTUNITIES:
1. Jaguars vs. Texans - Texans (1.5000%)
2. Jaguars vs. Texans - Jaguars (0.5000%)
```

If this works but app doesn't show it, the app needs a hard restart!
