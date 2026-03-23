import React from 'react';
import { StyleSheet } from 'react-native';
import { Chip, useTheme } from 'react-native-paper';
import { CATEGORY_COLORS } from '../constants/categories';
import { useExpenses } from '../hooks/useExpenses';

export default function CategoryChip({ label, selected, onPress, compact = false }) {
  const theme = useTheme();
  const { categoryColors } = useExpenses();
  const chipColor = categoryColors[label] || CATEGORY_COLORS[label] || theme.colors.primary;

  return (
    <Chip
      compact={compact}
      selected={selected}
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected
            ? chipColor
            : theme.colors.surfaceVariant,
        },
      ]}
      textStyle={{ color: selected ? '#ffffff' : theme.colors.onSurface }}
    >
      {label}
    </Chip>
  );
}

const styles = StyleSheet.create({
  chip: {
    marginBottom: 8,
    marginRight: 8,
  },
});
