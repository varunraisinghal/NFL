// src/screens/MainScreen.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { polymarketAPI } from '../services/polymarketAPI';
import { kalshiAPI } from '../services/kalshiAPI';
import { MarketData, ArbitrageOpportunity, RootStackParamList } from '../types';
import { extractTeamsFromTitle } from '../utils/nflTeamMappings';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type MainScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

const MainScreen = () => {
  const navigation = useNavigation<MainScreenNavigationProp>();
  
  // State for markets
  const [polymarketData, setPolymarketData] = useState<MarketData[]>([]);
  const [kalshiData, setKalshiData] = useState<MarketData[]>([]);
  const [arbitrageOpportunities, setArbitrageOpportunities] = useState<ArbitrageOpportunity[]>([]);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  // Settings
  const [settings, setSettings] = useState({
    profitThreshold: 0.01, // Show opportunities above 0.01% (almost all)
    includeFees: false, // Don't deduct fees - show raw arbitrage
    targetPayout: 10000, // Calculate profit on $10k positions
    notificationsEnabled: true, // Enable notifications
    notificationThreshold: 1.0, // Notify for opportunities above 1%
  });

  // Track notified opportunities to avoid spam
  const notifiedOpportunities = useRef<Set<string>>(new Set());

  // Request notification permissions
  useEffect(() => {
    (async () => {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('⚠️ Notification permissions not granted');
      }
    })();
  }, []);

  // Send notification for new opportunities
  const sendNotification = useCallback(async (opportunity: ArbitrageOpportunity) => {
    if (!settings.notificationsEnabled) return;
    if (opportunity.profitMargin < settings.notificationThreshold) return;
    if (notifiedOpportunities.current.has(opportunity.id)) return;

    notifiedOpportunities.current.add(opportunity.id);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💰 Arbitrage Opportunity!',
        body: `${opportunity.matchTitle}\n+${opportunity.profitMargin.toFixed(2)}% profit ($${opportunity.profitAmount})`,
        data: { opportunityId: opportunity.id },
        sound: true,
      },
      trigger: null, // Show immediately
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [settings.notificationsEnabled, settings.notificationThreshold]);

  // Fetch all markets
  const fetchAllMarkets = useCallback(async (showLoading = true) => {
    console.log('🔄 Fetching all markets...');
    if (showLoading) setIsLoading(true);

    try {
      // Fetch from both platforms in parallel
      // For both platforms, fetch moneylines AND spreads
      const [polyMoneylines, polySpreads, kalshiMoneylines, kalshiSpreads] = await Promise.all([
        polymarketAPI.fetchAllMarkets(),
        polymarketAPI.fetchSpreadsForSport({
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
        }),
        kalshiAPI.fetchAllMarkets(),
        kalshiAPI.fetchSpreadsForSport(),
      ]);

      // Combine moneylines and spreads for each platform
      const polyMarkets = [...polyMoneylines, ...polySpreads];
      const kalshiMarkets = [...kalshiMoneylines, ...kalshiSpreads];

      console.log(`📊 Fetched ${polyMoneylines.length} Polymarket moneylines, ${polySpreads.length} Polymarket spreads, ${kalshiMoneylines.length} Kalshi moneylines, ${kalshiSpreads.length} Kalshi spreads`);

      setPolymarketData(polyMarkets);
      setKalshiData(kalshiMarkets);
      
      // Find arbitrage opportunities
      const opportunities = findArbitrageOpportunities(polyMarkets, kalshiMarkets);
      setArbitrageOpportunities(opportunities);

      // Send notifications for high-value opportunities
      if (!showLoading) { // Only notify on background refreshes, not initial load
        for (const opp of opportunities) {
          await sendNotification(opp);
        }
      }

      setLastUpdate(new Date());

      console.log(`✅ Found ${opportunities.length} arbitrage opportunities`);
      
    } catch (error) {
      console.error('❌ Error fetching markets:', error);
      Alert.alert('Error', 'Failed to fetch market data. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [sendNotification]);
  
  // Find arbitrage opportunities between markets
  const findArbitrageOpportunities = (
    polyMarkets: MarketData[],
    kalshiMarkets: MarketData[]
  ): ArbitrageOpportunity[] => {
    const opportunities: ArbitrageOpportunity[] = [];

    // Separate moneylines and spreads
    const polyMoneylines = polyMarkets.filter(m => !m.marketType || m.marketType === 'moneyline');
    const polySpreads = polyMarkets.filter(m => m.marketType === 'spread');
    const kalshiMoneylines = kalshiMarkets.filter(m => !m.marketType || m.marketType === 'moneyline');
    const kalshiSpreads = kalshiMarkets.filter(m => m.marketType === 'spread');

    console.log('🔍 Looking for arbitrage opportunities...');
    console.log(`   Polymarket: ${polyMoneylines.length} moneylines, ${polySpreads.length} spreads`);
    console.log(`   Kalshi: ${kalshiMoneylines.length} moneylines, ${kalshiSpreads.length} spreads`);

    // === MONEYLINE ARBITRAGE ===
    // Group Kalshi markets by game (they have 2 markets per game)
    const kalshiGameMap = new Map<string, MarketData[]>();
    let failedExtractions = 0;

    for (const kalshiMarket of kalshiMoneylines) {
      // Extract teams from Kalshi market
      const teams = extractTeamsFromTitle(kalshiMarket.title);
      if (teams.length === 2) {
        // Create a game key from sorted team abbreviations
        const gameKey = [teams[0].abbr, teams[1].abbr].sort().join('-');

        if (!kalshiGameMap.has(gameKey)) {
          kalshiGameMap.set(gameKey, []);
        }
        kalshiGameMap.get(gameKey)!.push(kalshiMarket);
      } else {
        failedExtractions++;
        console.log(`   ⚠️ Failed to extract teams from: "${kalshiMarket.title}" (found ${teams.length} teams)`);
      }
    }

    if (failedExtractions > 0) {
      console.log(`   ⚠️ ${failedExtractions} Kalshi markets failed team extraction`);
    }

    console.log(`   Kalshi games identified: ${kalshiGameMap.size}`);

    // Match Polymarket moneylines with Kalshi games
    for (const polyMarket of polyMoneylines) {
      // Extract teams from Polymarket title
      const polyTeams = extractTeamsFromTitle(polyMarket.title);

      if (polyTeams.length !== 2) {
        continue; // Skip if we can't identify both teams
      }

      // Create game key for matching
      const polyGameKey = [polyTeams[0].abbr, polyTeams[1].abbr].sort().join('-');

      // Find matching Kalshi game
      const kalshiGameMarkets = kalshiGameMap.get(polyGameKey);

      if (kalshiGameMarkets && kalshiGameMarkets.length === 2) {
        // Polymarket: 1 market with Yes/No
        // - YES = Team1 wins, NO = Team2 wins
        //
        // Kalshi: 2 separate markets (one for each team)
        // - Market 1 (Team1): YES = Team1 wins, NO = Team1 loses
        // - Market 2 (Team2): YES = Team2 wins, NO = Team2 loses
        //
        // For arbitrage, compare SAME outcomes:
        // - Poly YES (Team1) vs Kalshi Team1 YES (Team1)
        // - Poly NO (Team2) vs Kalshi Team2 YES (Team2)

        const team1Abbr = polyTeams[0].abbr;
        const team2Abbr = polyTeams[1].abbr;

        const kalshiTeam1Market = kalshiGameMarkets.find(m =>
          m.teams && m.teams.length > 0 && m.teams[0].toUpperCase() === team1Abbr.toUpperCase()
        );
        const kalshiTeam2Market = kalshiGameMarkets.find(m =>
          m.teams && m.teams.length > 0 && m.teams[0].toUpperCase() === team2Abbr.toUpperCase()
        );

        if (kalshiTeam1Market && kalshiTeam2Market) {
          // Calculate cross-platform arbitrage
          // Option A: Poly YES (Team1) + Kalshi Team2 YES (Team2)
          const costA = polyMarket.yesPrice + kalshiTeam2Market.yesPrice;

          // Option B: Kalshi Team1 YES (Team1) + Poly NO (Team2)
          const costB = kalshiTeam1Market.yesPrice + polyMarket.noPrice;

          let bestOption: 'A' | 'B' | null = null;
          let bestCost = 1;
          let profitMargin = 0;

          if (costA < 1) {
            bestOption = 'A';
            bestCost = costA;
            profitMargin = (1 - costA) * 100;
          }

          if (costB < 1 && (bestOption === null || costB < bestCost)) {
            bestOption = 'B';
            bestCost = costB;
            profitMargin = (1 - costB) * 100;
          }

          if (settings.includeFees && profitMargin > 0) {
            profitMargin = Math.max(0, profitMargin - 0.5);
          }

          if (bestOption && profitMargin >= settings.profitThreshold) {
            const targetPayout = settings.targetPayout;
            const totalStake = bestCost * targetPayout;
            const profitAmount = (targetPayout - totalStake).toFixed(2);

            const team1Name = polyTeams[0].name;
            const team2Name = polyTeams[1].name;

            const opportunity: ArbitrageOpportunity = {
              id: `${polyMarket.id}-${kalshiTeam1Market.id}-${kalshiTeam2Market.id}`,
              matchTitle: polyMarket.title,
              teams: polyTeams.map(t => t.name),
              profitMargin: profitMargin,
              profitAmount: profitAmount,
              totalCost: bestCost,
              arbOption: bestOption,
              polymarket: bestOption === 'A' ? {
                ...polyMarket,
                stake: (polyMarket.yesPrice * targetPayout).toFixed(2),
                outcome: `${team1Name} to win`,
                displayPrice: polyMarket.yesPrice,
              } : {
                ...polyMarket,
                stake: (polyMarket.noPrice * targetPayout).toFixed(2),
                outcome: `${team2Name} to win`,
                displayPrice: polyMarket.noPrice,
              },
              kalshi: bestOption === 'A' ? {
                ...kalshiTeam2Market,
                stake: (kalshiTeam2Market.yesPrice * targetPayout).toFixed(2),
                outcome: `${team2Name} to win`,
                displayPrice: kalshiTeam2Market.yesPrice,
              } : {
                ...kalshiTeam1Market,
                stake: (kalshiTeam1Market.yesPrice * targetPayout).toFixed(2),
                outcome: `${team1Name} to win`,
                displayPrice: kalshiTeam1Market.yesPrice,
              },
              totalStake: totalStake.toFixed(2),
              targetPayout: targetPayout,
              timestamp: new Date().toISOString(),
            };

            opportunities.push(opportunity);
            console.log(`💰 Found opportunity: ${opportunity.matchTitle} - ${profitMargin.toFixed(4)}% profit (Option ${bestOption})`);
          }
        }
      }
    }

    // === SPREAD ARBITRAGE ===
    console.log('\n🔍 Looking for spread arbitrage...');

    // Group Kalshi spreads by game-line
    const kalshiSpreadMap = new Map<string, MarketData>();
    for (const kalshiSpread of kalshiSpreads) {
      if (!kalshiSpread.teams || kalshiSpread.teams.length < 2 || !kalshiSpread.line) continue;

      // Create key: "team1-team2-line" (sorted teams)
      const teams = kalshiSpread.teams.map(t => t.toLowerCase().trim()).sort();
      const key = `${teams[0]}-${teams[1]}-${kalshiSpread.line}`;

      // Store the favorite's market (team at index 0)
      if (!kalshiSpreadMap.has(key)) {
        kalshiSpreadMap.set(key, kalshiSpread);
      }
    }

    console.log(`   Kalshi spread lines: ${kalshiSpreadMap.size}`);

    // Match Polymarket spreads with Kalshi spreads
    for (const polySpread of polySpreads) {
      if (!polySpread.teams || polySpread.teams.length < 2 || !polySpread.line) continue;

      // Create matching key
      const polyTeams = polySpread.teams.map(t => t.toLowerCase().trim()).sort();
      const key = `${polyTeams[0]}-${polyTeams[1]}-${polySpread.line}`;

      const kalshiSpread = kalshiSpreadMap.get(key);
      if (!kalshiSpread) continue;

      // For spread arbitrage:
      // Polymarket: Yes = Favorite covers, No = Underdog covers
      // Kalshi: Yes = Favorite covers, No = Underdog covers
      //
      // Option A: Buy favorite on Poly + underdog on Kalshi
      // = Poly Yes + Kalshi No
      const costA = polySpread.yesPrice + kalshiSpread.noPrice;

      // Option B: Buy underdog on Poly + favorite on Kalshi
      // = Poly No + Kalshi Yes
      const costB = polySpread.noPrice + kalshiSpread.yesPrice;

      let bestOption: 'A' | 'B' | null = null;
      let bestCost = 1;
      let profitMargin = 0;

      if (costA < 1) {
        bestOption = 'A';
        bestCost = costA;
        profitMargin = (1 - costA) * 100;
      }

      if (costB < 1 && (bestOption === null || costB < bestCost)) {
        bestOption = 'B';
        bestCost = costB;
        profitMargin = (1 - costB) * 100;
      }

      if (settings.includeFees && profitMargin > 0) {
        profitMargin = Math.max(0, profitMargin - 0.5);
      }

      if (bestOption && profitMargin >= settings.profitThreshold) {
        const targetPayout = settings.targetPayout;
        const totalStake = bestCost * targetPayout;
        const profitAmount = (targetPayout - totalStake).toFixed(2);

        const favorite = polySpread.teams[0]; // First team is favorite
        const underdog = polySpread.teams[1];

        const opportunity: ArbitrageOpportunity = {
          id: `spread-${polySpread.id}-${kalshiSpread.id}`,
          matchTitle: `${favorite} vs ${underdog} (${polySpread.line})`,
          teams: [favorite, underdog],
          profitMargin: profitMargin,
          profitAmount: profitAmount,
          totalCost: bestCost,
          arbOption: bestOption,
          polymarket: bestOption === 'A' ? {
            ...polySpread,
            stake: (polySpread.yesPrice * targetPayout).toFixed(2),
            outcome: `${favorite} -${polySpread.line}`,
            displayPrice: polySpread.yesPrice,
          } : {
            ...polySpread,
            stake: (polySpread.noPrice * targetPayout).toFixed(2),
            outcome: `${underdog} +${polySpread.line}`,
            displayPrice: polySpread.noPrice,
          },
          kalshi: bestOption === 'A' ? {
            ...kalshiSpread,
            stake: (kalshiSpread.noPrice * targetPayout).toFixed(2),
            outcome: `${underdog} +${polySpread.line}`,
            displayPrice: kalshiSpread.noPrice,
          } : {
            ...kalshiSpread,
            stake: (kalshiSpread.yesPrice * targetPayout).toFixed(2),
            outcome: `${favorite} -${polySpread.line}`,
            displayPrice: kalshiSpread.yesPrice,
          },
          totalStake: totalStake.toFixed(2),
          targetPayout: targetPayout,
          timestamp: new Date().toISOString(),
        };

        opportunities.push(opportunity);
        console.log(`💰 Found SPREAD opportunity: ${opportunity.matchTitle} - ${profitMargin.toFixed(4)}% profit (Option ${bestOption})`);
      }
    }

    // Sort by profit margin
    opportunities.sort((a, b) => b.profitMargin - a.profitMargin);

    console.log(`   Total opportunities found: ${opportunities.length}`);

    return opportunities;
  };
  
  // Handle header press to view all markets
  const handleHeaderPress = (platform: 'Polymarket' | 'Kalshi') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const markets = platform === 'Polymarket' ? polymarketData : kalshiData;
    
    if (markets.length === 0) {
      Alert.alert('No Markets', `No ${platform} markets available at the moment.`);
      return;
    }
    
    navigation.navigate('MarketList', {
      markets: markets,
      platform: platform,
    });
  };
  
  // Handle opportunity press
  const handleOpportunityPress = (opportunity: ArbitrageOpportunity) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    navigation.navigate('MarketDetail', {
      polymarket: opportunity.polymarket,
      kalshi: opportunity.kalshi,
      matchTitle: opportunity.matchTitle,
      teams: opportunity.teams,
    });
  };
  
  // Initial data fetch
  useEffect(() => {
    fetchAllMarkets();
  }, []);
  
  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAllMarkets(false);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchAllMarkets]);
  
  // Pull to refresh handler
  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchAllMarkets(false);
  }, [fetchAllMarkets]);
  
  // Get gradient colors based on profit margin
  const getGradientColors = (profit: number): [string, string] => {
    if (profit >= 5) return ['#10B981', '#059669'];
    if (profit >= 3) return ['#3B82F6', '#2563EB'];
    return ['#8B5CF6', '#7C3AED'];
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#10B981"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.title}>Arbitrage Scanner</Text>
            <TouchableOpacity
              style={styles.debugButton}
              onPress={() => navigation.navigate('Debug')}
            >
              <Text style={styles.debugButtonText}>Debug</Text>
            </TouchableOpacity>
          </View>
          {lastUpdate && (
            <Text style={styles.lastUpdate}>
              Last update: {lastUpdate.toLocaleTimeString()}
            </Text>
          )}
        </View>
        
        {/* Platform Stats */}
        <View style={styles.statsContainer}>
          {/* Polymarket Card */}
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => handleHeaderPress('Polymarket')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              style={styles.statGradient}
            >
              <Text style={styles.statPlatform}>Polymarket</Text>
              <Text style={styles.statNumber}>
                {isLoading ? '...' : polymarketData.length}
              </Text>
              <Text style={styles.statLabel}>Markets</Text>
              <Text style={styles.tapHint}>Tap to view →</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          {/* Kalshi Card */}
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => handleHeaderPress('Kalshi')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#3B82F6', '#2563EB']}
              style={styles.statGradient}
            >
              <Text style={styles.statPlatform}>Kalshi</Text>
              <Text style={styles.statNumber}>
                {isLoading ? '...' : kalshiData.length}
              </Text>
              <Text style={styles.statLabel}>Markets</Text>
              <Text style={styles.tapHint}>Tap to view →</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        
        {/* Opportunities Header */}
        <View style={styles.opportunitiesHeader}>
          <Text style={styles.opportunitiesTitle}>Opportunities</Text>
          <View style={styles.opportunitiesCount}>
            <Text style={styles.opportunitiesNumber}>
              {arbitrageOpportunities.length}
            </Text>
          </View>
        </View>
        
        {/* Loading State */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={styles.loadingText}>Scanning markets...</Text>
          </View>
        )}
        
        {/* Opportunities List */}
        {!isLoading && arbitrageOpportunities.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateEmoji}>🔍</Text>
            <Text style={styles.emptyStateText}>
              No arbitrage opportunities found
            </Text>
            <Text style={styles.emptyStateSubtext}>
              Markets are currently efficient
            </Text>
          </View>
        )}
        
        {!isLoading && arbitrageOpportunities.map(opportunity => (
          <TouchableOpacity
            key={opportunity.id}
            onPress={() => handleOpportunityPress(opportunity)}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={getGradientColors(opportunity.profitMargin)}
              style={styles.opportunityCard}
            >
              <View style={styles.opportunityHeader}>
                <Text style={styles.opportunityTitle} numberOfLines={2}>
                  {opportunity.matchTitle}
                </Text>
                <View style={styles.profitBadge}>
                  <Text style={styles.profitText}>
                    +{opportunity.profitMargin.toFixed(2)}%
                  </Text>
                </View>
              </View>
              
              <View style={styles.opportunityDetails}>
                <View style={styles.platformDetail}>
                  <Text style={styles.platformName}>Polymarket</Text>
                  <Text style={styles.betDetail}>
                    {opportunity.polymarket.outcome} @ ${opportunity.polymarket.displayPrice.toFixed(6)}
                  </Text>
                  <Text style={styles.stakeDetail}>
                    Stake: ${opportunity.polymarket.stake}
                  </Text>
                </View>

                <View style={styles.vsContainer}>
                  <Text style={styles.vsText}>↔</Text>
                </View>

                <View style={styles.platformDetail}>
                  <Text style={styles.platformName}>Kalshi</Text>
                  <Text style={styles.betDetail}>
                    {opportunity.kalshi.outcome} @ ${opportunity.kalshi.displayPrice.toFixed(6)}
                  </Text>
                  <Text style={styles.stakeDetail}>
                    Stake: ${opportunity.kalshi.stake}
                  </Text>
                </View>
              </View>
              
              <View style={styles.profitSummary}>
                <Text style={styles.profitSummaryText}>
                  Invest ${opportunity.totalStake} → Win ${opportunity.targetPayout} = 
                  <Text style={styles.profitAmount}> +${opportunity.profitAmount}</Text>
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
        
        {/* Settings Section */}
        <View style={styles.settingsSection}>
          <Text style={styles.settingsTitle}>Settings</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Min Profit Threshold</Text>
            <View style={styles.settingButtons}>
              {[0.01, 0.1, 0.5, 1.0].map(threshold => (
                <TouchableOpacity
                  key={threshold}
                  style={[
                    styles.settingButton,
                    settings.profitThreshold === threshold && styles.settingButtonActive
                  ]}
                  onPress={() => setSettings({...settings, profitThreshold: threshold})}
                >
                  <Text style={styles.settingButtonText}>{threshold}%</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Include Fees (~2.5%)</Text>
            <TouchableOpacity
              style={[styles.toggle, settings.includeFees && styles.toggleActive]}
              onPress={() => setSettings({...settings, includeFees: !settings.includeFees})}
            >
              <Text style={styles.toggleText}>
                {settings.includeFees ? 'ON' : 'OFF'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Push Notifications</Text>
            <TouchableOpacity
              style={[styles.toggle, settings.notificationsEnabled && styles.toggleActive]}
              onPress={() => setSettings({...settings, notificationsEnabled: !settings.notificationsEnabled})}
            >
              <Text style={styles.toggleText}>
                {settings.notificationsEnabled ? 'ON' : 'OFF'}
              </Text>
            </TouchableOpacity>
          </View>

          {settings.notificationsEnabled && (
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Notification Threshold</Text>
              <View style={styles.settingButtons}>
                {[0.5, 1.0, 2.0, 3.0].map(threshold => (
                  <TouchableOpacity
                    key={threshold}
                    style={[
                      styles.settingButton,
                      settings.notificationThreshold === threshold && styles.settingButtonActive
                    ]}
                    onPress={() => setSettings({...settings, notificationThreshold: threshold})}
                  >
                    <Text style={styles.settingButtonText}>{threshold}%</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  debugButton: {
    backgroundColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  debugButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  lastUpdate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    gap: 10,
  },
  statCard: {
    flex: 1,
    height: 140,
  },
  statGradient: {
    flex: 1,
    borderRadius: 16,
    padding: 15,
    justifyContent: 'space-between',
  },
  statPlatform: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  statNumber: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  tapHint: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.7,
    fontStyle: 'italic',
  },
  opportunitiesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  opportunitiesTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  opportunitiesCount: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  opportunitiesNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 10,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyStateEmoji: {
    fontSize: 48,
    marginBottom: 15,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 5,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  opportunityCard: {
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 16,
    padding: 15,
  },
  opportunityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  opportunityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 10,
  },
  profitBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  profitText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  opportunityDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  platformDetail: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    padding: 12,
  },
  platformName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 4,
  },
  betDetail: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 2,
  },
  stakeDetail: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  vsContainer: {
    paddingHorizontal: 10,
  },
  vsText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  profitSummary: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 10,
  },
  profitSummaryText: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  profitAmount: {
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  settingsSection: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#374151',
    marginTop: 20,
  },
  settingsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  settingLabel: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  settingButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  settingButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#374151',
    borderRadius: 8,
  },
  settingButtonActive: {
    backgroundColor: '#10B981',
  },
  settingButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  toggle: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#374151',
    borderRadius: 20,
  },
  toggleActive: {
    backgroundColor: '#10B981',
  },
  toggleText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default MainScreen;