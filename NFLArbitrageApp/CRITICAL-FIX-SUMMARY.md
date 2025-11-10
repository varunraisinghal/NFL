# CRITICAL BUG FIX: Team Extraction Order

## The Problem

The app was showing FALSE arbitrage opportunities by betting on the SAME team twice.

### Example:
**User reported:** "Found opportunity: Saints vs. Panthers - 37.5000% profit"

**What was happening:**
- Polymarket: "Saints vs. Panthers" → YES = Saints (31.5¢), NO = Panthers (68.5¢)
- Kalshi: Two markets (Saints: YES 31¢, Panthers: YES 70¢)
- **Bug:** `extractTeamsFromTitle("Saints vs. Panthers")` returned `[Panthers, Saints]` (alphabetical order from NFL_TEAMS array)
- **Result:** Code thought Polymarket YES = Panthers (WRONG!)
- **Calculation:** Polymarket YES (Saints 31.5¢) + Kalshi Saints YES (31¢) = 62.5¢ = "37.5% profit"
- **Reality:** This is betting on Saints winning TWICE, not arbitrage!

## The Root Cause

The `extractTeamsFromTitle()` function in `src/utils/nflTeamMappings.ts` was returning teams in the order they appeared in the `NFL_TEAMS` array (alphabetical), not the order they appeared in the title (left to right).

## The Fix

Modified `extractTeamsFromTitle()` to:
1. Track the position (`match.index`) of each team alias in the title
2. Sort teams by position before returning
3. Return teams in left-to-right order as they appear in the title

### Code Changes

**File:** `src/utils/nflTeamMappings.ts`

**Before:**
```typescript
export function extractTeamsFromTitle(title: string): NFLTeam[] {
  const titleLower = title.toLowerCase();
  const foundTeams: NFLTeam[] = [];

  for (const team of NFL_TEAMS) {
    for (const alias of team.aliases) {
      const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(`\\b${escapedAlias}\\b`, 'i');

      if (pattern.test(titleLower)) {
        if (!foundTeams.find(t => t.abbr === team.abbr)) {
          foundTeams.push(team);  // ❌ Pushes in array order
          break;
        }
      }
    }
  }

  return foundTeams;  // ❌ Returns in alphabetical order
}
```

**After:**
```typescript
export function extractTeamsFromTitle(title: string): NFLTeam[] {
  const titleLower = title.toLowerCase();
  const foundTeams: { team: NFLTeam; position: number }[] = [];  // ✅ Track position

  for (const team of NFL_TEAMS) {
    for (const alias of team.aliases) {
      const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(`\\b${escapedAlias}\\b`, 'i');

      const match = pattern.exec(titleLower);  // ✅ Use exec() to get position
      if (match) {
        if (!foundTeams.find(ft => ft.team.abbr === team.abbr)) {
          foundTeams.push({ team, position: match.index });  // ✅ Store position
          break;
        }
      }
    }
  }

  // ✅ Sort by position to preserve title order
  foundTeams.sort((a, b) => a.position - b.position);

  return foundTeams.map(ft => ft.team);  // ✅ Returns in title order
}
```

## Verification

### Test Results

**Test 1: Team Order Preservation**
```
✅ "Saints vs. Panthers" → [Saints, Panthers] (correct!)
✅ "Panthers vs. Saints" → [Panthers, Saints] (correct!)
✅ "Jaguars vs. Texans" → [Jaguars, Texans] (correct!)
✅ All 6 test cases passed
```

**Test 2: Saints vs Panthers Arbitrage**
```
OLD (buggy):
  Poly YES (Saints 31.5¢) + Kalshi Saints YES (31¢) = 62.5¢
  ❌ FALSE "arbitrage" = 37.5% profit (betting on same team twice!)

NEW (fixed):
  Option A: Poly YES (Saints 31.5¢) + Kalshi Panthers YES (70¢) = 101.5¢ (no arb)
  Option B: Kalshi Saints YES (31¢) + Poly NO (Panthers 68.5¢) = 99.5¢
  ✅ Real arbitrage = 0.5% profit (betting on BOTH outcomes!)
```

**Test 3: Jacksonville vs Texans**
```
✅ Teams extracted: Jaguars (JAX), Texans (HOU) (in correct order!)
✅ Found 2 real arbitrage opportunities:
   - Jaguars: 0.5% profit = $5,000 on $1M
   - Texans: 1.5% profit = $15,000 on $1M
```

## Impact

### Before Fix:
- ❌ Showed false arbitrage opportunities (betting on same team twice)
- ❌ Incorrect profit calculations (e.g., 37.5% when there's actually 0.5%)
- ❌ Could lead to losses if user followed the "opportunities"

### After Fix:
- ✅ Only shows real arbitrage opportunities (betting on BOTH outcomes)
- ✅ Correct profit calculations
- ✅ Teams matched correctly across platforms

## Next Steps

**To see the fix in the app:**

1. **Restart the app** to load the new code:
   ```bash
   # In your terminal where the app is running:
   # Press Ctrl+C to stop, then:
   npx expo start --clear
   ```

2. **Verify the fix:**
   - Check that Jacksonville vs Texans now shows real opportunities
   - Check that false opportunities like "Saints 37.5%" are gone
   - Verify profit threshold slider shows [0.01, 0.1, 0.5, 1.0]

3. **Test thoroughly** before using real money:
   - The fix is critical for correct arbitrage detection
   - All test scripts pass, but verify in the live app
   - Start with small stakes to verify calculations

## Files Modified

1. ✅ `src/utils/nflTeamMappings.ts` - Fixed team extraction order
2. ✅ `test-team-order-fix.js` - Verification test (6/6 passed)
3. ✅ `test-real-jax-detection.js` - Updated to use fixed function
4. ✅ `test-saints-panthers-fix.js` - Demonstrates the bug fix

## Files Already Fixed (Previous Session)

1. ✅ `src/services/polymarketAPI.ts` - NFL moneylines only
2. ✅ `src/services/kalshiAPI.ts` - NFL game events
3. ✅ `src/screens/MainScreen.tsx` - Correct arbitrage calculation logic, updated thresholds
4. ✅ All 32 NFL teams with aliases and word boundary matching

## Status

🎉 **CRITICAL BUG FIXED** - Team extraction now preserves title order

⚠️ **ACTION REQUIRED** - User must restart app to see the fix

✅ **VERIFIED** - All test scripts pass with correct calculations
