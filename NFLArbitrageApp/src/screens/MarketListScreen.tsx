// src/screens/MarketListScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { MarketData, GroupedGame } from '../types';
import { RootStackParamList } from '../../App';
import { extractTeamsFromTitle } from '../utils/nflTeamMappings';

type MarketListRouteProp = RouteProp<RootStackParamList, 'MarketList'>;

const MarketListScreen = () => {
  const route = useRoute<MarketListRouteProp>();
  const navigation = useNavigation();
  const { markets, platform } = route.params;

  const [searchQuery, setSearchQuery] = useState('');
  const [groupedGames, setGroupedGames] = useState<GroupedGame[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'volume' | 'price' | 'title'>('volume');
  const [selectedTab, setSelectedTab] = useState<'moneylines' | 'spreads'>('moneylines');
  const [expandedSpreads, setExpandedSpreads] = useState<Set<string>>(new Set());

  // Separate markets by type
  const moneylineMarkets = markets.filter(m => !m.marketType || m.marketType === 'moneyline');
  const spreadMarkets = markets.filter(m => m.marketType === 'spread');

  // Get unique categories
  const categories = ['All', ...new Set(markets.map(m => m.category || 'General'))];

  // Group markets by game (works for both Kalshi and Polymarket)
  const groupMarketsByGame = (marketList: MarketData[], platformName: 'Polymarket' | 'Kalshi'): GroupedGame[] => {
    const gameMap = new Map<string, MarketData[]>();

    if (platformName === 'Kalshi') {
      // Kalshi: Has 2 separate markets per game (one for each team)
      for (const market of marketList) {
        const teams = extractTeamsFromTitle(market.title);
        if (teams.length === 2) {
          const gameKey = [teams[0].abbr, teams[1].abbr].sort().join('-');
          if (!gameMap.has(gameKey)) {
            gameMap.set(gameKey, []);
          }
          gameMap.get(gameKey)!.push(market);
        }
      }
    } else {
      // Polymarket: Has 1 market per game with Yes/No outcomes
      // We'll treat it as two "virtual" markets to match Kalshi structure
      for (const market of marketList) {
        const teams = extractTeamsFromTitle(market.title);
        if (teams.length === 2) {
          const gameKey = [teams[0].abbr, teams[1].abbr].sort().join('-');
          if (!gameMap.has(gameKey)) {
            gameMap.set(gameKey, []);
          }
          gameMap.get(gameKey)!.push(market);
        }
      }
    }

    // Convert to grouped games
    const groupedGamesList: GroupedGame[] = [];
    for (const [gameKey, gameMarkets] of gameMap.entries()) {
      if (platformName === 'Kalshi' && gameMarkets.length === 2) {
        // Kalshi has 2 markets per game
        const teams = extractTeamsFromTitle(gameMarkets[0].title);
        const team1Market = gameMarkets.find(m =>
          m.teams && m.teams.length > 0 && m.teams[0].toUpperCase() === teams[0].abbr.toUpperCase()
        );
        const team2Market = gameMarkets.find(m =>
          m.teams && m.teams.length > 0 && m.teams[0].toUpperCase() === teams[1].abbr.toUpperCase()
        );

        if (team1Market && team2Market) {
          groupedGamesList.push({
            gameTitle: `${teams[0].name} vs ${teams[1].name}`,
            platform: 'Kalshi',
            team1: {
              name: teams[0].name,
              abbr: teams[0].abbr,
              yesPrice: team1Market.yesPrice,
              noPrice: team1Market.noPrice,
            },
            team2: {
              name: teams[1].name,
              abbr: teams[1].abbr,
              yesPrice: team2Market.yesPrice,
              noPrice: team2Market.noPrice,
            },
            volume: team1Market.volume + team2Market.volume,
            endDate: team1Market.endDate,
            url: team1Market.url,
          });
        }
      } else if (platformName === 'Polymarket' && gameMarkets.length >= 1) {
        // Polymarket has 1 market per game
        const market = gameMarkets[0];
        const teams = extractTeamsFromTitle(market.title);

        if (teams.length === 2) {
          groupedGamesList.push({
            gameTitle: `${teams[0].name} vs ${teams[1].name}`,
            platform: 'Polymarket',
            team1: {
              name: teams[0].name,
              abbr: teams[0].abbr,
              yesPrice: market.yesPrice,  // Yes = Team1 wins
              noPrice: market.noPrice,    // No = Team1 loses (Team2 wins)
            },
            team2: {
              name: teams[1].name,
              abbr: teams[1].abbr,
              yesPrice: market.noPrice,   // Team2 wins = No on Team1
              noPrice: market.yesPrice,   // Team2 loses = Yes on Team1
            },
            volume: market.volume,
            endDate: market.endDate,
            url: market.url,
          });
        }
      }
    }

    return groupedGamesList;
  };
  
  // Filter and sort markets
  useEffect(() => {
    // Group markets by game for both platforms (only for moneylines)
    const marketsToGroup = selectedTab === 'moneylines' ? moneylineMarkets : [];
    let grouped = groupMarketsByGame(marketsToGroup, platform);

    // Apply search filter
    if (searchQuery) {
      grouped = grouped.filter(game =>
        game.gameTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.team1.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.team2.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    grouped.sort((a, b) => {
      switch (sortBy) {
        case 'volume':
          return b.volume - a.volume;
        case 'price':
          return b.team1.yesPrice - a.team1.yesPrice;
        case 'title':
          return a.gameTitle.localeCompare(b.gameTitle);
        default:
          return 0;
      }
    });

    setGroupedGames(grouped);
  }, [searchQuery, selectedCategory, sortBy, markets, platform, selectedTab]);
  
  const handleGamePress = (game: GroupedGame) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('Game pressed:', game.gameTitle);
  };

  const getPlatformColor = () => {
    return platform === 'Polymarket' ? '#8B5CF6' : '#3B82F6';
  };

  // Group spread markets by game
  const groupSpreadsByGame = (spreads: MarketData[]) => {
    const gameMap = new Map<string, MarketData[]>();

    for (const spread of spreads) {
      if (spread.teams && spread.teams.length >= 2) {
        const gameKey = spread.teams.slice(0, 2).sort().join('-');
        if (!gameMap.has(gameKey)) {
          gameMap.set(gameKey, []);
        }
        gameMap.get(gameKey)!.push(spread);
      }
    }

    return gameMap;
  };

  // Toggle spread expansion
  const toggleSpreadExpansion = (gameKey: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedSpreads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(gameKey)) {
        newSet.delete(gameKey);
      } else {
        newSet.add(gameKey);
      }
      return newSet;
    });
  };

  // Render individual spread line
  const renderSpreadLine = (spread: MarketData, formatPrice: (n: number) => string, isMain: boolean = false) => {
    // Parse the question to determine which team is the favorite for THIS specific line
    let favoriteTeam = spread.teams[0];
    let underdogTeam = spread.teams[1];

    const questionMatch = spread.title?.match(/Spread:\s*(\w+(?:\s+\w+)*?)\s*\(/i);
    if (questionMatch) {
      const teamInQuestion = questionMatch[1].trim();
      const team1Match = spread.teams[0].toLowerCase().includes(teamInQuestion.toLowerCase()) ||
                        teamInQuestion.toLowerCase().includes(spread.teams[0].toLowerCase());
      const team2Match = spread.teams[1].toLowerCase().includes(teamInQuestion.toLowerCase()) ||
                        teamInQuestion.toLowerCase().includes(spread.teams[1].toLowerCase());

      if (team1Match) {
        favoriteTeam = spread.teams[0];
        underdogTeam = spread.teams[1];
      } else if (team2Match) {
        favoriteTeam = spread.teams[1];
        underdogTeam = spread.teams[0];
      }
    }

    const totalVolume = (spread.volume || 0) + (spread.liquidity || 0);

    return (
      <View key={spread.id} style={styles.spreadRow}>
        <View style={styles.spreadLineContainer}>
          <Text style={styles.spreadLineLabel}>
            Line {spread.line}
            {totalVolume > 0 && (
              <Text style={styles.spreadVolume}> (${totalVolume.toLocaleString()})</Text>
            )}
          </Text>
        </View>
        <View style={styles.spreadTeamsContainer}>
          <View style={styles.spreadTeamRow}>
            <Text style={styles.spreadTeamName}>{favoriteTeam} -{spread.line}</Text>
            <Text style={styles.spreadPrice}>@ {formatPrice(spread.yesPrice)}</Text>
          </View>
          <View style={styles.spreadTeamRow}>
            <Text style={styles.spreadTeamName}>{underdogTeam} +{spread.line}</Text>
            <Text style={styles.spreadPrice}>@ {formatPrice(spread.noPrice)}</Text>
          </View>
        </View>
      </View>
    );
  };

  // Render spread card with collapse/expand
  const renderSpreadCard = (gameKey: string, spreads: MarketData[]) => {
    if (spreads.length === 0) return null;

    // Get all teams involved in this game
    const allTeams = new Set<string>();
    spreads.forEach(s => s.teams.forEach(t => allTeams.add(t)));
    const teamNames = Array.from(allTeams);

    const formatPrice = (price: number) => price.toFixed(6);

    // Find the main spread (highest volume/liquidity)
    const mainSpread = spreads.reduce((max, curr) => {
      const maxMetric = (max.volume || 0) + (max.liquidity || 0);
      const currMetric = (curr.volume || 0) + (curr.liquidity || 0);
      return currMetric > maxMetric ? curr : max;
    }, spreads[0]);

    const isExpanded = expandedSpreads.has(gameKey);
    const hasMultipleSpreads = spreads.length > 1;
    const additionalCount = spreads.length - 1;

    return (
      <TouchableOpacity
        key={gameKey}
        style={[
          styles.gameCard,
          hasMultipleSpreads && styles.gameCardTappable
        ]}
        onPress={() => hasMultipleSpreads && toggleSpreadExpansion(gameKey)}
        activeOpacity={hasMultipleSpreads ? 0.7 : 1}
        disabled={!hasMultipleSpreads}
      >
        <View style={styles.gameHeader}>
          <View style={styles.gameHeaderLeft}>
            <Text style={styles.gameTitle}>{teamNames.join(' vs ')}</Text>
            {mainSpread.volume > 0 && (
              <Text style={styles.gameVolume}>
                ${(mainSpread.volume + (mainSpread.liquidity || 0)).toLocaleString()} vol
              </Text>
            )}
          </View>
          {hasMultipleSpreads && (
            <View style={styles.spreadIndicator}>
              <Text style={styles.spreadIndicatorText}>
                {isExpanded ? 'Show less' : `+${additionalCount} more ${additionalCount === 1 ? 'line' : 'lines'}`}
              </Text>
              <Text style={[styles.spreadChevron, isExpanded && styles.spreadChevronUp]}>
                ▼
              </Text>
            </View>
          )}
        </View>

        {/* Main spread (always visible) */}
        {renderSpreadLine(mainSpread, formatPrice)}

        {/* Additional spreads (shown when expanded) */}
        {isExpanded && spreads
          .filter(s => s.id !== mainSpread.id)
          .map(spread => renderSpreadLine(spread, formatPrice))
        }

        {spreads[0].endDate && (
          <Text style={styles.endDate}>
            Ends: {new Date(spreads[0].endDate).toLocaleDateString()}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  // Render unified game card with full decimal precision
  const renderGameCard = (game: GroupedGame) => {
    // Format prices with maximum precision (6 decimal places)
    const formatPrice = (price: number) => price.toFixed(6);

    return (
      <TouchableOpacity
        key={game.gameTitle}
        style={styles.gameCard}
        onPress={() => handleGamePress(game)}
        activeOpacity={0.7}
      >
        <View style={styles.gameHeader}>
          <Text style={styles.gameTitle}>{game.gameTitle}</Text>
          {game.volume > 0 && (
            <Text style={styles.gameVolume}>${game.volume.toLocaleString()} vol</Text>
          )}
        </View>

        {/* Team 1 */}
        <View style={styles.teamRow}>
          <View style={styles.teamInfo}>
            <Text style={styles.teamName}>{game.team1.name}</Text>
          </View>
          <View style={styles.pricesRow}>
            <View style={styles.priceBox}>
              <Text style={styles.priceLabel}>YES</Text>
              <Text style={styles.yesPrice}>{formatPrice(game.team1.yesPrice)}</Text>
            </View>
            <View style={styles.priceBox}>
              <Text style={styles.priceLabel}>NO</Text>
              <Text style={styles.noPrice}>{formatPrice(game.team1.noPrice)}</Text>
            </View>
          </View>
        </View>

        {/* Team 2 */}
        <View style={styles.teamRow}>
          <View style={styles.teamInfo}>
            <Text style={styles.teamName}>{game.team2.name}</Text>
          </View>
          <View style={styles.pricesRow}>
            <View style={styles.priceBox}>
              <Text style={styles.priceLabel}>YES</Text>
              <Text style={styles.yesPrice}>{formatPrice(game.team2.yesPrice)}</Text>
            </View>
            <View style={styles.priceBox}>
              <Text style={styles.priceLabel}>NO</Text>
              <Text style={styles.noPrice}>{formatPrice(game.team2.noPrice)}</Text>
            </View>
          </View>
        </View>

        {game.endDate && (
          <Text style={styles.endDate}>
            Ends: {new Date(game.endDate).toLocaleDateString()}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={platform === 'Polymarket' ? ['#8B5CF6', '#7C3AED'] : ['#3B82F6', '#2563EB']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>{platform} Markets</Text>
        <Text style={styles.headerSubtitle}>
          {selectedTab === 'moneylines' ? groupedGames.length : spreadMarkets.length} markets
        </Text>
      </LinearGradient>

      {/* Tab Selector - Show for both platforms if spreads are available */}
      {(spreadMarkets.length > 0) && (
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              selectedTab === 'moneylines' && styles.tabActive,
              selectedTab === 'moneylines' && platform === 'Kalshi' && { backgroundColor: '#3B82F6' }
            ]}
            onPress={() => setSelectedTab('moneylines')}
          >
            <Text style={[styles.tabText, selectedTab === 'moneylines' && styles.tabTextActive]}>
              Moneylines
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              selectedTab === 'spreads' && styles.tabActive,
              selectedTab === 'spreads' && platform === 'Kalshi' && { backgroundColor: '#3B82F6' }
            ]}
            onPress={() => setSelectedTab('spreads')}
          >
            <Text style={[styles.tabText, selectedTab === 'spreads' && styles.tabTextActive]}>
              Spreads
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.controls}>
        {/* Search Bar */}
        <TextInput
          style={styles.searchBar}
          placeholder="Search markets..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        
        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
        >
          {categories.slice(0, 10).map(category => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                selectedCategory === category && styles.categoryChipActive
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.categoryChipText,
                selectedCategory === category && styles.categoryChipTextActive
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        {/* Sort Options */}
        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>Sort by:</Text>
          <View style={styles.sortButtons}>
            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'volume' && styles.sortButtonActive]}
              onPress={() => setSortBy('volume')}
            >
              <Text style={styles.sortButtonText}>Volume</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'price' && styles.sortButtonActive]}
              onPress={() => setSortBy('price')}
            >
              <Text style={styles.sortButtonText}>Price</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'title' && styles.sortButtonActive]}
              onPress={() => setSortBy('title')}
            >
              <Text style={styles.sortButtonText}>Name</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      <ScrollView
        style={styles.marketList}
        contentContainerStyle={styles.marketListContent}
        showsVerticalScrollIndicator={false}
      >
        {selectedTab === 'moneylines' ? (
          // Render moneylines
          groupedGames.length > 0 ? (
            groupedGames.map(game => renderGameCard(game))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No moneyline markets found
              </Text>
            </View>
          )
        ) : (
          // Render spreads
          (() => {
            let groupedSpreads = groupSpreadsByGame(spreadMarkets);

            // Apply search filter
            if (searchQuery) {
              const filtered = new Map<string, MarketData[]>();
              for (const [gameKey, spreads] of groupedSpreads.entries()) {
                const teamNames = Array.from(new Set<string>(spreads.flatMap(s => s.teams)));
                const matchesSearch = teamNames.some(team =>
                  team.toLowerCase().includes(searchQuery.toLowerCase())
                );
                if (matchesSearch) {
                  filtered.set(gameKey, spreads);
                }
              }
              groupedSpreads = filtered;
            }

            // Convert to array for sorting
            let spreadsArray = Array.from(groupedSpreads.entries());

            // Apply sorting
            spreadsArray.sort((a, b) => {
              const [keyA, spreadsA] = a;
              const [keyB, spreadsB] = b;

              switch (sortBy) {
                case 'volume':
                  const volA = Math.max(...spreadsA.map(s => (s.volume || 0) + (s.liquidity || 0)));
                  const volB = Math.max(...spreadsB.map(s => (s.volume || 0) + (s.liquidity || 0)));
                  return volB - volA;
                case 'price':
                  const priceA = Math.max(...spreadsA.map(s => s.yesPrice));
                  const priceB = Math.max(...spreadsB.map(s => s.yesPrice));
                  return priceB - priceA;
                case 'title':
                  return keyA.localeCompare(keyB);
                default:
                  return 0;
              }
            });

            return spreadsArray.length > 0 ? (
              spreadsArray.map(([gameKey, spreads]) =>
                renderSpreadCard(gameKey, spreads)
              )
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  No spread markets found
                </Text>
              </View>
            );
          })()
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 5,
  },
  controls: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#1F2937',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  searchBar: {
    backgroundColor: '#374151',
    borderRadius: 10,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 10,
  },
  categoryScroll: {
    marginBottom: 10,
    maxHeight: 40,
  },
  categoryChip: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#374151',
    borderRadius: 20,
    marginRight: 8,
    height: 35,
  },
  categoryChipActive: {
    backgroundColor: '#10B981',
  },
  categoryChipText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sortLabel: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#374151',
    borderRadius: 8,
  },
  sortButtonActive: {
    backgroundColor: '#3B82F6',
  },
  sortButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  marketList: {
    flex: 1,
  },
  marketListContent: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  // Unified game card styles (for both Kalshi and Polymarket)
  gameCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  gameCardTappable: {
    borderColor: '#4B5563',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  gameHeaderLeft: {
    flex: 1,
    marginRight: 10,
  },
  spreadIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#374151',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  spreadIndicatorText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  spreadChevron: {
    fontSize: 10,
    color: '#9CA3AF',
    marginLeft: 2,
  },
  spreadChevronUp: {
    transform: [{ rotate: '180deg' }],
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  gameVolume: {
    fontSize: 13,
    color: '#9CA3AF',
    marginLeft: 10,
  },
  teamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  pricesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  priceBox: {
    alignItems: 'center',
    backgroundColor: '#111827',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 90,
  },
  priceLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginBottom: 6,
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  yesPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#10B981',
    fontFamily: 'monospace',
  },
  noPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#EF4444',
    fontFamily: 'monospace',
  },
  endDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 12,
    paddingTop: 8,
  },
  // Tab selector styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1F2937',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 5,
    backgroundColor: '#374151',
  },
  tabActive: {
    backgroundColor: '#8B5CF6',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  // Spread display styles
  spreadRow: {
    marginBottom: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  spreadLineContainer: {
    marginBottom: 8,
  },
  spreadLineLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8B5CF6',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  spreadVolume: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'none',
  },
  spreadTeamsContainer: {
    gap: 8,
  },
  spreadTeamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  spreadTeamName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  spreadPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10B981',
    fontFamily: 'monospace',
  },
});

export default MarketListScreen;