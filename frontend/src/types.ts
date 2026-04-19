export interface Customer {
  id: string
  name: string
  creditLimit: number
  receivables: number
  invoices: number
  currency: string
  validFrom: string
  validTo: string
  status: 'ok' | 'warning' | 'blocked'
}

export interface CreditHistory {
  id: number
  customerId: string
  type: 'limit_increase' | 'status_change'
  oldLimit?: number
  newLimit?: number
  oldStatus?: string
  newStatus?: string
  date: string
  user: string
  notes: string
}

export interface KPIData {
  totalCustomers: number
  creditOk: number
  approachingLimit: number
  creditBlocked: number
  totalExposure: number
  totalLimit: number
  exposurePercent: number
}