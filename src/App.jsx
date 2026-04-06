import { useState, useEffect, useMemo } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec489a', '#14b8a6', '#6b7280']

// Mock data generator
const generateMockTransactions = () => {
  const categories = ['Food & Dining', 'Shopping', 'Transport', 'Entertainment', 'Bills & Utilities', 'Health', 'Salary', 'Freelance']
  const transactions = []
  const startDate = new Date(2025, 9, 6) // October 6, 2025
  const endDate = new Date(2026, 3, 6) // April 6, 2026
  
  // Generate transactions from October 31, 2025 to February 27, 2026
  const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
  for (let i = 0; i < days; i++) {
    const type = i % 7 === 0 ? 'income' : (i % 5 === 0 ? 'income' : 'expense')
    const category = type === 'income' ? (i % 3 === 0 ? 'Freelance' : 'Salary') : categories[Math.floor(Math.random() * (categories.length - 2))]
    const amount = type === 'income' ? Math.floor(Math.random() * 2000) + 800 : Math.floor(Math.random() * 350) + 20
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    transactions.push({
      id: i,
      date: date.toISOString().slice(0, 10),
      description: type === 'income' ? (category === 'Salary' ? 'Monthly Salary' : 'Freelance Project') : `Purchase at ${category}`,
      category: category,
      amount: amount,
      type: type,
    })
  }
  return transactions.sort((a, b) => new Date(b.date) - new Date(a.date))
}

const computeSummary = (transactions) => {
  let totalIncome = 0, totalExpense = 0
  transactions.forEach(t => {
    if (t.type === 'income') totalIncome += t.amount
    else totalExpense += t.amount
  })
  const balance = totalIncome - totalExpense
  return { totalIncome, totalExpense, balance }
}

const getCategorySpending = (transactions) => {
  const spending = {}
  transactions.filter(t => t.type === 'expense').forEach(t => {
    spending[t.category] = (spending[t.category] || 0) + t.amount
  })
  return Object.entries(spending).map(([name, value]) => ({ name, value }))
}

