// src/services/polymarketAPI.ts
import { MarketData } from '../types';
import { SportConfig } from '../constants/sports';

// Enhanced logger with colors for terminal
const log = (message: string, data?: any, level: 'info' | 'success' | 'error' | 'debug' = 'info') => {
  const timestamp = new Date().toLocaleTimeString();
  const prefix = `[Polymarket ${timestamp}]`;

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

export class PolymarketAPI {
  // Use Gamma API with sport-specific filtering
  private gammaEndpoint = 'https://gamma-api.polymarket.com/markets';
  private sportsEndpoint = 'https://gamma-api.polymarket.com/sports';

  /**
   * Fetch markets for a specific sport
   * @param sport - Sport configuration object
   * @returns Array of market data
   */
  async fetchMarketsForSport(sport: SportConfig): Promise<MarketData[]> {
    log(`🚀 Fetching ${sport.name} moneylines from Polymarket...`, null, 'info');

    try {
      // Get tag ID for this sport
      const tagId = await this.getTagIdForSport(sport);

      if (!tagId) {
        log(`No tag ID found for ${sport.name}`, null, 'error');
        return [];
      }

      // Fetch ONLY moneylines for this sport using sports_market_types parameter
      const url = `${this.gammaEndpoint}?tag_id=${tagId}&sports_market_types=moneyline&active=true&closed=false&limit=100`;

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

      const markets = await response.json();

      // Gamma API returns array directly (not wrapped in {data: []})
      if (!Array.isArray(markets)) {
        log('Unexpected response structure from Gamma API', null, 'error');
        return [];
      }

      if (markets.length === 0) {
        log(`No ${sport.name} moneyline markets found`, null, 'info');
        return [];
      }

      const processedMarkets = this.processGammaMarkets(markets, `${sport.name} moneylines`, sport);

      log(`✅ Successfully fetched ${processedMarkets.length} ${sport.name} moneyline markets`, null, 'success');

      if (processedMarkets.length > 0) {
        log('Sample markets:', processedMarkets.slice(0, 3).map(m => ({
          title: m.title,
          yesPrice: m.yesPrice,
          noPrice: m.noPrice,
        })), 'debug');
      }

      return processedMarkets;

    } catch (error) {
      log(`Error fetching ${sport.name} moneylines: ${error}`, null, 'error');
      return [];
    }
  }

  /**
   * Get Polymarket tag ID for a sport
   * Uses cached mapping to avoid repeated API calls
   */
  private async getTagIdForSport(sport: SportConfig): Promise<string | null> {
    // Use the configured polymarketSportId
    // For now, we'll use a simple mapping based on sport ID
    // In the future, we could fetch from the /sports endpoint to get dynamic IDs

    const sportTagMapping: Record<string, string> = {
      'nfl': '450',
      'nba': '745',  // ✅ Verified - returns NBA moneylines
      'mlb': '8',
      'nhl': '35',
    };

    return sportTagMapping[sport.id] || null;
  }

  /**
   * Legacy method for backwards compatibility
   * Fetches NFL markets (default sport)
   */
  async fetchAllMarkets(): Promise<MarketData[]> {
    // Default to NFL for now to maintain backwards compatibility
    const nflSport: SportConfig = {
      id: 'nfl',
      name: 'NFL',
      emoji: '🏈',
      polymarketSportId: 10,
      kalshiSeriesTicker: 'KXNFLGAME',
      teams: [],
      extractTeams: () => [],
      isSameGame: () => false,
      matchingStrategy: 'team-based',
      season: { start: '09-01', end: '02-15' },
      active: true,
    };

    return this.fetchMarketsForSport(nflSport);
  }

  // Process Gamma API markets (different structure than CLOB)
  private processGammaMarkets(markets: any[], source: string, sport?: SportConfig): MarketData[] {
    log(`Processing ${markets.length} markets from ${source}...`, null, 'debug');

    const processedMarkets: MarketData[] = [];

    for (const market of markets) {
      try {
        // Gamma API already filters for active=true&closed=false
        // Just verify the market has essential data
        if (!market.question && !market.title) {
          continue;
        }

        // Log sample structure for debugging
        if (processedMarkets.length < 2) {
          log(`Sample Gamma market:`, {
            question: market.question,
            endDate: market.endDate,
            outcomePrices: market.outcomePrices,
            volumeNum: market.volumeNum,
            active: market.active,
            closed: market.closed,
          }, 'debug');
        }

        const title = market.question || market.title || 'Unknown Market';

        // Extract prices from Gamma API structure
        let yesPrice = 0.5, noPrice = 0.5;
        let hasPrices = false;

        // FIXED: outcomePrices is a JSON string like "[\"0.0135\", \"0.9865\"]"
        if (market.outcomePrices && typeof market.outcomePrices === 'string') {
          try {
            const parsed = JSON.parse(market.outcomePrices);
            if (Array.isArray(parsed) && parsed.length >= 2) {
              yesPrice = parseFloat(parsed[0]) || 0.5;
              noPrice = parseFloat(parsed[1]) || 0.5;
              hasPrices = true;
            }
          } catch (e) {
            // If JSON parse fails, try comma split as fallback
            const prices = market.outcomePrices.split(',').map((p: string) => parseFloat(p.trim()));
            if (prices.length >= 2 && !isNaN(prices[0]) && !isNaN(prices[1])) {
              yesPrice = prices[0];
              noPrice = prices[1];
              hasPrices = true;
            }
          }
        }

        // Fallback to other price fields if outcomePrices not available
        if (!hasPrices) {
          if (market.lastTradePrice !== undefined && market.lastTradePrice > 0) {
            yesPrice = parseFloat(market.lastTradePrice);
            noPrice = 1 - yesPrice;
            hasPrices = true;
          } else if (market.bestBid !== undefined && market.bestBid > 0) {
            yesPrice = parseFloat(market.bestBid);
            noPrice = 1 - yesPrice;
            hasPrices = true;
          } else if (market.bestAsk !== undefined && market.bestAsk > 0 && market.bestAsk < 1) {
            yesPrice = parseFloat(market.bestAsk);
            noPrice = 1 - yesPrice;
            hasPrices = true;
          }
        }

        // Skip markets with no valid prices
        if (!hasPrices) {
          continue;
        }

        // Ensure prices are in 0-1 range
        if (yesPrice > 1) yesPrice = yesPrice / 100;
        if (noPrice > 1) noPrice = noPrice / 100;

        processedMarkets.push({
          id: market.id || market.conditionId || `gamma-${Date.now()}-${Math.random()}`,
          slug: market.slug,
          platform: 'Polymarket',
          title: title,
          category: market.category || market.marketType || (sport ? sport.name : 'General'),
          teams: [],
          yesPrice: yesPrice,
          noPrice: noPrice,
          volume: parseFloat(market.volumeNum || market.volume || 0),
          liquidity: parseFloat(market.liquidityNum || market.liquidity || 0),
          url: market.slug ? `https://polymarket.com/event/${market.slug}` :
               market.id ? `https://polymarket.com/market/${market.id}` :
               'https://polymarket.com',
          lastUpdate: new Date().toISOString(),
          active: market.active !== false,
          endDate: market.endDate || market.end_date_iso,
          sport: sport?.id,
        });

      } catch (error) {
        log(`Error processing Gamma market: ${error}`, null, 'error');
      }
    }

    log(`✅ Processed ${processedMarkets.length} valid markets from Gamma API`, null, 'success');
    return processedMarkets;
  }

}

export const polymarketAPI = new PolymarketAPI();