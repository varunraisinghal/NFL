// src/types.ts
export interface MarketData {
  id: string;
  slug?: string;
  platform: 'Polymarket' | 'Kalshi';
  title: string;
  category?: string;  // Added category field
  teams: string[];
  yesPrice: number;
  noPrice: number;
  volume: number;
  liquidity?: number;
  openInterest?: number;
  url: string;
  lastUpdate: string;
  active?: boolean;  // Added active field
  sport?: string;  // Sport ID (nfl, nba, mlb, etc.)
  // Additional fields for detail view
  outcomes?: Outcome[];
  spread?: number;
  totalVolume?: number;
  endDate?: string;
}

export interface Outcome {
  name: string;
  price: number;
  impliedProbability: number;
}

export interface ArbitrageOpportunity {
  id: string;
  matchTitle: string;
  teams: string[];
  profitMargin: number;
  profitAmount: string;
  totalCost: number;
  arbOption: 'A' | 'B';
  polymarket: MarketData & {
    stake: string;
    outcome: string;
    displayPrice: number;
  };
  kalshi: MarketData & {
    stake: string;
    outcome: string;
    displayPrice: number;
  };
  totalStake: string;
  targetPayout: number;
  timestamp: string;
}

export interface Settings {
  profitThreshold: number;
  refreshInterval: number;
  notifications: boolean;
  stakeStrategy: 'equal' | 'kelly';
  targetPayout: number;
  autoRefresh: boolean;
  includeFees: boolean;
}

export interface MatchedMarket {
  polymarket: MarketData;
  kalshi: MarketData;
  teams: string[];
  matchTitle: string;
}

// Navigation types for React Navigation
export type RootStackParamList = {
  Main: undefined;
  MarketDetail: {
    polymarket: MarketData;
    kalshi: MarketData;
    matchTitle: string;
    teams: string[];
  };
  MarketList: {
    markets: MarketData[];
    platform: 'Polymarket' | 'Kalshi';
  };
  Settings: undefined;
  Debug: undefined;
};