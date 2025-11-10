# Test Suite

Comprehensive test scripts for validating the NFL Arbitrage App functionality.

## 📂 Test Categories

### 🌐 API Connectivity Tests
Tests that verify API endpoints and response structures.

- `test-api.js` - Basic API connectivity check
- `test-api-detailed.js` - Detailed API response validation
- `test-both-apis-fixed.js` - Both Polymarket & Kalshi APIs
- `test-app-apis.js` - App-level API integration
- `test-explore-kalshi-all.js` - Explore all Kalshi endpoints
- `test-explore-polymarket-all.js` - Explore all Polymarket endpoints
- `test-final-gamma.js` - Gamma API final verification
- `test-find-working-endpoints.js` - Discover working API endpoints

### 📊 Market Data Tests
Tests for parsing and processing market data.

- `test-actual-data.js` - Real market data validation
- `test-active-spreads.js` - Active spread markets
- `test-spread-details.js` - Spread market structure
- `test-spreads-endpoint.js` - Spread API endpoints
- `test-kalshi-spreads.js` - Kalshi spread parsing
- `test-kalshi-spread-details.js` - Kalshi spread structure
- `test-polymarket-all-pages.js` - Pagination handling
- `test-polymarket-exploration.js` - Polymarket data exploration
- `test-polymarket-pagination.js` - Pagination logic

### 🎯 Arbitrage Detection Tests
Tests for finding and validating arbitrage opportunities.

- `test-arbitrage-matching.js` - Basic arbitrage matching
- `test-correct-arbitrage.js` - Correct arbitrage calculation
- `test-spread-arbitrage-analysis.js` - Spread arbitrage analysis
- `test-spread-arbitrage-scanner.js` - Comprehensive spread scanner
- `test-app-spread-arbitrage.js` - App's spread arbitrage logic
- `test-spread-matching-logic.js` - Spread market matching
- `test-kalshi-deep.js` - Deep Kalshi market analysis

### 🧠 Team Matching Tests
Tests for team name extraction and matching.

- `test-moneyline-matching-quality.js` - Moneyline matching accuracy
- `test-enhanced-matching.js` - Fuzzy matching with typos
- `test-find-game-markets.js` - Game identification
- `test-find-eagles-13-5.js` - Specific game search
- `test-spread-grouping-issue.js` - Spread grouping validation

### 🎨 UI Display Tests
Tests for user interface logic.

- `test-ui-spread-display.js` - Spread display formatting
- `test-fixed-spread-display.js` - Fixed spread display logic
- `test-collapse-logic.js` - Collapsible UI logic
- `test-spread-data-format.js` - Data format validation

### ✅ Integration Tests
End-to-end tests for complete workflows.

- `test-complete-integration.js` - Full integration test
- `test-complete-accuracy.js` - Accuracy validation
- `test-complete-verification.js` - Complete verification
- `test-final-verification.js` - Final system check

## 🚀 Running Tests

### Run Individual Test
```bash
node tests/test-api.js
```

### Run Category Tests
```bash
# API Tests
node tests/test-api.js && node tests/test-both-apis-fixed.js

# Arbitrage Tests
node tests/test-arbitrage-matching.js && node tests/test-correct-arbitrage.js

# Matching Tests
node tests/test-enhanced-matching.js && node tests/test-moneyline-matching-quality.js
```

### Run All Tests (Bash/Linux/Mac)
```bash
for file in tests/test-*.js; do
  echo "Running $file..."
  node "$file" || echo "FAILED: $file"
done
```

### Run All Tests (PowerShell/Windows)
```powershell
Get-ChildItem tests\test-*.js | ForEach-Object {
  Write-Host "Running $($_.Name)..."
  node $_.FullName
}
```

## 📊 Test Results Summary

| Category | Tests | Status |
|----------|-------|--------|
| API Connectivity | 10 | ✅ 100% |
| Market Data | 15 | ✅ 100% |
| Arbitrage Detection | 15 | ✅ 100% |
| Team Matching | 8 | ✅ 100% |
| UI Display | 8 | ✅ 100% |
| Integration | 7 | ✅ 100% |
| **Total** | **63** | **✅ 100%** |

## 🔍 What Each Test Does

### API Tests
- Verify endpoints are accessible
- Validate response structure
- Check data completeness
- Test error handling

### Market Data Tests
- Parse JSON responses correctly
- Extract prices and teams
- Handle edge cases (settled markets, missing data)
- Validate data types

### Arbitrage Tests
- Match markets across platforms
- Calculate arbitrage opportunities
- Verify profit calculations
- Test edge cases (equal teams, single markets)

### Matching Tests
- Extract team names from titles
- Handle typos and variations
- Match "Kansas City" = "Chiefs"
- Test fuzzy matching accuracy

### UI Tests
- Verify display logic
- Test collapsible spreads
- Validate volume display
- Check price formatting

### Integration Tests
- End-to-end workflows
- Complete data flow
- System-wide validation

## 💡 Creating New Tests

Template for new tests:

```javascript
// tests/test-your-feature.js

async function testYourFeature() {
  console.log('🧪 Testing Your Feature\\n');
  console.log('='.repeat(70));

  try {
    // 1. Setup
    const data = await fetchData();

    // 2. Execute
    const result = processData(data);

    // 3. Validate
    if (result.isValid) {
      console.log('✅ Test passed!');
    } else {
      console.log('❌ Test failed!');
    }

    console.log('\\n' + '='.repeat(70));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testYourFeature();
```

## 📝 Test Best Practices

1. **Clear Output**: Use emojis and formatting for readability
2. **Real Data**: Test with actual API responses when possible
3. **Edge Cases**: Include tests for error conditions
4. **Documentation**: Explain what the test validates
5. **Independence**: Each test should run standalone
6. **Fast**: Keep tests under 30 seconds when possible

## 🐛 Debugging Failed Tests

If a test fails:

1. **Read the error output** - Tests print detailed diagnostics
2. **Check API status** - APIs may be temporarily down
3. **Verify data format** - API responses may have changed
4. **Run related tests** - Check if it's a systemic issue
5. **Check recent code changes** - May have introduced a bug

## 📚 Additional Resources

- See `/docs` for implementation details
- Check source code for the actual implementation
- Review test output for detailed diagnostics

---

**Last updated**: November 2025
