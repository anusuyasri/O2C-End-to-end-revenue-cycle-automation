import { useState } from 'react'
import { Customer } from '../types'
import { X } from 'lucide-react'

interface CreditModalProps {
  isOpen: boolean
  customer: Customer | null
  onClose: () => void
  onSubmit: (newLimit: number, validTo: string, notes: string) => void
}

export default function CreditModal({ isOpen, customer, onClose, onSubmit }: CreditModalProps) {
  const [newLimit, setNewLimit] = useState(customer?.creditLimit || 0)
  const [validTo, setValidTo] = useState(customer?.validTo || '')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  if (!customer) return null

  const handleSubmit = () => {
    if (!newLimit || newLimit < 0) {
      setError('Please enter a valid credit limit')
      return
    }
    if (newLimit > 1000000000) {
      setError('Credit limit cannot exceed $1,000,000,000')
      return
    }
    onSubmit(newLimit, validTo, notes)
  }

  return (
    <div className={`modal ${isOpen ? 'modal-open' : ''}`}>
      <div className="modal-overlay" onClick={onClose}></div>
      <div className="modal-dialog">
        <div className="modal-header">
          <h3>Adjust Credit Limit</h3>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Customer</label>
            <input type="text" value={`${customer.id} - ${customer.name}`} readOnly className="input-readonly" />
          </div>
          <div className="form-group">
            <label>New Credit Limit *</label>
            <div className="input-prefix">
              <span>$</span>
              <input 
                type="number" 
                value={newLimit}
                onChange={(e) => setNewLimit(Number(e.target.value))}
                min={0}
                step={1000}
              />
            </div>
            {error && <span className="form-error">{error}</span>}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Valid From</label>
              <input type="date" value={customer.validFrom} readOnly />
            </div>
            <div className="form-group">
              <label>Valid Until</label>
              <input 
                type="date" 
                value={validTo}
                onChange={(e) => setValidTo(e.target.value)}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Reason</label>
            <select value={notes} onChange={(e) => setNotes(e.target.value)}>
              <option value="">Select a reason...</option>
              <option value="Good payment history">Good payment history</option>
              <option value="Business expansion">Business expansion</option>
              <option value="Annual review">Annual review</option>
              <option value="New customer">New customer onboarding</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>Save Changes</button>
        </div>
      </div>
    </div>
  )
}