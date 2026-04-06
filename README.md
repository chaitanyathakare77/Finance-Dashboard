# FinDash - Finance Dashboard

A production-ready finance dashboard built with React, Tailwind CSS, and Recharts.

## ✨ Features

- 📊 Interactive charts and visualizations
- 💰 Income & expense tracking
- 📈 Monthly trends analysis
- 🎨 Dark mode support
- 👤 Role-based access (Admin/Viewer)
- 📥 CSV export functionality
- 🔍 Search and filter transactions
- 💾 Local storage persistence

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Start development server:**
```bash
npm run dev
```
The app will open at `http://localhost:3000`

3. **Build for production:**
```bash
npm run build
```

4. **Preview production build:**
```bash
npm run preview
```

## 📁 Project Structure

```
.
├── src/
│   ├── App.jsx           # Main dashboard component
│   ├── main.jsx          # React entry point
│   └── styles.css        # Global Tailwind CSS
├── index-new.html        # Root HTML file
├── package.json          # Dependencies
├── vite.config.js        # Vite configuration
├── tailwind.config.js    # Tailwind CSS configuration
└── postcss.config.js     # PostCSS configuration
```

## 🛠️ Technologies

- **React 18** - UI library
- **Recharts** - Chart library
- **Tailwind CSS** - Utility-first CSS
- **Vite** - Build tool & dev server
- **Font Awesome** - Icons

## 📊 Key Components

### Summary Cards
Displays total balance, income, and expenses with visual indicators

### Charts
- **Line Chart**: Monthly income vs expense trends
- **Pie Chart**: Spending breakdown by category

### Smart Insights
- Highest spending category
- Monthly expense comparison
- Average daily expense calculation

### Transactions Table
- Full transaction history
- Search & filter capabilities
- Sorting by date, amount, or category
- Admin edit/delete functionality

## 👤 Roles

- **Admin Mode**: Full access to add, edit, and delete transactions
- **Viewer Mode**: Read-only access to view all data

## 💾 Data Persistence

The app uses browser localStorage to save transaction data automatically. Switch roles and refresh—your data persists!

## 🌙 Dark Mode

Toggle dark mode with the sun/moon button in the header. Preference persists in localStorage.

## 📤 Export

Download your transactions as CSV file with the "Export CSV" button.

---

**Ready to track your finances!** 💸
