// src/screens/MarketDetailScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';

type MarketDetailRouteProp = RouteProp<RootStackParamList, 'MarketDetail'>;

const MarketDetailScreen = () => {
  const route = useRoute<MarketDetailRouteProp>();
  const { polymarket, kalshi, matchTitle, teams } = route.params;
  
  const [targetPayout, setTargetPayout] = useState(100);
  const [includeFees, setIncludeFees] = useState(true);
  
  // Calculate implied probabilities
  const polyYesProb = polymarket.yesPrice * 100;
  const polyNoProb = polymarket.noPrice * 100;
  const kalshiYesProb = kalshi.yesPrice * 100;
  const kalshiNoProb = kalshi.noPrice * 100;
  
  // Calculate arbitrage for both options
  const calculateArbitrage = () => {
    const costA = polymarket.yesPrice + kalshi.noPrice;
    const costB = polymarket.noPrice + kalshi.yesPrice;
    
    let bestOption = null;
    let profit = 0;
    let totalCost = 0;
    
    if (costA < 1) {
      bestOption = 'A';
      totalCost = costA;
      profit = (1 - costA) * 100;
    } else if (costB < 1) {
      bestOption = 'B';
      totalCost = costB;
      profit = (1 - costB) * 100;
    }
    
    if (includeFees && profit > 0) {
      profit = Math.max(0, profit - 2.5);
    }
    
    if (profit > 0 && bestOption) {
      if (bestOption === 'A') {
        return {
          exists: true,
          profit: profit,
          polyStake: (polymarket.yesPrice * targetPayout).toFixed(2),
          kalshiStake: (kalshi.noPrice * targetPayout).toFixed(2),
          polyOutcome: 'Yes',
          kalshiOutcome: 'No',
          totalStake: (totalCost * targetPayout).toFixed(2),
          profitAmount: (targetPayout * profit / 100).toFixed(2),
        };
      } else {
        return {
          exists: true,
          profit: profit,
          polyStake: (polymarket.noPrice * targetPayout).toFixed(2),
          kalshiStake: (kalshi.yesPrice * targetPayout).toFixed(2),
          polyOutcome: 'No',
          kalshiOutcome: 'Yes',
          totalStake: (totalCost * targetPayout).toFixed(2),
          profitAmount: (targetPayout * profit / 100).toFixed(2),
        };
      }
    }
    
    return { exists: false };
  };
  
  const arb = calculateArbitrage();
  
  const openMarket = (url: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(url);
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.content}>
        {/* Market Title */}
        <View style={styles.titleSection}>
          <Text style={styles.matchTitle}>{matchTitle}</Text>
          <Text style={styles.lastUpdate}>
            Last updated: {new Date(polymarket.lastUpdate).toLocaleTimeString()}
          </Text>
        </View>
        
        {/* Arbitrage Summary */}
        {arb.exists && (
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.arbSummary}
          >
            <Text style={styles.arbTitle}>✅ Arbitrage Opportunity</Text>
            <Text style={styles.arbProfit}>+{arb.profit.toFixed(2)}% Profit</Text>
            <Text style={styles.arbAmount}>
              Stake ${arb.totalStake} → Win ${targetPayout} = Profit ${arb.profitAmount}
            </Text>
          </LinearGradient>
        )}
        
        {/* Market Comparison */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Market Comparison</Text>
          
          {/* Team 1 (Yes) Odds */}
          <View style={styles.oddsRow}>
            <Text style={styles.teamName}>{teams[0]} (Yes)</Text>
            <View style={styles.oddsContainer}>
              <View style={styles.oddsBox}>
                <Text style={styles.platformLabel}>Polymarket</Text>
                <Text style={styles.oddsValue}>${polymarket.yesPrice.toFixed(3)}</Text>
                <Text style={styles.probValue}>{polyYesProb.toFixed(1)}%</Text>
              </View>
              <View style={styles.oddsBox}>
                <Text style={styles.platformLabel}>Kalshi</Text>
                <Text style={styles.oddsValue}>${kalshi.yesPrice.toFixed(3)}</Text>
                <Text style={styles.probValue}>{kalshiYesProb.toFixed(1)}%</Text>
              </View>
            </View>
          </View>
          
          {/* Team 2 (No) Odds */}
          <View style={styles.oddsRow}>
            <Text style={styles.teamName}>{teams[1]} (No)</Text>
            <View style={styles.oddsContainer}>
              <View style={styles.oddsBox}>
                <Text style={styles.platformLabel}>Polymarket</Text>
                <Text style={styles.oddsValue}>${polymarket.noPrice.toFixed(3)}</Text>
                <Text style={styles.probValue}>{polyNoProb.toFixed(1)}%</Text>
              </View>
              <View style={styles.oddsBox}>
                <Text style={styles.platformLabel}>Kalshi</Text>
                <Text style={styles.oddsValue}>${kalshi.noPrice.toFixed(3)}</Text>
                <Text style={styles.probValue}>{kalshiNoProb.toFixed(1)}%</Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Recommended Stakes */}
        {arb.exists && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recommended Stakes</Text>
            
            <View style={styles.stakeCard}>
              <View style={styles.stakeHeader}>
                <Text style={styles.stakeTitle}>Polymarket</Text>
                <Text style={styles.stakeOutcome}>{arb.polyOutcome}</Text>
              </View>
              <Text style={styles.stakeAmount}>${arb.polyStake}</Text>
            </View>
            
            <View style={styles.stakeCard}>
              <View style={styles.stakeHeader}>
                <Text style={styles.stakeTitle}>Kalshi</Text>
                <Text style={styles.stakeOutcome}>{arb.kalshiOutcome}</Text>
              </View>
              <Text style={styles.stakeAmount}>${arb.kalshiStake}</Text>
            </View>
            
            <View style={styles.profitCard}>
              <Text style={styles.profitLabel}>Guaranteed Profit</Text>
              <Text style={styles.profitValue}>${arb.profitAmount}</Text>
            </View>
          </View>
        )}
        
        {/* Market Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Market Details</Text>
          
          <View style={styles.detailsGrid}>
            <View style={styles.detailBox}>
              <Text style={styles.detailLabel}>Polymarket Volume</Text>
              <Text style={styles.detailValue}>${polymarket.volume.toLocaleString()}</Text>
            </View>
            <View style={styles.detailBox}>
              <Text style={styles.detailLabel}>Kalshi Volume</Text>
              <Text style={styles.detailValue}>${kalshi.volume.toLocaleString()}</Text>
            </View>
            {polymarket.liquidity && (
              <View style={styles.detailBox}>
                <Text style={styles.detailLabel}>Poly Liquidity</Text>
                <Text style={styles.detailValue}>${polymarket.liquidity.toLocaleString()}</Text>
              </View>
            )}
            {kalshi.openInterest && (
              <View style={styles.detailBox}>
                <Text style={styles.detailLabel}>Kalshi OI</Text>
                <Text style={styles.detailValue}>${kalshi.openInterest.toLocaleString()}</Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[styles.actionButton, styles.polyButton]}
            onPress={() => openMarket(polymarket.url)}
          >
            <Text style={styles.actionButtonText}>Open in Polymarket</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.kalshiButton]}
            onPress={() => openMarket(kalshi.url)}
          >
            <Text style={styles.actionButtonText}>Open in Kalshi</Text>
          </TouchableOpacity>
        </View>
        
        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Settings</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Target Payout ($)</Text>
            <View style={styles.settingButtons}>
              <TouchableOpacity
                style={[styles.settingButton, targetPayout === 100 && styles.settingButtonActive]}
                onPress={() => setTargetPayout(100)}
              >
                <Text style={styles.settingButtonText}>$100</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.settingButton, targetPayout === 500 && styles.settingButtonActive]}
                onPress={() => setTargetPayout(500)}
              >
                <Text style={styles.settingButtonText}>$500</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.settingButton, targetPayout === 1000 && styles.settingButtonActive]}
                onPress={() => setTargetPayout(1000)}
              >
                <Text style={styles.settingButtonText}>$1k</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Include Fees (~2.5%)</Text>
            <TouchableOpacity
              style={[styles.toggle, includeFees && styles.toggleActive]}
              onPress={() => setIncludeFees(!includeFees)}
            >
              <Text style={styles.toggleText}>{includeFees ? 'ON' : 'OFF'}</Text>
            </TouchableOpacity>
          </View>
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
  titleSection: {
    padding: 20,
    backgroundColor: '#1F2937',
  },
  matchTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  lastUpdate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 5,
  },
  arbSummary: {
    margin: 15,
    padding: 20,
    borderRadius: 12,
  },
  arbTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  arbProfit: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  arbAmount: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  section: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  oddsRow: {
    marginBottom: 20,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  oddsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  oddsBox: {
    flex: 1,
    backgroundColor: '#1F2937',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  platformLabel: {
    fontSize: 12,
    color: '#60A5FA',
    marginBottom: 5,
  },
  oddsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 5,
  },
  probValue: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  stakeCard: {
    backgroundColor: '#1F2937',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  stakeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  stakeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  stakeOutcome: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: '600',
  },
  stakeAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#10B981',
  },
  profitCard: {
    backgroundColor: '#065F46',
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
    alignItems: 'center',
  },
  profitLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 5,
  },
  profitValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  detailBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1F2937',
    borderRadius: 10,
    padding: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 5,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionSection: {
    padding: 15,
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  polyButton: {
    backgroundColor: '#8B5CF6',
  },
  kalshiButton: {
    backgroundColor: '#3B82F6',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
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
    paddingHorizontal: 15,
    paddingVertical: 8,
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

export default MarketDetailScreen;