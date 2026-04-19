(function() {
    'use strict';

    const STORAGE_KEY = 'o2c_credit_data';
    const PAGE_SIZE = 5;

    const mockCustomers = [
        { id: 'CUST001', name: 'Acme Corporation', creditLimit: 50000, receivables: 12000, invoices: 8000, currency: 'USD', validFrom: '2026-01-01', validTo: '2026-12-31' },
        { id: 'CUST002', name: 'Global Tech Industries', creditLimit: 75000, receivables: 65000, invoices: 15000, currency: 'USD', validFrom: '2026-01-01', validTo: '2026-12-31' },
        { id: 'CUST003', name: 'Premier Solutions Ltd', creditLimit: 25000, receivables: 8000, invoices: 5000, currency: 'USD', validFrom: '2026-01-15', validTo: '2026-12-31' },
        { id: 'CUST004', name: 'Stellar Enterprises', creditLimit: 100000, receivables: 45000, invoices: 20000, currency: 'USD', validFrom: '2026-01-01', validTo: '2027-01-01' },
        { id: 'CUST005', name: 'Apex Manufacturing', creditLimit: 30000, receivables: 28000, invoices: 12000, currency: 'USD', validFrom: '2026-02-01', validTo: '2026-12-31' },
        { id: 'CUST006', name: 'Oceanic Trading Co', creditLimit: 60000, receivables: 35000, invoices: 18000, currency: 'USD', validFrom: '2026-01-01', validTo: '2026-12-31' },
        { id: 'CUST007', name: 'Visionary Systems', creditLimit: 40000, receivables: 42000, invoices: 10000, currency: 'USD', validFrom: '2026-01-01', validTo: '2026-12-31' },
        { id: 'CUST008', name: 'Quantum Dynamics', creditLimit: 80000, receivables: 22000, invoices: 15000, currency: 'USD', validFrom: '2026-01-15', validTo: '2027-01-15' },
        { id: 'CUST009', name: 'Horizon Group', creditLimit: 55000, receivables: 15000, invoices: 8000, currency: 'USD', validFrom: '2026-01-01', validTo: '2026-12-31' },
        { id: 'CUST010', name: 'Atlas Industries', creditLimit: 90000, receivables: 85000, invoices: 25000, currency: 'USD', validFrom: '2026-01-01', validTo: '2026-12-31' }
    ];

    const mockHistory = [
        { id: 1, customerId: 'CUST001', type: 'limit_increase', oldLimit: 30000, newLimit: 50000, date: '2026-01-15', user: 'Admin', notes: 'Increased based on payment history' },
        { id: 2, customerId: 'CUST002', type: 'status_change', oldStatus: 'warning', newStatus: 'blocked', date: '2026-02-01', user: 'System', notes: 'Credit limit exceeded' },
        { id: 3, customerId: 'CUST004', type: 'limit_increase', oldLimit: 75000, newLimit: 100000, date: '2026-03-01', user: 'Admin', notes: 'Annual review adjustment' },
        { id: 4, customerId: 'CUST005', type: 'status_change', oldStatus: 'ok', newStatus: 'warning', date: '2026-03-10', user: 'System', notes: 'Approaching credit limit' },
        { id: 5, customerId: 'CUST006', type: 'limit_increase', oldLimit: 40000, newLimit: 60000, date: '2026-03-15', user: 'Admin', notes: 'Business expansion' }
    ];

    let appData = {
        customers: [...mockCustomers],
        creditHistory: [...mockHistory],
        settings: { maxCreditLimit: 1000000000 }
    };

    let state = {
        currentView: 'dashboard',
        selectedCustomer: null,
        searchQuery: '',
        statusFilter: 'all',
        sortColumn: 'id',
        sortAsc: true,
        currentPage: 1
    };

    function init() {
        loadData();
        bindEvents();
        render();
    }

    function loadData() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                appData.customers = parsed.customers || [...mockCustomers];
                appData.creditHistory = parsed.creditHistory || [...mockHistory];
            } catch (e) {
                console.warn('Failed to load stored data, using defaults');
            }
        }
    }

    function saveData() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            customers: appData.customers,
            creditHistory: appData.creditHistory,
            settings: appData.settings
        }));
    }

    function calculateCredit(customer) {
        const used = customer.receivables + customer.invoices;
        const available = customer.creditLimit - used;
        const percentage = (used / customer.creditLimit) * 100;

        let status = 'ok';
        if (available < 0 || percentage > 100) {
            status = 'blocked';
        } else if (percentage >= 80) {
            status = 'warning';
        }

        return { used, available, status, percentage };
    }

    function formatCurrency(amount, currency = 'USD') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    function formatDate(dateStr) {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    function getFilteredCustomers() {
        let filtered = [...appData.customers];

        if (state.searchQuery) {
            const query = state.searchQuery.toLowerCase();
            filtered = filtered.filter(c =>
                c.name.toLowerCase().includes(query) ||
                c.id.toLowerCase().includes(query)
            );
        }

        if (state.statusFilter !== 'all') {
            filtered = filtered.filter(c => {
                const { status } = calculateCredit(c);
                return status === state.statusFilter;
            });
        }

        filtered.sort((a, b) => {
            let aVal = a[state.sortColumn];
            let bVal = b[state.sortColumn];

            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }

            if (aVal < bVal) return state.sortAsc ? -1 : 1;
            if (aVal > bVal) return state.sortAsc ? 1 : -1;
            return 0;
        });

        return filtered;
    }

    function getPagedCustomers() {
        const filtered = getFilteredCustomers();
        const start = (state.currentPage - 1) * PAGE_SIZE;
        return filtered.slice(start, start + PAGE_SIZE);
    }

    function getTotalPages() {
        return Math.ceil(getFilteredCustomers().length / PAGE_SIZE) || 1;
    }

    function addHistoryEntry(entry) {
        appData.creditHistory.unshift({
            id: Date.now(),
            ...entry,
            date: new Date().toISOString().split('T')[0]
        });
        saveData();
    }

    function bindEvents() {
        document.getElementById('menuBtn').addEventListener('click', toggleSidebar);

        document.querySelectorAll('.sap-nav__item').forEach(item => {
            item.addEventListener('click', () => {
                const view = item.dataset.view;
                if (view) switchView(view);
            });
        });

        document.getElementById('searchInput').addEventListener('input', (e) => {
            state.searchQuery = e.target.value;
            state.currentPage = 1;
            renderCustomersTable();
        });

        document.getElementById('statusFilter').addEventListener('change', (e) => {
            state.statusFilter = e.target.value;
            state.currentPage = 1;
            renderCustomersTable();
        });

        document.querySelectorAll('.customers-table th[data-sort]').forEach(th => {
            th.addEventListener('click', () => {
                const column = th.dataset.sort;
                if (state.sortColumn === column) {
                    state.sortAsc = !state.sortAsc;
                } else {
                    state.sortColumn = column;
                    state.sortAsc = true;
                }
                renderCustomersTable();
            });
        });

        document.getElementById('prevPage').addEventListener('click', () => {
            if (state.currentPage > 1) {
                state.currentPage--;
                renderCustomersTable();
            }
        });

        document.getElementById('nextPage').addEventListener('click', () => {
            if (state.currentPage < getTotalPages()) {
                state.currentPage++;
                renderCustomersTable();
            }
        });

        document.getElementById('adjustCreditBtn').addEventListener('click', openCreditModal);
        document.getElementById('closeModal').addEventListener('click', closeCreditModal);
        document.getElementById('cancelForm').addEventListener('click', closeCreditModal);
        document.getElementById('submitForm').addEventListener('click', submitCreditForm);

        document.querySelector('.sap-modal__overlay').addEventListener('click', closeCreditModal);
    }

    function toggleSidebar() {
        document.getElementById('sidebar').classList.toggle('sap-nav--open');
    }

    function switchView(viewName) {
        state.currentView = viewName;
        state.selectedCustomer = null;

        document.querySelectorAll('.sap-nav__item').forEach(item => {
            item.classList.toggle('sap-nav__item--active', item.dataset.view === viewName);
        });

        document.querySelectorAll('.sap-view').forEach(view => {
            view.classList.toggle('sap-view--active', view.id === `${viewName}-view`);
        });

        document.getElementById('sidebar').classList.remove('sap-nav--open');

        render();
    }

    function openCreditModal() {
        if (!state.selectedCustomer) return;

        const customer = state.selectedCustomer;
        const credit = calculateCredit(customer);

        document.getElementById('formCustomerId').value = `${customer.id} - ${customer.name}`;
        document.getElementById('formCreditLimit').value = customer.creditLimit;
        document.getElementById('formCurrency').value = customer.currency;
        document.getElementById('formValidFrom').value = customer.validFrom;
        document.getElementById('formValidTo').value = customer.validTo;
        document.getElementById('formNotes').value = '';
        document.getElementById('formLimitError').textContent = '';

        document.getElementById('creditModal').classList.add('sap-modal--active');
    }

    function closeCreditModal() {
        document.getElementById('creditModal').classList.remove('sap-modal--active');
    }

    function submitCreditForm() {
        const newLimit = parseFloat(document.getElementById('formCreditLimit').value);
        const validTo = document.getElementById('formValidTo').value;
        const notes = document.getElementById('formNotes').value;
        const errorEl = document.getElementById('formLimitError');

        if (isNaN(newLimit) || newLimit < 0) {
            errorEl.textContent = 'Credit limit must be a positive number';
            return;
        }

        if (newLimit > appData.settings.maxCreditLimit) {
            errorEl.textContent = `Credit limit cannot exceed ${formatCurrency(appData.settings.maxCreditLimit)}`;
            return;
        }

        const customer = appData.customers.find(c => c.id === state.selectedCustomer.id);
        if (customer) {
            const oldLimit = customer.creditLimit;
            customer.creditLimit = newLimit;
            customer.validTo = validTo || customer.validTo;

            if (oldLimit !== newLimit) {
                addHistoryEntry({
                    customerId: customer.id,
                    type: 'limit_increase',
                    oldLimit: oldLimit,
                    newLimit: newLimit,
                    user: 'Credit Manager',
                    notes: notes || 'Credit limit adjusted'
                });
            }
        }

        saveData();
        closeCreditModal();
        render();
    }

    function render() {
        renderDashboard();
        renderCustomersTable();
        renderHistory();
    }

    function renderDashboard() {
        let totalOk = 0, totalWarning = 0, totalBlocked = 0;
        let totalUsed = 0, totalLimit = 0;

        appData.customers.forEach(customer => {
            const { status, used } = calculateCredit(customer);
            totalUsed += used;
            totalLimit += customer.creditLimit;

            if (status === 'ok') totalOk++;
            else if (status === 'warning') totalWarning++;
            else totalBlocked++;
        });

        document.getElementById('totalCustomers').textContent = appData.customers.length;
        document.getElementById('creditOk').textContent = totalOk;
        document.getElementById('approachingLimit').textContent = totalWarning;
        document.getElementById('creditBlocked').textContent = totalBlocked;

        const exposurePercent = totalLimit > 0 ? Math.round((totalUsed / totalLimit) * 100) : 0;
        document.getElementById('exposureFill').style.width = `${exposurePercent}%`;
        document.getElementById('exposureUsed').textContent = formatCurrency(totalUsed);
        document.getElementById('exposureLimit').textContent = formatCurrency(totalLimit);
        document.getElementById('exposurePercent').textContent = `${exposurePercent}%`;

        const activitiesList = document.getElementById('activitiesList');
        activitiesList.innerHTML = '';

        appData.creditHistory.slice(0, 5).forEach(entry => {
            const customer = appData.customers.find(c => c.id === entry.customerId);
            const customerName = customer ? customer.name : entry.customerId;

            let iconClass = 'sap-badge--success';
            let iconSvg = '<path d="M5 12l5 5L20 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';

            if (entry.type === 'limit_increase') {
                iconClass = 'sap-badge--success';
                iconSvg = '<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>';
            } else if (entry.type === 'status_change') {
                iconClass = entry.newStatus === 'blocked' ? 'sap-badge--danger' : 'sap-badge--warning';
                iconSvg = '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><path d="M12 8v5M12 14v2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>';
            }

            activitiesList.innerHTML += `
                <li class="activities-list__item">
                    <div class="activities-list__icon ${iconClass}">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">${iconSvg}</svg>
                    </div>
                    <div class="activities-list__content">
                        <div class="activities-list__title">${customerName}</div>
                        <div class="activities-list__meta">${entry.type === 'limit_increase' ? `Limit changed to ${formatCurrency(entry.newLimit)}` : `Status changed to ${entry.newStatus}`} - ${formatDate(entry.date)}</div>
                    </div>
                </li>
            `;
        });
    }

    function renderCustomersTable() {
        const tbody = document.getElementById('customersTableBody');
        tbody.innerHTML = '';

        const customers = getPagedCustomers();

        customers.forEach(customer => {
            const credit = calculateCredit(customer);
            const isSelected = state.selectedCustomer && state.selectedCustomer.id === customer.id;

            let badgeClass = 'sap-badge--success';
            if (credit.status === 'warning') badgeClass = 'sap-badge--warning';
            else if (credit.status === 'blocked') badgeClass = 'sap-badge--danger';

            const statusLabel = credit.status === 'ok' ? 'Credit OK' :
                              credit.status === 'warning' ? 'At Risk' : 'Blocked';

            tbody.innerHTML += `
                <tr class="${isSelected ? 'selected' : ''}" data-id="${customer.id}">
                    <td>${customer.id}</td>
                    <td>${customer.name}</td>
                    <td>${formatCurrency(customer.creditLimit)}</td>
                    <td>${formatCurrency(credit.used)}</td>
                    <td>${formatCurrency(credit.available)}</td>
                    <td><span class="sap-badge ${badgeClass}">${statusLabel}</span></td>
                </tr>
            `;
        });

        document.querySelectorAll('#customersTableBody tr').forEach(row => {
            row.addEventListener('click', () => {
                const customerId = row.dataset.id;
                const customer = appData.customers.find(c => c.id === customerId);
                if (customer) {
                    state.selectedCustomer = customer;
                    renderCustomerDetail();
                    renderCustomersTable();
                }
            });
        });

        document.querySelectorAll('.customers-table th[data-sort]').forEach(th => {
            th.classList.remove('sort-asc', 'sort-desc');
            if (th.dataset.sort === state.sortColumn) {
                th.classList.add(state.sortAsc ? 'sort-asc' : 'sort-desc');
            }
        });

        const totalPages = getTotalPages();
        document.getElementById('currentPage').textContent = state.currentPage;
        document.getElementById('totalPages').textContent = totalPages;
        document.getElementById('prevPage').disabled = state.currentPage <= 1;
        document.getElementById('nextPage').disabled = state.currentPage >= totalPages;
    }

    function renderCustomerDetail() {
        const detailContent = document.getElementById('customerDetailContent');
        const emptyState = document.querySelector('.customer-detail__empty');

        if (!state.selectedCustomer) {
            emptyState.style.display = 'block';
            detailContent.style.display = 'none';
            return;
        }

        emptyState.style.display = 'none';
        detailContent.style.display = 'block';

        const customer = state.selectedCustomer;
        const credit = calculateCredit(customer);

        document.getElementById('detailCustomerName').textContent = customer.name;
        document.getElementById('detailCustomerId').textContent = customer.id;
        document.getElementById('detailCreditLimit').textContent = formatCurrency(customer.creditLimit);
        document.getElementById('detailReceivables').textContent = formatCurrency(customer.receivables);
        document.getElementById('detailInvoices').textContent = formatCurrency(customer.invoices);
        document.getElementById('detailAvailable').textContent = formatCurrency(credit.available);
        document.getElementById('detailValidUntil').textContent = formatDate(customer.validTo);

        let badgeClass = 'sap-badge--success sap-badge--large';
        let statusLabel = 'Credit OK';
        if (credit.status === 'warning') {
            badgeClass = 'sap-badge--warning sap-badge--large';
            statusLabel = 'At Risk';
        } else if (credit.status === 'blocked') {
            badgeClass = 'sap-badge--danger sap-badge--large';
            statusLabel = 'Blocked';
        }

        const badgeEl = document.getElementById('detailStatus');
        badgeEl.className = `sap-badge ${badgeClass}`;
        badgeEl.textContent = statusLabel;
    }

    function renderHistory() {
        const timeline = document.getElementById('historyTimeline');
        timeline.innerHTML = '';

        if (appData.creditHistory.length === 0) {
            timeline.innerHTML = '<p style="color: var(--sap-text-secondary); text-align: center;">No credit history available</p>';
            return;
        }

        appData.creditHistory.forEach(entry => {
            const customer = appData.customers.find(c => c.id === entry.customerId);
            const customerName = customer ? customer.name : entry.customerId;

            let title = '';
            if (entry.type === 'limit_increase') {
                title = `Credit limit changed from ${formatCurrency(entry.oldLimit)} to ${formatCurrency(entry.newLimit)}`;
            } else if (entry.type === 'status_change') {
                title = `Status changed from ${entry.oldStatus} to ${entry.newStatus}`;
            }

            timeline.innerHTML += `
                <div class="history-item">
                    <div class="history-item__content">
                        <div class="history-item__title">${customerName}</div>
                        <div>${title}</div>
                        <div class="history-item__meta">${formatDate(entry.date)} by ${entry.user}</div>
                        ${entry.notes ? `<div style="margin-top: 4px; color: var(--sap-text-secondary);">${entry.notes}</div>` : ''}
                    </div>
                </div>
            `;
        });
    }

    document.addEventListener('DOMContentLoaded', init);
})();