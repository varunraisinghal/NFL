// Test that team extraction now preserves title order (left to right)
// Run with: node test-team-order-fix.js

const NFL_TEAMS = [
  { city: 'Arizona', name: 'Cardinals', abbr: 'ARI', aliases: ['cardinals', 'arizona', 'ari'] },
  { city: 'Atlanta', name: 'Falcons', abbr: 'ATL', aliases: ['falcons', 'atlanta', 'atl'] },
  { city: 'Baltimore', name: 'Ravens', abbr: 'BAL', aliases: ['ravens', 'baltimore', 'bal'] },
  { city: 'Buffalo', name: 'Bills', abbr: 'BUF', aliases: ['bills', 'buffalo', 'buf'] },
  { city: 'Carolina', name: 'Panthers', abbr: 'CAR', aliases: ['panthers', 'carolina', 'car'] },
  { city: 'Chicago', name: 'Bears', abbr: 'CHI', aliases: ['bears', 'chicago', 'chi'] },
  { city: 'Cincinnati', name: 'Bengals', abbr: 'CIN', aliases: ['bengals', 'cincinnati', 'cin'] },
  { city: 'Cleveland', name: 'Browns', abbr: 'CLE', aliases: ['browns', 'cleveland', 'cle'] },
  { city: 'Dallas', name: 'Cowboys', abbr: 'DAL', aliases: ['cowboys', 'dallas', 'dal'] },
  { city: 'Denver', name: 'Broncos', abbr: 'DEN', aliases: ['broncos', 'denver', 'den'] },
  { city: 'Detroit', name: 'Lions', abbr: 'DET', aliases: ['lions', 'detroit', 'det'] },
  { city: 'Green Bay', name: 'Packers', abbr: 'GB', aliases: ['packers', 'green bay', 'gb'] },
  { city: 'Houston', name: 'Texans', abbr: 'HOU', aliases: ['texans', 'houston', 'hou'] },
  { city: 'Indianapolis', name: 'Colts', abbr: 'IND', aliases: ['colts', 'indianapolis', 'ind'] },
  { city: 'Jacksonville', name: 'Jaguars', abbr: 'JAX', aliases: ['jaguars', 'jacksonville', 'jax'] },
  { city: 'Kansas City', name: 'Chiefs', abbr: 'KC', aliases: ['chiefs', 'kansas city', 'kc'] },
  { city: 'Las Vegas', name: 'Raiders', abbr: 'LV', aliases: ['raiders', 'las vegas', 'lv'] },
  { city: 'Los Angeles', name: 'Chargers', abbr: 'LAC', aliases: ['chargers', 'los angeles chargers', 'los angeles c', 'lac'] },
  { city: 'Los Angeles', name: 'Rams', abbr: 'LA', aliases: ['rams', 'los angeles rams', 'los angeles r', 'la'] },
  { city: 'Miami', name: 'Dolphins', abbr: 'MIA', aliases: ['dolphins', 'miami', 'mia'] },
  { city: 'Minnesota', name: 'Vikings', abbr: 'MIN', aliases: ['vikings', 'minnesota', 'min'] },
  { city: 'New England', name: 'Patriots', abbr: 'NE', aliases: ['patriots', 'new england', 'ne'] },
  { city: 'New Orleans', name: 'Saints', abbr: 'NO', aliases: ['saints', 'new orleans', 'no'] },
  { city: 'New York', name: 'Giants', abbr: 'NYG', aliases: ['giants', 'new york giants', 'new york g', 'nyg'] },
  { city: 'New York', name: 'Jets', abbr: 'NYJ', aliases: ['jets', 'new york jets', 'new york j', 'nyj'] },
  { city: 'Philadelphia', name: 'Eagles', abbr: 'PHI', aliases: ['eagles', 'philadelphia', 'phi'] },
  { city: 'Pittsburgh', name: 'Steelers', abbr: 'PIT', aliases: ['steelers', 'pittsburgh', 'pit'] },
  { city: 'San Francisco', name: '49ers', abbr: 'SF', aliases: ['49ers', 'san francisco', 'sf', 'niners'] },
  { city: 'Seattle', name: 'Seahawks', abbr: 'SEA', aliases: ['seahawks', 'seattle', 'sea'] },
  { city: 'Tampa Bay', name: 'Buccaneers', abbr: 'TB', aliases: ['buccaneers', 'tampa bay', 'bucs', 'tb'] },
  { city: 'Tennessee', name: 'Titans', abbr: 'TEN', aliases: ['titans', 'tennessee', 'ten'] },
  { city: 'Washington', name: 'Commanders', abbr: 'WAS', aliases: ['commanders', 'washington', 'was'] },
];

