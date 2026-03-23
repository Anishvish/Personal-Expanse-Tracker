import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  getCategoryColors,
  getCustomCategories,
  deleteExpense as deleteExpenseRecord,
  getExpenseCount,
  getExpenseById,
  getExpensesPage,
  getExpensesByDate,
  getMonthlyBudget,
  getMonthlySummary,
  getQuickPresets,
  getRecentExpenses,
  getRecurringRules,
  initializeDatabase,
  insertExpense,
  saveCategoryColors as persistCategoryColors,
  saveCustomCategories as persistCustomCategories,
  saveQuickPresets as persistQuickPresets,
  saveRecurringRules as persistRecurringRules,
  saveMonthlyBudget as persistMonthlyBudget,
  updateExpense as updateExpenseRecord,
} from '../database/db';
import { getMonthKey, getTodayDateString } from '../utils/date';

const ExpenseContext = createContext(null);

export function ExpenseProvider({ children }) {
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [todayExpenses, setTodayExpenses] = useState([]);
  const [monthlySummary, setMonthlySummary] = useState({
    total: 0,
    categories: [],
    dailyTotals: [],
    paymentModes: [],
    transactionCount: 0,
    averageDailySpend: 0,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [monthlyBudget, setMonthlyBudget] = useState(0);
  const [totalExpenseCount, setTotalExpenseCount] = useState(0);
  const [categories, setCategories] = useState([]);
  const [quickPresets, setQuickPresets] = useState([]);
  const [categoryColors, setCategoryColors] = useState({});
  const [recurringRules, setRecurringRules] = useState([]);

  const applyRecurringRules = useCallback(async () => {
    const rules = await getRecurringRules();
    if (rules.length === 0) {
      setRecurringRules([]);
      return;
    }

    const today = getTodayDateString();
    const nextRules = [...rules];
    const generatedExpenses = [];

    const addInterval = (dateString, frequency) => {
      const date = new Date(`${dateString}T00:00:00`);
      if (frequency === 'weekly') {
        date.setDate(date.getDate() + 7);
      } else if (frequency === 'monthly') {
        date.setMonth(date.getMonth() + 1);
      } else {
        date.setDate(date.getDate() + 1);
      }
      return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    };

    nextRules.forEach((rule, index) => {
      let cursor = rule.lastGeneratedDate
        ? addInterval(rule.lastGeneratedDate, rule.frequency)
        : rule.startDate;

      while (cursor && cursor <= today) {
        generatedExpenses.push({
          amount: Number(rule.amount),
          category: rule.category,
          paymentMode: rule.payment_mode,
          platform: rule.platform || '',
          note: rule.note || rule.name || '',
          date: cursor,
        });
        nextRules[index] = { ...nextRules[index], lastGeneratedDate: cursor };
        cursor = addInterval(cursor, rule.frequency);
      }
    });

    if (generatedExpenses.length > 0) {
      for (const expense of generatedExpenses) {
        await insertExpense(expense);
      }
      await persistRecurringRules(nextRules);
    }

    setRecurringRules(nextRules);
  }, []);

  const refreshExpenses = useCallback(async () => {
    const today = getTodayDateString();
    const monthKey = getMonthKey(today);

    try {
      setError('');
      await applyRecurringRules();
      const [recentRows, todayRows, summary, budget, totalCount, savedCategories, savedPresets, savedColors, savedRecurringRules] = await Promise.all([
        getRecentExpenses(),
        getExpensesByDate(today),
        getMonthlySummary(monthKey),
        getMonthlyBudget(),
        getExpenseCount(),
        getCustomCategories(),
        getQuickPresets(),
        getCategoryColors(),
        getRecurringRules(),
      ]);

      setRecentExpenses(recentRows);
      setTodayExpenses(todayRows);
      setMonthlySummary(summary);
      setMonthlyBudget(budget);
      setTotalExpenseCount(totalCount);
      setCategories(savedCategories);
      setQuickPresets(savedPresets);
      setCategoryColors(savedColors);
      setRecurringRules(savedRecurringRules);
    } catch (refreshError) {
      setError(refreshError.message || 'Unable to load expenses.');
      throw refreshError;
    }
  }, [applyRecurringRules]);

  useEffect(() => {
    async function bootstrap() {
      try {
        await initializeDatabase();
        await refreshExpenses();
      } catch (bootstrapError) {
        setError(bootstrapError.message || 'Unable to initialize the expense database.');
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, [refreshExpenses]);

  const addExpense = useCallback(async (expense) => {
    setSubmitting(true);
    try {
      await insertExpense(expense);
      await refreshExpenses();
    } finally {
      setSubmitting(false);
    }
  }, [refreshExpenses]);

  const updateExpense = useCallback(async (id, expense) => {
    setSubmitting(true);
    try {
      await updateExpenseRecord(id, expense);
      await refreshExpenses();
    } finally {
      setSubmitting(false);
    }
  }, [refreshExpenses]);

  const removeExpense = useCallback(async (id) => {
    setSubmitting(true);
    try {
      await deleteExpenseRecord(id);
      await refreshExpenses();
    } finally {
      setSubmitting(false);
    }
  }, [refreshExpenses]);

  const getExpense = useCallback(async (id) => getExpenseById(id), []);
  const getExpensesForDate = useCallback(async (date) => getExpensesByDate(date), []);
  const getSummaryForMonth = useCallback(async (monthKey) => getMonthlySummary(monthKey), []);
  const getExpenseHistoryPage = useCallback(async (filters) => getExpensesPage(filters), []);
  const getExpenseHistoryCount = useCallback(async (filters) => getExpenseCount(filters), []);
  const updateMonthlyBudget = useCallback(async (amount) => {
    setSubmitting(true);
    try {
      await persistMonthlyBudget(amount);
      await refreshExpenses();
    } finally {
      setSubmitting(false);
    }
  }, [refreshExpenses]);
  const updateCategories = useCallback(async (nextCategories) => {
    setSubmitting(true);
    try {
      await persistCustomCategories(nextCategories);
      await refreshExpenses();
    } finally {
      setSubmitting(false);
    }
  }, [refreshExpenses]);
  const updateQuickPresets = useCallback(async (nextPresets) => {
    setSubmitting(true);
    try {
      await persistQuickPresets(nextPresets);
      await refreshExpenses();
    } finally {
      setSubmitting(false);
    }
  }, [refreshExpenses]);
  const updateCategoryColors = useCallback(async (nextCategoryColors) => {
    setSubmitting(true);
    try {
      await persistCategoryColors(nextCategoryColors);
      await refreshExpenses();
    } finally {
      setSubmitting(false);
    }
  }, [refreshExpenses]);
  const updateRecurringRules = useCallback(async (nextRules) => {
    setSubmitting(true);
    try {
      await persistRecurringRules(nextRules);
      await refreshExpenses();
    } finally {
      setSubmitting(false);
    }
  }, [refreshExpenses]);

  const recentExpenseTemplates = useMemo(() => {
    const seen = new Set();
    return recentExpenses.filter((expense) => {
      const key = [
        expense.amount,
        expense.category,
        expense.payment_mode,
        expense.platform || '',
        expense.note || '',
      ].join('|');

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    }).slice(0, 4);
  }, [recentExpenses]);

  const latestExpense = recentExpenses[0] || null;

  const value = useMemo(() => ({
    recentExpenses,
    todayExpenses,
    monthlySummary,
    monthlyBudget,
    categories,
    quickPresets,
    categoryColors,
    recurringRules,
    totalExpenseCount,
    loading,
    submitting,
    error,
    latestExpense,
    recentExpenseTemplates,
    addExpense,
    updateExpense,
    removeExpense,
    refreshExpenses,
    getExpense,
    getExpensesForDate,
    getSummaryForMonth,
    getExpenseHistoryPage,
    getExpenseHistoryCount,
    updateMonthlyBudget,
    updateCategories,
    updateQuickPresets,
    updateCategoryColors,
    updateRecurringRules,
  }), [
    addExpense,
    categories,
    categoryColors,
    error,
    getExpense,
    getExpensesForDate,
    getExpenseHistoryCount,
    getExpenseHistoryPage,
    getSummaryForMonth,
    latestExpense,
    loading,
    monthlyBudget,
    monthlySummary,
    quickPresets,
    recentExpenses,
    recentExpenseTemplates,
    recurringRules,
    refreshExpenses,
    removeExpense,
    submitting,
    todayExpenses,
    totalExpenseCount,
    updateCategories,
    updateCategoryColors,
    updateMonthlyBudget,
    updateQuickPresets,
    updateRecurringRules,
    updateExpense,
  ]);

  return <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>;
}

export function useExpenseContext() {
  const context = useContext(ExpenseContext);

  if (!context) {
    throw new Error('useExpenseContext must be used within ExpenseProvider.');
  }

  return context;
}
