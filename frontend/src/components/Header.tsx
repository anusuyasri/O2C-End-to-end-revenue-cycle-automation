import { Bell, Settings, Menu, LayoutGrid, FileText } from 'lucide-react'

export default function Header() {
  return (
    <header className="app-header">
      <div className="header-left">
        <button className="menu-btn"><Menu size={20} /></button>
        <div className="header-brand">
          <div className="header-logo">
            <svg width="36" height="36" viewBox="0 0 36 36">
              <defs>
                <linearGradient id="logoGrad" x1="0" y1="0" x2="36" y2="36">
                  <stop offset="0%" stopColor="#0F6CBD" />
                  <stop offset="100%" stopColor="#085796" />
                </linearGradient>
              </defs>
              <rect width="36" height="36" rx="6" fill="url(#logoGrad)" />
              <path d="M10 24V12h4.5v4.5h4.5V12H23v12h-4.5v-4.5h-4.5V24H10z" fill="white" />
            </svg>
          </div>
          <div className="header-title-group">
            <h1>SAP Credit Management</h1>
            <span>Order-to-Cash / Credit Risk</span>
          </div>
        </div>
      </div>
      
      <nav className="header-nav">
        <a href="#" className="header-nav-item header-nav-item-active">
          <LayoutGrid size={18} />
          <span>Overview</span>
        </a>
        <a href="#" className="header-nav-item">
          <FileText size={18} />
          <span>Reports</span>
        </a>
        <a href="#" className="header-nav-item">
          <Settings size={18} />
          <span>Settings</span>
        </a>
      </nav>
      
      <div className="header-right">
        <button className="header-icon-btn">
          <Bell size={20} />
          <span className="notification-badge">3</span>
        </button>
        <div className="header-user">
          <div className="user-avatar">CM</div>
          <div className="user-info">
            <span className="user-name">Credit Manager</span>
            <span className="user-role">Finance</span>
          </div>
        </div>
      </div>
    </header>
  )
}