import React from 'react';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from '../screens/HomeScreen';
import AddExpenseScreen from '../screens/AddExpenseScreen';
import EditExpenseScreen from '../screens/EditExpenseScreen';
import AllExpensesScreen from '../screens/AllExpensesScreen';
import SummaryScreen from '../screens/SummaryScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function Tabs({ theme }) {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
          marginBottom: 4,
        },
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
          borderTopWidth: 0,
          elevation: 8,
          height: 68 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 10),
          paddingTop: 8,
        },
        tabBarIcon: ({ color, size }) => {
          const icons = {
            HomeTab: 'home-variant-outline',
            AllExpensesTab: 'wallet-outline',
            SummaryTab: 'chart-donut',
          };

          return <MaterialCommunityIcons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="AllExpensesTab" component={AllExpensesScreen} options={{ title: 'All Expenses' }} />
      <Tab.Screen name="SummaryTab" component={SummaryScreen} options={{ title: 'Summary' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator({ theme }) {
  const navigationTheme = theme.dark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: theme.colors.background,
          border: theme.colors.outline,
          card: theme.colors.surface,
          primary: theme.colors.primary,
          text: theme.colors.onSurface,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: theme.colors.background,
          border: theme.colors.outline,
          card: theme.colors.surface,
          primary: theme.colors.primary,
          text: theme.colors.onSurface,
        },
      };

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: theme.colors.background,
          },
          headerTintColor: theme.colors.onBackground,
          contentStyle: {
            backgroundColor: theme.colors.background,
          },
        }}
      >
        <Stack.Screen
          name="Expenses"
          children={() => <Tabs theme={theme} />}
          options={{ title: 'Expense Tracker', headerShown: false }}
        />
        <Stack.Screen name="AddExpense" component={AddExpenseScreen} options={{ title: 'Add Expense' }} />
        <Stack.Screen name="EditExpense" component={EditExpenseScreen} options={{ title: 'Edit Expense' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
