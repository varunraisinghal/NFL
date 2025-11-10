// Test NBA market fetching from both Polymarket and Kalshi

const GAMMA_API = 'https://gamma-api.polymarket.com';
const KALSHI_API = 'https://api.elections.kalshi.com/trade-api/v2';

async function testPolymarketNBA() {
  console.log('\n🏀 TESTING POLYMARKET NBA MARKETS...\n');

  try {
    // NBA tag ID should be 34 based on our exploration
    // But we need to verify the exact tag_id parameter
    const url = `${GAMMA_API}/markets?tag_id=34&sports_market_types=moneyline&active=true&closed=false&limit=20`;

    console.log(`Fetching from: ${url}\n`);

    const response = await fetch(url);
    const markets = await response.json();

    if (!Array.isArray(markets) || markets.length === 0) {
      console.log('❌ No NBA markets found with tag_id=34');
      console.log('Trying alternative approach...\n');

      // Try fetching sports list to find correct NBA tag
      const sportsResponse = await fetch(`${GAMMA_API}/sports`);
      const sports = await sportsResponse.json();
      const nba = sports.find(s => s.name === 'nba' || s.sport === 'nba');

      if (nba) {
        console.log('✅ Found NBA in sports list:');
        console.log(JSON.stringify(nba, null, 2));

        // Try with the correct tag_id
        if (nba.tag_id) {
          console.log(`\nRetrying with tag_id=${nba.tag_id}...\n`);
          const retryResponse = await fetch(
            `${GAMMA_API}/markets?tag_id=${nba.tag_id}&sports_market_types=moneyline&active=true&closed=false&limit=20`
          );
          const retryMarkets = await retryResponse.json();

          if (Array.isArray(retryMarkets) && retryMarkets.length > 0) {
            console.log(`✅ Found ${retryMarkets.length} NBA markets!\n`);
            displayMarkets(retryMarkets);
            return retryMarkets;
          }
        }
      }
    } else {
      console.log(`✅ Found ${markets.length} NBA markets!\n`);
      displayMarkets(markets);
      return markets;
    }

  } catch (error) {
    console.error('❌ Error fetching Polymarket NBA:', error.message);
  }

  return [];
}

async function testKalshiNBA() {
  console.log('\n🏀 TESTING KALSHI NBA MARKETS...\n');

  try {
    // Try KXNBAGAME series (similar to KXNFLGAME)
    const url = `${KALSHI_API}/events?series_ticker=KXNBAGAME&status=open&with_nested_markets=true&limit=20`;

    console.log(`Fetching from: ${url}\n`);

    const response = await fetch(url);
    const data = await response.json();
    const events = data.events || [];

    if (events.length === 0) {
      console.log('❌ No NBA events found with series_ticker=KXNBAGAME');
      console.log('Searching for NBA series...\n');

      // Search through series for NBA-related ones
      const seriesResponse = await fetch(`${KALSHI_API}/series?limit=100`);
      const seriesData = await seriesResponse.json();
      const allSeries = seriesData.series || [];

      const nbaSeries = allSeries.filter(s => {
        const ticker = (s.ticker || '').toUpperCase();
        const title = (s.title || '').toLowerCase();
        return ticker.includes('NBA') || title.includes('nba') || title.includes('basketball');
      });

      console.log(`Found ${nbaSeries.length} NBA-related series:\n`);
      nbaSeries.forEach(s => {
        console.log(`  ${s.ticker}: ${s.title}`);
      });

      if (nbaSeries.length > 0) {
        // Try the first one
        const firstSeries = nbaSeries[0];
        console.log(`\nTrying ${firstSeries.ticker}...\n`);

        const retryResponse = await fetch(
          `${KALSHI_API}/events?series_ticker=${firstSeries.ticker}&status=open&with_nested_markets=true&limit=20`
        );
        const retryData = await retryResponse.json();
        const retryEvents = retryData.events || [];

        if (retryEvents.length > 0) {
          console.log(`✅ Found ${retryEvents.length} NBA events!\n`);
          displayKalshiEvents(retryEvents);
          return retryEvents;
        }
      }
    } else {
      console.log(`✅ Found ${events.length} NBA events!\n`);
      displayKalshiEvents(events);
      return events;
    }

  } catch (error) {
    console.error('❌ Error fetching Kalshi NBA:', error.message);
  }

  return [];
}

function displayMarkets(markets) {
  markets.slice(0, 5).forEach((m, i) => {
    console.log(`${i + 1}. ${m.question || m.title}`);

    if (m.outcomePrices) {
      let prices;
      if (typeof m.outcomePrices === 'string') {
        prices = JSON.parse(m.outcomePrices);
      } else {
        prices = m.outcomePrices;
      }
      console.log(`   Prices: ${prices[0]} / ${prices[1]}`);
    }

    console.log(`   Volume: $${m.volumeNum || m.volume || 0}`);
    console.log('');
  });
}

function displayKalshiEvents(events) {
  events.slice(0, 5).forEach((e, i) => {
    console.log(`${i + 1}. ${e.title}`);
    console.log(`   Ticker: ${e.event_ticker}`);

    if (e.markets && e.markets.length > 0) {
      console.log(`   Markets: ${e.markets.length}`);
      e.markets.slice(0, 2).forEach(m => {
        console.log(`     - ${m.title || m.ticker}`);
        console.log(`       Price: ${m.last_price || m.yes_bid || 'N/A'}¢`);
      });
    }

    console.log('');
  });
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  NBA MARKET TESTING');
  console.log('═══════════════════════════════════════════════════════');

  const polymarketNBA = await testPolymarketNBA();
  const kalshiNBA = await testKalshiNBA();

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  SUMMARY');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log(`Polymarket NBA markets: ${polymarketNBA.length}`);
  console.log(`Kalshi NBA events: ${kalshiNBA.length}`);

  if (polymarketNBA.length > 0 && kalshiNBA.length > 0) {
    console.log('\n✅ SUCCESS! Both platforms have NBA markets.');
    console.log('NBA arbitrage detection is ready to implement!');
  } else {
    console.log('\n⚠️  One or both platforms missing NBA markets.');
    console.log('This might be expected if NBA season is not active.');
  }

  console.log('\n');
}

main().catch(console.error);
