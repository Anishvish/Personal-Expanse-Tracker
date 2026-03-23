import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import {
  FAB,
  IconButton,
  Surface,
  Text,
  TouchableRipple,
  useTheme,
} from 'react-native-paper';
import EmptyState from '../components/EmptyState';
import ExpenseItem from '../components/ExpenseItem';
import LoadingState from '../components/LoadingState';
import ScreenContainer from '../components/ScreenContainer';
import SummaryCard from '../components/SummaryCard';
import { useExpenses } from '../hooks/useExpenses';
import { formatDate, getTodayDateString } from '../utils/date';

function shiftDate(dateString, deltaDays) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + deltaDays);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export default function HomeScreen({ navigation }) {
  const theme = useTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const {
    addExpense,
    categories,
    error,
    getExpensesForDate,
    loading,
    monthlyBudget,
    monthlySummary,
    quickPresets,
    recentExpenseTemplates,
    refreshExpenses,
  } = useExpenses();
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [dayExpenses, setDayExpenses] = useState([]);
  const [dayLoading, setDayLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadDayExpenses() {
      setDayLoading(true);
      try {
        const rows = await getExpensesForDate(selectedDate);
        if (isMounted) {
          setDayExpenses(rows);
        }
      } finally {
        if (isMounted) {
          setDayLoading(false);
        }
      }
    }

    loadDayExpenses();

    return () => {
      isMounted = false;
    };
  }, [getExpensesForDate, selectedDate]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getExpensesForDate(selectedDate).then((rows) => {
        if (active) setDayExpenses(rows);
      });
      return () => { active = false; };
    }, [getExpensesForDate, selectedDate])
  );

  const dayTotal = useMemo(
    () => dayExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0),
    [dayExpenses]
  );

  const currentMonthSpent = Number(monthlySummary?.total || 0);
  const budgetLeft = Math.max(Number(monthlyBudget || 0) - currentMonthSpent, 0);
  const mergedQuickItems = [...quickPresets, ...recentExpenseTemplates].slice(0, 8);

  const handleQuickAdd = async (expense) => {
    try {
      await addExpense({
        amount: Number(expense.amount),
        category: expense.category,
        paymentMode: expense.payment_mode,
        platform: expense.platform || '',
        note: expense.note || '',
        date: selectedDate,
      });
      const refreshed = await getExpensesForDate(selectedDate);
      setDayExpenses(refreshed);
    } catch (quickAddError) {
      Alert.alert('Unable to add quick expense', quickAddError.message || 'Please try again.');
    }
  };

  const handleRefresh = async () => {
    await refreshExpenses();
    const refreshed = await getExpensesForDate(selectedDate);
    setDayExpenses(refreshed);
  };

  if (loading) {
    return <LoadingState message="Loading your day view..." />;
  }

  return (
    <ScreenContainer edges={['top']}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <FlatList
          data={dayExpenses}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[
            styles.content,
            {
              paddingBottom: tabBarHeight + 88,
            },
          ]}
          refreshControl={<RefreshControl refreshing={false} onRefresh={handleRefresh} />}
          renderItem={({ item }) => (
            <ExpenseItem
              expense={item}
              onPress={() => navigation.navigate('EditExpense', { expenseId: item.id })}
            />
          )}
          ListHeaderComponent={(
            <View>
              <View style={[styles.heroCard, { backgroundColor: theme.colors.primaryContainer }]}>
                <Text variant="labelLarge" style={[styles.heroLabel, { color: theme.colors.primary }]}>
                  Day view
                </Text>
                <Text variant="headlineMedium" style={styles.heading}>
                  {selectedDate === getTodayDateString() ? "Today's Expenses" : formatDate(selectedDate)}
                </Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  Jump between days, review one date at a time, and post quick entries directly into that day.
                </Text>
              </View>

              <Surface style={[styles.dayNavigator, { backgroundColor: theme.colors.surface }]} elevation={1}>
                <IconButton icon="chevron-left" onPress={() => setSelectedDate((current) => shiftDate(current, -1))} />
                <TouchableRipple onPress={() => setShowDatePicker(true)} style={styles.dayPickerTap}>
                  <View>
                    <Text variant="labelLarge" style={{ color: theme.colors.primary }}>
                      Selected day
                    </Text>
                    <Text variant="titleMedium">{formatDate(selectedDate)}</Text>
                  </View>
                </TouchableRipple>
                <IconButton
                  icon="chevron-right"
                  onPress={() => {
                    const nextDate = shiftDate(selectedDate, 1);
                    if (nextDate <= getTodayDateString()) {
                      setSelectedDate(nextDate);
                    }
                  }}
                  disabled={selectedDate === getTodayDateString()}
                />
              </Surface>

              {selectedDate !== getTodayDateString() ? (
                <View style={styles.todayButtonRow}>
                  <TouchableRipple
                    onPress={() => setSelectedDate(getTodayDateString())}
                    style={[
                      styles.todayButton,
                      {
                        backgroundColor: theme.colors.secondaryContainer,
                      },
                    ]}
                  >
                    <Text variant="labelLarge" style={{ color: theme.colors.onSecondaryContainer }}>
                      Jump to today
                    </Text>
                  </TouchableRipple>
                </View>
              ) : null}

              {showDatePicker ? (
                <DateTimePicker
                  value={new Date(`${selectedDate}T00:00:00`)}
                  mode="date"
                  display="default"
                  maximumDate={new Date()}
                  onChange={(_, pickedDate) => {
                    setShowDatePicker(false);
                    if (pickedDate) {
                      const iso = new Date(pickedDate.getTime() - pickedDate.getTimezoneOffset() * 60000)
                        .toISOString()
                        .slice(0, 10);
                      setSelectedDate(iso);
                    }
                  }}
                />
              ) : null}

              <View style={styles.cardRow}>
                <SummaryCard
                  label="Day total"
                  value={`Rs ${dayTotal.toFixed(2)}`}
                  accent={theme.colors.secondaryContainer}
                />
                <View style={styles.spacer} />
                <SummaryCard
                  label={monthlyBudget > 0 ? 'Budget left' : 'Set budget'}
                  value={monthlyBudget > 0 ? `Rs ${budgetLeft.toFixed(2)}` : 'Monthly target'}
                  accent={theme.colors.tertiaryContainer}
                />
              </View>

              {mergedQuickItems.length > 0 ? (
                <>
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    Quick Add
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.quickAddRow}
                  >
                    {mergedQuickItems.map((expense, index) => (
                      <TouchableRipple
                        key={`quick-${expense.id || expense.name || index}`}
                        borderless={false}
                        onPress={() => handleQuickAdd(expense)}
                        style={[
                          styles.quickAddCard,
                          {
                            backgroundColor: theme.colors.surface,
                            borderColor: theme.colors.outline,
                          },
                        ]}
                      >
                        <Surface style={styles.quickAddInner} elevation={0}>
                          <Text variant="labelMedium" style={{ color: theme.colors.primary }}>
                            {(expense.name || expense.payment_mode)}{expense.platform ? ` | ${expense.platform}` : ''}
                          </Text>
                          <Text variant="titleMedium" style={styles.quickAddAmount}>
                            Rs {Number(expense.amount).toFixed(0)}
                          </Text>
                          <Text variant="bodyMedium">{expense.category || categories[0]}</Text>
                          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                            {expense.note?.trim() || `Tap to add on ${formatDate(selectedDate)}`}
                          </Text>
                        </Surface>
                      </TouchableRipple>
                    ))}
                  </ScrollView>
                </>
              ) : null}

              {error ? (
                <Text variant="bodyMedium" style={[styles.error, { color: theme.colors.error }]}>
                  {error}
                </Text>
              ) : null}

              <Text variant="titleMedium" style={styles.sectionTitle}>
                Transactions
              </Text>
            </View>
          )}
          ListEmptyComponent={dayLoading ? (
            <LoadingState message="Loading expenses for this day..." />
          ) : (
            <EmptyState
              title="No expenses for this day"
              description="Use the date picker or quick add cards to log spending for the selected day."
            />
          )}
        />

        <FAB
          icon="plus"
          style={[
            styles.fab,
            {
              backgroundColor: theme.colors.primary,
              bottom: tabBarHeight + 16,
            },
          ]}
          color="#ffffff"
          onPress={() => navigation.navigate('AddExpense')}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 10,
  },
  heading: {
    fontWeight: '800',
    marginBottom: 12,
  },
  heroCard: {
    borderRadius: 28,
    marginBottom: 16,
    padding: 20,
  },
  heroLabel: {
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  dayNavigator: {
    alignItems: 'center',
    borderRadius: 22,
    flexDirection: 'row',
    marginBottom: 16,
    paddingVertical: 4,
  },
  dayPickerTap: {
    borderRadius: 18,
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  todayButtonRow: {
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  todayButton: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  cardRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  spacer: {
    width: 12,
  },
  sectionTitle: {
    marginBottom: 12,
    marginTop: 24,
  },
  quickAddRow: {
    paddingBottom: 4,
  },
  quickAddCard: {
    borderRadius: 22,
    borderWidth: 1,
    marginRight: 12,
    overflow: 'hidden',
    width: 190,
  },
  quickAddInner: {
    padding: 16,
  },
  quickAddAmount: {
    fontWeight: '800',
    marginBottom: 6,
    marginTop: 8,
  },
  fab: {
    borderRadius: 999,
    position: 'absolute',
    right: 24,
  },
  error: {
    marginTop: 12,
  },
});
