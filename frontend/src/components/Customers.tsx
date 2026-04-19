import { useState, useMemo } from 'react'
import { Customer } from '../types'
import { Search, Filter, Download, ChevronUp, ChevronDown, Edit, Eye } from 'lucide-react'

interface CustomersProps {
  customers: Customer[]
  selectedCustomer: Customer | null
  onSelectCustomer: (customer: Customer) => void
  onUpdateCredit: () => void
}

function calculateCredit(customer: Customer) {
  const used = customer.receivables + customer.invoices
  const available = customer.creditLimit - used
  const percentage = (used / customer.creditLimit) * 100
  
  let status: 'ok' | 'warning' | 'blocked' = 'ok'
  if (available < 0 || percentage > 100) {
    status = 'blocked'
  } else if (percentage >= 80) {
    status = 'warning'
  }
  
  return { used, available, status, percentage }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export default function Customers({ customers, selectedCustomer, onSelectCustomer, onUpdateCredit }: CustomersProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortColumn, setSortColumn] = useState('id')
  const [sortAsc, setSortAsc] = useState(true)
  const [page, setPage] = useState(1)
  const pageSize = 5

  const filtered = useMemo(() => {
    let result = [...customers]
    
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.id.toLowerCase().includes(q)
      )
    }
    
    if (statusFilter !== 'all') {
      result = result.filter(c => calculateCredit(c).status === statusFilter)
    }
    
    result.sort((a, b) => {
      let aVal = a[sortColumn as keyof Customer]
      let bVal = b[sortColumn as keyof Customer]
      
      if (sortColumn === 'available') {
        aVal = calculateCredit(a).available as any
        bVal = calculateCredit(b).available as any
      }
      
      if (typeof aVal === 'string') {
        return sortAsc ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal)
      }
      
      return sortAsc ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number)
    })
    
    return result
  }, [customers, search, statusFilter, sortColumn, sortAsc])

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)
  const totalPages = Math.ceil(filtered.length / pageSize) || 1

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortAsc(!sortAsc)
    } else {
      setSortColumn(column)
      setSortAsc(true)
    }
  }

  return (
    <div className="customers-page">
      <div className="page-header">
        <div className="page-header-left">
          <h2 className="page-title">Customer Credit Management</h2>
          <p className="page-subtitle">Manage customer credit limits and monitor exposure</p>
        </div>
      </div>

      <div className="customers-layout">
        <div className="customers-panel">
          <div className="toolbar">
            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search by ID or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="select">
              <option value="all">All Status</option>
              <option value="ok">Approved</option>
              <option value="warning">At Risk</option>
              <option value="blocked">Blocked</option>
            </select>
            <div className="toolbar-actions">
              <button className="btn-icon"><Filter size={18} /></button>
              <button className="btn-icon"><Download size={18} /></button>
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('id')}>ID {sortColumn === 'id' && (sortAsc ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}</th>
                  <th onClick={() => handleSort('name')}>Name {sortColumn === 'name' && (sortAsc ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}</th>
                  <th onClick={() => handleSort('creditLimit')}>Limit {sortColumn === 'creditLimit' && (sortAsc ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}</th>
                  <th onClick={() => handleSort('used')}>Used {sortColumn === 'used' && (sortAsc ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}</th>
                  <th onClick={() => handleSort('available')}>Available {sortColumn === 'available' && (sortAsc ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {paged.map(customer => {
                  const credit = calculateCredit(customer)
                  const isSelected = selectedCustomer?.id === customer.id
                  return (
                    <tr 
                      key={customer.id} 
                      className={isSelected ? 'row-selected' : ''}
                      onClick={() => onSelectCustomer(customer)}
                    >
                      <td className="cell-id">{customer.id}</td>
                      <td>{customer.name}</td>
                      <td>{formatCurrency(customer.creditLimit)}</td>
                      <td>{formatCurrency(credit.used)}</td>
                      <td className={credit.available < 0 ? 'text-danger' : ''}>{formatCurrency(credit.available)}</td>
                      <td>
                        <span className={`status-badge status-${credit.status}`}>
                          {credit.status === 'ok' ? 'Approved' : credit.status === 'warning' ? 'At Risk' : 'Blocked'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="table-footer">
            <span>Showing {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, filtered.length)} of {filtered.length}</span>
            <div className="pagination">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>&lt;</button>
              <span>Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>&gt;</button>
            </div>
          </div>
        </div>

        <div className="detail-panel">
          {!selectedCustomer ? (
            <div className="detail-empty">
              <Eye size={48} />
              <p>Select a customer to view details</p>
            </div>
          ) : (
            <div className="detail-content">
              <div className="detail-header">
                <div>
                  <h3>{selectedCustomer.name}</h3>
                  <span className="detail-id">{selectedCustomer.id}</span>
                </div>
                <span className={`status-badge status-${calculateCredit(selectedCustomer).status}`}>
                  {calculateCredit(selectedCustomer).status === 'ok' ? 'Approved' : 
                   calculateCredit(selectedCustomer).status === 'warning' ? 'At Risk' : 'Blocked'}
                </span>
              </div>
              
              <div className="detail-section">
                <h4>Credit Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span>Credit Limit</span>
                    <span>{formatCurrency(selectedCustomer.creditLimit)}</span>
                  </div>
                  <div className="detail-item">
                    <span>Receivables</span>
                    <span>{formatCurrency(selectedCustomer.receivables)}</span>
                  </div>
                  <div className="detail-item">
                    <span>Open Invoices</span>
                    <span>{formatCurrency(selectedCustomer.invoices)}</span>
                  </div>
                  <div className="detail-item detail-highlight">
                    <span>Available</span>
                    <span>{formatCurrency(calculateCredit(selectedCustomer).available)}</span>
                  </div>
                  <div className="detail-item">
                    <span>Valid Until</span>
                    <span>{formatDate(selectedCustomer.validTo)}</span>
                  </div>
                </div>
              </div>

              <div className="detail-actions">
                <button className="btn btn-primary" onClick={onUpdateCredit}>
                  <Edit size={16} /> Adjust Credit Limit
                </button>
                <button className="btn btn-secondary">
                  <Eye size={16} /> View History
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}