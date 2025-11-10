// Test to find the correct endpoint and parameters for NFL spreads

async function testSportsMarketTypes() {
  console.log('🏈 Testing sports_market_types parameter values\n');
  console.log('='.repeat(60));

  const baseUrl = 'https://gamma-api.polymarket.com/markets';
  const nflTagId = '450'; // NFL tag ID

  const typesToTest = [
    'spread',
    'spreads',
    'total',
    'totals',
    'moneyline',
    'moneylines',
  ];

  for (const type of typesToTest) {
    try {
      const url = `${baseUrl}?tag_id=${nflTagId}&sports_market_types=${type}&active=true&limit=10`;
      console.log(`\nTesting: sports_market_types=${type}`);
      console.log(`URL: ${url}`);

      const response = await fetch(url);
      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        console.log(`✅ SUCCESS - Found ${data.length} markets`);
        console.log(`Sample market:`, {
          question: data[0].question,
          sportsMarketType: data[0].sportsMarketType,
          line: data[0].line,
        });
      } else {
        console.log(`⚠️ No markets found`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
}

async function testEventsEndpoint() {
  console.log('\n\n🏈 Testing /events endpoint for NFL\n');
  console.log('='.repeat(60));

  try {
    const url = 'https://gamma-api.polymarket.com/events?tag_id=450&active=true&limit=5';
    console.log(`\nURL: ${url}`);

    const response = await fetch(url);
    const events = await response.json();

    console.log(`\n✅ Found ${events.length} events`);

    if (events.length > 0) {
      const event = events[0];
      console.log(`\nSample Event:`, {
        title: event.title,
        slug: event.slug,
        marketCount: event.markets?.length || 0,
      });

      if (event.markets && event.markets.length > 0) {
        console.log(`\n📊 Markets within event:`);
        event.markets.forEach((market, i) => {
          console.log(`   ${i + 1}. ${market.groupItemTitle || market.question}`);
          console.log(`      Type: ${market.sportsMarketType}`);
          console.log(`      Line: ${market.line}`);
        });
      }
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

async function main() {
  await testSportsMarketTypes();
  await testEventsEndpoint();

  console.log('\n' + '='.repeat(60));
  console.log('✅ Test complete!\n');
}

main();
