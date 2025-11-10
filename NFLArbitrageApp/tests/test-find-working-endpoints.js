// Find working endpoints with actual market data
// Run with: node test-find-working-endpoints.js

console.log('🔍 SEARCHING FOR WORKING API ENDPOINTS\n');

async function tryPolymarketEndpoints() {
  console.log('='.repeat(70));
  console.log('📊 TRYING DIFFERENT POLYMARKET ENDPOINTS');
  console.log('='.repeat(70));

  const attempts = [
    {
      name: 'CLOB API - Only accepting orders',
      url: 'https://clob.polymarket.com/markets?accepting_orders=true&limit=100',
    },
    {
      name: 'CLOB API - Active + current year',
      url: 'https://clob.polymarket.com/markets?active=true&limit=100',
    },
    {
      name: 'Gamma API - Sports',
      url: 'https://gamma-api.polymarket.com/sports',
    },
    {
      name: 'Gamma API - Markets',
      url: 'https://gamma-api.polymarket.com/markets',
    },
    {
      name: 'Strapi CMS - Events',
      url: 'https://strapi-matic.poly.market/markets?_limit=100&_sort=volume:desc&active=true&closed=false',
    },
  ];

  for (const attempt of attempts) {
    console.log(`\n🔍 Trying: ${attempt.name}`);
    console.log(`   URL: ${attempt.url}`);

    try {
      const response = await fetch(attempt.url);
      console.log(`   Status: ${response.status}`);

      if (response.ok) {
        const data = await response.json();

        // Analyze structure
        if (Array.isArray(data)) {
          console.log(`   ✅ Got array with ${data.length} items`);

          if (data.length > 0) {
            // Check if markets are accepting orders
            const accepting = data.filter(m => m.accepting_orders === true || m.accepting_orders === undefined);
            console.log(`   📊 Markets accepting orders: ${accepting.length}`);

            if (accepting.length > 0) {
              console.log(`\n   🎉 FOUND WORKING ENDPOINT!`);
              console.log(`   Sample market:`);
              console.log(`      Question: ${accepting[0].question || accepting[0].title}`);
              console.log(`      Accepting Orders: ${accepting[0].accepting_orders}`);
              console.log(`      Closed: ${accepting[0].closed}`);
              console.log(`      End Date: ${accepting[0].end_date_iso || accepting[0].endDate}`);
              return { success: true, url: attempt.url, data: accepting };
            }
          }
        } else if (data.data) {
          console.log(`   ✅ Got object with data array: ${data.data.length} items`);

          const accepting = data.data.filter(m => m.accepting_orders === true || m.accepting_orders === undefined);
          console.log(`   📊 Markets accepting orders: ${accepting.length}`);

          if (accepting.length > 0) {
            console.log(`\n   🎉 FOUND WORKING ENDPOINT!`);
            console.log(`   Sample market:`);
            console.log(`      Question: ${accepting[0].question || accepting[0].title}`);
            return { success: true, url: attempt.url, data: accepting };
          }
        } else {
          console.log(`   Structure: ${Object.keys(data).join(', ')}`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  console.log('\n');
  return { success: false };
}

async function tryKalshiEndpoints() {
  console.log('='.repeat(70));
  console.log('📊 TRYING DIFFERENT KALSHI ENDPOINTS');
  console.log('='.repeat(70));

  const attempts = [
    {
      name: 'Markets - binary only',
      url: 'https://api.elections.kalshi.com/trade-api/v2/markets?status=open&limit=100&market_type=binary',
    },
    {
      name: 'Events API',
      url: 'https://api.elections.kalshi.com/trade-api/v2/events?status=open&limit=50',
    },
    {
      name: 'Series API',
      url: 'https://api.elections.kalshi.com/trade-api/v2/series?limit=50',
    },
  ];

  for (const attempt of attempts) {
    console.log(`\n🔍 Trying: ${attempt.name}`);
    console.log(`   URL: ${attempt.url}`);

    try {
      const response = await fetch(attempt.url);
      console.log(`   Status: ${response.status}`);

      if (response.ok) {
        const data = await response.json();

        if (data.markets) {
          console.log(`   ✅ Got ${data.markets.length} markets`);

          // Check for valid prices
          const withPrices = data.markets.filter(m => {
            const hasYesBid = m.yes_bid > 0 && m.yes_bid < 100;
            const hasNoBid = m.no_bid > 0 && m.no_bid < 100;
            return hasYesBid || hasNoBid;
          });

          console.log(`   💰 Markets with valid bid prices: ${withPrices.length}`);

          if (withPrices.length > 0) {
            console.log(`\n   🎉 FOUND MARKETS WITH PRICES!`);
            console.log(`   Sample market:`);
            const sample = withPrices[0];
            console.log(`      Title: ${sample.title}`);
            console.log(`      Ticker: ${sample.ticker}`);
            console.log(`      Yes Bid: ${sample.yes_bid}, Yes Ask: ${sample.yes_ask}`);
            console.log(`      No Bid: ${sample.no_bid}, No Ask: ${sample.no_ask}`);
            return { success: true, url: attempt.url, data: withPrices };
          }
        } else if (data.events) {
          console.log(`   ✅ Got ${data.events.length} events`);
          console.log(`   Sample event: ${data.events[0].title}`);
        } else if (data.series) {
          console.log(`   ✅ Got ${data.series.length} series`);
        } else {
          console.log(`   Structure: ${Object.keys(data).join(', ')}`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  console.log('\n');
  return { success: false };
}

async function main() {
  const polyResult = await tryPolymarketEndpoints();
  const kalshiResult = await tryKalshiEndpoints();

  console.log('='.repeat(70));
  console.log('📊 SUMMARY');
  console.log('='.repeat(70));

  if (polyResult.success) {
    console.log(`\n✅ Polymarket: Found ${polyResult.data.length} active markets`);
    console.log(`   Endpoint: ${polyResult.url}`);
  } else {
    console.log('\n❌ Polymarket: No working endpoint found');
  }

  if (kalshiResult.success) {
    console.log(`\n✅ Kalshi: Found ${kalshiResult.data.length} markets with prices`);
    console.log(`   Endpoint: ${kalshiResult.url}`);
  } else {
    console.log('\n❌ Kalshi: No markets with valid prices found');
  }
}

main();
