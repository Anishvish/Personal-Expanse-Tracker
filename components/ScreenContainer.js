import React from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ScreenContainer({ children, edges = ['top'], style }) {
  const theme = useTheme();

  return (
    <SafeAreaView
      edges={edges}
      style={[styles.container, { backgroundColor: theme.colors.background }, style]}
    >
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
