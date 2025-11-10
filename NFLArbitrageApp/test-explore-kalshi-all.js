// Comprehensive exploration of Kalshi API
// Discover ALL available series, events, and market types

const KALSHI_API = 'https://api.elections.kalshi.com/trade-api/v2';

async function exploreExchangeStatus() {
  console.log('\n💹 KALSHI EXCHANGE STATUS...\n');

  try {
    const response = await fetch(`${KALSHI_API}/exchange/status`);
    const status = await response.json();

    console.log('Exchange Status:');
    console.log(JSON.stringify(status, null, 2));
    console.log('');
  } catch (error) {
    console.error('Error fetching exchange status:', error.message);
  }
}

async function exploreAllSeries() {
  console.log('\n📊 EXPLORING ALL SERIES (CATEGORIES)...\n');

  try {
    const response = await fetch(`${KALSHI_API}/series?limit=100`);
    const data = await response.json();
    const series = data.series || [];

    console.log(`Found ${series.length} series:\n`);

    const categorized = {
      sports: [],
      politics: [],
      economics: [],
      weather: [],
      other: []
    };

    for (const s of series) {
      const ticker = s.ticker || '';
      const title = s.title || '';
      const category = s.category || 'Unknown';

      console.log(`📁 ${ticker}`);
      console.log(`   Title: ${title}`);
      console.log(`   Category: ${category}`);
      console.log(`   Frequency: ${s.frequency || 'N/A'}`);
      console.log('');

      // Categorize
      if (ticker.includes('NFL') || ticker.includes('NBA') || ticker.includes('MLB') ||
          ticker.includes('NHL') || ticker.includes('NCAA') || ticker.includes('SPORT')) {
        categorized.sports.push(s);
      } else if (ticker.includes('PRES') || ticker.includes('CONG') || ticker.includes('ELEC') ||
                 ticker.includes('SENATE') || category.toLowerCase().includes('politics')) {
        categorized.politics.push(s);
      } else if (ticker.includes('GDP') || ticker.includes('INFL') || ticker.includes('FED') ||
                 ticker.includes('UNEMP') || category.toLowerCase().includes('econom')) {
        categorized.economics.push(s);
      } else if (ticker.includes('TEMP') || ticker.includes('CLIMATE') || ticker.includes('WEATHER')) {
        categorized.weather.push(s);
      } else {
        categorized.other.push(s);
      }
    }

    console.log('\n═══════════════════════════════════════════');
    console.log('CATEGORIZED SUMMARY:');
    console.log('═══════════════════════════════════════════\n');

    console.log(`🏈 SPORTS (${categorized.sports.length}):`);
    categorized.sports.forEach(s => console.log(`   ${s.ticker}: ${s.title}`));

    console.log(`\n🗳️  POLITICS (${categorized.politics.length}):`);
    categorized.politics.forEach(s => console.log(`   ${s.ticker}: ${s.title}`));

    console.log(`\n💰 ECONOMICS (${categorized.economics.length}):`);
    categorized.economics.forEach(s => console.log(`   ${s.ticker}: ${s.title}`));

    console.log(`\n🌡️  WEATHER (${categorized.weather.length}):`);
    categorized.weather.forEach(s => console.log(`   ${s.ticker}: ${s.title}`));

    console.log(`\n❓ OTHER (${categorized.other.length}):`);
    categorized.other.slice(0, 10).forEach(s => console.log(`   ${s.ticker}: ${s.title}`));

    return categorized;
  } catch (error) {
    console.error('Error fetching series:', error.message);
    return null;
  }
}

async function exploreSeriesDetails(seriesTicker) {
  console.log(`\n🔍 EXPLORING SERIES: ${seriesTicker}\n`);

  try {
    // Get events for this series
    const eventsResponse = await fetch(
      `${KALSHI_API}/events?series_ticker=${seriesTicker}&status=open&limit=50`
    );
    const eventsData = await eventsResponse.json();
    const events = eventsData.events || [];

    console.log(`${events.length} open events in ${seriesTicker}:\n`);

    for (const event of events.slice(0, 10)) {
      console.log(`📅 ${event.event_ticker || event.ticker}`);
      console.log(`   Title: ${event.title}`);
      console.log(`   Category: ${event.category || 'N/A'}`);
      console.log(`   Markets: ${event.markets_count || 'N/A'}`);

      // Get markets for this event
      const marketsResponse = await fetch(
        `${KALSHI_API}/events/${event.event_ticker}/markets`
      );
      const marketsData = await marketsResponse.json();
      const markets = marketsData.markets || [];

      if (markets.length > 0) {
        console.log(`   Market samples:`);
        markets.slice(0, 3).forEach(m => {
          console.log(`     - ${m.title || m.ticker}`);
          console.log(`       Ticker: ${m.ticker}`);
          console.log(`       Price: ${m.last_price || m.yes_bid || 'N/A'}¢`);
        });
      }
      console.log('');
    }

    return events;
  } catch (error) {
    console.error(`Error exploring ${seriesTicker}:`, error.message);
    return [];
  }
}

