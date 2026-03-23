# 💰 Personal Expense Tracker

A feature-rich React Native mobile app built with **Expo**, **React Navigation**, **React Native Paper (Material Design 3)**, and **SQLite** for tracking daily personal expenses — entirely offline.

## ✨ Features

### Core
- **Add, edit, and delete** expenses with full form validation
- **Payment modes** — Cash, Online, or Card
- **Online platform tracking** — GPay, PhonePe, Paytm, UPI, or custom platforms
- **Native date picker** for selecting expense dates
- **SQLite persistence** — all data stays on-device via `expo-sqlite`

### Productivity
- **Quick Add** — repeat recent expenses or saved presets with a single tap
- **Recurring rules** — automatically generate daily, weekly, or monthly expenses
- **Customizable categories** — add, remove, or reorder expense categories
- **Custom category colors** — personalize the look of each category

### Insights
- **Home screen** — day-view with date navigator, daily total, and budget remaining
- **All Expenses** — paginated list with search, date, category, and payment mode filters
- **Monthly Summary** — category-wise breakdown, daily totals bar chart, payment mode split, average daily spend, and transaction count
- **Month navigation** — browse previous months for historical analytics

### Design
- **Material Design 3** — powered by React Native Paper
- **Dark mode** — auto-detects device theme
- **Monthly budget** — set a target and track remaining balance
- **Responsive layout** — safe area and bottom tab bar aware

## 📁 Project Structure

```text
├── App.js                  # Root component with providers
├── navigation/
│   └── AppNavigator.js     # Stack + Bottom Tab navigation
├── screens/
│   ├── HomeScreen.js       # Day view with quick add & date navigator
│   ├── AllExpensesScreen.js# Paginated, filterable expense list
│   ├── SummaryScreen.js    # Monthly analytics & charts
│   ├── AddExpenseScreen.js # New expense form
│   └── EditExpenseScreen.js# Edit/delete existing expense
├── components/
│   ├── ExpenseForm.js      # Shared add/edit form
│   ├── ExpenseItem.js      # Single expense card
│   ├── CategoryChip.js     # Selectable chip for filters/forms
│   ├── SummaryCard.js      # Stat display card
│   ├── SimpleBarChart.js   # Lightweight bar chart
│   ├── EmptyState.js       # Empty list placeholder
│   ├── LoadingState.js     # Loading spinner
│   └── ScreenContainer.js  # Safe-area wrapper
├── context/
│   └── ExpenseContext.js   # Global state & DB operations
├── hooks/
│   └── useExpenses.js      # Context consumer hook
├── database/
│   └── db.js               # SQLite schema, queries & migrations
├── constants/
│   └── categories.js       # Default categories, payment modes, colors
├── utils/
│   └── date.js             # Date formatting & validation helpers
└── theme.js                # Light & dark Material Design 3 themes
```

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) or `npx expo`
- Android/iOS emulator or a physical device with [Expo Go](https://expo.dev/go)

### Installation

```bash
# Clone the repo
git clone <your-repo-url>
cd Personal-Expanse-Tracker

# Install dependencies
npm install

# Start the Expo dev server
npm start
```

### Run on Device

- Press **`a`** for Android emulator
- Press **`i`** for iOS simulator
- Scan the **QR code** with Expo Go on your phone

## 🗄️ Database Schema

```sql
CREATE TABLE expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  amount REAL NOT NULL,
  category TEXT NOT NULL,
  payment_mode TEXT NOT NULL,
  platform TEXT,
  note TEXT,
  date TEXT NOT NULL
);

CREATE TABLE settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT
);
```

**Indexes:** `date DESC`, `category`, `payment_mode`, `platform`, `(date DESC, id DESC)`

## 📦 Key Dependencies

| Package | Purpose |
|---|---|
| `expo` | Managed workflow runtime |
| `expo-sqlite` | Local SQLite database |
| `@react-navigation/native` | Navigation framework |
| `@react-navigation/bottom-tabs` | Bottom tab navigator |
| `@react-navigation/native-stack` | Stack navigator |
| `react-native-paper` | Material Design 3 UI components |
| `@react-native-community/datetimepicker` | Native date picker |
| `react-native-safe-area-context` | Safe area insets |
| `react-native-screens` | Native screen containers |

## 📝 Notes

- All dates are stored as **`YYYY-MM-DD`** strings and selected via a native date picker.
- Currency is displayed as **Rs** (Indian Rupees).
- The SQLite database is automatically initialized on first launch with WAL journal mode.
- Settings (budget, categories, presets, recurring rules, colors) are stored in a `settings` key-value table.
