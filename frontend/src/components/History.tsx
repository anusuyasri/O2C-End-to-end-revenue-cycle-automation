import { CreditHistory, Customer } from '../types'
import { Clock, TrendingUp, AlertTriangle } from 'lucide-react'

interface HistoryProps {
  history: CreditHistory[]
  customers: Customer[]
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

export default function History({ history, customers }: HistoryProps) {
  return (
    <div className="history-page">
      <div className="page-header">
        <div className="page-header-left">
          <h2 className="page-title">Credit History</h2>
          <p className="page-subtitle">Audit trail of credit limit changes</p>
        </div>
      </div>

      <div className="history-panel">
        <div className="timeline">
          {history.map((entry, index) => {
            const customer = customers.find(c => c.id === entry.customerId)
            
            return (
              <div key={entry.id} className="timeline-item">
                <div className={`timeline-dot ${entry.type === 'limit_increase' ? 'dot-success' : 'dot-warning'}`}></div>
                {index < history.length - 1 && <div className="timeline-line"></div>}
                <div className="timeline-content">
                  <div className="timeline-header">
                    <span className="timeline-title">{customer?.name || entry.customerId}</span>
                    <span className="timeline-date">{formatDate(entry.date)}</span>
                  </div>
                  <div className="timeline-body">
                    {entry.type === 'limit_increase' ? (
                      <div className="timeline-change">
                        <TrendingUp size={14} />
                        <span>Credit limit changed from <strong>{formatCurrency(entry.oldLimit!)}</strong> to <strong>{formatCurrency(entry.newLimit!)}</strong></span>
                      </div>
                    ) : (
                      <div className="timeline-change">
                        <AlertTriangle size={14} />
                        <span>Status changed from <strong>{entry.oldStatus}</strong> to <strong>{entry.newStatus}</strong></span>
                      </div>
                    )}
                    <div className="timeline-meta">
                      <Clock size={12} />
                      <span>By {entry.user}</span>
                    </div>
                    {entry.notes && <div className="timeline-notes">{entry.notes}</div>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}