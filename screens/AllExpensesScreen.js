import React, { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import {
  ActivityIndicator,
  Button,
  FAB,
  Searchbar,
  Surface,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import CategoryChip from '../components/CategoryChip';
import EmptyState from '../components/EmptyState';
import ExpenseItem from '../components/ExpenseItem';
import ScreenContainer from '../components/ScreenContainer';
import { DEFAULT_EXPENSE_CATEGORIES, PAYMENT_MODES } from '../constants/categories';
import { useExpenses } from '../hooks/useExpenses';
import { isValidISODate } from '../utils/date';

const PAYMENT_FILTERS = ['All', ...PAYMENT_MODES];
const PAGE_SIZE = 25;

export default function AllExpensesScreen({ navigation }) {
  const theme = useTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const { categories, getExpenseHistoryCount, getExpenseHistoryPage, refreshExpenses } = useExpenses();
  const categoryFilters = ['All', ...(categories.length > 0 ? categories : DEFAULT_EXPENSE_CATEGORIES)];
  const [dateFilter, setDateFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [historyRows, setHistoryRows] = useState([]);
  const [historyCount, setHistoryCount] = useState(0);
  const [loadingRows, setLoadingRows] = useState(true);
  const [refreshingRows, setRefreshingRows] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const deferredSearch = useDeferredValue(search);
  const deferredCategoryFilter = useDeferredValue(categoryFilter);
  const deferredPaymentFilter = useDeferredValue(paymentFilter);
  const deferredDateFilter = useDeferredValue(dateFilter);
  const hasInvalidDate = Boolean(dateFilter) && !isValidISODate(dateFilter);

  const activeFilters = useMemo(() => ({
    category: deferredCategoryFilter,
    date: isValidISODate(deferredDateFilter) ? deferredDateFilter : '',
    paymentMode: deferredPaymentFilter,
    search: deferredSearch,
  }), [deferredCategoryFilter, deferredDateFilter, deferredPaymentFilter, deferredSearch]);

  const fetchHistory = async ({ append = false, forceRefresh = false } = {}) => {
    if (!append) {
      forceRefresh ? setRefreshingRows(true) : setLoadingRows(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const offset = append ? historyRows.length : 0;
      const [count, rows] = await Promise.all([
        getExpenseHistoryCount(activeFilters),
        getExpenseHistoryPage({
          ...activeFilters,
          limit: PAGE_SIZE,
          offset,
        }),
      ]);

      setHistoryCount(count);
      setHistoryRows((current) => (append ? [...current, ...rows] : rows));
    } finally {
      setLoadingRows(false);
      setRefreshingRows(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [activeFilters]);

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [activeFilters])
  );

  const handleRefresh = async () => {
    await refreshExpenses();
    await fetchHistory({ forceRefresh: true });
  };

  const handleLoadMore = async () => {
    if (loadingMore || loadingRows || historyRows.length >= historyCount) {
      return;
    }

    await fetchHistory({ append: true });
  };

  const resetFilters = () => {
    setDateFilter('');
    setCategoryFilter('All');
    setPaymentFilter('All');
    setSearch('');
  };

  return (
    <ScreenContainer edges={['top']}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <FlatList
          data={historyRows}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[
            styles.content,
            {
              paddingBottom: tabBarHeight + 88,
            },
          ]}
          refreshControl={<RefreshControl refreshing={refreshingRows} onRefresh={handleRefresh} />}
          renderItem={({ item }) => (
            <ExpenseItem
              expense={item}
              onPress={() => navigation.navigate('EditExpense', { expenseId: item.id })}
            />
          )}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.35}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.footerLoader} /> : null}
          ListHeaderComponent={(
            <Surface
              style={[
                styles.filterCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.outline,
                },
              ]}
              elevation={1}
            >
              <Text variant="headlineSmall" style={styles.heading}>
                All Expenses
              </Text>
              <Text variant="bodyMedium" style={[styles.subheading, { color: theme.colors.onSurfaceVariant }]}>
                Filter by date, category, note, or platform to quickly find any transaction.
              </Text>
              <View style={styles.summaryRow}>
                <Text variant="labelLarge" style={{ color: theme.colors.primary }}>
                  {historyCount} result{historyCount === 1 ? '' : 's'}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {paymentFilter === 'All' ? 'All payment modes' : paymentFilter}
                </Text>
              </View>
              <Searchbar
                placeholder="Search by note, category, payment mode, or platform"
                value={search}
                onChangeText={setSearch}
                style={styles.search}
              />
              <TextInput
                label="Filter by date (YYYY-MM-DD)"
                mode="outlined"
                value={dateFilter}
                onChangeText={setDateFilter}
                style={styles.dateInput}
                error={hasInvalidDate}
              />
              {hasInvalidDate ? (
                <Text variant="bodySmall" style={[styles.helperText, { color: theme.colors.error }]}>
                  Enter dates in YYYY-MM-DD format to apply the filter.
                </Text>
              ) : null}
              <View style={styles.chipsRow}>
                {categoryFilters.map((category) => (
                  <CategoryChip
                    key={category}
                    label={category}
                    selected={categoryFilter === category}
                    onPress={() => setCategoryFilter(category)}
                    compact
                  />
                ))}
              </View>
              <Text variant="titleSmall" style={styles.filterLabel}>
                Payment Mode
              </Text>
              <View style={styles.chipsRow}>
                {PAYMENT_FILTERS.map((paymentMode) => (
                  <CategoryChip
                    key={paymentMode}
                    label={paymentMode}
                    selected={paymentFilter === paymentMode}
                    onPress={() => setPaymentFilter(paymentMode)}
                    compact
                  />
                ))}
              </View>
              <Button mode="text" onPress={resetFilters} style={styles.resetButton}>
                Reset Filters
              </Button>
            </Surface>
          )}
          ListEmptyComponent={loadingRows ? (
            <ActivityIndicator style={styles.emptyLoader} />
          ) : (
            <EmptyState
              title="No matching expenses"
              description="Try changing the date, category, or payment filters to see more transactions."
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
  filterCard: {
    borderWidth: 1,
    borderRadius: 24,
    marginBottom: 18,
    padding: 16,
  },
  heading: {
    fontWeight: '800',
    marginBottom: 8,
  },
  subheading: {
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  search: {
    marginBottom: 12,
  },
  dateInput: {
    marginBottom: 12,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterLabel: {
    marginBottom: 10,
    marginTop: 4,
  },
  helperText: {
    marginBottom: 12,
  },
  resetButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  fab: {
    borderRadius: 999,
    position: 'absolute',
    right: 24,
  },
  footerLoader: {
    marginTop: 8,
  },
  emptyLoader: {
    marginTop: 32,
  },
});
