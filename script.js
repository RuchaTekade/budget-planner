document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const incomeForm = document.getElementById('income-form');
    const expenseForm = document.getElementById('expense-form');
    const transactionsList = document.getElementById('transactions-list');
    const balanceAmount = document.getElementById('balance-amount');
    const totalIncomeElement = document.getElementById('total-income');
    const totalExpensesElement = document.getElementById('total-expenses');
    const balanceProgress = document.getElementById('balance-progress');
    const modal = document.getElementById('modal');
    const closeModal = document.getElementById('close-modal');
    const confirmModal = document.getElementById('confirm-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    
    // Initialize Chart
    const ctx = document.getElementById('expense-chart').getContext('2d');
    let expenseChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#FF6384', // Housing - Red
                '#36A2EB', // Food - Blue
                '#FFCE56', // Transportation - Yellow
                '#4BC0C0', // Entertainment - Teal
                '#9966FF', // Healthcare - Purple
                '#FF9F40', // Education - Orange
                '#8AC24A', // Utilities - Green
                '#FF6B6B'  // Other - Coral
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                },
                // Add this tooltip configuration:
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: $${value} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '70%',
            animation: {
                animateScale: true,
                animateRotate: true
            }
        }
    });
    
    // Data Store
    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    let nextId = transactions.length > 0 ? Math.max(...transactions.map(t => t.id)) + 1 : 1;
    
    // Initialize App
    updateUI();
    
    // Event Listeners
    incomeForm.addEventListener('submit', addIncome);
    expenseForm.addEventListener('submit', addExpense);
    closeModal.addEventListener('click', hideModal);
    confirmModal.addEventListener('click', hideModal);
    
    // Functions
    function addIncome(e) {
        e.preventDefault();
        
        const source = document.getElementById('income-source').value.trim();
        const amount = parseFloat(document.getElementById('income-amount').value);
        
        if (!source || isNaN(amount) || amount <= 0) {
            showModal('Invalid Input', 'Please provide a valid income source and amount.');
            return;
        }
        
        const transaction = {
            id: nextId++,
            type: 'income',
            source,
            amount,
            date: new Date().toISOString()
        };
        
        transactions.push(transaction);
        saveTransactions();
        updateUI();
        
        // Reset form
        incomeForm.reset();
        
        // Animation feedback
        const incomeCard = document.querySelector('.income-card');
        incomeCard.style.transform = 'scale(1.05)';
        setTimeout(() => {
            incomeCard.style.transform = 'scale(1)';
        }, 300);
    }
    
    function addExpense(e) {
        e.preventDefault();
        
        const category = document.getElementById('expense-category').value;
        const description = document.getElementById('expense-description').value.trim();
        const amount = parseFloat(document.getElementById('expense-amount').value);
        
        if (!category || isNaN(amount) || amount <= 0) {
            showModal('Invalid Input', 'Please provide a valid expense category and amount.');
            return;
        }
        
        const transaction = {
            id: nextId++,
            type: 'expense',
            category,
            description: description || category,
            amount,
            date: new Date().toISOString()
        };
        
        transactions.push(transaction);
        saveTransactions();
        updateUI();
        
        // Reset form
        expenseForm.reset();
        
        // Animation feedback
        const expenseCard = document.querySelector('.expense-card');
        expenseCard.style.transform = 'scale(1.05)';
        setTimeout(() => {
            expenseCard.style.transform = 'scale(1)';
        }, 300);
    }
    
    function deleteTransaction(id) {
        transactions = transactions.filter(transaction => transaction.id !== id);
        saveTransactions();
        updateUI();
    }
    
    function saveTransactions() {
        localStorage.setItem('transactions', JSON.stringify(transactions));
    }
    
    function updateUI() {
        // Calculate totals
        const incomes = transactions.filter(t => t.type === 'income');
        const expenses = transactions.filter(t => t.type === 'expense');
        
        const totalIncome = incomes.reduce((sum, t) => sum + t.amount, 0);
        const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
        const balance = totalIncome - totalExpenses;
        
        // Update summary cards
        totalIncomeElement.textContent = `$${totalIncome.toFixed(2)}`;
        totalExpensesElement.textContent = `$${totalExpenses.toFixed(2)}`;
        balanceAmount.textContent = `$${balance.toFixed(2)}`;
        
        // Update progress bar
        const maxAmount = Math.max(totalIncome, totalExpenses, balance);
        const progressPercentage = maxAmount > 0 ? (balance / maxAmount) * 100 : 0;
        balanceProgress.style.width = `${progressPercentage}%`;
        
        // Update transactions list
        renderTransactions();
        
        // Update chart
        updateChart();
    }
    
    function renderTransactions() {
        if (transactions.length === 0) {
            transactionsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-coins"></i>
                    <p>No transactions yet</p>
                </div>
            `;
            return;
        }
        
        // Sort by date (newest first)
        const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        transactionsList.innerHTML = sortedTransactions.slice(0, 10).map(transaction => {
            if (transaction.type === 'income') {
                return `
                    <div class="transaction-item income-transaction">
                        <div class="transaction-details">
                            <span class="transaction-title">${transaction.source}</span>
                            <span class="transaction-date">${formatDate(transaction.date)}</span>
                        </div>
                        <div class="transaction-amount">+$${transaction.amount.toFixed(2)}</div>
                        <div class="transaction-actions">
                            <button onclick="deleteTransaction(${transaction.id})" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            } else {
                return `
                    <div class="transaction-item expense-transaction">
                        <div class="transaction-details">
                            <span class="transaction-title">${transaction.description}</span>
                            <span class="transaction-category">${transaction.category}</span>
                        </div>
                        <div class="transaction-amount">-$${transaction.amount.toFixed(2)}</div>
                        <div class="transaction-actions">
                            <button onclick="deleteTransaction(${transaction.id})" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            }
        }).join('');
    }
    
    function updateChart() {
        const expenses = transactions.filter(t => t.type === 'expense');
        
        if (expenses.length === 0) {
            expenseChart.data.labels = ['No expenses yet'];
            expenseChart.data.datasets[0].data = [1];
            expenseChart.data.datasets[0].backgroundColor = ['#f1f1f1'];
            expenseChart.update();
            return;
        }
        
        // Group by category
        const categories = {};
        expenses.forEach(expense => {
            if (!categories[expense.category]) {
                categories[expense.category] = 0;
            }
            categories[expense.category] += expense.amount;
        });
        
        // Sort by amount (descending)
        const sortedCategories = Object.entries(categories)
            .sort((a, b) => b[1] - a[1]);
        
        // Update chart data
        expenseChart.data.labels = sortedCategories.map(item => item[0]);
        expenseChart.data.datasets[0].data = sortedCategories.map(item => item[1]);
        expenseChart.data.datasets[0].backgroundColor = [
            '#FF6384', // Red (Housing)
            '#36A2EB', // Blue (Food)
            '#FFCE56', // Yellow (Transportation)
            '#4BC0C0', // Teal (Entertainment)
            '#9966FF', // Purple (Healthcare)
            '#FF9F40', // Orange (Education)
            '#8AC24A', // Green (Utilities)
            '#FF6B6B'  // Coral (Other)
        ].slice(0, sortedCategories.length);
        
        expenseChart.update();
    }
    
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }
    
    function showModal(title, message) {
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        modal.style.display = 'flex';
    }
    
    function hideModal() {
        modal.style.display = 'none';
    }
    
    // Make deleteTransaction available globally
    window.deleteTransaction = deleteTransaction;
});
// Theme Toggle Functionality
const themeSwitch = document.getElementById('theme-switch');
const body = document.body;

// Check for saved theme preference
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  body.setAttribute('data-theme', savedTheme);
  themeSwitch.checked = (savedTheme === 'dark');
}

// Toggle theme on switch
themeSwitch.addEventListener('change', () => {
  if (themeSwitch.checked) {
    body.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
  } else {
    body.removeAttribute('data-theme');
    localStorage.setItem('theme', 'light');
  }
});