import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Surface, Text, useTheme } from 'react-native-paper';
import { CATEGORY_COLORS, PAYMENT_MODE_COLORS } from '../constants/categories';
import { useExpenses } from '../hooks/useExpenses';
import { formatDate } from '../utils/date';

export default function ExpenseItem({ expense, onPress }) {
  const theme = useTheme();
  const { categoryColors } = useExpenses();
  const helperText = expense.payment_mode === 'Online' && expense.platform?.trim()
    ? expense.note?.trim()
      ? `${expense.platform} | ${expense.note}`
      : `Online via ${expense.platform}`
    : expense.note?.trim() || 'No note added';

  return (
    <Pressable onPress={onPress}>
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
        <View style={styles.row}>
          <View style={styles.leftContent}>
            <View
              style={[
                styles.dot,
                {
                  backgroundColor:
                    categoryColors[expense.category] || CATEGORY_COLORS[expense.category] || theme.colors.primary,
                },
              ]}
            />
            <View style={styles.textBlock}>
              <Text variant="titleMedium">{expense.category}</Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {helperText}
              </Text>
            </View>
          </View>
          <Text variant="titleMedium" style={styles.amount}>
            Rs {Number(expense.amount).toFixed(2)}
          </Text>
        </View>

        <View style={styles.footer}>
          <View
            style={[
              styles.modeBadge,
              {
                backgroundColor:
                  PAYMENT_MODE_COLORS[expense.payment_mode] || theme.colors.primaryContainer,
              },
            ]}
          >
            <Text variant="labelMedium" style={styles.modeText}>
              {expense.payment_mode}
            </Text>
          </View>
          <Text variant="bodySmall" style={[styles.dateText, { color: theme.colors.onSurfaceVariant }]}>
            {formatDate(expense.date)}
          </Text>
        </View>
      </Surface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  leftContent: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    marginRight: 12,
  },
  dot: {
    borderRadius: 7,
    height: 14,
    marginRight: 12,
    width: 14,
  },
  textBlock: {
    flex: 1,
  },
  amount: {
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  modeBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  modeText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  dateText: {
    marginLeft: 12,
  },
});
