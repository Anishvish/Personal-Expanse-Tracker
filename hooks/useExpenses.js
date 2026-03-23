import { useExpenseContext } from '../context/ExpenseContext';

export function useExpenses() {
  return useExpenseContext();
}
