// src/services/kalshiAPI.ts
import { MarketData } from '../types';

// Enhanced logger
const log = (message: string, data?: any, level: 'info' | 'success' | 'error' | 'debug' = 'info') => {
  const timestamp = new Date().toLocaleTimeString();
  const prefix = `[Kalshi ${timestamp}]`;
  
  switch(level) {
    case 'success':
      console.log(`✅ ${prefix} ${message}`);
      break;
    case 'error':
      console.error(`❌ ${prefix} ${message}`);
      break;
    case 'debug':
      console.log(`🔍 ${prefix} ${message}`);
      break;
    default:
      console.log(`ℹ️ ${prefix} ${message}`);
  }
  
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
};

export class KalshiAPI {
  // Use events endpoint for NFL game moneylines
  private eventsEndpoint = 'https://api.elections.kalshi.com/trade-api/v2/events';
  private nflSeriesTicker = 'KXNFLGAME'; // NFL game events series

  async fetchAllMarkets(): Promise<MarketData[]> {
    log('🚀 Fetching NFL game events from Kalshi...', null, 'info');

    try {
      // Fetch NFL game events with nested markets
      const url = `${this.eventsEndpoint}?series_ticker=${this.nflSeriesTicker}&status=open&with_nested_markets=true&limit=100`;

      log(`Fetching from: ${url}`, null, 'debug');

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ArbitrageApp/1.0',
        }
      });

      if (!response.ok) {
        log(`Failed with status: ${response.status}`, null, 'error');
        return [];
      }

      const data = await response.json();
      const events = data.events || [];

      if (events.length === 0) {
        log('No NFL game events found', null, 'info');
        return [];
      }

      log(`Found ${events.length} NFL game events`, null, 'info');

      // Process events and extract markets
      const processedMarkets = this.processNFLEvents(events);

      log(`✅ Successfully processed ${processedMarkets.length} NFL moneyline markets`, null, 'success');

      if (processedMarkets.length > 0) {
        log('Sample markets:', processedMarkets.slice(0, 3).map(m => ({
          title: m.title,
          yesPrice: m.yesPrice,
          noPrice: m.noPrice,
        })), 'debug');
      }

      return processedMarkets;

    } catch (error) {
      log(`Error fetching NFL events: ${error}`, null, 'error');
      return [];
    }
  }
  
  // Process NFL events and extract moneyline markets
  private processNFLEvents(events: any[]): MarketData[] {
    log(`Processing ${events.length} NFL events...`, null, 'debug');

    const processedMarkets: MarketData[] = [];

    for (const event of events) {
      try {
        const eventTitle = event.title || 'Unknown Game';
        const markets = event.markets || [];

        // Log sample event structure
        if (processedMarkets.length < 2) {
          log(`Sample event:`, {
            ticker: event.event_ticker,
            title: eventTitle,
            marketsCount: markets.length,
          }, 'debug');
        }

        // Each event has 2 markets (one for each team)
        for (const market of markets) {
          // Extract team from ticker (e.g., "KXNFLGAME-25NOV16KCDEN-KC" -> KC)
          const tickerParts = market.ticker?.split('-') || [];
          const team = tickerParts[tickerParts.length - 1] || '';

          // Extract price (Kalshi uses cents: 62 = 62%)
          let yesPrice = 0.5;
          let hasValidPrice = false;

          // Try different price fields
          if (market.last_price !== undefined && market.last_price > 0 && market.last_price < 100) {
            yesPrice = market.last_price / 100;
            hasValidPrice = true;
          } else if (market.yes_bid !== undefined && market.yes_bid > 0 && market.yes_bid < 100) {
            yesPrice = market.yes_bid / 100;
            hasValidPrice = true;
          } else if (market.yes_ask !== undefined && market.yes_ask > 0 && market.yes_ask < 100) {
            yesPrice = market.yes_ask / 100;
            hasValidPrice = true;
          }

          // Skip markets without valid prices
          if (!hasValidPrice) {
            continue;
          }

          const noPrice = 1 - yesPrice;

          processedMarkets.push({
            id: market.ticker || `kalshi-${Date.now()}-${Math.random()}`,
            platform: 'Kalshi',
            title: market.title || eventTitle,
            category: 'NFL',
            teams: [team],
            yesPrice: yesPrice,
            noPrice: noPrice,
            volume: parseFloat(market.volume || 0),
            openInterest: parseFloat(market.open_interest || 0),
            url: market.ticker ? `https://kalshi.com/markets/${market.ticker}` : 'https://kalshi.com',
            lastUpdate: new Date().toISOString(),
            active: true,
            endDate: market.close_time || event.close_time,
          });
        }

      } catch (error) {
        log(`Error processing event: ${error}`, null, 'error');
      }
    }

    log(`✅ Processed ${processedMarkets.length} moneyline markets from NFL events`, null, 'success');
    return processedMarkets;
  }
}

export const kalshiAPI = new KalshiAPI();