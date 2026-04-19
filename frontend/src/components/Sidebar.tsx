import { LayoutDashboard, Users, History, PlusCircle, Download, Settings } from 'lucide-react'

interface SidebarProps {
  activeView: string
  onNavigate: (view: string) => void
  totalCustomers: number
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'history', label: 'Credit History', icon: History },
]

const quickActions = [
  { id: 'new', label: 'New Request', icon: PlusCircle },
  { id: 'export', label: 'Export Data', icon: Download },
]

export default function Sidebar({ activeView, onNavigate, totalCustomers }: SidebarProps) {
  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <div className="sidebar-section">
          <span className="sidebar-title">Navigation</span>
          {navItems.map(item => (
            <button
              key={item.id}
              className={`sidebar-item ${activeView === item.id ? 'sidebar-item-active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
              {item.id === 'customers' && (
                <span className="sidebar-badge">{totalCustomers}</span>
              )}
            </button>
          ))}
        </div>
        
        <div className="sidebar-section">
          <span className="sidebar-title">Quick Actions</span>
          {quickActions.map(item => (
            <button key={item.id} className="sidebar-item">
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
        
        <div className="sidebar-footer">
          <span className="sidebar-version">v1.0.0</span>
          <span className="sidebar-sync">Last sync: Today, 09:41</span>
        </div>
      </nav>
    </aside>
  )
}