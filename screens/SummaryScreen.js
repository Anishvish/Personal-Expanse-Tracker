import React, { startTransition, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import {
  ActivityIndicator,
  Button,
  Dialog,
  IconButton,
  Portal,
  Surface,
  Text,
  TextInput,
  TouchableRipple,
  useTheme,
} from 'react-native-paper';
import EmptyState from '../components/EmptyState';
import ScreenContainer from '../components/ScreenContainer';
import SimpleBarChart from '../components/SimpleBarChart';
import SummaryCard from '../components/SummaryCard';
import { CATEGORY_COLORS, PAYMENT_MODE_COLORS, PAYMENT_MODES } from '../constants/categories';
import { useExpenses } from '../hooks/useExpenses';
import {
  formatDate,
  getMonthKey,
  getReadableMonth,
  getTodayDateString,
  isFutureMonth,
  shiftMonth,
} from '../utils/date';

const COLOR_PRESETS = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899'];
const FREQUENCY_OPTIONS = ['daily', 'weekly', 'monthly'];

function normalizeHexColor(value) {
  const cleaned = value.trim().replace(/[^0-9a-fA-F#]/g, '');
  if (!cleaned) {
    return '';
  }

  const prefixed = cleaned.startsWith('#') ? cleaned : `#${cleaned}`;
  return prefixed.slice(0, 7);
}

function getDefaultColorForCategory(category, categoryColors) {
  return categoryColors[category] || CATEGORY_COLORS[category] || COLOR_PRESETS[0];
}

export default function SummaryScreen() {
  const theme = useTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const {
    categories,
    categoryColors,
    getSummaryForMonth,
    monthlyBudget,
    monthlySummary,
    quickPresets,
    recurringRules,
    submitting,
    todayExpenses,
    totalExpenseCount,
    updateCategories,
    updateCategoryColors,
    updateMonthlyBudget,
    updateQuickPresets,
    updateRecurringRules,
  } = useExpenses();

  const currentMonthKey = getMonthKey(getTodayDateString());
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);
  const [summaryData, setSummaryData] = useState(monthlySummary);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [budgetDialogVisible, setBudgetDialogVisible] = useState(false);
  const [categoryDialogVisible, setCategoryDialogVisible] = useState(false);
  const [presetDialogVisible, setPresetDialogVisible] = useState(false);
  const [colorDialogVisible, setColorDialogVisible] = useState(false);
  const [recurringDialogVisible, setRecurringDialogVisible] = useState(false);
  const [budgetInput, setBudgetInput] = useState(monthlyBudget ? String(monthlyBudget) : '');
  const [categoryInput, setCategoryInput] = useState('');
  const [presetName, setPresetName] = useState('');
  const [presetAmount, setPresetAmount] = useState('');
  const [presetCategory, setPresetCategory] = useState(categories[0] || '');
  const [presetPaymentMode, setPresetPaymentMode] = useState(PAYMENT_MODES[0]);
  const [selectedCategoryForColor, setSelectedCategoryForColor] = useState('');
  const [colorInput, setColorInput] = useState('');
  const [recurringName, setRecurringName] = useState('');
  const [recurringAmount, setRecurringAmount] = useState('');
  const [recurringCategory, setRecurringCategory] = useState(categories[0] || '');
  const [recurringPaymentMode, setRecurringPaymentMode] = useState(PAYMENT_MODES[0]);
  const [recurringPlatform, setRecurringPlatform] = useState('');
  const [recurringNote, setRecurringNote] = useState('');
  const [recurringFrequency, setRecurringFrequency] = useState(FREQUENCY_OPTIONS[0]);
  const [recurringStartDate, setRecurringStartDate] = useState(getTodayDateString());
  const [showRecurringDatePicker, setShowRecurringDatePicker] = useState(false);

  useEffect(() => {
    setBudgetInput(monthlyBudget ? String(monthlyBudget) : '');
  }, [monthlyBudget]);

  useEffect(() => {
    if (!presetCategory && categories.length > 0) {
      setPresetCategory(categories[0]);
    }
    if (!recurringCategory && categories.length > 0) {
      setRecurringCategory(categories[0]);
    }
  }, [categories, presetCategory, recurringCategory]);

  useEffect(() => {
    let isMounted = true;

    async function loadSummary() {
      if (selectedMonth === currentMonthKey) {
        setSummaryData(monthlySummary);
        return;
      }

      try {
        setLoadingSummary(true);
        const nextSummary = await getSummaryForMonth(selectedMonth);
        if (isMounted) {
          setSummaryData(nextSummary);
        }
      } finally {
        if (isMounted) {
          setLoadingSummary(false);
        }
      }
    }

    loadSummary();
    return () => {
      isMounted = false;
    };
  }, [currentMonthKey, getSummaryForMonth, monthlySummary, selectedMonth]);

  const todayTotal = todayExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const highestSpendDay = useMemo(() => {
    if (!summaryData.dailyTotals?.length) {
      return null;
    }
    return summaryData.dailyTotals.reduce((highest, row) => (
      Number(row.total) > Number(highest.total) ? row : highest
    ));
  }, [summaryData.dailyTotals]);

  const budgetProgress = monthlyBudget > 0
    ? Math.min((Number(summaryData.total) / Number(monthlyBudget)) * 100, 100)
    : 0;

  const handlePreviousMonth = () => {
    startTransition(() => {
      setSelectedMonth((current) => shiftMonth(current, -1));
    });
  };

  const handleNextMonth = () => {
    const nextMonth = shiftMonth(selectedMonth, 1);
    if (!isFutureMonth(nextMonth)) {
      startTransition(() => {
        setSelectedMonth(nextMonth);
      });
    }
  };

  const handleBudgetSave = async () => {
    await updateMonthlyBudget(Number(budgetInput || 0));
    setBudgetDialogVisible(false);
  };

  const handleAddCategory = async () => {
    const trimmed = categoryInput.trim();
    if (!trimmed || categories.includes(trimmed)) {
      return;
    }

    const nextCategories = [...categories, trimmed];
    await updateCategories(nextCategories);
    await updateCategoryColors({
      ...categoryColors,
      [trimmed]: COLOR_PRESETS[nextCategories.length % COLOR_PRESETS.length],
    });
    setCategoryInput('');
    setCategoryDialogVisible(false);
  };

  const handleRemoveCategory = async (categoryToRemove) => {
    const nextCategories = categories.filter((category) => category !== categoryToRemove);
    if (nextCategories.length === 0) {
      return;
    }

    const nextColors = { ...categoryColors };
    delete nextColors[categoryToRemove];
    await updateCategories(nextCategories);
    await updateCategoryColors(nextColors);
  };

  const openColorDialog = (category) => {
    setSelectedCategoryForColor(category);
    setColorInput(getDefaultColorForCategory(category, categoryColors));
    setColorDialogVisible(true);
  };

  const handleSaveCategoryColor = async () => {
    const normalized = normalizeHexColor(colorInput);
    if (!selectedCategoryForColor || !/^#[0-9A-Fa-f]{6}$/.test(normalized)) {
      return;
    }

    await updateCategoryColors({
      ...categoryColors,
      [selectedCategoryForColor]: normalized,
    });
    setColorDialogVisible(false);
  };

  const handleAddPreset = async () => {
    if (!presetName.trim() || !presetAmount || !presetCategory) {
      return;
    }

    await updateQuickPresets([
      {
        name: presetName.trim(),
        amount: Number(presetAmount),
        category: presetCategory,
        payment_mode: presetPaymentMode,
        platform: '',
        note: '',
      },
      ...quickPresets,
    ].slice(0, 8));

    setPresetName('');
    setPresetAmount('');
    setPresetPaymentMode(PAYMENT_MODES[0]);
    setPresetDialogVisible(false);
  };

  const handleRemovePreset = async (presetIndex) => {
    await updateQuickPresets(quickPresets.filter((_, index) => index !== presetIndex));
  };

  const handleAddRecurringRule = async () => {
    if (!recurringAmount || !recurringCategory || (recurringPaymentMode === 'Online' && !recurringPlatform.trim())) {
      return;
    }

    const nextRules = [
      {
        name: recurringName.trim(),
        amount: Number(recurringAmount),
        category: recurringCategory,
        payment_mode: recurringPaymentMode,
        platform: recurringPaymentMode === 'Online' ? recurringPlatform.trim() : '',
        note: recurringNote.trim(),
        frequency: recurringFrequency,
        startDate: recurringStartDate,
        lastGeneratedDate: '',
      },
      ...recurringRules,
    ];

    await updateRecurringRules(nextRules);
    setRecurringName('');
    setRecurringAmount('');
    setRecurringCategory(categories[0] || '');
    setRecurringPaymentMode(PAYMENT_MODES[0]);
    setRecurringPlatform('');
    setRecurringNote('');
    setRecurringFrequency(FREQUENCY_OPTIONS[0]);
    setRecurringStartDate(getTodayDateString());
    setRecurringDialogVisible(false);
  };

  const handleRemoveRecurringRule = async (ruleIndex) => {
    await updateRecurringRules(recurringRules.filter((_, index) => index !== ruleIndex));
  };

  return (
    <ScreenContainer edges={['top']}>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + 28 }]}
      >
        <Surface style={[styles.heroCard, { backgroundColor: theme.colors.tertiaryContainer }]} elevation={1}>
          <Text variant="labelLarge" style={[styles.heroLabel, { color: theme.colors.tertiary }]}>Analytics</Text>
          <Text variant="headlineMedium" style={styles.heroTitle}>Spending pulse</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Manage your personal setup, recurring charges, and month-by-month spending in one place.
          </Text>
        </Surface>

        <View style={styles.headerRow}>
          <IconButton icon="chevron-left" onPress={handlePreviousMonth} />
          <Text variant="headlineMedium" style={styles.heading}>{getReadableMonth(selectedMonth)}</Text>
          <IconButton icon="chevron-right" onPress={handleNextMonth} disabled={selectedMonth === currentMonthKey} />
        </View>

        <View style={styles.cardRow}>
          <SummaryCard label="Selected month" value={`Rs ${Number(summaryData.total).toFixed(2)}`} />
          <View style={styles.spacer} />
          <SummaryCard label="Today" value={`Rs ${todayTotal.toFixed(2)}`} accent={theme.colors.secondaryContainer} />
        </View>

        <View style={styles.cardRow}>
          <SummaryCard label="Transactions" value={String(summaryData.transactionCount ?? 0)} accent={theme.colors.tertiaryContainer} />
          <View style={styles.spacer} />
          <SummaryCard label="Avg. daily spend" value={`Rs ${Number(summaryData.averageDailySpend ?? 0).toFixed(2)}`} />
        </View>

        <Surface style={[styles.panel, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <View style={styles.sectionHeader}>
            <Text variant="titleLarge">Monthly Budget</Text>
            <Button mode="text" onPress={() => setBudgetDialogVisible(true)}>{monthlyBudget > 0 ? 'Edit' : 'Set'}</Button>
          </View>
          <Text variant="headlineSmall" style={styles.budgetValue}>
            {monthlyBudget > 0 ? `Rs ${Number(monthlyBudget).toFixed(2)}` : 'Not set'}
          </Text>
          <View style={[styles.progressTrack, { backgroundColor: theme.colors.surfaceVariant }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: budgetProgress >= 100 ? theme.colors.error : theme.colors.primary,
                  width: `${monthlyBudget > 0 ? Math.max(budgetProgress, 6) : 0}%`,
                },
              ]}
            />
          </View>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {monthlyBudget > 0
              ? `Spent Rs ${Number(summaryData.total).toFixed(2)} this month. ${Math.max(Number(monthlyBudget) - Number(summaryData.total), 0).toFixed(2)} left.`
              : 'Set a monthly cap to see how much room you have left.'}
          </Text>
        </Surface>

        <Surface style={[styles.panel, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <View style={styles.sectionHeader}>
            <Text variant="titleLarge">Custom Categories</Text>
            <Button mode="text" onPress={() => setCategoryDialogVisible(true)}>Add</Button>
          </View>
          {categories.map((category) => (
            <View key={category} style={styles.categoryRow}>
              <View style={styles.categoryInfo}>
                <View style={[styles.colorDot, { backgroundColor: getDefaultColorForCategory(category, categoryColors) }]} />
                <Text variant="bodyLarge">{category}</Text>
              </View>
              <View style={styles.rowActions}>
                <Button compact mode="text" onPress={() => openColorDialog(category)}>Color</Button>
                <Button compact mode="text" onPress={() => handleRemoveCategory(category)}>Remove</Button>
              </View>
            </View>
          ))}
        </Surface>

        <Surface style={[styles.panel, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <View style={styles.sectionHeader}>
            <Text variant="titleLarge">Quick Presets</Text>
            <Button mode="text" onPress={() => setPresetDialogVisible(true)}>Add</Button>
          </View>
          {quickPresets.length > 0 ? quickPresets.map((preset, index) => (
            <View key={`${preset.name}-${index}`} style={styles.listRow}>
              <Text variant="bodyLarge">{preset.name} | Rs {Number(preset.amount).toFixed(0)}</Text>
              <Button compact mode="text" onPress={() => handleRemovePreset(index)}>Remove</Button>
            </View>
          )) : (
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Add your own quick-add buttons for fixed personal spends.
            </Text>
          )}
        </Surface>

        <Surface style={[styles.panel, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <View style={styles.sectionHeader}>
            <Text variant="titleLarge">Recurring Expenses</Text>
            <Button mode="text" onPress={() => setRecurringDialogVisible(true)}>Add</Button>
          </View>
          {recurringRules.length > 0 ? recurringRules.map((rule, index) => (
            <View key={`${rule.name || rule.category}-${rule.startDate}-${index}`} style={styles.recurringRow}>
              <View style={styles.recurringInfo}>
                <Text variant="bodyLarge">{rule.name?.trim() || rule.category}</Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Rs {Number(rule.amount).toFixed(2)} | {rule.frequency} | starts {formatDate(rule.startDate)}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {rule.payment_mode}{rule.platform ? ` | ${rule.platform}` : ''}{rule.note ? ` | ${rule.note}` : ''}
                </Text>
              </View>
              <Button compact mode="text" onPress={() => handleRemoveRecurringRule(index)}>Remove</Button>
            </View>
          )) : (
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Set repeating bills, subscriptions, or rent once and the app will post them automatically.
            </Text>
          )}
        </Surface>

        {loadingSummary ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator animating color={theme.colors.primary} />
            <Text variant="bodyMedium">Loading selected month...</Text>
          </View>
        ) : null}

        <Surface style={[styles.panel, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <Text variant="titleLarge" style={styles.sectionTitle}>Category Breakdown</Text>
          {summaryData.categories.length > 0 ? (
            <SimpleBarChart
              items={summaryData.categories.map((item) => ({
                label: item.category,
                total: item.total,
                color: categoryColors[item.category] || CATEGORY_COLORS[item.category] || theme.colors.primary,
              }))}
            />
          ) : (
            <EmptyState title="No monthly data yet" description="Add expenses this month to view category-wise analysis." />
          )}
        </Surface>

        <Surface style={[styles.panel, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <Text variant="titleLarge" style={styles.sectionTitle}>Payment Mode Split</Text>
          {summaryData.paymentModes?.length > 0 ? (
            <SimpleBarChart
              items={summaryData.paymentModes.map((item) => ({
                label: item.payment_mode,
                total: item.total,
                color: PAYMENT_MODE_COLORS[item.payment_mode] || theme.colors.primary,
              }))}
            />
          ) : (
            <EmptyState title="No payment data yet" description="Cash, online, and card totals for this month will appear here." />
          )}
        </Surface>

        <Surface style={[styles.panel, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <Text variant="titleLarge" style={styles.sectionTitle}>Daily Totals</Text>
          {summaryData.dailyTotals.length > 0 ? (
            summaryData.dailyTotals.map((item) => (
              <View key={item.date} style={styles.listRow}>
                <Text variant="bodyLarge">{item.date}</Text>
                <Text variant="titleSmall">Rs {Number(item.total).toFixed(2)}</Text>
              </View>
            ))
          ) : (
            <EmptyState title="No daily totals yet" description="Your daily totals for the current month will appear here." />
          )}
        </Surface>

        <Surface style={[styles.panel, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <Text variant="titleLarge" style={styles.sectionTitle}>Overall Snapshot</Text>
          <View style={styles.listRow}>
            <Text variant="bodyLarge">All recorded expenses</Text>
            <Text variant="titleSmall">{totalExpenseCount}</Text>
          </View>
          <View style={styles.listRow}>
            <Text variant="bodyLarge">Monthly categories used</Text>
            <Text variant="titleSmall">{summaryData.categories.length}</Text>
          </View>
          <View style={styles.listRow}>
            <Text variant="bodyLarge">Highest spend day</Text>
            <Text variant="titleSmall">
              {highestSpendDay ? `${highestSpendDay.date} | Rs ${Number(highestSpendDay.total).toFixed(2)}` : 'N/A'}
            </Text>
          </View>
        </Surface>
      </ScrollView>

      <Portal>
        <Dialog visible={budgetDialogVisible} onDismiss={() => setBudgetDialogVisible(false)}>
          <Dialog.Title>Monthly Budget</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Budget Amount"
              mode="outlined"
              keyboardType="decimal-pad"
              value={budgetInput}
              onChangeText={(value) => setBudgetInput(value.replace(/[^0-9.]/g, ''))}
              placeholder="0.00"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setBudgetDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleBudgetSave} loading={submitting}>Save</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={categoryDialogVisible} onDismiss={() => setCategoryDialogVisible(false)}>
          <Dialog.Title>Add Category</Dialog.Title>
          <Dialog.Content>
            <TextInput label="Category Name" mode="outlined" value={categoryInput} onChangeText={setCategoryInput} placeholder="Example: Health" />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCategoryDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleAddCategory} loading={submitting}>Save</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={presetDialogVisible} onDismiss={() => setPresetDialogVisible(false)}>
          <Dialog.Title>Add Quick Preset</Dialog.Title>
          <Dialog.Content>
            <TextInput label="Preset Name" mode="outlined" value={presetName} onChangeText={setPresetName} style={styles.dialogInput} />
            <TextInput
              label="Amount"
              mode="outlined"
              value={presetAmount}
              keyboardType="decimal-pad"
              onChangeText={(value) => setPresetAmount(value.replace(/[^0-9.]/g, ''))}
              style={styles.dialogInput}
            />
            <Text variant="titleSmall" style={styles.dialogLabel}>Category</Text>
            <View style={styles.dialogChips}>
              {categories.map((category) => (
                <Button key={category} compact mode={presetCategory === category ? 'contained' : 'outlined'} onPress={() => setPresetCategory(category)} style={styles.dialogChipButton}>
                  {category}
                </Button>
              ))}
            </View>
            <Text variant="titleSmall" style={styles.dialogLabel}>Payment Mode</Text>
            <View style={styles.dialogChips}>
              {PAYMENT_MODES.map((mode) => (
                <Button key={mode} compact mode={presetPaymentMode === mode ? 'contained' : 'outlined'} onPress={() => setPresetPaymentMode(mode)} style={styles.dialogChipButton}>
                  {mode}
                </Button>
              ))}
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setPresetDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleAddPreset} loading={submitting}>Save</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={colorDialogVisible} onDismiss={() => setColorDialogVisible(false)}>
          <Dialog.Title>Edit Category Color</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={styles.dialogHelper}>{selectedCategoryForColor || 'Category'}</Text>
            <TextInput
              label="Hex Color"
              mode="outlined"
              value={colorInput}
              onChangeText={(value) => setColorInput(normalizeHexColor(value))}
              placeholder="#3B82F6"
              style={styles.dialogInput}
            />
            <View style={styles.colorPalette}>
              {COLOR_PRESETS.map((color) => (
                <TouchableRipple
                  key={color}
                  borderless={false}
                  onPress={() => setColorInput(color)}
                  style={[
                    styles.colorSwatch,
                    {
                      backgroundColor: color,
                      borderColor: colorInput === color ? theme.colors.onSurface : 'transparent',
                    },
                  ]}
                >
                  <View />
                </TouchableRipple>
              ))}
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setColorDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleSaveCategoryColor} disabled={!/^#[0-9A-Fa-f]{6}$/.test(normalizeHexColor(colorInput))} loading={submitting}>Save</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={recurringDialogVisible} onDismiss={() => setRecurringDialogVisible(false)}>
          <Dialog.Title>Add Recurring Expense</Dialog.Title>
          <Dialog.ScrollArea style={styles.dialogScrollArea}>
            <ScrollView>
              <TextInput label="Name" mode="outlined" value={recurringName} onChangeText={setRecurringName} placeholder="Example: Rent" style={styles.dialogInput} />
              <TextInput
                label="Amount"
                mode="outlined"
                keyboardType="decimal-pad"
                value={recurringAmount}
                onChangeText={(value) => setRecurringAmount(value.replace(/[^0-9.]/g, ''))}
                style={styles.dialogInput}
              />
              <Text variant="titleSmall" style={styles.dialogLabel}>Category</Text>
              <View style={styles.dialogChips}>
                {categories.map((category) => (
                  <Button key={category} compact mode={recurringCategory === category ? 'contained' : 'outlined'} onPress={() => setRecurringCategory(category)} style={styles.dialogChipButton}>
                    {category}
                  </Button>
                ))}
              </View>
              <Text variant="titleSmall" style={styles.dialogLabel}>Payment Mode</Text>
              <View style={styles.dialogChips}>
                {PAYMENT_MODES.map((mode) => (
                  <Button key={mode} compact mode={recurringPaymentMode === mode ? 'contained' : 'outlined'} onPress={() => setRecurringPaymentMode(mode)} style={styles.dialogChipButton}>
                    {mode}
                  </Button>
                ))}
              </View>
              {recurringPaymentMode === 'Online' ? (
                <TextInput label="Platform" mode="outlined" value={recurringPlatform} onChangeText={setRecurringPlatform} placeholder="Example: GPay" style={styles.dialogInput} />
              ) : null}
              <TextInput label="Note" mode="outlined" value={recurringNote} onChangeText={setRecurringNote} placeholder="Optional" style={styles.dialogInput} />
              <Text variant="titleSmall" style={styles.dialogLabel}>Frequency</Text>
              <View style={styles.dialogChips}>
                {FREQUENCY_OPTIONS.map((frequency) => (
                  <Button key={frequency} compact mode={recurringFrequency === frequency ? 'contained' : 'outlined'} onPress={() => setRecurringFrequency(frequency)} style={styles.dialogChipButton}>
                    {frequency}
                  </Button>
                ))}
              </View>
              <Button mode="outlined" onPress={() => setShowRecurringDatePicker(true)} style={styles.dateButton}>
                Start Date: {formatDate(recurringStartDate)}
              </Button>
              {showRecurringDatePicker ? (
                <DateTimePicker
                  value={new Date(`${recurringStartDate}T00:00:00`)}
                  mode="date"
                  display="default"
                  maximumDate={new Date()}
                  onChange={(_, pickedDate) => {
                    setShowRecurringDatePicker(false);
                    if (pickedDate) {
                      const iso = new Date(pickedDate.getTime() - pickedDate.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
                      setRecurringStartDate(iso);
                    }
                  }}
                />
              ) : null}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setRecurringDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleAddRecurringRule} loading={submitting}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingTop: 10 },
  headerRow: { alignItems: 'center', flexDirection: 'row', marginBottom: 16 },
  heroCard: { borderRadius: 28, marginBottom: 18, padding: 20 },
  heroLabel: { fontWeight: '700', marginBottom: 8, textTransform: 'uppercase' },
  heroTitle: { fontWeight: '800', marginBottom: 10 },
  heading: { flex: 1, fontWeight: '800', textAlign: 'center' },
  cardRow: { flexDirection: 'row', marginBottom: 16 },
  loadingRow: { alignItems: 'center', flexDirection: 'row', gap: 12, marginBottom: 16 },
  spacer: { width: 12 },
  panel: { borderRadius: 24, marginBottom: 16, padding: 16 },
  sectionTitle: { marginBottom: 16 },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  budgetValue: { fontWeight: '800', marginBottom: 12 },
  progressTrack: { borderRadius: 999, height: 12, marginBottom: 12, overflow: 'hidden' },
  progressFill: { borderRadius: 999, height: '100%' },
  listRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  categoryRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  categoryInfo: { alignItems: 'center', flexDirection: 'row', flex: 1 },
  recurringRow: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  recurringInfo: { flex: 1, marginRight: 12 },
  rowActions: { alignItems: 'center', flexDirection: 'row' },
  colorDot: { borderRadius: 7, height: 14, marginRight: 12, width: 14 },
  dialogInput: { marginBottom: 12 },
  dialogLabel: { marginBottom: 10 },
  dialogHelper: { marginBottom: 12 },
  dialogChips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  dialogChipButton: { marginBottom: 8, marginRight: 8 },
  dialogScrollArea: { maxHeight: 430, paddingHorizontal: 24 },
  colorPalette: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  colorSwatch: { borderRadius: 16, borderWidth: 2, height: 32, marginBottom: 10, marginRight: 10, overflow: 'hidden', width: 32 },
  dateButton: { marginBottom: 8, marginTop: 4 },
});