async function exploreAllMarkets() {
  console.log('\n📈 EXPLORING ALL OPEN MARKETS...\n');

  try {
    const response = await fetch(`${KALSHI_API}/markets?status=open&limit=100`);
    const data = await response.json();
    const markets = data.markets || [];

    console.log(`Found ${markets.length} open markets\n`);

    // Categorize by ticker prefix
    const prefixMap = new Map();

    for (const market of markets) {
      const ticker = market.ticker || '';
      const prefix = ticker.split('-')[0]; // e.g., "KXNFLGAME" from "KXNFLGAME-25NOV16KCDEN-KC"

      if (!prefixMap.has(prefix)) {
        prefixMap.set(prefix, {
          count: 0,
          samples: []
        });
      }

      const prefixData = prefixMap.get(prefix);
      prefixData.count++;
      if (prefixData.samples.length < 3) {
        prefixData.samples.push({
          ticker: ticker,
          title: market.title,
          price: market.last_price || market.yes_bid
        });
      }
    }

    console.log('Markets by Series Prefix:\n');

    for (const [prefix, data] of prefixMap) {
      console.log(`${prefix}: ${data.count} markets`);
      data.samples.forEach(s => {
        console.log(`   ${s.ticker}`);
        console.log(`   "${s.title}"`);
        console.log(`   Price: ${s.price}¢\n`);
      });
    }

    return prefixMap;
  } catch (error) {
    console.error('Error exploring markets:', error.message);
    return new Map();
  }
}

async function exploreSpecificCategories() {
  console.log('\n🎯 EXPLORING SPECIFIC CATEGORIES...\n');

  const interestingPrefixes = [
    'KXNFLGAME',   // NFL games
    'KXNBAGAME',   // NBA games (if exists)
    'KXMLBGAME',   // MLB games (if exists)
    'HIGHNY',      // NYC temperature
    'INXM',        // Inflation
    'GDP',         // GDP
    'FED',         // Federal Reserve
    'UNEMP',       // Unemployment
  ];

  for (const prefix of interestingPrefixes) {
    try {
      const response = await fetch(`${KALSHI_API}/markets?limit=10&ticker_contains=${prefix}`);
      const data = await response.json();
      const markets = data.markets || [];

      if (markets.length > 0) {
        console.log(`\n✅ ${prefix}: ${markets.length} markets found`);
        markets.slice(0, 3).forEach(m => {
          console.log(`   - ${m.title}`);
        });
      }
    } catch (error) {
      // Silently skip if error
    }
  }
}

async function analyzeMarketStructure() {
  console.log('\n🔬 ANALYZING MARKET STRUCTURE...\n');

  try {
    // Get a sample market to see its full structure
    const response = await fetch(`${KALSHI_API}/markets?status=open&limit=1`);
    const data = await response.json();
    const markets = data.markets || [];

    if (markets.length > 0) {
      console.log('Sample Market Structure:');
      console.log(JSON.stringify(markets[0], null, 2));
      console.log('\n');

      console.log('Available Fields:');
      console.log(Object.keys(markets[0]).join(', '));
    }
  } catch (error) {
    console.error('Error analyzing structure:', error.message);
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  KALSHI API COMPREHENSIVE EXPLORATION');
  console.log('═══════════════════════════════════════════════════════');

  // 1. Check exchange status
  await exploreExchangeStatus();

  // 2. Explore all series
  const categorized = await exploreAllSeries();

  // 3. Explore sports series in detail
  if (categorized && categorized.sports.length > 0) {
    for (const sport of categorized.sports.slice(0, 3)) {
      await exploreSeriesDetails(sport.ticker);
    }
  }

  // 4. Explore all markets
  await exploreAllMarkets();

  // 5. Analyze market structure
  await analyzeMarketStructure();

  // 6. Explore specific categories
  await exploreSpecificCategories();

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  EXPLORATION COMPLETE');
  console.log('═══════════════════════════════════════════════════════\n');
}

main().catch(console.error);
