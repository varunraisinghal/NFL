// Try Kalshi /events endpoint to find game winner markets
// Run with: node test-kalshi-events.js

console.log('🏈 KALSHI EVENTS ENDPOINT\n');

async function searchEvents() {
  console.log('='.repeat(70));
  console.log('Testing /events Endpoint');
  console.log('='.repeat(70) + '\n');

  try {
    // Try different series tickers
    const seriesToTry = [
      'kxnflgame',
      'KXNFLGAME',
      'nfl',
      'NFL',
      'professional-football',
    ];

    for (const series of seriesToTry) {
      console.log(`\nTrying series_ticker=${series}:`);

      const url = `https://api.elections.kalshi.com/trade-api/v2/events?series_ticker=${series}&status=open&limit=50&with_nested_markets=true`;

      try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.events && data.events.length > 0) {
          console.log(`   ✅ Found ${data.events.length} events`);

          data.events.slice(0, 3).forEach((e, i) => {
            console.log(`\n   Event ${i + 1}:`);
            console.log(`      Ticker: ${e.event_ticker}`);
            console.log(`      Title: ${e.title}`);
            console.log(`      Markets: ${e.markets?.length || 0}`);

            if (e.markets && e.markets.length > 0) {
              console.log(`\n      Markets in this event:`);
              e.markets.slice(0, 5).forEach((m, j) => {
                console.log(`         ${j + 1}. ${m.ticker}`);
                console.log(`            ${m.title}`);
                if (m.yes_bid > 0 && m.yes_bid < 100) {
                  console.log(`            Price: ${m.yes_bid}¢`);
                }
              });
            }
          });

          return data.events;
        } else {
          console.log(`   No events found`);
        }
      } catch (error) {
        console.log(`   Error: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function tryDirectEventAccess() {
  console.log('\n\n' + '='.repeat(70));
  console.log('Try Direct Event Access');
  console.log('='.repeat(70) + '\n');

  // Based on user's screenshot: kxnflgame-25nov09atlind
  const eventTickers = [
    'KXNFLGAME-25NOV09ATLIND',
    'kxnflgame-25nov09atlind',
  ];

  for (const ticker of eventTickers) {
    console.log(`\nTrying direct access: ${ticker}`);

    try {
      const url = `https://api.elections.kalshi.com/trade-api/v2/events/${ticker}?with_nested_markets=true`;
      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ SUCCESS! Event found`);
        console.log(`   Title: ${data.event?.title || 'N/A'}`);
        console.log(`   Markets: ${data.markets?.length || 0}`);

        if (data.markets && data.markets.length > 0) {
          console.log(`\n   Markets:`);
          data.markets.forEach((m, i) => {
            console.log(`   ${i + 1}. ${m.ticker}`);
            console.log(`      ${m.title}`);
            console.log(`      Yes: ${m.yes_bid || 0}¢ / ${m.yes_ask || 0}¢`);
          });
        }

        return data;
      } else {
        console.log(`   Status: ${response.status}`);
      }
    } catch (error) {
      console.log(`   Error: ${error.message}`);
    }
  }
}

async function main() {
  const events = await searchEvents();
  const directEvent = await tryDirectEventAccess();

  console.log('\n\n' + '='.repeat(70));
  console.log('🎯 CONCLUSION');
  console.log('='.repeat(70));

  if (events || directEvent) {
    console.log('\n✅ Found NFL game events!');
    console.log('\nNext: Extract markets and group by game\n');
  } else {
    console.log('\n❌ Could not find NFL game events via API');
    console.log('\nPossible reasons:');
    console.log('  1. Requires authentication');
    console.log('  2. Different series ticker needed');
    console.log('  3. Markets only accessible via website, not API\n');
  }
}

main();
