// Test corrected arbitrage calculation (YES/NO per team)
// Run with: node test-correct-arbitrage.js

console.log('🎯 TESTING CORRECTED ARBITRAGE CALCULATION\n');
console.log('Key insight: Each Kalshi market is YES/NO for a SPECIFIC team!\n');

// Real Jacksonville vs Houston data
const polymarket = {
  title: 'Jaguars vs. Texans',
  yesPrice: 0.485, // Jaguars win
  noPrice: 0.515,  // Texans win
};

const kalshiJAX = {
  id: 'KXNFLGAME-25NOV09JACHOU-JAX',
  title: 'Jacksonville at Houston Winner?',
  yesPrice: 0.49, // Jacksonville wins
  noPrice: 0.51,  // Jacksonville loses
  teams: ['JAX']
};

const kalshiHOU = {
  id: 'KXNFLGAME-25NOV09JACHOU-HOU',
  title: 'Jacksonville at Houston Winner?',
  yesPrice: 0.50, // Houston wins
  noPrice: 0.50,  // Houston loses
  teams: ['HOU']
};

console.log('='.repeat(70));
console.log('MARKET DATA');
console.log('='.repeat(70) + '\n');

console.log('Polymarket (1 market, binary outcome):');
console.log(`  YES = Jaguars win: ${(polymarket.yesPrice * 100).toFixed(2)}%`);
console.log(`  NO = Texans win: ${(polymarket.noPrice * 100).toFixed(2)}%\n`);

console.log('Kalshi JAX Market (YES/NO for Jacksonville):');
console.log(`  YES = Jacksonville wins: ${(kalshiJAX.yesPrice * 100).toFixed(2)}%`);
console.log(`  NO = Jacksonville loses: ${(kalshiJAX.noPrice * 100).toFixed(2)}%\n`);

console.log('Kalshi HOU Market (YES/NO for Houston):');
console.log(`  YES = Houston wins: ${(kalshiHOU.yesPrice * 100).toFixed(2)}%`);
console.log(`  NO = Houston loses: ${(kalshiHOU.noPrice * 100).toFixed(2)}%\n`);

console.log('='.repeat(70));
console.log('CORRECTED ARBITRAGE CALCULATION');
console.log('='.repeat(70) + '\n');

console.log('For arbitrage, we bet on BOTH outcomes to guarantee profit:\n');

// Option A: Poly YES (Jaguars) + Kalshi HOU YES (Texans)
console.log('OPTION A: Cover both teams');
console.log('  Bet 1: Polymarket YES (Jaguars win)');
console.log(`         Cost: ${(polymarket.yesPrice * 100).toFixed(2)}¢`);
console.log('  Bet 2: Kalshi HOU market YES (Texans win)');
console.log(`         Cost: ${(kalshiHOU.yesPrice * 100).toFixed(2)}¢`);

const costA = polymarket.yesPrice + kalshiHOU.yesPrice;
console.log(`  Total Cost: ${costA.toFixed(4)} = ${(costA * 100).toFixed(2)}¢`);

if (costA < 1) {
  const profitA = (1 - costA) * 100;
  console.log(`  ✅ ARBITRAGE! Profit: ${profitA.toFixed(4)}%\n`);
} else {
  console.log(`  ❌ No arbitrage (cost >= $1)\n`);
}

// Option B: Kalshi JAX YES (Jaguars) + Poly NO (Texans)
console.log('OPTION B: Cover both teams (alternative)');
console.log('  Bet 1: Kalshi JAX market YES (Jaguars win)');
console.log(`         Cost: ${(kalshiJAX.yesPrice * 100).toFixed(2)}¢`);
console.log('  Bet 2: Polymarket NO (Texans win)');
console.log(`         Cost: ${(polymarket.noPrice * 100).toFixed(2)}¢`);

const costB = kalshiJAX.yesPrice + polymarket.noPrice;
console.log(`  Total Cost: ${costB.toFixed(4)} = ${(costB * 100).toFixed(2)}¢`);

if (costB < 1) {
  const profitB = (1 - costB) * 100;
  console.log(`  ✅ ARBITRAGE! Profit: ${profitB.toFixed(4)}%\n`);
} else {
  console.log(`  ❌ No arbitrage (cost >= $1)\n`);
}

console.log('='.repeat(70));
console.log('WHY THIS IS CORRECT');
console.log('='.repeat(70) + '\n');

console.log('Outcome 1: Jaguars win');
console.log('  - Polymarket YES pays $1 → We bet this in Option A ✅');
console.log('  - Kalshi JAX YES pays $1 → We bet this in Option B ✅');
console.log('  - Either way, we get $1 back!\n');

console.log('Outcome 2: Texans win');
console.log('  - Polymarket NO pays $1 → We bet this in Option B ✅');
console.log('  - Kalshi HOU YES pays $1 → We bet this in Option A ✅');
console.log('  - Either way, we get $1 back!\n');

console.log('='.repeat(70));
console.log('BEST OPTION');
console.log('='.repeat(70) + '\n');

const bestOption = costA < costB ? 'A' : 'B';
const bestCost = Math.min(costA, costB);
const bestProfit = (1 - bestCost) * 100;

console.log(`Best: Option ${bestOption}`);
console.log(`Cost: ${bestCost.toFixed(4)}`);
console.log(`Profit: ${bestProfit.toFixed(4)}%\n`);

console.log('With $10,000 stake:');
const stake = 10000;
const totalCost = bestCost * stake;
const profit = stake - totalCost;
console.log(`  Total cost: $${totalCost.toFixed(2)}`);
console.log(`  Profit: $${profit.toFixed(2)}\n`);

console.log('With $1,000,000 stake:');
const bigStake = 1000000;
const bigCost = bestCost * bigStake;
const bigProfit = bigStake - bigCost;
console.log(`  Total cost: $${bigCost.toLocaleString('en-US', {minimumFractionDigits: 2})}`);
console.log(`  Profit: $${bigProfit.toLocaleString('en-US', {minimumFractionDigits: 2})}\n`);

console.log('✅ This is the CORRECT way to calculate arbitrage!\n');
