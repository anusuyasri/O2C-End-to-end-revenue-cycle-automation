import { useState, useEffect } from 'react'
import Dashboard from './components/Dashboard'
import Customers from './components/Customers'
import History from './components/History'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import CreditModal from './components/CreditModal'
import { Customer, CreditHistory } from './types'

function App() {
  const [activeView, setActiveView] = useState('dashboard')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [history, setHistory] = useState<CreditHistory[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [customersRes, historyRes] = await Promise.all([
        fetch('/api/customers'),
        fetch('/api/history')
      ])
      const customersData = await customersRes.json()
      const historyData = await historyRes.json()
      setCustomers(customersData)
      setHistory(historyData)
    } catch {
      const mockCustomers: Customer[] = [
        { id: 'CUST001', name: 'Acme Corporation', creditLimit: 50000, receivables: 12000, invoices: 8000, currency: 'USD', validFrom: '2026-01-01', validTo: '2026-12-31', status: 'ok' },
        { id: 'CUST002', name: 'Global Tech Industries', creditLimit: 75000, receivables: 65000, invoices: 15000, currency: 'USD', validFrom: '2026-01-01', validTo: '2026-12-31', status: 'blocked' },
        { id: 'CUST003', name: 'Premier Solutions Ltd', creditLimit: 25000, receivables: 8000, invoices: 5000, currency: 'USD', validFrom: '2026-01-15', validTo: '2026-12-31', status: 'ok' },
        { id: 'CUST004', name: 'Stellar Enterprises', creditLimit: 100000, receivables: 45000, invoices: 20000, currency: 'USD', validFrom: '2026-01-01', validTo: '2027-01-01', status: 'ok' },
        { id: 'CUST005', name: 'Apex Manufacturing', creditLimit: 30000, receivables: 28000, invoices: 12000, currency: 'USD', validFrom: '2026-02-01', validTo: '2026-12-31', status: 'warning' },
        { id: 'CUST006', name: 'Oceanic Trading Co', creditLimit: 60000, receivables: 35000, invoices: 18000, currency: 'USD', validFrom: '2026-01-01', validTo: '2026-12-31', status: 'ok' },
        { id: 'CUST007', name: 'Visionary Systems', creditLimit: 40000, receivables: 42000, invoices: 10000, currency: 'USD', validFrom: '2026-01-01', validTo: '2026-12-31', status: 'warning' },
        { id: 'CUST008', name: 'Quantum Dynamics', creditLimit: 80000, receivables: 22000, invoices: 15000, currency: 'USD', validFrom: '2026-01-15', validTo: '2027-01-15', status: 'ok' },
        { id: 'CUST009', name: 'Horizon Group', creditLimit: 55000, receivables: 15000, invoices: 8000, currency: 'USD', validFrom: '2026-01-01', validTo: '2026-12-31', status: 'ok' },
        { id: 'CUST010', name: 'Atlas Industries', creditLimit: 90000, receivables: 85000, invoices: 25000, currency: 'USD', validFrom: '2026-01-01', validTo: '2026-12-31', status: 'blocked' }
      ]
      const mockHistory: CreditHistory[] = [
        { id: 1, customerId: 'CUST001', type: 'limit_increase', oldLimit: 30000, newLimit: 50000, date: '2026-01-15', user: 'Admin', notes: 'Increased based on payment history' },
        { id: 2, customerId: 'CUST002', type: 'status_change', oldStatus: 'warning', newStatus: 'blocked', date: '2026-02-01', user: 'System', notes: 'Credit limit exceeded' },
        { id: 3, customerId: 'CUST004', type: 'limit_increase', oldLimit: 75000, newLimit: 100000, date: '2026-03-01', user: 'Admin', notes: 'Annual review adjustment' },
        { id: 4, customerId: 'CUST005', type: 'status_change', oldStatus: 'ok', newStatus: 'warning', date: '2026-03-10', user: 'System', notes: 'Approaching credit limit' },
        { id: 5, customerId: 'CUST006', type: 'limit_increase', oldLimit: 40000, newLimit: 60000, date: '2026-03-15', user: 'Admin', notes: 'Business expansion' }
      ]
      setCustomers(mockCustomers)
      setHistory(mockHistory)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
  }

  const handleUpdateCreditLimit = async (newLimit: number, validTo: string, notes: string) => {
    if (!selectedCustomer) return
    
    try {
      await fetch(`/api/customers/${selectedCustomer.id}/credit-limit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creditLimit: newLimit, validTo, notes })
      })
    } catch {
      const updatedCustomers = customers.map(c => 
        c.id === selectedCustomer.id 
          ? { ...c, creditLimit: newLimit, validTo: validTo || c.validTo }
          : c
      )
      setCustomers(updatedCustomers)
      
      const newHistory: CreditHistory = {
        id: Date.now(),
        customerId: selectedCustomer.id,
        type: 'limit_increase',
        oldLimit: selectedCustomer.creditLimit,
        newLimit,
        date: new Date().toISOString().split('T')[0],
        user: 'Credit Manager',
        notes
      }
      setHistory([newHistory, ...history])
    }
    
    setIsModalOpen(false)
  }

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <span>Loading Credit Management...</span>
      </div>
    )
  }

  return (
    <div className="app">
      <Header />
      <div className="app-container">
        <Sidebar activeView={activeView} onNavigate={setActiveView} totalCustomers={customers.length} />
        <main className="app-main">
          {activeView === 'dashboard' && (
            <Dashboard customers={customers} history={history} />
          )}
          {activeView === 'customers' && (
            <Customers 
              customers={customers} 
              selectedCustomer={selectedCustomer}
              onSelectCustomer={handleSelectCustomer}
              onUpdateCredit={() => setIsModalOpen(true)}
            />
          )}
          {activeView === 'history' && (
            <History history={history} customers={customers} />
          )}
        </main>
      </div>
      <CreditModal 
        isOpen={isModalOpen}
        customer={selectedCustomer}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleUpdateCreditLimit}
      />
    </div>
  )
}

export default App