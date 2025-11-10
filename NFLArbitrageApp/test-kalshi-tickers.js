// Debug Kalshi tickers to find the game markets
// Run with: node test-kalshi-tickers.js

console.log('🔍 KALSHI TICKER DEBUG\n');

async function debugTickers() {
  try {
    const url = 'https://api.elections.kalshi.com/trade-api/v2/markets?status=open&limit=500';
    const response = await fetch(url);
    const data = await response.json();
    const markets = data.markets || [];

    console.log(`Total markets: ${markets.length}\n`);

    // Filter for NFL
    const nflMarkets = markets.filter(m => {
      const ticker = (m.ticker || '').toLowerCase();
      const title = (m.title || '').toLowerCase();
      return ticker.includes('nfl') || title.includes('nfl') ||
             ticker.includes('atlanta') || ticker.includes('buffalo') ||
             ticker.includes('ravens') || ticker.includes('chiefs');
    });

    console.log(`NFL-related markets: ${nflMarkets.length}\n`);

    if (nflMarkets.length > 0) {
      console.log('Sample NFL tickers:\n');
      nflMarkets.slice(0, 20).forEach((m, i) => {
        console.log(`${i + 1}. Ticker: ${m.ticker}`);
        console.log(`   Title: ${m.title.substring(0, 80)}`);
        console.log(`   Event: ${m.event_ticker || 'N/A'}`);
        console.log(`   MVE legs: ${m.mve_selected_legs?.length || 0}`);
        console.log('');
      });

      // Look for patterns
      console.log('\nTicker patterns found:');
      const patterns = {
        'KXNFLGAME': 0,
        'KXMVENFL': 0,
        'KXNFL': 0,
        other: 0,
      };

      nflMarkets.forEach(m => {
        const ticker = m.ticker || '';
        if (ticker.startsWith('KXNFLGAME')) patterns['KXNFLGAME']++;
        else if (ticker.startsWith('KXMVENFL')) patterns['KXMVENFL']++;
        else if (ticker.startsWith('KXNFL')) patterns['KXNFL']++;
        else patterns.other++;
      });

      console.log(JSON.stringify(patterns, null, 2));

      // Check if any match the pattern we saw on the website
      const gamePattern = nflMarkets.filter(m => {
        const ticker = m.ticker || '';
        return ticker.match(/KXNFLGAME-\d+[A-Z]+\d+[A-Z]+-[A-Z]+/i);
      });

      console.log(`\nMarkets matching KXNFLGAME-DATE-TEAMS-TEAM pattern: ${gamePattern.length}`);

      if (gamePattern.length > 0) {
        console.log('\nMatches:');
        gamePattern.slice(0, 10).forEach((m, i) => {
          console.log(`${i + 1}. ${m.ticker}`);
          console.log(`   ${m.title}`);
        });
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugTickers();