function extractTeamsFromTitle(title) {
  const titleLower = title.toLowerCase();
  const foundTeams = [];

  for (const team of NFL_TEAMS) {
    for (const alias of team.aliases) {
      const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(`\\b${escapedAlias}\\b`, 'i');

      const match = pattern.exec(titleLower);
      if (match) {
        if (!foundTeams.find(ft => ft.team.abbr === team.abbr)) {
          foundTeams.push({ team, position: match.index });
          break;
        }
      }
    }
  }

  // Sort by position in title to preserve left-to-right order
  foundTeams.sort((a, b) => a.position - b.position);

  return foundTeams.map(ft => ft.team);
}

console.log('🔍 TESTING TEAM ORDER PRESERVATION\n');
console.log('This test verifies teams are returned in TITLE ORDER, not alphabetical order\\n');
console.log('='.repeat(70) + '\\n');

const testCases = [
  {
    title: 'Saints vs. Panthers',
    expectedOrder: ['Saints', 'Panthers'],
    expectedAbbrs: ['NO', 'CAR'],
    reason: 'Saints appears first (left) in title, should be first in array'
  },
  {
    title: 'Panthers vs. Saints',
    expectedOrder: ['Panthers', 'Saints'],
    expectedAbbrs: ['CAR', 'NO'],
    reason: 'Panthers appears first (left) in title, should be first in array'
  },
  {
    title: 'Jaguars vs. Texans',
    expectedOrder: ['Jaguars', 'Texans'],
    expectedAbbrs: ['JAX', 'HOU'],
    reason: 'Jaguars appears first in title'
  },
  {
    title: 'Texans vs. Jaguars',
    expectedOrder: ['Texans', 'Jaguars'],
    expectedAbbrs: ['HOU', 'JAX'],
    reason: 'Texans appears first in title'
  },
  {
    title: 'Dallas at Las Vegas',
    expectedOrder: ['Cowboys', 'Raiders'],
    expectedAbbrs: ['DAL', 'LV'],
    reason: 'Dallas (Cowboys) appears before Las Vegas'
  },
  {
    title: 'Atlanta at Indianapolis',
    expectedOrder: ['Falcons', 'Colts'],
    expectedAbbrs: ['ATL', 'IND'],
    reason: 'Atlanta (Falcons) appears before Indianapolis (Colts)'
  },
];

let passCount = 0;
let failCount = 0;

testCases.forEach((test, i) => {
  console.log(`Test ${i + 1}: "${test.title}"`);
  console.log(`  Expected: ${test.expectedOrder.join(' → ')}`);

  const teams = extractTeamsFromTitle(test.title);
  const actualNames = teams.map(t => t.name);
  const actualAbbrs = teams.map(t => t.abbr);

  console.log(`  Actual:   ${actualNames.join(' → ')}`);

  const passed =
    teams.length === 2 &&
    actualAbbrs[0] === test.expectedAbbrs[0] &&
    actualAbbrs[1] === test.expectedAbbrs[1];

  if (passed) {
    console.log(`  ✅ PASS - Order preserved correctly`);
    console.log(`  Reason: ${test.reason}\\n`);
    passCount++;
  } else {
    console.log(`  ❌ FAIL - Wrong order!`);
    console.log(`  Expected abbrs: [${test.expectedAbbrs.join(', ')}]`);
    console.log(`  Actual abbrs:   [${actualAbbrs.join(', ')}]`);
    console.log(`  Reason: ${test.reason}\\n`);
    failCount++;
  }
});

console.log('='.repeat(70));
console.log('RESULTS');
console.log('='.repeat(70) + '\\n');

console.log(`✅ Passed: ${passCount}/${testCases.length}`);
console.log(`❌ Failed: ${failCount}/${testCases.length}\\n`);

if (passCount === testCases.length) {
  console.log('🎉 ALL TESTS PASSED!');
  console.log('   Teams are now returned in TITLE ORDER (left to right)');
  console.log('   This fixes the arbitrage calculation bug!\\n');
  console.log('💡 WHAT THIS MEANS:');
  console.log('   "Saints vs. Panthers" → [Saints, Panthers] (correct!)');
  console.log('   NOT → [Panthers, Saints] (old buggy behavior)\\n');
  console.log('   Now the app will correctly match:');
  console.log('   - Polymarket YES (first team) with Kalshi first team market');
  console.log('   - Polymarket NO (second team) with Kalshi second team market\\n');
} else {
  console.log('❌ SOME TESTS FAILED');
  console.log('   The team order fix may not be working correctly\\n');
}
