import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import ExpenseForm from '../components/ExpenseForm';
import ScreenContainer from '../components/ScreenContainer';
import { useExpenses } from '../hooks/useExpenses';
import { getTodayDateString } from '../utils/date';

export default function AddExpenseScreen({ navigation }) {
  const { addExpense, latestExpense, submitting } = useExpenses();
  const initialValues = latestExpense
    ? {
        ...latestExpense,
        date: getTodayDateString(),
      }
    : undefined;

  const handleSubmit = async (expense) => {
    try {
      await addExpense(expense);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Unable to save expense', error.message || 'Please try again.');
    }
  };

  return (
    <ScreenContainer edges={['bottom']}>
      <View style={styles.container}>
        <ExpenseForm
          initialValues={initialValues}
          submitLabel="Save Expense"
          submitting={submitting}
          onSubmit={handleSubmit}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
