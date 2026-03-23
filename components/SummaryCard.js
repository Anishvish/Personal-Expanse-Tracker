import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Surface, Text, useTheme } from 'react-native-paper';

export default function SummaryCard({ label, value, accent }) {
  const theme = useTheme();

  return (
    <Surface
      style={[
        styles.card,
        {
          backgroundColor: accent || theme.colors.surface,
          borderColor: theme.colors.outline,
        },
      ]}
      elevation={1}
    >
      <View style={[styles.glow, { backgroundColor: theme.colors.primary }]} />
      <Text variant="labelLarge" style={styles.label}>
        {label}
      </Text>
      <Text variant="headlineSmall" style={styles.value}>
        {value}
      </Text>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 20,
    flex: 1,
    minHeight: 110,
    overflow: 'hidden',
    padding: 18,
  },
  glow: {
    borderRadius: 999,
    height: 84,
    opacity: 0.08,
    position: 'absolute',
    right: -24,
    top: -20,
    width: 84,
  },
  label: {
    opacity: 0.78,
  },
  value: {
    fontWeight: '800',
    marginTop: 16,
  },
});
