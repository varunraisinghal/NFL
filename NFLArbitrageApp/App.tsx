// App.tsx
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';

// Import screens
import MainScreen from './src/screens/MainScreen';
import MarketDetailScreen from './src/screens/MarketDetailScreen';
import MarketListScreen from './src/screens/MarketListScreen';
import DebugScreen from './src/screens/DebugScreen';

// Import types
import { MarketData } from './src/types';

// Define navigation types
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
  Debug: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

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

export default function App() {
  // Request notification permissions on mount
  useEffect(() => {
    const requestPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('Notification permissions not granted');
      } else {
        console.log('✅ Notification permissions granted');
      }
    };
    
    requestPermissions();
    
    // Log app startup
    console.log('🚀 Arbitrage Scanner App Started');
    console.log('📱 Platform: iOS/Android');
    console.log('⚡ Ready to scan markets...');
  }, []);
  
  return (
    <>
      <StatusBar style="light" />
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: '#111827',
            },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            headerBackTitleVisible: false,
          }}
        >
          <Stack.Screen
            name="Main"
            component={MainScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="MarketDetail"
            component={MarketDetailScreen}
            options={{
              title: 'Market Details',
              headerStyle: {
                backgroundColor: '#1F2937',
              },
            }}
          />
          <Stack.Screen
            name="MarketList"
            component={MarketListScreen}
            options={({ route }) => ({
              title: `${route.params.platform} Markets`,
              headerStyle: {
                backgroundColor: route.params.platform === 'Polymarket' ? '#7C3AED' : '#2563EB',
              },
            })}
          />
          <Stack.Screen
            name="Debug"
            component={DebugScreen}
            options={{
              title: 'API Debug',
              headerStyle: {
                backgroundColor: '#7C3AED',
              },
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}