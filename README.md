 # Expense Tracker App

A full-stack mobile expense tracking app I built using React Native for the frontend and Node.js + Express + MongoDB for the backend. The app lets you log, manage, and analyze your daily expenses with a clean dark UI.

---

## Tech Stack

**Frontend:** React Native, React Navigation, Context API, Axios, AsyncStorage  
**Backend:** Node.js, Express.js, MongoDB, Mongoose, JWT, bcryptjs

---

## Project Structure

```
expense-tracker/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   └── Expense.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── expenses.js
│   │   └── categories.js
│   ├── middleware/
│   │   └── auth.js
│   ├── server.js
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── screens/
    │   │   ├── SplashScreen.js
    │   │   ├── LoginScreen.js
    │   │   ├── DashboardScreen.js
    │   │   ├── ExpensesScreen.js
    │   │   ├── AddExpenseScreen.js
    │   │   ├── AnalyticsScreen.js
    │   │   ├── ProfileScreen.js
    │   │   └── ExpenseDetailScreen.js
    │   ├── context/
    │   │   ├── AuthContext.js
    │   │   └── ExpenseContext.js
    │   ├── navigation/
    │   │   └── AppNavigator.js
    │   ├── services/
    │   │   └── api.js
    │   └── utils/
    │       ├── theme.js
    │       └── helpers.js
    ├── App.js
    └── package.json
```

---

## Features

- User registration and login with JWT authentication
- Add, edit, and delete expenses (amount, category, date, note, payment method)
- Dashboard showing monthly total, budget progress, and category-wise breakdown
- Analytics screen with monthly trends and daily activity charts
- Search and filter expenses by category
- Infinite scroll pagination
- Profile management — set name, budget, and currency
- Persistent login using AsyncStorage
- Loading, error, and empty states handled throughout

---

## Prerequisites

Make sure you have the following set up before running the project:

- Node.js 18 or above
- npm
- MongoDB Atlas account (or a local MongoDB instance)
- React Native development environment — follow the [official setup guide](https://reactnative.dev/docs/environment-setup)
  - Android: Android Studio + Android SDK
  - iOS: Xcode (macOS only)

---

## Setup Instructions

### 1. Clone the repo

```bash
git clone <https://github.com/Arjun-hub-create/expense-tracker-.git>
cd expense-tracker
```

---

### 2. Backend

```bash
cd backend
npm install
```

Create a `.env` file by copying the example:

```bash
cp .env.example .env
```

Open `.env` and fill in your values:

```
PORT=5000
MONGODB_URI=your_mongodb_connection_string_here
JWT_SECRET=pick_any_long_random_string_here
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

Start the server:

```bash
npm run dev
```

If everything is connected correctly, you should see:

```
✅ MongoDB connected successfully
🚀 Server running on port 5000
```

You can also do a quick health check:

```bash
curl http://localhost:5000/health
```

---

### 3. Frontend

Open a new terminal:

```bash
cd frontend
npm install
```

In `src/services/api.js`, set the correct base URL depending on how you're running the app:

```js
// Android emulator
export const BASE_URL = 'http://10.0.2.2:5000/api';

// iOS simulator
export const BASE_URL = 'http://localhost:5000/api';

// Physical device — replace with your machine's local IP
export const BASE_URL = 'http://192.168.x.x:5000/api';
```

If you're on iOS, install pods:

```bash
cd ios && pod install && cd ..
```

---

### 4. Run the app

**Android:**

```bash
# Terminal 1 — start Metro
npx react-native start

# Terminal 2 — run on Android
npx react-native run-android
```

**iOS:**

```bash
npx react-native run-ios
```

---

## API Endpoints

### Auth

| Method | Endpoint | Auth Required |
|--------|----------|---------------|
| POST | `/api/auth/register` | No |
| POST | `/api/auth/login` | No |
| GET | `/api/auth/me` | Yes |
| PUT | `/api/auth/profile` | Yes |
| PUT | `/api/auth/change-password` | Yes |

### Expenses

| Method | Endpoint | Auth Required |
|--------|----------|---------------|
| GET | `/api/expenses` | Yes |
| GET | `/api/expenses/summary` | Yes |
| GET | `/api/expenses/:id` | Yes |
| POST | `/api/expenses` | Yes |
| PUT | `/api/expenses/:id` | Yes |
| DELETE | `/api/expenses/:id` | Yes |

Supported query params for `GET /api/expenses`:

```
page, limit, category, startDate, endDate, search, sortBy, order
```

---

## Notes

- The JWT token is stored in AsyncStorage and automatically attached to every API request via an Axios interceptor.
- State is managed using React's Context API with `useReducer` — no Redux needed.
- If the token expires or is invalid, the app automatically clears storage and redirects to the login screen.
- All forms include client-side validation before hitting the API.

---

## Dependencies

### Backend
- express
- mongoose
- jsonwebtoken
- bcryptjs
- express-validator
- dotenv
- cors
- morgan
- nodemon (dev)

### Frontend
- react-native
- @react-navigation/native + native-stack + bottom-tabs
- axios
- @react-native-async-storage/async-storage
- react-native-reanimated
- react-native-gesture-handler
- react-native-safe-area-context
- react-native-screens
- react-native-linear-gradient
- react-native-toast-message
- date-fns
