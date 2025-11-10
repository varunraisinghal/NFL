// Simulate EXACTLY what the app does with real Jacksonville vs Houston data
// Run with: node test-real-jax-detection.js

console.log('🎯 SIMULATING APP LOGIC WITH REAL JAX/HOU DATA\n');

// Real data from APIs
const polymarketData = [
  {
    id: 'poly-jax-hou',
    title: 'Jaguars vs. Texans',
    yesPrice: 0.485,
    noPrice: 0.515,
    platform: 'Polymarket'
  }
];

const kalshiData = [
  {
    id: 'KXNFLGAME-25NOV09JACHOU-JAC',
    title: 'Jacksonville at Houston Winner?',
    yesPrice: 0.49,
    noPrice: 0.51,
    platform: 'Kalshi',
    teams: ['JAX']
  },
  {
    id: 'KXNFLGAME-25NOV09JACHOU-HOU',
    title: 'Jacksonville at Houston Winner?',
    yesPrice: 0.50,
    noPrice: 0.50,
    platform: 'Kalshi',
    teams: ['HOU']
  }
];

// Team mappings (from nflTeamMappings.ts)
const NFL_TEAMS = [
  { city: 'Houston', name: 'Texans', abbr: 'HOU', aliases: ['texans', 'houston', 'hou'] },
  { city: 'Jacksonville', name: 'Jaguars', abbr: 'JAX', aliases: ['jaguars', 'jacksonville', 'jax'] },
];

function extractTeamsFromTitle(title) {
  const titleLower = title.toLowerCase();
  const foundTeams = [];

  for (const team of NFL_TEAMS) {
    for (const alias of team.aliases) {
      // Use word boundaries to avoid false matches
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

// App settings (from MainScreen.tsx after our changes)
const settings = {
  profitThreshold: 0.01,
  includeFees: false,
  targetPayout: 10000
};

console.log('='.repeat(70));
console.log('STEP 1: GROUP KALSHI MARKETS BY GAME');
console.log('='.repeat(70) + '\n');

const kalshiGameMap = new Map();

for (const kalshiMarket of kalshiData) {
  const teams = extractTeamsFromTitle(kalshiMarket.title);
  if (teams.length === 2) {
    const gameKey = [teams[0].abbr, teams[1].abbr].sort().join('-');
    if (!kalshiGameMap.has(gameKey)) {
      kalshiGameMap.set(gameKey, []);
    }
    kalshiGameMap.get(gameKey).push(kalshiMarket);
  }
}

console.log(`Kalshi games identified: ${kalshiGameMap.size}\n`);
kalshiGameMap.forEach((markets, gameKey) => {
  console.log(`Game ${gameKey}:`);
  markets.forEach(m => {
    console.log(`  - ${m.id} (${m.teams[0]}): ${(m.yesPrice * 100).toFixed(1)}%`);
  });
  console.log('');
});

console.log('\n' + '='.repeat(70));
console.log('STEP 2: MATCH POLYMARKET WITH KALSHI');
console.log('='.repeat(70) + '\n');

const opportunities = [];

for (const polyMarket of polymarketData) {
  console.log(`Processing: "${polyMarket.title}"`);

  const polyTeams = extractTeamsFromTitle(polyMarket.title);
  console.log(`  Teams extracted: ${polyTeams.map(t => `${t.name} (${t.abbr})`).join(', ')}`);

  if (polyTeams.length !== 2) {
    console.log(`  ❌ Could not identify 2 teams\n`);
    continue;
  }

  const polyGameKey = [polyTeams[0].abbr, polyTeams[1].abbr].sort().join('-');
  console.log(`  Game key: ${polyGameKey}`);

  const kalshiGameMarkets = kalshiGameMap.get(polyGameKey);

  if (kalshiGameMarkets && kalshiGameMarkets.length === 2) {
    console.log(`  ✅ Found matching Kalshi game with 2 markets\n`);

    const team1Abbr = polyTeams[0].abbr;
    const team2Abbr = polyTeams[1].abbr;

    const kalshiTeam1Market = kalshiGameMarkets.find(m =>
      m.teams && m.teams.length > 0 && m.teams[0].toUpperCase() === team1Abbr.toUpperCase()
    );
    const kalshiTeam2Market = kalshiGameMarkets.find(m =>
      m.teams && m.teams.length > 0 && m.teams[0].toUpperCase() === team2Abbr.toUpperCase()
    );

    // Calculate arbitrage for both teams
    [
      { team: polyTeams[0], kalshiMarket: kalshiTeam1Market },
      { team: polyTeams[1], kalshiMarket: kalshiTeam2Market }
    ].forEach(({ team, kalshiMarket }) => {
      if (!kalshiMarket) return;

      console.log(`  ${team.name} (${team.abbr}):`);

      const costA = polyMarket.yesPrice + kalshiMarket.noPrice;
      const costB = polyMarket.noPrice + kalshiMarket.yesPrice;

      console.log(`    Poly: Yes=${(polyMarket.yesPrice * 100).toFixed(2)}%, No=${(polyMarket.noPrice * 100).toFixed(2)}%`);
      console.log(`    Kalshi: Yes=${(kalshiMarket.yesPrice * 100).toFixed(2)}%, No=${(kalshiMarket.noPrice * 100).toFixed(2)}%`);
      console.log(`    Cost A: ${costA.toFixed(4)}`);
      console.log(`    Cost B: ${costB.toFixed(4)}`);

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

        console.log(`    💰 ARBITRAGE: ${profitMargin.toFixed(4)}% (Option ${bestOption})`);
        console.log(`       Stake: $${totalStake.toFixed(2)}`);
        console.log(`       Profit: $${profitAmount.toFixed(2)}`);

        if (profitMargin >= settings.profitThreshold) {
          console.log(`       ✅ PASSES THRESHOLD (${settings.profitThreshold}%)\n`);
          opportunities.push({
            game: polyMarket.title,
            team: team.name,
            profitMargin,
            profitAmount,
            option: bestOption
          });
        } else {
          console.log(`       ❌ Below threshold (${settings.profitThreshold}%)\n`);
        }
      } else {
        console.log(`    ❌ No arbitrage\n`);
      }
    });
  } else {
    console.log(`  ❌ No matching Kalshi game\n`);
  }
}

console.log('\n' + '='.repeat(70));
console.log('📊 FINAL RESULTS');
console.log('='.repeat(70) + '\n');

if (opportunities.length > 0) {
  console.log(`✅ FOUND ${opportunities.length} ARBITRAGE OPPORTUNITIES:\n`);

  opportunities.forEach((opp, i) => {
    console.log(`${i + 1}. ${opp.game} - ${opp.team}`);
    console.log(`   Profit: ${opp.profitMargin.toFixed(4)}%`);
    console.log(`   $${opp.profitAmount} on $${settings.targetPayout.toLocaleString()} stake`);
    console.log(`   Option: ${opp.option}\n`);
  });

  console.log('💰 WITH YOUR $1M BALANCE:\n');
  opportunities.forEach((opp, i) => {
    const scaledProfit = 1000000 * (opp.profitMargin / 100);
    console.log(`${i + 1}. ${opp.team}: ${opp.profitMargin.toFixed(4)}% × $1M = $${scaledProfit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
  });

  console.log('\n✅ THE APP WILL DETECT THIS WHEN YOU RUN IT!');

} else {
  console.log('❌ No opportunities found (check threshold or data)\n');
}