const getMonthlyTrend = (transactions, startDate = null, endDate = null) => {
  const monthMap = new Map()
  
  // Default date range: Oct 6, 2025 to Apr 6, 2026 (6 months)
  let filterStartDate = startDate ? new Date(startDate) : new Date(2025, 9, 6)
  let filterEndDate = endDate ? new Date(endDate) : new Date(2026, 3, 6)
  
  // First, create entries for all months in the range (even empty ones)
  let year = filterStartDate.getFullYear()
  let month = filterStartDate.getMonth()
  let endYear = filterEndDate.getFullYear()
  let endMonth = filterEndDate.getMonth()
  
  while (year < endYear || (year === endYear && month <= endMonth)) {
    const key = `${year}-${month + 1}`
    const date = new Date(year, month, 1)
    const label = date.toLocaleString('default', { month: 'short', year: 'numeric' })
    monthMap.set(key, { label, income: 0, expense: 0 })
    
    month++
    if (month > 11) {
      month = 0
      year++
    }
  }
  
  // Then, add transaction data
  transactions.forEach(t => {
    const d = new Date(t.date)
    if (d >= filterStartDate && d <= filterEndDate) {
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`
      const entry = monthMap.get(key)
      if (entry) {
        if (t.type === 'income') entry.income += t.amount
        else entry.expense += t.amount
      }
    }
  })
  
  // Sort by year-month numerically
  const sorted = Array.from(monthMap.entries()).sort((a, b) => {
    const [aYear, aMonth] = a[0].split('-').map(Number)
    const [bYear, bMonth] = b[0].split('-').map(Number)
    return aYear !== bYear ? aYear - bYear : aMonth - bMonth
  })
  
  return sorted.map(([_, data]) => ({ name: data.label, income: data.income, expense: data.expense }))
}

const getInsights = (transactions) => {
  const categorySpend = getCategorySpending(transactions)
  const highest = categorySpend.length ? categorySpend.reduce((max, curr) => curr.value > max.value ? curr : max, categorySpend[0]) : { name: 'None', value: 0 }
  
  // Use Apr 2026 as current month and Mar 2026 as previous month
  const currentMonth = 3 // April
  const currentYear = 2026
  const prevMonth = 2 // March
  const prevYear = 2026
  
  const currentExpenses = transactions.filter(t => {
    const d = new Date(t.date)
    return t.type === 'expense' && d.getMonth() === currentMonth && d.getFullYear() === currentYear
  }).reduce((sum, t) => sum + t.amount, 0)
  
  const prevExpenses = transactions.filter(t => {
    const d = new Date(t.date)
    return t.type === 'expense' && d.getMonth() === prevMonth && d.getFullYear() === prevYear
  }).reduce((sum, t) => sum + t.amount, 0)
  
  let monthlyDiff = null
  if (prevExpenses > 0) {
    const diffPercent = ((currentExpenses - prevExpenses) / prevExpenses * 100).toFixed(1)
    monthlyDiff = { current: currentExpenses, previous: prevExpenses, percent: diffPercent }
  }
  return { highestSpendingCategory: highest.name, highestAmount: highest.value, monthlyDiff }
}

export default function App() {
  const [transactions, setTransactions] = useState(() => generateMockTransactions())
  const [role, setRole] = useState('admin')
  const [filterType, setFilterType] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' })
  const [darkMode, setDarkMode] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingTx, setEditingTx] = useState(null)
  const [chartStartDate, setChartStartDate] = useState(() => {
    return new Date(2025, 9, 6).toISOString().slice(0, 10) // Oct 6, 2025
  })
  const [chartEndDate, setChartEndDate] = useState(() => {
    return new Date(2026, 3, 6).toISOString().slice(0, 10) // Apr 6, 2026
  })
  const [formData, setFormData] = useState({ description: '', amount: '', category: 'Food & Dining', type: 'expense', date: new Date(2026, 3, 6).toISOString().slice(0, 10) })
  const [txDateFilter, setTxDateFilter] = useState('all') // all, thisMonth, lastMonth, last3Months, custom
  const [txCustomStartDate, setTxCustomStartDate] = useState('')
  const [txCustomEndDate, setTxCustomEndDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    const saved = localStorage.getItem('fintransactions')
    if (saved) {
      try {
        setTransactions(JSON.parse(saved))
      } catch (e) {}
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('fintransactions', JSON.stringify(transactions))
  }, [transactions])

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const { totalIncome, totalExpense, balance } = useMemo(() => computeSummary(transactions), [transactions])
  const categoryData = useMemo(() => getCategorySpending(transactions), [transactions])
  const trendData = useMemo(() => getMonthlyTrend(transactions, chartStartDate, chartEndDate), [transactions, chartStartDate, chartEndDate])
  const insights = useMemo(() => getInsights(transactions), [transactions])

  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions]
    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType)
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(t => t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q))
    }
    
    // Apply date filter for transactions
    const today = new Date(2026, 3, 6) // Using Apr 6, 2026 as "today"
    let startFilter, endFilter
    
    if (txDateFilter === 'thisMonth') {
      startFilter = new Date(today.getFullYear(), today.getMonth(), 1)
      endFilter = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    } else if (txDateFilter === 'lastMonth') {
      startFilter = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      endFilter = new Date(today.getFullYear(), today.getMonth(), 0)
    } else if (txDateFilter === 'last3Months') {
      startFilter = new Date(today.getFullYear(), today.getMonth() - 2, 1)
      endFilter = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    } else if (txDateFilter === 'custom' && txCustomStartDate && txCustomEndDate) {
      startFilter = new Date(txCustomStartDate)
      endFilter = new Date(txCustomEndDate)
      endFilter.setHours(23, 59, 59, 999) // Include full day
    }
    
    if (startFilter && endFilter) {
      filtered = filtered.filter(t => {
        const txDate = new Date(t.date)
        return txDate >= startFilter && txDate <= endFilter
      })
    }
    
    filtered.sort((a, b) => {
      if (sortConfig.key === 'date') {
        return sortConfig.direction === 'asc' ? new Date(a.date) - new Date(b.date) : new Date(b.date) - new Date(a.date)
      } else if (sortConfig.key === 'amount') {
        return sortConfig.direction === 'asc' ? a.amount - b.amount : b.amount - a.amount
      } else if (sortConfig.key === 'category') {
        return sortConfig.direction === 'asc' ? a.category.localeCompare(b.category) : b.category.localeCompare(a.category)
      }
      return 0
    })
    return filtered
  }, [transactions, filterType, searchQuery, sortConfig, txDateFilter, txCustomStartDate, txCustomEndDate])

  const requestSort = (key) => {
    let direction = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc'
    setSortConfig({ key, direction })
    setCurrentPage(1) // Reset to page 1 when sorting
  }

  const openAddModal = () => {
    if (role !== 'admin') return
    setEditingTx(null)
    setFormData({ description: '', amount: '', category: 'Food & Dining', type: 'expense', date: new Date(2026, 3, 6).toISOString().slice(0, 10) })
    setShowModal(true)
  }

  const openEditModal = (tx) => {
    if (role !== 'admin') return
    setEditingTx(tx)
    setFormData({
      description: tx.description,
      amount: tx.amount,
      category: tx.category,
      type: tx.type,
      date: tx.date,
    })
    setShowModal(true)
  }

  const deleteTransaction = (id) => {
    if (role !== 'admin') return
    if (window.confirm('Delete this transaction?')) {
      setTransactions(prev => prev.filter(t => t.id !== id))
      setCurrentPage(1) // Reset to page 1 after deletion
    }
  }

  const clearLocalStorage = () => {
    if (window.confirm('Clear all saved data? This cannot be undone.')) {
      localStorage.removeItem('fintransactions')
      setTransactions(generateMockTransactions())
      setCurrentPage(1)
    }
  }

  const handleSave = () => {
    if (!formData.description || !formData.amount || parseFloat(formData.amount) <= 0) {
      alert('Please fill valid description and amount')
      return
    }
    const amountNum = parseFloat(formData.amount)
    if (editingTx) {
      setTransactions(prev => prev.map(t => t.id === editingTx.id ? {
        ...editingTx,
        description: formData.description,
        amount: amountNum,
        category: formData.category,
        type: formData.type,
        date: formData.date,
      } : t))
    } else {
      const newId = Date.now()
      const newTx = {
        id: newId,
        description: formData.description,
        amount: amountNum,
        category: formData.category,
        type: formData.type,
        date: formData.date,
      }
      setTransactions(prev => [newTx, ...prev])
    }
    setShowModal(false)
  }

  const exportCSV = () => {
    const headers = ['ID', 'Date', 'Description', 'Category', 'Amount', 'Type']
    const rows = transactions.map(t => [t.id, t.date, t.description, t.category, t.amount, t.type])
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `transactions_${new Date().toISOString()}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
          <div className="flex items-center gap-3">
            <i className="fas fa-chart-line text-3xl text-blue-600"></i>
            <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>FinDash</h1>
            <span className={`text-xs px-2 py-1 rounded-full ${role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'} font-medium`}>
              {role === 'admin' ? 'Admin Mode' : 'Viewer Mode'}
            </span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 text-yellow-300' : 'bg-gray-200 text-gray-700'}`}>
              <i className={`fas ${darkMode ? 'fa-sun' : 'fa-moon'}`}></i>
            </button>
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm px-3 py-1">
              <i className="fas fa-user-lock text-gray-500"></i>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="bg-transparent text-sm font-medium outline-none dark:text-white">
                <option value="viewer">👁️ Viewer</option>
                <option value="admin">🛡️ Admin</option>
              </select>
            </div>
            {role === 'admin' && (
              <button onClick={openAddModal} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl shadow-md flex items-center gap-2 transition text-sm">
                <i className="fas fa-plus"></i> Add Transaction
              </button>
            )}
            <button onClick={exportCSV} className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-xl text-sm flex items-center gap-1">
              <i className="fas fa-download"></i> Export CSV
            </button>
            {role === 'admin' && (
              <button onClick={clearLocalStorage} className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-xl text-sm flex items-center gap-1">
                <i className="fas fa-trash"></i> Clear Data
              </button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5 card-hover border-l-4 border-blue-500">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Total Balance</span>
              <i className="fas fa-wallet text-blue-500 text-xl"></i>
            </div>
            <p className="text-2xl font-bold mt-2 dark:text-white">${balance.toFixed(2)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5 card-hover border-l-4 border-green-500">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Total Income</span>
              <i className="fas fa-arrow-up text-green-500"></i>
            </div>
            <p className="text-2xl font-bold mt-2 dark:text-white">${totalIncome.toFixed(2)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5 card-hover border-l-4 border-red-500">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Total Expenses</span>
              <i className="fas fa-arrow-down text-red-500"></i>
            </div>
            <p className="text-2xl font-bold mt-2 dark:text-white">${totalExpense.toFixed(2)}</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm">
            <div className="flex flex-col gap-3 mb-3">
              <div className="flex justify-between items-center">
                <h2 className="font-semibold text-lg dark:text-white">
                  <i className="fas fa-chart-line mr-2 text-blue-500"></i>Balance Trend (Monthly)
                </h2>
                <button 
                  onClick={() => {
                    setChartStartDate(new Date(2025, 9, 6).toISOString().slice(0, 10)) // Oct 6, 2025
                    setChartEndDate(new Date(2026, 3, 6).toISOString().slice(0, 10)) // Apr 6, 2026
                  }} 
                  className="text-xs bg-blue-100 dark:bg-blue-500 text-blue-700 dark:text-white px-2 py-1 rounded hover:bg-blue-200 dark:hover:bg-blue-600"
                >
                  <i className="fas fa-redo mr-1"></i>Reset
                </button>
              </div>
              <div className="flex gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">From:</label>
                  <input 
                    type="date" 
                    value={chartStartDate} 
                    onChange={(e) => setChartStartDate(e.target.value)}
                    className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">To:</label>
                  <input 
                    type="date" 
                    value={chartEndDate} 
                    onChange={(e) => setChartEndDate(e.target.value)}
                    className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#4b5563' : '#e5e7eb'} />
                  <XAxis dataKey="name" tick={{ fill: darkMode ? '#ddd' : '#374151' }} />
                  <YAxis tick={{ fill: darkMode ? '#ddd' : '#374151' }} />
                  <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1f2937' : 'white', borderColor: '#ccc' }} />
                  <Legend />
                  <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} name="Income" />
                  <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} name="Expense" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm">
            <h2 className="font-semibold text-lg mb-3 dark:text-white">
              <i className="fas fa-chart-pie mr-2 text-purple-500"></i>Spending by Category
            </h2>
            {categoryData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-400">No expense data</div>
            ) : (
              <div style={{ width: '100%', height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Insights */}
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-5 mb-8 shadow-sm">
          <h2 className="font-bold text-xl mb-3 dark:text-white">
            <i className="fas fa-lightbulb text-yellow-500 mr-2"></i>Smart Insights
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <i className="fas fa-chart-simple text-2xl text-blue-600"></i>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-300">Highest Spending</p>
                <p className="font-bold dark:text-white">
                  {insights.highestSpendingCategory} <span className="text-sm font-normal">(${insights.highestAmount.toFixed(2)})</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <i className="fas fa-calendar-alt text-2xl text-green-600"></i>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-300">Monthly Comparison</p>
                {insights.monthlyDiff ? (
                  <p className="font-bold dark:text-white">
                    {insights.monthlyDiff.percent > 0 ? '📈 +' : '📉 '}{Math.abs(insights.monthlyDiff.percent)}% vs last month
                  </p>
                ) : (
                  <p className="dark:text-white">Not enough data</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <i className="fas fa-coins text-2xl text-amber-500"></i>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-300">Avg Expense/Day (30d)</p>
                <p className="font-bold dark:text-white">${(totalExpense / 30).toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-xl dark:text-white">
                <i className="fas fa-list-ul mr-2 text-gray-600"></i>Transactions
              </h2>
              <span className="text-xs text-gray-500 dark:text-gray-400">Total: {filteredTransactions.length}</span>
            </div>
            
            {/* Date Range Filters */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => { setTxDateFilter('all'); setCurrentPage(1) }}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${txDateFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'}`}
              >
                All Time
              </button>
              <button
                onClick={() => { setTxDateFilter('thisMonth'); setCurrentPage(1) }}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${txDateFilter === 'thisMonth' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'}`}
              >
                This Month
              </button>
              <button
                onClick={() => { setTxDateFilter('lastMonth'); setCurrentPage(1) }}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${txDateFilter === 'lastMonth' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'}`}
              >
                Last Month
              </button>
              <button
                onClick={() => { setTxDateFilter('last3Months'); setCurrentPage(1) }}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${txDateFilter === 'last3Months' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'}`}
              >
                Last 3 Months
              </button>
              <button
                onClick={() => { setTxDateFilter('custom'); setCurrentPage(1) }}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${txDateFilter === 'custom' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'}`}
              >
                Custom Range
              </button>
            </div>
            
            {/* Custom Date Range Inputs */}
            {txDateFilter === 'custom' && (
              <div className="flex gap-2 flex-wrap items-center">
                <input
                  type="date"
                  value={txCustomStartDate}
                  onChange={(e) => { setTxCustomStartDate(e.target.value); setCurrentPage(1) }}
                  className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 dark:bg-gray-700 dark:text-white"
                  placeholder="Start Date"
                />
                <input
                  type="date"
                  value={txCustomEndDate}
                  onChange={(e) => { setTxCustomEndDate(e.target.value); setCurrentPage(1) }}
                  className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 dark:bg-gray-700 dark:text-white"
                  placeholder="End Date"
                />
                {txCustomStartDate && txCustomEndDate && new Date(txCustomStartDate) > new Date(txCustomEndDate) && (
                  <span className="text-xs text-red-600 dark:text-red-400 font-medium">⚠️ Start date cannot be after end date</span>
                )}
                {txCustomStartDate && txCustomEndDate && (
                  <button
                    onClick={() => { setTxCustomStartDate(''); setTxCustomEndDate(''); setCurrentPage(1) }}
                    className="text-xs bg-gray-400 hover:bg-gray-500 text-white px-2 py-1.5 rounded-lg"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}
            
            {/* Search and Type Filter */}
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative flex-grow min-w-[200px]">
                <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                <input type="text" placeholder="Search description/category" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 pr-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm dark:bg-gray-700 dark:text-white w-full" />
              </div>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="text-sm border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-1.5 dark:bg-gray-700 dark:text-white">
                <option value="all">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
              <div className="text-sm text-gray-500 dark:text-gray-400">Role: {role === 'admin' ? '✏️ Editable' : '🔍 View Only'}</div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  {['date', 'description', 'category', 'amount'].map((key) => (
                    <th key={key} onClick={() => requestSort(key)} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800">
                      <div className="flex items-center gap-1">
                        {key.charAt(0).toUpperCase() + key.slice(1)} {sortConfig.key === key && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </div>
                    </th>
                  ))}
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">Type</th>
                  {role === 'admin' && <th className="px-5 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={role === 'admin' ? 6 : 5} className="text-center py-8 text-gray-400">No transactions found</td>
                  </tr>
                ) : (
                  filteredTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(tx => (
                    <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                      <td className="px-5 py-3 whitespace-nowrap text-sm dark:text-gray-200">{tx.date}</td>
                      <td className="px-5 py-3 text-sm dark:text-gray-200 max-w-[180px] truncate">{tx.description}</td>
                      <td className="px-5 py-3 text-sm">
                        <span className="px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-xs">{tx.category}</span>
                      </td>
                      <td className={`px-5 py-3 whitespace-nowrap text-sm font-medium ${tx.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                        ${tx.amount.toFixed(2)}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span className={`capitalize text-xs px-2 py-0.5 rounded-full ${tx.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {tx.type}
                        </span>
                      </td>
                      {role === 'admin' && (
                        <td className="px-5 py-3 whitespace-nowrap text-right">
                          <button onClick={() => openEditModal(tx)} className="text-blue-500 hover:text-blue-700 mr-3">
                            <i className="fas fa-edit"></i>
                          </button>
                          <button onClick={() => deleteTransaction(tx.id)} className="text-red-500 hover:text-red-700">
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {filteredTransactions.length > 0 && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center flex-wrap gap-3">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} transactions
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <i className="fas fa-chevron-left"></i> Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.ceil(filteredTransactions.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 text-sm rounded-lg ${currentPage === page ? 'bg-blue-600 text-white' : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredTransactions.length / itemsPerPage)))}
                  disabled={currentPage === Math.ceil(filteredTransactions.length / itemsPerPage)}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Next <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4 dark:text-white">{editingTx ? 'Edit Transaction' : 'Add Transaction'}</h3>
            <div className="space-y-3">
              <input type="text" placeholder="Description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full border rounded-xl p-2 dark:bg-gray-700 dark:text-white" />
              <input type="number" placeholder="Amount" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} className="w-full border rounded-xl p-2 dark:bg-gray-700 dark:text-white" />
              <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full border rounded-xl p-2 dark:bg-gray-700 dark:text-white">
                <option>Food & Dining</option>
                <option>Shopping</option>
                <option>Transport</option>
                <option>Entertainment</option>
                <option>Bills & Utilities</option>
                <option>Salary</option>
                <option>Freelance</option>
              </select>
              <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full border rounded-xl p-2 dark:bg-gray-700 dark:text-white">
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
              <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full border rounded-xl p-2 dark:bg-gray-700 dark:text-white" />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-xl">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-xl">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
