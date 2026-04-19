import { Customer, CreditHistory } from '../types'
import { TrendingUp, TrendingDown, AlertTriangle, XCircle, Users, CreditCard, Activity } from 'lucide-react'

interface DashboardProps {
  customers: Customer[]
  history: CreditHistory[]
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
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export default function Dashboard({ customers, history }: DashboardProps) {
  let creditOk = 0
  let approachingLimit = 0
  let creditBlocked = 0
  let totalUsed = 0
  let totalLimit = 0

  customers.forEach(customer => {
    const { used, status } = calculateCredit(customer)
    totalUsed += used
    totalLimit += customer.creditLimit
    
    if (status === 'ok') creditOk++
    else if (status === 'warning') approachingLimit++
    else creditBlocked++
  })

  const exposurePercent = totalLimit > 0 ? Math.round((totalUsed / totalLimit) * 100) : 0
  const gaugeDash = (exposurePercent / 100) * 283

  return (
    <div className="dashboard">
      <div className="page-header">
        <div className="page-header-left">
          <h2 className="page-title">Credit Dashboard</h2>
          <p className="page-subtitle">Real-time credit exposure and risk analysis</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary">
            <Activity size={16} />
            Generate Report
          </button>
          <button className="btn btn-primary">
            <CreditCard size={16} />
            New Credit Check
          </button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <Users className="kpi-icon kpi-icon-primary" />
            <span className="kpi-trend kpi-trend-up">+2</span>
          </div>
          <div className="kpi-value">{customers.length}</div>
          <div className="kpi-label">Total Customers</div>
        </div>
        
        <div className="kpi-card kpi-success">
          <div className="kpi-header">
            <TrendingUp className="kpi-icon" />
            <span className="kpi-badge">Healthy</span>
          </div>
          <div className="kpi-value">{creditOk}</div>
          <div className="kpi-label">Credit Approved</div>
        </div>
        
        <div className="kpi-card kpi-warning">
          <div className="kpi-header">
            <AlertTriangle className="kpi-icon" />
            <span className="kpi-badge">Review</span>
          </div>
          <div className="kpi-value">{approachingLimit}</div>
          <div className="kpi-label">At Risk</div>
        </div>
        
        <div className="kpi-card kpi-danger">
          <div className="kpi-header">
            <XCircle className="kpi-icon" />
            <span className="kpi-badge">Action</span>
          </div>
          <div className="kpi-value">{creditBlocked}</div>
          <div className="kpi-label">Blocked</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-panel">
          <div className="panel-header">
            <h3>Credit Exposure</h3>
          </div>
          <div className="exposure-content">
            <div className="exposure-gauge">
              <svg viewBox="0 0 120 120" className="gauge-svg">
                <circle 
                  cx="60" 
                  cy="60" 
                  r="50" 
                  fill="none" 
                  stroke="var(--border)" 
                  strokeWidth="10"
                />
                <circle 
                  cx="60" 
                  cy="60" 
                  r="50" 
                  fill="none" 
                  stroke="var(--sap-blue)" 
                  strokeWidth="10"
                  strokeDasharray={283}
                  strokeDashoffset={283 - gaugeDash}
                  strokeLinecap="round"
                  transform="rotate(-90 60 60)"
                  className="gauge-fill"
                />
              </svg>
              <div className="gauge-value">
                <span className="gauge-percent">{exposurePercent}%</span>
                <span className="gauge-label">Utilized</span>
              </div>
            </div>
            <div className="exposure-metrics">
              <div className="exposure-metric">
                <span className="metric-label">Total Limit</span>
                <span className="metric-value">{formatCurrency(totalLimit)}</span>
              </div>
              <div className="exposure-metric">
                <span className="metric-label">Current Usage</span>
                <span className="metric-value">{formatCurrency(totalUsed)}</span>
              </div>
              <div className="exposure-metric">
                <span className="metric-label">Available</span>
                <span className="metric-value metric-success">{formatCurrency(totalLimit - totalUsed)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-panel">
          <div className="panel-header">
            <h3>Recent Activities</h3>
            <button className="panel-link">View All</button>
          </div>
          <div className="activity-list">
            {history.slice(0, 5).map(entry => {
              const customer = customers.find(c => c.id === entry.customerId)
              return (
                <div key={entry.id} className="activity-item">
                  <div className={`activity-icon ${entry.type === 'limit_increase' ? 'activity-success' : 'activity-warning'}`}>
                    {entry.type === 'limit_increase' ? <TrendingUp size={16} /> : <AlertTriangle size={16} />}
                  </div>
                  <div className="activity-content">
                    <div className="activity-title">{customer?.name || entry.customerId}</div>
                    <div className="activity-meta">
                      {entry.type === 'limit_increase' 
                        ? `Limit: ${formatCurrency(entry.oldLimit!)} → ${formatCurrency(entry.newLimit!)}`
                        : `${entry.oldStatus} → ${entry.newStatus}`
                      } • {formatDate(entry.date)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="dashboard-panel distribution-panel">
        <div className="panel-header">
          <h3>Risk Distribution</h3>
          <div className="filter-tabs">
            <button className="filter-tab filter-tab-active">Week</button>
            <button className="filter-tab">Month</button>
            <button className="filter-tab">Quarter</button>
          </div>
        </div>
        <div className="distribution-bar">
          <div className="segment segment-success" style={{ width: `${(creditOk / customers.length) * 100}%` }}>
            <span>OK ({Math.round((creditOk / customers.length) * 100)}%)</span>
          </div>
          <div className="segment segment-warning" style={{ width: `${(approachingLimit / customers.length) * 100}%` }}>
            <span>At Risk ({Math.round((approachingLimit / customers.length) * 100)}%)</span>
          </div>
          <div className="segment segment-danger" style={{ width: `${(creditBlocked / customers.length) * 100}%` }}>
            <span>Blocked ({Math.round((creditBlocked / customers.length) * 100)}%)</span>
          </div>
        </div>
      </div>
    </div>
  )
}