/**
 * AI-powered fallback for market matching when traditional methods fail
 *
 * USAGE: Only call this when:
 * - extractTeamsFromTitle() returns 0 or 1 teams
 * - Confidence score < 0.8 for fuzzy matches
 * - Need semantic understanding (e.g., "beats" vs "defeats")
 *
 * IMPORTANT: This is SLOW and COSTS MONEY. Use sparingly!
 */

import { NFLTeam, NFL_TEAMS } from './nflTeamMappings';

/**
 * Configuration for AI matching
 */
interface AIMatchConfig {
  enabled: boolean;  // Set to false to disable AI fallback entirely
  apiKey?: string;   // Optional: Your AI API key
  confidenceThreshold: number;  // Only use AI when confidence < this value
}

const DEFAULT_CONFIG: AIMatchConfig = {
  enabled: false,  // Disabled by default - enable only if needed
  confidenceThreshold: 0.8,
};

/**
 * Use AI to extract teams from ambiguous market titles
 * Returns null if AI is disabled or fails
 */
export async function aiExtractTeams(
  title: string,
  config: AIMatchConfig = DEFAULT_CONFIG
): Promise<NFLTeam[] | null> {
  // Return null if AI is disabled
  if (!config.enabled) {
    return null;
  }

  // TODO: Implement AI API call here
  // Example using Claude API, OpenAI, or similar

  console.warn('⚠️ AI matching is not yet implemented');
  console.warn(`   Title: "${title}"`);
  console.warn('   Falling back to empty result');

  return null;
}

/**
 * Use AI to determine if two market titles represent the same game
 */
export async function aiIsSameGame(
  title1: string,
  title2: string,
  config: AIMatchConfig = DEFAULT_CONFIG
): Promise<boolean | null> {
  if (!config.enabled) {
    return null;
  }

  // TODO: Implement AI API call here

  console.warn('⚠️ AI same-game matching is not yet implemented');
  console.warn(`   Title 1: "${title1}"`);
  console.warn(`   Title 2: "${title2}"`);
  console.warn('   Falling back to traditional matching');

  return null;
}

/**
 * Example implementation guide for AI integration:
 *
 * 1. Choose an AI provider:
 *    - Anthropic Claude API (recommended for reasoning)
 *    - OpenAI GPT-4
 *    - Local LLM (Llama, etc.)
 *
 * 2. Create a prompt like:
 *    ```
 *    Extract the two NFL teams from this market title: "${title}"
 *
 *    Available teams:
 *    ${NFL_TEAMS.map(t => `- ${t.city} ${t.name} (${t.abbr})`).join('\n')}
 *
 *    Return only the abbreviations separated by comma (e.g., "KC,DEN")
 *    If you cannot determine with high confidence, return "UNCERTAIN"
 *    ```
 *
 * 3. Parse the response and map to NFLTeam objects
 *
 * 4. Add error handling and rate limiting
 *
 * 5. Consider caching results to avoid repeated API calls
 */

/**
 * Enhanced matching with AI fallback
 * This is the main function to use in your app
 */
export interface EnhancedMatchResult {
  teams: NFLTeam[];
  confidence: number;
  usedAI: boolean;
  source: 'exact' | 'fuzzy' | 'ai' | 'failed';
}

export async function extractTeamsWithAIFallback(
  title: string,
  traditionalExtractor: (title: string) => NFLTeam[],
  config: AIMatchConfig = DEFAULT_CONFIG
): Promise<EnhancedMatchResult> {
  // Try traditional extraction first
  const teams = traditionalExtractor(title);

  // If we got exactly 2 teams, great!
  if (teams.length === 2) {
    return {
      teams,
      confidence: 1.0,  // TODO: Get actual confidence from traditional extractor
      usedAI: false,
      source: 'exact',
    };
  }

  // If we got 0 or 1 teams, try AI fallback
  if (config.enabled && (teams.length === 0 || teams.length === 1)) {
    console.warn(`⚠️ Traditional matching found ${teams.length} teams, trying AI fallback...`);

    const aiTeams = await aiExtractTeams(title, config);

    if (aiTeams && aiTeams.length === 2) {
      return {
        teams: aiTeams,
        confidence: 0.9,  // AI is pretty confident but not 100%
        usedAI: true,
        source: 'ai',
      };
    }
  }

  // Return whatever we got
  return {
    teams,
    confidence: teams.length === 2 ? 0.8 : 0.0,
    usedAI: false,
    source: teams.length === 0 ? 'failed' : 'fuzzy',
  };
}
