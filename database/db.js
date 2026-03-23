import * as SQLite from 'expo-sqlite';
import { CATEGORY_COLORS, DEFAULT_EXPENSE_CATEGORIES } from '../constants/categories';

let databasePromise;

async function getDatabase() {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync('expense-tracker.db');
  }

  return databasePromise;
}

async function ensurePlatformColumn(db) {
  const columns = await db.getAllAsync('PRAGMA table_info(expenses)');
  const hasPlatformColumn = columns.some((column) => column.name === 'platform');

  if (!hasPlatformColumn) {
    await db.execAsync('ALTER TABLE expenses ADD COLUMN platform TEXT;');
  }
}

async function initializeSettingsTable(db) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT
    );
  `);
  await db.runAsync(
    'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)',
    ['monthly_budget', '']
  );
  await db.runAsync(
    'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)',
    ['custom_categories', JSON.stringify(DEFAULT_EXPENSE_CATEGORIES)]
  );
  await db.runAsync(
    'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)',
    ['quick_presets', '[]']
  );
  await db.runAsync(
    'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)',
    ['category_colors', JSON.stringify(CATEGORY_COLORS)]
  );
  await db.runAsync(
    'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)',
    ['recurring_rules', '[]']
  );
}

async function initializeIndexes(db) {
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);
    CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
    CREATE INDEX IF NOT EXISTS idx_expenses_payment_mode ON expenses(payment_mode);
    CREATE INDEX IF NOT EXISTS idx_expenses_platform ON expenses(platform);
    CREATE INDEX IF NOT EXISTS idx_expenses_date_id ON expenses(date DESC, id DESC);
  `);
}

function buildExpenseFilters(filters = {}) {
  const conditions = [];
  const params = [];

  if (filters.date) {
    conditions.push('date = ?');
    params.push(filters.date);
  }

  if (filters.category && filters.category !== 'All') {
    conditions.push('category = ?');
    params.push(filters.category);
  }

  if (filters.paymentMode && filters.paymentMode !== 'All') {
    conditions.push('payment_mode = ?');
    params.push(filters.paymentMode);
  }

  if (filters.search?.trim()) {
    const query = `%${filters.search.trim().toLowerCase()}%`;
    conditions.push(`(
      lower(COALESCE(note, '')) LIKE ?
      OR lower(COALESCE(platform, '')) LIKE ?
      OR lower(category) LIKE ?
      OR lower(payment_mode) LIKE ?
    )`);
    params.push(query, query, query, query);
  }

  return {
    params,
    whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
  };
}

export async function initializeDatabase() {
  const db = await getDatabase();
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      payment_mode TEXT NOT NULL,
      platform TEXT,
      note TEXT,
      date TEXT NOT NULL
    );
  `);
  await ensurePlatformColumn(db);
  await initializeSettingsTable(db);
  await initializeIndexes(db);
}

export async function insertExpense(expense) {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO expenses (amount, category, payment_mode, platform, note, date)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      expense.amount,
      expense.category,
      expense.paymentMode,
      expense.platform?.trim() || '',
      expense.note?.trim() || '',
      expense.date,
    ]
  );

  return result.lastInsertRowId;
}

export async function getAllExpenses(filters = {}) {
  const db = await getDatabase();
  const { params, whereClause } = buildExpenseFilters(filters);

  return db.getAllAsync(
    `SELECT * FROM expenses ${whereClause} ORDER BY date DESC, id DESC`,
    params
  );
}

export async function getExpensesPage(filters = {}) {
  const db = await getDatabase();
  const limit = Number(filters.limit) > 0 ? Number(filters.limit) : 25;
  const offset = Number(filters.offset) >= 0 ? Number(filters.offset) : 0;
  const { params, whereClause } = buildExpenseFilters(filters);

  return db.getAllAsync(
    `SELECT * FROM expenses
     ${whereClause}
     ORDER BY date DESC, id DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
}

export async function getExpenseCount(filters = {}) {
  const db = await getDatabase();
  const { params, whereClause } = buildExpenseFilters(filters);
  const row = await db.getFirstAsync(
    `SELECT COUNT(*) AS count FROM expenses ${whereClause}`,
    params
  );

  return row?.count ?? 0;
}

export async function getRecentExpenses(limit = 12) {
  const db = await getDatabase();
  return db.getAllAsync(
    `SELECT * FROM expenses ORDER BY date DESC, id DESC LIMIT ?`,
    [limit]
  );
}

export async function getExpensesByDate(date) {
  const db = await getDatabase();
  return db.getAllAsync(
    'SELECT * FROM expenses WHERE date = ? ORDER BY id DESC',
    [date]
  );
}

export async function getExpenseById(id) {
  const db = await getDatabase();
  return db.getFirstAsync('SELECT * FROM expenses WHERE id = ?', [id]);
}

