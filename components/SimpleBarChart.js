import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

export default function SimpleBarChart({ items }) {
  const theme = useTheme();
  const maxValue = Math.max(...items.map((item) => Number(item.total)), 1);

  return (
    <View>
      {items.map((item) => {
        const widthPercent = (Number(item.total) / maxValue) * 100;

        return (
          <View key={`${item.label}-${item.total}`} style={styles.row}>
            <View style={styles.labelRow}>
              <Text variant="bodyMedium" style={styles.label}>
                {item.label}
              </Text>
              <Text variant="labelLarge">Rs {Number(item.total).toFixed(2)}</Text>
            </View>
            <View style={[styles.track, { backgroundColor: theme.colors.surfaceVariant }]}>
              <View
                style={[
                  styles.fill,
                  {
                    backgroundColor: item.color || theme.colors.primary,
                    width: `${Math.max(widthPercent, 8)}%`,
                  },
                ]}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    flex: 1,
    marginRight: 12,
  },
  track: {
    borderRadius: 999,
    height: 10,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 999,
    height: '100%',
  },
});
