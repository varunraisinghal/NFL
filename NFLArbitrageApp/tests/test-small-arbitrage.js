// Test small arbitrage detection with fake teams
// Run with: node test-small-arbitrage.js

console.log('🏈 TESTING SMALL ARBITRAGE OPPORTUNITIES\n');
console.log('Testing with fake teams to verify threshold detection\n');

// Fake team mappings for testing
const TEST_TEAMS = [
  { city: 'Team A City', name: 'Team A', abbr: 'TAA', aliases: ['team a', 'teama', 'taa'] },
  { city: 'Team B City', name: 'Team B', abbr: 'TBB', aliases: ['team b', 'teamb', 'tbb'] },
  { city: 'Team C City', name: 'Team C', abbr: 'TCC', aliases: ['team c', 'teamc', 'tcc'] },
  { city: 'Team D City', name: 'Team D', abbr: 'TDD', aliases: ['team d', 'teamd', 'tdd'] },
  { city: 'Jacksonville', name: 'Jaguars', abbr: 'JAX', aliases: ['jaguars', 'jacksonville', 'jax', 'jags'] },
  { city: 'Houston', name: 'Texans', abbr: 'HOU', aliases: ['texans', 'houston', 'hou'] },
];

function extractTeamsFromTitle(title, teams = TEST_TEAMS) {
  const titleLower = title.toLowerCase();
  const foundTeams = [];

  for (const team of teams) {
    for (const alias of team.aliases) {
      if (titleLower.includes(alias)) {
        if (!foundTeams.find(t => t.abbr === team.abbr)) {
          foundTeams.push(team);
          break;
        }
      }
    }
  }

  return foundTeams;
}

// Test scenarios with increasing arbitrage sizes
const testScenarios = [
  {
    name: 'TINY ARBITRAGE (0.1%)',
    polymarket: { title: 'Team A vs. Team B', yesPrice: 0.499, noPrice: 0.501 },
    kalshi: [
      { title: 'Team A City at Team B City Winner?', yesPrice: 0.500, noPrice: 0.500, teams: ['TAA'] },
      { title: 'Team A City at Team B City Winner?', yesPrice: 0.501, noPrice: 0.499, teams: ['TBB'] }
    ]
  },
  {
    name: 'SMALL ARBITRAGE (0.5%)',
    polymarket: { title: 'Team C vs. Team D', yesPrice: 0.495, noPrice: 0.505 },
    kalshi: [
      { title: 'Team C City at Team D City Winner?', yesPrice: 0.500, noPrice: 0.500, teams: ['TCC'] },
      { title: 'Team C City at Team D City Winner?', yesPrice: 0.505, noPrice: 0.495, teams: ['TDD'] }
    ]
  },
  {
    name: 'MEDIUM ARBITRAGE (1.0%)',
    polymarket: { title: 'Jaguars vs. Texans', yesPrice: 0.485, noPrice: 0.515 },
    kalshi: [
      { title: 'Jacksonville at Houston Winner?', yesPrice: 0.490, noPrice: 0.510, teams: ['JAX'] },
      { title: 'Jacksonville at Houston Winner?', yesPrice: 0.515, noPrice: 0.485, teams: ['HOU'] }
    ]
  }
];

// App settings
const settings = {
  profitThreshold: 0.01, // 0.01%
  includeFees: false,
  targetPayout: 10000
};

console.log('='.repeat(70));
console.log('APP SETTINGS');
console.log('='.repeat(70));
console.log(`Profit Threshold: ${settings.profitThreshold}%`);
console.log(`Include Fees: ${settings.includeFees}`);
console.log(`Target Payout: $${settings.targetPayout.toLocaleString()}\n`);

