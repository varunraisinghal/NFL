// Sport configuration system for multi-sport arbitrage detection

import { NFL_TEAMS, extractTeamsFromTitle as extractNFLTeams, isSameGame as isSameNFLGame } from '../utils/nflTeamMappings';
import { NBA_TEAMS, extractNBATeamsFromTitle, isSameNBAGame } from './nbaTeams';

export interface Team {
  city: string;
  name: string;
  abbr: string;
  aliases: string[];
  conference?: string;
  division?: string;
}

export type MatchingStrategy = 'team-based' | 'event-based' | 'player-based';

export interface SportConfig {
  id: string;
  name: string;
  emoji: string;
  polymarketSportId: number;
  kalshiSeriesTicker: string;
  teams: Team[];
  extractTeams: (title: string) => Team[];
  isSameGame: (title1: string, title2: string) => boolean;
  matchingStrategy: MatchingStrategy;
  season: {
    start: string; // MM-DD format
    end: string;
  };
  active: boolean;
}

export const SPORTS: Record<string, SportConfig> = {
  nfl: {
    id: 'nfl',
    name: 'NFL',
    emoji: '🏈',
    polymarketSportId: 10,
    kalshiSeriesTicker: 'KXNFLGAME',
    teams: NFL_TEAMS as Team[],
    extractTeams: extractNFLTeams,
    isSameGame: isSameNFLGame,
    matchingStrategy: 'team-based',
    season: {
      start: '09-01', // September
      end: '02-15',   // February (Super Bowl)
    },
    active: true,
  },

  nba: {
    id: 'nba',
    name: 'NBA',
    emoji: '🏀',
    polymarketSportId: 34,
    kalshiSeriesTicker: 'KXNBAGAME', // To be verified
    teams: NBA_TEAMS as Team[],
    extractTeams: extractNBATeamsFromTitle,
    isSameGame: isSameNBAGame,
    matchingStrategy: 'team-based',
    season: {
      start: '10-01', // October
      end: '06-30',   // June (Finals)
    },
    active: true,
  },
};

/**
 * Get all active sports
 */
export function getActiveSports(): SportConfig[] {
  return Object.values(SPORTS).filter(sport => sport.active);
}

/**
 * Get sport by ID
 */
export function getSport(sportId: string): SportConfig | undefined {
  return SPORTS[sportId];
}

/**
 * Check if a sport is currently in season
 */
export function isInSeason(sport: SportConfig): boolean {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const day = now.getDate();
  const currentDate = `${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

  const { start, end } = sport.season;

  // Handle seasons that span year boundary (e.g., NFL: Sep-Feb)
  if (start > end) {
    return currentDate >= start || currentDate <= end;
  }

  // Normal season within same year
  return currentDate >= start && currentDate <= end;
}

/**
 * Get sports currently in season
 */
export function getSportsInSeason(): SportConfig[] {
  return getActiveSports().filter(isInSeason);
}
