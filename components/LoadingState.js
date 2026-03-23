import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text, useTheme } from 'react-native-paper';

export default function LoadingState({ message = 'Loading...' }) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <ActivityIndicator animating color={theme.colors.primary} size="large" />
      <Text variant="bodyLarge" style={styles.text}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  text: {
    marginTop: 16,
  },
});