export async function updateExpense(id, expense) {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE expenses
     SET amount = ?, category = ?, payment_mode = ?, platform = ?, note = ?, date = ?
     WHERE id = ?`,
    [
      expense.amount,
      expense.category,
      expense.paymentMode,
      expense.platform?.trim() || '',
      expense.note?.trim() || '',
      expense.date,
      id,
    ]
  );
}

export async function deleteExpense(id) {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM expenses WHERE id = ?', [id]);
}

export async function getMonthlySummary(monthKey) {
  const db = await getDatabase();
  const totalRow = await db.getFirstAsync(
    `SELECT COALESCE(SUM(amount), 0) AS total
     FROM expenses
     WHERE substr(date, 1, 7) = ?`,
    [monthKey]
  );

  const categoryRows = await db.getAllAsync(
    `SELECT category, COALESCE(SUM(amount), 0) AS total
     FROM expenses
     WHERE substr(date, 1, 7) = ?
     GROUP BY category
     ORDER BY total DESC`,
    [monthKey]
  );

  const dailyRows = await db.getAllAsync(
    `SELECT date, COALESCE(SUM(amount), 0) AS total
     FROM expenses
     WHERE substr(date, 1, 7) = ?
     GROUP BY date
     ORDER BY date DESC`,
    [monthKey]
  );

  const paymentModeRows = await db.getAllAsync(
    `SELECT payment_mode, COALESCE(SUM(amount), 0) AS total
     FROM expenses
     WHERE substr(date, 1, 7) = ?
     GROUP BY payment_mode
     ORDER BY total DESC`,
    [monthKey]
  );

  const transactionCountRow = await db.getFirstAsync(
    `SELECT COUNT(*) AS count
     FROM expenses
     WHERE substr(date, 1, 7) = ?`,
    [monthKey]
  );

  const averageDailySpend =
    dailyRows.length > 0
      ? dailyRows.reduce((sum, row) => sum + Number(row.total), 0) / dailyRows.length
      : 0;

  return {
    total: totalRow?.total ?? 0,
    categories: categoryRows,
    dailyTotals: dailyRows,
    paymentModes: paymentModeRows,
    transactionCount: transactionCountRow?.count ?? 0,
    averageDailySpend,
  };
}

export async function getMonthlyBudget() {
  const db = await getDatabase();
  const row = await db.getFirstAsync(
    'SELECT value FROM settings WHERE key = ?',
    ['monthly_budget']
  );

  if (!row?.value) {
    return 0;
  }

  return Number(row.value) || 0;
}

export async function saveMonthlyBudget(amount) {
  const db = await getDatabase();
  const normalized = amount && Number(amount) > 0 ? String(Number(amount)) : '';
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    ['monthly_budget', normalized]
  );
}

export async function getCustomCategories() {
  const db = await getDatabase();
  const row = await db.getFirstAsync(
    'SELECT value FROM settings WHERE key = ?',
    ['custom_categories']
  );

  if (!row?.value) {
    return DEFAULT_EXPENSE_CATEGORIES;
  }

  try {
    const parsed = JSON.parse(row.value);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_EXPENSE_CATEGORIES;
  } catch {
    return DEFAULT_EXPENSE_CATEGORIES;
  }
}

export async function saveCustomCategories(categories) {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    ['custom_categories', JSON.stringify(categories)]
  );
}

export async function getQuickPresets() {
  const db = await getDatabase();
  const row = await db.getFirstAsync(
    'SELECT value FROM settings WHERE key = ?',
    ['quick_presets']
  );

  if (!row?.value) {
    return [];
  }

  try {
    const parsed = JSON.parse(row.value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveQuickPresets(presets) {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    ['quick_presets', JSON.stringify(presets)]
  );
}

export async function getCategoryColors() {
  const db = await getDatabase();
  const row = await db.getFirstAsync(
    'SELECT value FROM settings WHERE key = ?',
    ['category_colors']
  );

  if (!row?.value) {
    return CATEGORY_COLORS;
  }

  try {
    const parsed = JSON.parse(row.value);
    return parsed && typeof parsed === 'object' ? { ...CATEGORY_COLORS, ...parsed } : CATEGORY_COLORS;
  } catch {
    return CATEGORY_COLORS;
  }
}

export async function saveCategoryColors(categoryColors) {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    ['category_colors', JSON.stringify(categoryColors)]
  );
}

export async function getRecurringRules() {
  const db = await getDatabase();
  const row = await db.getFirstAsync(
    'SELECT value FROM settings WHERE key = ?',
    ['recurring_rules']
  );

  if (!row?.value) {
    return [];
  }

  try {
    const parsed = JSON.parse(row.value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveRecurringRules(rules) {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    ['recurring_rules', JSON.stringify(rules)]
  );
}
