// Test low threshold arbitrage detection
// Run with: node test-low-threshold.js

console.log('🏈 TESTING LOW-THRESHOLD ARBITRAGE DETECTION\n');
console.log('Scenario: Jaguars vs Texans (Houston)');
console.log('  - Jags: $10,000 → $20,408.16 return (49% price)');
console.log('  - Houston YES: $10,000 → $20,000 return (50% price)');
console.log('  - Expected: 1% arbitrage\n');

// Calculate prices from returns
const jagsReturn = 20408.16;
const houstonReturn = 20000;
const stake = 10000;

const jagsPrice = stake / jagsReturn; // 0.49
const houstonPrice = stake / houstonReturn; // 0.50

console.log('='.repeat(70));
console.log('PRICE CALCULATION');
console.log('='.repeat(70));
console.log(`Jags price: ${jagsPrice.toFixed(4)} (${(jagsPrice * 100).toFixed(2)}%)`);
console.log(`Houston price: ${houstonPrice.toFixed(4)} (${(houstonPrice * 100).toFixed(2)}%)`);
console.log(`Total cost: ${(jagsPrice + houstonPrice).toFixed(4)}`);
console.log('');

// Simulate Polymarket data
const polymarketJagsHouston = {
  id: 'poly-jags-houston',
  title: 'Jaguars vs. Texans',
  yesPrice: 0.485, // Jags
  noPrice: 0.515, // Texans
  platform: 'Polymarket'
};

// Simulate Kalshi data (2 markets)
const kalshiJagsMarket = {
  id: 'KXNFLGAME-25NOV09JAXHOU-JAX',
  title: 'Jacksonville at Houston Winner?',
  yesPrice: 0.49,
  noPrice: 0.51,
  platform: 'Kalshi',
  teams: ['JAX']
};

const kalshiHoustonMarket = {
  id: 'KXNFLGAME-25NOV09JAXHOU-HOU',
  title: 'Jacksonville at Houston Winner?',
  yesPrice: 0.515,
  noPrice: 0.485,
  platform: 'Kalshi',
  teams: ['HOU']
};

console.log('='.repeat(70));
console.log('ARBITRAGE CALCULATION');
console.log('='.repeat(70));

// Settings from updated app
const settings = {
  profitThreshold: 0.01,
  includeFees: false,
  targetPayout: 10000
};

function calculateArbitrage(polyMarket, kalshiMarket, label) {
  console.log(`\n${label}:`);

  // Option A: Buy Yes on Poly, No on Kalshi
  const costA = polyMarket.yesPrice + kalshiMarket.noPrice;

  // Option B: Buy No on Poly, Yes on Kalshi
  const costB = polyMarket.noPrice + kalshiMarket.yesPrice;

  console.log(`  Polymarket: Yes=${(polyMarket.yesPrice * 100).toFixed(2)}%, No=${(polyMarket.noPrice * 100).toFixed(2)}%`);
  console.log(`  Kalshi: Yes=${(kalshiMarket.yesPrice * 100).toFixed(2)}%, No=${(kalshiMarket.noPrice * 100).toFixed(2)}%`);
  console.log(`  Cost A (Poly Yes + Kalshi No): ${costA.toFixed(4)}`);
  console.log(`  Cost B (Poly No + Kalshi Yes): ${costB.toFixed(4)}`);

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

    console.log(`  ✅ ARBITRAGE FOUND!`);
    console.log(`     Option: ${bestOption}`);
    console.log(`     Profit Margin: ${profitMargin.toFixed(2)}%`);
    console.log(`     Total Stake: $${totalStake.toFixed(2)}`);
    console.log(`     Profit Amount: $${profitAmount.toFixed(2)}`);
    console.log(`     Return: $${settings.targetPayout.toFixed(2)}`);

    if (profitMargin >= settings.profitThreshold) {
      console.log(`     🎯 PASSES THRESHOLD (${settings.profitThreshold}%)`);
      return { found: true, profitMargin, profitAmount };
    } else {
      console.log(`     ❌ Below threshold (${settings.profitThreshold}%)`);
      return { found: false, profitMargin, profitAmount };
    }
  } else {
    console.log(`  ❌ No arbitrage`);
    return { found: false, profitMargin: 0, profitAmount: 0 };
  }
}

const result1 = calculateArbitrage(polymarketJagsHouston, kalshiJagsMarket, 'Jaguars Market');
const result2 = calculateArbitrage(polymarketJagsHouston, kalshiHoustonMarket, 'Texans Market');

console.log('\n\n' + '='.repeat(70));
console.log('📊 SUMMARY');
console.log('='.repeat(70));
console.log(`\nSettings:`);
console.log(`  Profit Threshold: ${settings.profitThreshold}%`);
console.log(`  Include Fees: ${settings.includeFees}`);
console.log(`  Target Payout: $${settings.targetPayout}`);

console.log(`\nResults:`);
if (result1.found || result2.found) {
  console.log(`  ✅ Arbitrage opportunities found!`);
  if (result1.found) {
    console.log(`     Jaguars: ${result1.profitMargin.toFixed(2)}% ($${result1.profitAmount.toFixed(2)} profit)`);
  }
  if (result2.found) {
    console.log(`     Texans: ${result2.profitMargin.toFixed(2)}% ($${result2.profitAmount.toFixed(2)} profit)`);
  }
} else {
  console.log(`  ❌ No arbitrage opportunities above threshold`);
}

console.log('\n' + '='.repeat(70));
console.log('💡 WITH $1M BALANCE');
console.log('='.repeat(70));

if (result1.found || result2.found) {
  const bestResult = result1.profitMargin > result2.profitMargin ? result1 : result2;
  const scaledStake = 1000000;
  const scaledProfit = scaledStake * (bestResult.profitMargin / 100);

  console.log(`\nIf you scale up to your full $1M balance:`);
  console.log(`  Profit Margin: ${bestResult.profitMargin.toFixed(2)}%`);
  console.log(`  Expected Profit: $${scaledProfit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
  console.log(`\nNote: This assumes sufficient liquidity on both platforms!`);
}

console.log('\n✅ App will now show ALL opportunities above 0.01%!\n');
