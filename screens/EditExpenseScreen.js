import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Button, Dialog, Portal, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ExpenseForm from '../components/ExpenseForm';
import LoadingState from '../components/LoadingState';
import ScreenContainer from '../components/ScreenContainer';
import { useExpenses } from '../hooks/useExpenses';

export default function EditExpenseScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { expenseId } = route.params;
  const { getExpense, updateExpense, removeExpense, submitting } = useExpenses();
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteVisible, setDeleteVisible] = useState(false);

  useEffect(() => {
    async function loadExpense() {
      try {
        const row = await getExpense(expenseId);
        if (!row) {
          throw new Error('The selected expense was not found.');
        }
        setExpense(row);
      } catch (error) {
        Alert.alert('Unable to load expense', error.message || 'Please try again.');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    }

    loadExpense();
  }, [expenseId, getExpense, navigation]);

  const handleUpdate = async (updatedExpense) => {
    try {
      await updateExpense(expenseId, updatedExpense);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Unable to update expense', error.message || 'Please try again.');
    }
  };

  const handleDelete = async () => {
    try {
      await removeExpense(expenseId);
      setDeleteVisible(false);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Unable to delete expense', error.message || 'Please try again.');
    }
  };

  if (loading) {
    return <LoadingState message="Loading expense..." />;
  }

  return (
    <ScreenContainer edges={['bottom']}>
      <View style={styles.container}>
        <ExpenseForm
          initialValues={expense}
          submitLabel="Update Expense"
          submitting={submitting}
          onSubmit={handleUpdate}
        />

        <View style={[styles.footer, { paddingBottom: 16 + insets.bottom }]}>
          <Button mode="outlined" textColor="#dc2626" onPress={() => setDeleteVisible(true)}>
            Delete Expense
          </Button>
        </View>

        <Portal>
          <Dialog visible={deleteVisible} onDismiss={() => setDeleteVisible(false)}>
            <Dialog.Title>Delete expense?</Dialog.Title>
            <Dialog.Content>
              <Text variant="bodyMedium">This action cannot be undone.</Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setDeleteVisible(false)}>Cancel</Button>
              <Button onPress={handleDelete} loading={submitting} disabled={submitting}>
                Delete
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  footer: {
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
});