function analyzeScenario(scenario) {
  console.log('\n' + '='.repeat(70));
  console.log(scenario.name);
  console.log('='.repeat(70));

  const polyTeams = extractTeamsFromTitle(scenario.polymarket.title);

  if (polyTeams.length !== 2) {
    console.log(`❌ Could not extract 2 teams from: "${scenario.polymarket.title}"`);
    return;
  }

  console.log(`\nPolymarket: "${scenario.polymarket.title}"`);
  console.log(`  Yes: ${(scenario.polymarket.yesPrice * 100).toFixed(2)}%`);
  console.log(`  No:  ${(scenario.polymarket.noPrice * 100).toFixed(2)}%`);
  console.log(`  Teams found: ${polyTeams.map(t => t.name).join(', ')}`);

  const gameKey = [polyTeams[0].abbr, polyTeams[1].abbr].sort().join('-');
  console.log(`  Game Key: ${gameKey}`);

  // Group Kalshi markets
  const kalshiGameMap = new Map();
  scenario.kalshi.forEach(market => {
    const teams = extractTeamsFromTitle(market.title);
    if (teams.length === 2) {
      const key = [teams[0].abbr, teams[1].abbr].sort().join('-');
      if (!kalshiGameMap.has(key)) {
        kalshiGameMap.set(key, []);
      }
      kalshiGameMap.get(key).push(market);
    }
  });

  console.log(`\nKalshi: ${scenario.kalshi.length} markets`);
  scenario.kalshi.forEach((market, i) => {
    console.log(`  ${i + 1}. "${market.title}" (${market.teams[0]})`);
    console.log(`     Yes: ${(market.yesPrice * 100).toFixed(2)}%, No: ${(market.noPrice * 100).toFixed(2)}%`);
  });

  const kalshiGameMarkets = kalshiGameMap.get(gameKey);

  if (!kalshiGameMarkets || kalshiGameMarkets.length !== 2) {
    console.log(`\n❌ Could not match Kalshi game (found ${kalshiGameMarkets?.length || 0} markets)`);
    return;
  }

  console.log(`\n✅ Game matched! Calculating arbitrage...`);

  const opportunities = [];

  // Test both team markets
  [polyTeams[0], polyTeams[1]].forEach((team, idx) => {
    const kalshiMarket = kalshiGameMarkets.find(m =>
      m.teams && m.teams[0].toUpperCase() === team.abbr.toUpperCase()
    );

    if (!kalshiMarket) return;

    console.log(`\n  ${team.name}:`);

    // Option A: Poly Yes + Kalshi No
    const costA = scenario.polymarket.yesPrice + kalshiMarket.noPrice;
    // Option B: Poly No + Kalshi Yes
    const costB = scenario.polymarket.noPrice + kalshiMarket.yesPrice;

    console.log(`    Cost A (Poly Yes + Kalshi No): ${costA.toFixed(4)}`);
    console.log(`    Cost B (Poly No + Kalshi Yes): ${costB.toFixed(4)}`);

    let bestOption = null;
    let bestCost = 1;
    let profitMargin = 0;

    if (costA < 1) {
      bestOption = 'A';
      bestCost = costA;
      profitMargin = (1 - costA) * 100;
    }

    if (costB < 1 && costB < costA) {
      bestOption = 'B';
      bestCost = costB;
      profitMargin = (1 - costB) * 100;
    }

    if (profitMargin > 0) {
      const totalStake = bestCost * settings.targetPayout;
      const profitAmount = settings.targetPayout - totalStake;
      const passesThreshold = profitMargin >= settings.profitThreshold;

      console.log(`    💰 ARBITRAGE: ${profitMargin.toFixed(4)}% (Option ${bestOption})`);
      console.log(`       Stake: $${totalStake.toFixed(2)}`);
      console.log(`       Profit: $${profitAmount.toFixed(2)}`);
      console.log(`       ${passesThreshold ? '✅' : '❌'} ${passesThreshold ? 'PASSES' : 'BELOW'} threshold (${settings.profitThreshold}%)`);

      if (passesThreshold) {
        opportunities.push({
          team: team.name,
          profitMargin,
          profitAmount,
          option: bestOption
        });
      }
    } else {
      console.log(`    ❌ No arbitrage (both costs >= 1.0)`);
    }
  });

  return opportunities;
}

// Run all scenarios
const allOpportunities = [];

testScenarios.forEach(scenario => {
  const opportunities = analyzeScenario(scenario);
  if (opportunities && opportunities.length > 0) {
    allOpportunities.push(...opportunities.map(opp => ({
      ...opp,
      scenario: scenario.name
    })));
  }
});

console.log('\n\n' + '='.repeat(70));
console.log('📊 FINAL RESULTS');
console.log('='.repeat(70));

if (allOpportunities.length > 0) {
  console.log(`\n✅ Found ${allOpportunities.length} arbitrage opportunities above ${settings.profitThreshold}%:\n`);

  allOpportunities.sort((a, b) => b.profitMargin - a.profitMargin);

  allOpportunities.forEach((opp, i) => {
    console.log(`${i + 1}. ${opp.scenario} - ${opp.team}`);
    console.log(`   Profit: ${opp.profitMargin.toFixed(4)}% ($${opp.profitAmount.toFixed(2)} on $10k stake)`);
    console.log(`   Option: ${opp.option}\n`);
  });

  console.log('💡 WITH $1M BALANCE:\n');
  allOpportunities.forEach((opp, i) => {
    const scaledProfit = 1000000 * (opp.profitMargin / 100);
    console.log(`${i + 1}. ${opp.scenario} - ${opp.team}`);
    console.log(`   ${opp.profitMargin.toFixed(4)}% × $1M = $${scaledProfit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}\n`);
  });

} else {
  console.log(`\n❌ No arbitrage opportunities found above ${settings.profitThreshold}% threshold\n`);
}

console.log('='.repeat(70));
console.log('🔍 JACKSONVILLE/JAGUARS TEST');
console.log('='.repeat(70));

const jaxTests = [
  'Jaguars vs. Texans',
  'Jacksonville vs. Houston',
  'Jags vs. Texans',
  'Jacksonville at Houston Winner?'
];

console.log('\nTesting Jacksonville/Jaguars team extraction:\n');
jaxTests.forEach(title => {
  const teams = extractTeamsFromTitle(title);
  console.log(`"${title}"`);
  console.log(`  → ${teams.map(t => `${t.name} (${t.abbr})`).join(', ') || 'NO TEAMS FOUND'}\n`);
});

console.log('✅ Jacksonville should be recognized in all formats!\n');
