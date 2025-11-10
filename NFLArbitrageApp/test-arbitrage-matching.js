// Test if arbitrage detection works with the new data structures
// Run with: node test-arbitrage-matching.js

console.log('🏈 TESTING ARBITRAGE MATCHING WITH NEW NFL DATA\n');

// Simulated Polymarket data (based on actual response)
const polymarketMarkets = [
  {
    id: 'poly-1',
    title: 'Falcons vs. Colts',
    yesPrice: 0.275,
    noPrice: 0.725,
    platform: 'Polymarket'
  },
  {
    id: 'poly-2',
    title: 'Bills vs. Dolphins',
    yesPrice: 0.815,
    noPrice: 0.185,
    platform: 'Polymarket'
  }
];

// Simulated Kalshi data (based on actual response)
const kalshiMarkets = [
  {
    id: 'KXNFLGAME-25NOV09ATLIND-ATL',
    title: 'Atlanta at Indianapolis Winner?',
    yesPrice: 0.28,
    noPrice: 0.72,
    platform: 'Kalshi',
    teams: ['ATL']
  },
  {
    id: 'KXNFLGAME-25NOV09ATLIND-IND',
    title: 'Atlanta at Indianapolis Winner?',
    yesPrice: 0.73,
    noPrice: 0.27,
    platform: 'Kalshi',
    teams: ['IND']
  },
  {
    id: 'KXNFLGAME-25NOV09BUFMIA-BUF',
    title: 'Buffalo at Miami Winner?',
    yesPrice: 0.82,
    noPrice: 0.18,
    platform: 'Kalshi',
    teams: ['BUF']
  },
  {
    id: 'KXNFLGAME-25NOV09BUFMIA-MIA',
    title: 'Buffalo at Miami Winner?',
    yesPrice: 0.19,
    noPrice: 0.81,
    platform: 'Kalshi',
    teams: ['MIA']
  }
];

// Team name mappings (city to team name)
const teamMappings = {
  'atlanta': 'falcons',
  'indianapolis': 'colts',
  'buffalo': 'bills',
  'miami': 'dolphins',
};

// Current matching logic (from MainScreen.tsx)
function findArbitrageOpportunities(polyMarkets, kalshiMarkets) {
  const opportunities = [];

  console.log('🔍 Testing current matching logic:\n');

  for (const polyMarket of polyMarkets) {
    for (const kalshiMarket of kalshiMarkets) {
      const polyWords = polyMarket.title.toLowerCase().split(/\s+/);
      const kalshiWords = kalshiMarket.title.toLowerCase().split(/\s+/);

      const commonWords = ['the', 'a', 'an', 'to', 'will', 'be', 'in', 'on', 'at', 'for', 'of', 'and', 'or', 'vs', 'winner'];
      const significantPolyWords = polyWords.filter(w => w.length > 3 && !commonWords.includes(w));
      const significantKalshiWords = kalshiWords.filter(w => w.length > 3 && !commonWords.includes(w));

      const matchingWords = significantPolyWords.filter(word =>
        significantKalshiWords.some(kWord => kWord.includes(word) || word.includes(kWord))
      );

      if (matchingWords.length >= 2 ||
          (polyMarket.title.toLowerCase().includes(kalshiMarket.title.toLowerCase()) ||
           kalshiMarket.title.toLowerCase().includes(polyMarket.title.toLowerCase()))) {

        console.log(`   Match attempt: "${polyMarket.title}" vs "${kalshiMarket.title}"`);
        console.log(`   Matching words: ${matchingWords.join(', ')}`);

        // Calculate arbitrage
        const costA = polyMarket.yesPrice + kalshiMarket.noPrice;
        const costB = polyMarket.noPrice + kalshiMarket.yesPrice;

        let profitMargin = 0;
        let option = null;

        if (costA < 1) {
          profitMargin = (1 - costA) * 100;
          option = 'A';
        }

        if (costB < 1 && costB < costA) {
          profitMargin = (1 - costB) * 100;
          option = 'B';
        }

        if (profitMargin > 0) {
          console.log(`   ✅ ARBITRAGE FOUND: ${profitMargin.toFixed(2)}% profit (Option ${option})`);
          console.log(`      Cost A (Poly Yes + Kalshi No): ${costA.toFixed(3)}`);
          console.log(`      Cost B (Poly No + Kalshi Yes): ${costB.toFixed(3)}\n`);

          opportunities.push({
            polyMarket: polyMarket.title,
            kalshiMarket: kalshiMarket.title,
            profitMargin,
            option
          });
        } else {
          console.log(`   ❌ No arbitrage (costs: A=${costA.toFixed(3)}, B=${costB.toFixed(3)})\n`);
        }
      }
    }
  }

  return opportunities;
}

// Test the matching
const opportunities = findArbitrageOpportunities(polymarketMarkets, kalshiMarkets);

console.log('\n' + '='.repeat(70));
console.log('📊 RESULTS');
console.log('='.repeat(70) + '\n');

if (opportunities.length > 0) {
  console.log(`✅ Found ${opportunities.length} arbitrage opportunities:\n`);
  opportunities.forEach((opp, i) => {
    console.log(`${i + 1}. ${opp.polyMarket} ↔ ${opp.kalshiMarket}`);
    console.log(`   Profit: ${opp.profitMargin.toFixed(2)}% (Option ${opp.option})\n`);
  });
} else {
  console.log('❌ No arbitrage opportunities found');
}

console.log('\n' + '='.repeat(70));
console.log('🔍 ISSUE ANALYSIS');
console.log('='.repeat(70) + '\n');

console.log('PROBLEM: Polymarket uses team names, Kalshi uses city names');
console.log('  Polymarket: "Falcons vs. Colts"');
console.log('  Kalshi: "Atlanta at Indianapolis Winner?"');
console.log('');
console.log('SOLUTION NEEDED:');
console.log('  1. Add team/city name mapping');
console.log('  2. Normalize both titles to use same format');
console.log('  3. Match games by normalized team names');
console.log('  4. Handle Kalshi\'s 2 markets per game structure\n');
