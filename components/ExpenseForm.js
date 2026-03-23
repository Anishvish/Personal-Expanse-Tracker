import React, { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Button, HelperText, Surface, Text, TextInput, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CategoryChip from './CategoryChip';
import { DEFAULT_EXPENSE_CATEGORIES, ONLINE_PLATFORMS, PAYMENT_MODES } from '../constants/categories';
import { useExpenses } from '../hooks/useExpenses';
import { formatDate, getTodayDateString, isValidISODate } from '../utils/date';

function validateExpense(form) {
  const amount = Number(form.amount);

  if (!form.amount || Number.isNaN(amount) || amount <= 0) {
    return 'Enter a valid amount greater than 0.';
  }

  if (!form.category) {
    return 'Select a category.';
  }

  if (!form.paymentMode) {
    return 'Select a payment mode.';
  }

  if (!isValidISODate(form.date)) {
    return 'Use a valid date in YYYY-MM-DD format.';
  }

  if (form.paymentMode === 'Online' && !form.platform.trim()) {
    return 'Select or enter the online platform name.';
  }

  if (form.paymentMode === 'Online' && form.platform === 'Other' && !form.customPlatform.trim()) {
    return 'Enter the online platform name.';
  }

  return '';
}

export default function ExpenseForm({
  initialValues,
  onSubmit,
  submitting,
  submitLabel,
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { categories } = useExpenses();
  const availableCategories = categories.length > 0 ? categories : DEFAULT_EXPENSE_CATEGORIES;
  const initialPlatform = initialValues?.platform || '';
  const initialPaymentMode =
    initialValues?.payment_mode || initialValues?.paymentMode || PAYMENT_MODES[0];
  const resolvedInitialPlatform = initialPaymentMode !== 'Online'
    ? ''
    : initialPlatform
      ? (ONLINE_PLATFORMS.includes(initialPlatform) ? initialPlatform : 'Other')
      : ONLINE_PLATFORMS[0];
  const [form, setForm] = useState({
    amount: initialValues?.amount ? String(initialValues.amount) : '',
    category: initialValues?.category || availableCategories[0],
    paymentMode: initialPaymentMode,
    platform: resolvedInitialPlatform,
    customPlatform: initialPlatform && !ONLINE_PLATFORMS.includes(initialPlatform) ? initialPlatform : '',
    note: initialValues?.note || '',
    date: initialValues?.date || getTodayDateString(),
  });
  const [error, setError] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const numericAmount = useMemo(() => Number(form.amount || 0), [form.amount]);
  const isOtherPlatform = form.platform === 'Other';

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async () => {
    const validationError = validateExpense(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    await onSubmit({
      amount: numericAmount,
      category: form.category,
      paymentMode: form.paymentMode,
      platform: form.paymentMode === 'Online'
        ? (isOtherPlatform ? form.customPlatform.trim() : form.platform.trim())
        : '',
      note: form.note,
      date: form.date,
    });
  };

  const handleDateChange = (_, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (selectedDate) {
      const nextDate = new Date(selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 10);
      updateField('date', nextDate);
    }
  };

  const handlePaymentModeChange = (mode) => {
    setForm((current) => ({
      ...current,
      paymentMode: mode,
      platform: mode === 'Online' ? current.platform || ONLINE_PLATFORMS[0] : '',
      customPlatform: mode === 'Online' ? current.customPlatform : '',
    }));
    if (error) {
      setError('');
    }
  };

  const handlePlatformChange = (platform) => {
    setForm((current) => ({
      ...current,
      platform,
      customPlatform: platform === 'Other' ? current.customPlatform : '',
    }));
    if (error) {
      setError('');
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        {
          paddingBottom: 24 + insets.bottom,
          paddingTop: 12,
        },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <Surface
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outline,
          },
        ]}
        elevation={1}
      >
        <Text variant="titleLarge" style={styles.sectionTitle}>
          Expense Details
        </Text>

        <TextInput
          label="Amount"
          mode="outlined"
          value={form.amount}
          onChangeText={(value) => updateField('amount', value.replace(/[^0-9.]/g, ''))}
          keyboardType="decimal-pad"
          placeholder="0.00"
          style={styles.input}
        />

        <Text variant="titleSmall" style={styles.label}>
          Category
        </Text>
        <View style={styles.chipsRow}>
          {availableCategories.map((category) => (
            <CategoryChip
              key={category}
              label={category}
              selected={form.category === category}
              onPress={() => updateField('category', category)}
            />
          ))}
        </View>

        <Text variant="titleSmall" style={styles.label}>
          Payment Mode
        </Text>
        <View style={styles.chipsRow}>
          {PAYMENT_MODES.map((mode) => (
            <CategoryChip
              key={mode}
              label={mode}
              selected={form.paymentMode === mode}
              onPress={() => handlePaymentModeChange(mode)}
            />
          ))}
        </View>

        {form.paymentMode === 'Online' ? (
          <>
            <Text variant="titleSmall" style={styles.label}>
              Online Platform
            </Text>
            <View style={styles.chipsRow}>
              {ONLINE_PLATFORMS.map((platform) => (
                <CategoryChip
                  key={platform}
                  label={platform}
                  selected={form.platform === platform}
                  onPress={() => handlePlatformChange(platform)}
                />
              ))}
            </View>

            {isOtherPlatform ? (
              <TextInput
                label="Custom Platform Name"
                mode="outlined"
                value={form.customPlatform}
                onChangeText={(value) => updateField('customPlatform', value)}
                placeholder="Enter platform name"
                style={styles.input}
              />
            ) : null}
          </>
        ) : null}

        <Text variant="titleSmall" style={styles.label}>
          Date
        </Text>
        <Pressable onPress={() => setShowDatePicker(true)}>
          <View pointerEvents="none">
            <TextInput
              label="Expense Date"
              mode="outlined"
              value={formatDate(form.date)}
              placeholder="Select date"
              style={styles.input}
              right={<TextInput.Icon icon="calendar" />}
            />
          </View>
        </Pressable>

        {showDatePicker ? (
          <DateTimePicker
            value={new Date(`${form.date}T00:00:00`)}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={handleDateChange}
            maximumDate={new Date()}
          />
        ) : null}

        <TextInput
          label="Note (Optional)"
          mode="outlined"
          value={form.note}
          onChangeText={(value) => updateField('note', value)}
          multiline
          numberOfLines={3}
          style={styles.input}
        />

        <HelperText type={error ? 'error' : 'info'} visible>
          {error || 'Pick the expense date and add an online platform when relevant.'}
        </HelperText>

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={submitting}
          disabled={submitting}
          contentStyle={styles.buttonContent}
        >
          {submitLabel}
        </Button>
      </Surface>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
  },
  card: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
  },
  sectionTitle: {
    marginBottom: 18,
  },
  input: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 10,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  buttonContent: {
    minHeight: 48,
  },
});
