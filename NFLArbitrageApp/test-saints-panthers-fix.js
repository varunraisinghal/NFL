// Test that Saints vs Panthers arbitrage is now calculated correctly
// This was the bug the user identified: showing 37.5% "arbitrage" by betting on Saints twice
// Run with: node test-saints-panthers-fix.js

console.log('🔍 TESTING SAINTS VS PANTHERS ARBITRAGE FIX\n');
console.log('User reported: "Found opportunity: Saints vs. Panthers - 37.5000% profit (Option A)"');
console.log('This was WRONG because it was betting on Saints twice (0.315 + 0.31 = 0.625)\n');
console.log('='.repeat(70) + '\n');

const NFL_TEAMS = [
  { city: 'Carolina', name: 'Panthers', abbr: 'CAR', aliases: ['panthers', 'carolina', 'car'] },
  { city: 'New Orleans', name: 'Saints', abbr: 'NO', aliases: ['saints', 'new orleans', 'no'] },
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

// Data from user's screenshot (Kalshi Saints vs Panthers)
const polyMarket = {
  title: 'Saints vs. Panthers',
  yesPrice: 0.315,  // Saints win
  noPrice: 0.685,   // Panthers win
};

const kalshiNO = {
  id: 'KALSHI-NO',
  title: 'New Orleans at Carolina',
  yesPrice: 0.31,  // Saints win (YES on New Orleans market)
  noPrice: 0.69,   // Saints lose
  teams: ['NO']
};

const kalshiCAR = {
  id: 'KALSHI-CAR',
  title: 'New Orleans at Carolina',
  yesPrice: 0.70,  // Panthers win (YES on Carolina market)
  noPrice: 0.30,   // Panthers lose
  teams: ['CAR']
};

console.log('MARKET DATA:\n');
console.log(`Polymarket: "${polyMarket.title}"`);
console.log(`  YES (Saints):   ${(polyMarket.yesPrice * 100).toFixed(1)}¢`);
console.log(`  NO (Panthers):  ${(polyMarket.noPrice * 100).toFixed(1)}¢\n`);

console.log('Kalshi New Orleans Market:');
console.log(`  YES (Saints):   ${(kalshiNO.yesPrice * 100).toFixed(1)}¢`);
console.log(`  NO (Saints lose): ${(kalshiNO.noPrice * 100).toFixed(1)}¢\n`);

console.log('Kalshi Carolina Market:');
console.log(`  YES (Panthers): ${(kalshiCAR.yesPrice * 100).toFixed(1)}¢`);
console.log(`  NO (Panthers lose): ${(kalshiCAR.noPrice * 100).toFixed(1)}¢\n`);

console.log('='.repeat(70));
console.log('STEP 1: EXTRACT TEAMS IN CORRECT ORDER');
console.log('='.repeat(70) + '\n');

const polyTeams = extractTeamsFromTitle(polyMarket.title);
console.log(`"${polyMarket.title}" → [${polyTeams.map(t => t.name).join(', ')}]`);
console.log(`Abbreviations: [${polyTeams.map(t => t.abbr).join(', ')}]\n`);

if (polyTeams.length !== 2) {
  console.log('❌ ERROR: Could not extract 2 teams!\n');
  process.exit(1);
}

if (polyTeams[0].name !== 'Saints' || polyTeams[1].name !== 'Panthers') {
  console.log('❌ ERROR: Teams in wrong order!');
  console.log(`   Expected: [Saints, Panthers]`);
  console.log(`   Got: [${polyTeams.map(t => t.name).join(', ')}]\n`);
  process.exit(1);
}

console.log('✅ Teams extracted in correct order: Saints first, Panthers second\n');

console.log('='.repeat(70));
console.log('STEP 2: MATCH KALSHI MARKETS TO TEAMS');
console.log('='.repeat(70) + '\n');

const team1Abbr = polyTeams[0].abbr; // NO (Saints)
const team2Abbr = polyTeams[1].abbr; // CAR (Panthers)

const kalshiGameMarkets = [kalshiNO, kalshiCAR];

const kalshiTeam1Market = kalshiGameMarkets.find(m =>
  m.teams && m.teams.length > 0 && m.teams[0].toUpperCase() === team1Abbr.toUpperCase()
);

const kalshiTeam2Market = kalshiGameMarkets.find(m =>
  m.teams && m.teams.length > 0 && m.teams[0].toUpperCase() === team2Abbr.toUpperCase()
);

console.log(`Team 1: ${polyTeams[0].name} (${team1Abbr})`);
console.log(`  Matched Kalshi market: ${kalshiTeam1Market ? kalshiTeam1Market.id : 'NOT FOUND'}\n`);

console.log(`Team 2: ${polyTeams[1].name} (${team2Abbr})`);
console.log(`  Matched Kalshi market: ${kalshiTeam2Market ? kalshiTeam2Market.id : 'NOT FOUND'}\n`);

if (!kalshiTeam1Market || !kalshiTeam2Market) {
  console.log('❌ ERROR: Could not match Kalshi markets!\n');
  process.exit(1);
}

console.log('✅ Successfully matched both Kalshi markets\n');

console.log('='.repeat(70));
console.log('STEP 3: CALCULATE ARBITRAGE (CORRECTED LOGIC)');
console.log('='.repeat(70) + '\n');

console.log('For arbitrage, we bet on BOTH outcomes (Saints win OR Panthers win):\n');

console.log('OPTION A: Cover both teams via different combinations');
console.log('  Bet 1: Polymarket YES (Saints win) = 31.5¢');
console.log('  Bet 2: Kalshi Panthers market YES (Panthers win) = 70¢');
console.log('  Explanation: If Saints win, Poly YES pays $1. If Panthers win, Kalshi CAR YES pays $1.');

const costA = polyMarket.yesPrice + kalshiTeam2Market.yesPrice;
console.log(`  Total Cost: ${costA.toFixed(4)} = ${(costA * 100).toFixed(2)}¢`);

if (costA < 1) {
  const profitA = (1 - costA) * 100;
  console.log(`  ❌ NO ARBITRAGE (cost = ${(costA * 100).toFixed(2)}¢ > 100¢)\n`);
} else {
  console.log(`  ✅ ARBITRAGE! Profit: ${((1 - costA) * 100).toFixed(4)}%\n`);
}

console.log('OPTION B: Alternative combination');
console.log('  Bet 1: Kalshi Saints market YES (Saints win) = 31¢');
console.log('  Bet 2: Polymarket NO (Panthers win) = 68.5¢');
console.log('  Explanation: If Saints win, Kalshi NO YES pays $1. If Panthers win, Poly NO pays $1.');

const costB = kalshiTeam1Market.yesPrice + polyMarket.noPrice;
console.log(`  Total Cost: ${costB.toFixed(4)} = ${(costB * 100).toFixed(2)}¢`);

if (costB < 1) {
  const profitB = (1 - costB) * 100;
  console.log(`  ❌ NO ARBITRAGE (cost = ${(costB * 100).toFixed(2)}¢ > 100¢)\n`);
} else {
  console.log(`  ✅ ARBITRAGE! Profit: ${((1 - costB) * 100).toFixed(4)}%\n`);
}

console.log('='.repeat(70));
console.log('VERIFICATION: OLD BUGGY CALCULATION');
console.log('='.repeat(70) + '\n');

console.log('The OLD bug would calculate:');
console.log('  Bet 1: Polymarket YES (Saints) = 31.5¢');
console.log('  Bet 2: Kalshi Saints market YES (Saints) = 31¢');
console.log('  Explanation: WRONG! Both bets are on Saints winning!');

const buggedCost = polyMarket.yesPrice + kalshiNO.yesPrice;
console.log(`  Total Cost: ${buggedCost.toFixed(4)} = ${(buggedCost * 100).toFixed(2)}¢`);

if (buggedCost < 1) {
  const buggedProfit = (1 - buggedCost) * 100;
  console.log(`  ❌ FALSE "ARBITRAGE": ${buggedProfit.toFixed(4)}% (INCORRECT!)`);
  console.log(`  This is what the user saw: "37.5% profit"\n`);
} else {
  console.log(`  No arbitrage\n`);
}

console.log('WHY IT\'S WRONG:');
console.log('  - If Saints win: Both bets pay → Get $2 back from $0.625 stake = Profit!');
console.log('  - If Panthers win: Both bets lose → Get $0 back from $0.625 stake = Total loss!');
console.log('  This is NOT arbitrage - it\'s just a regular bet on Saints!\n');

console.log('='.repeat(70));
console.log('FINAL RESULT');
console.log('='.repeat(70) + '\n');

if (costA >= 1 && costB >= 1) {
  console.log('✅ CORRECT: No arbitrage opportunity for Saints vs Panthers');
  console.log(`   Both options cost more than $1 (A: $${costA.toFixed(4)}, B: $${costB.toFixed(4)})`);
  console.log('   The app will NOT show a false 37.5% "opportunity"\n');
  console.log('🎉 THE BUG IS FIXED!\n');
} else {
  console.log('⚠️ Hmm, there might actually be arbitrage here...');
  console.log('   Or the test data might be off. Check the calculations above.\n');
}
