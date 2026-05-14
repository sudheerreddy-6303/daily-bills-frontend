import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login     from './pages/Login';
import Dashboard from './pages/Dashboard';
import Bills     from './pages/Bills';
import BillForm  from './pages/BillForm';
import Users     from './pages/Users';
import './App.css';

// Base64 logo from original project
const LOGO_URL = 'https://img1.wsimg.com/isteam/ip/e7e3142b-3f26-4173-bc29-b2315178edb8/DI%20logo%20(2).png/:/rs=w:559,h:192,cg:true,m/cr=w:559,h:192/qt=q:95';

function TopNav({ user, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const links = [
    { to: '/dashboard', label: 'Dashboard',    icon: '◈' },
    { to: '/bills',     label: 'ALL Expenses', icon: '≡' },
    { to: '/bills/new', label: 'Add Expense',  icon: '+' },
    ...(user.role === 'admin' ? [{ to: '/users', label: 'Users', icon: '⊕' }] : []),
  ];

  const initials = user.display.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  React.useEffect(() => setMobileOpen(false), [location.pathname]);

  return (
    <header className="topnav">
      <div className="topnav-inner">
        <div className="topnav-brand">
          <img src={LOGO_URL} alt="Deeraj Interiors" className="topnav-logo"
            onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
          />
          <div className="topnav-brand-mark" style={{ display: 'none' }}>DI</div>
        </div>

        <nav className="topnav-links">
          {links.map(l => (
            <NavLink key={l.to} to={l.to}
              className={({ isActive }) => `topnav-link${isActive ? ' active' : ''}`}>
              <span className="topnav-link-icon">{l.icon}</span>{l.label}
            </NavLink>
          ))}
        </nav>

        <div className="topnav-right">
          <div className="topnav-user-info">
            <div className="topnav-avatar">{initials}</div>
            <div className="topnav-user-text">
              <div className="topnav-user-name">{user.display}</div>
              <div className="topnav-user-role">{user.role === 'admin' ? 'Admin' : user.site || 'User'}</div>
            </div>
          </div>
          <button className="topnav-logout" onClick={onLogout} title="Sign out">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>

          <button className="topnav-hamburger" onClick={() => setMobileOpen(o => !o)} aria-label="Menu">
            <span className={mobileOpen ? 'open' : ''} />
            <span className={mobileOpen ? 'open' : ''} />
            <span className={mobileOpen ? 'open' : ''} />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="topnav-mobile-menu">
          {links.map(l => (
            <NavLink key={l.to} to={l.to}
              className={({ isActive }) => `topnav-mobile-link${isActive ? ' active' : ''}`}>
              <span style={{ fontSize: 18 }}>{l.icon}</span> {l.label}
            </NavLink>
          ))}
          <button className="topnav-mobile-logout" onClick={onLogout}>⎋ Sign Out</button>
        </div>
      )}
    </header>
  );
}

/* Bottom tab bar — visible only on mobile via CSS */
function BottomTabBar({ user, onLogout }) {
  const location = useLocation();

  const tabs = [
    { to: '/dashboard', icon: '◈', label: 'Dashboard' },
    { to: '/bills',     icon: '≡', label: 'Bills' },
    { to: '/bills/new', icon: '+', label: 'Add' },
    ...(user.role === 'admin' ? [{ to: '/users', icon: '⊕', label: 'Users' }] : []),
  ];

  const isActive = (to) => {
    if (to === '/bills/new') return location.pathname === '/bills/new';
    if (to === '/bills')     return location.pathname === '/bills' || (location.pathname.startsWith('/bills/') && location.pathname !== '/bills/new');
    return location.pathname.startsWith(to);
  };

  return (
    <div className="bottom-tabbar">
      <div className="bottom-tabbar-inner">
        {tabs.map(t => (
          <NavLink key={t.to} to={t.to}
            className={() => `tab-item${isActive(t.to) ? ' active' : ''}`}>
            <span className="tab-icon">{t.icon}</span>
            <span className="tab-label">{t.label}</span>
          </NavLink>
        ))}
        <button className="tab-item" onClick={onLogout}>
          <span className="tab-icon">⎋</span>
          <span className="tab-label">Logout</span>
        </button>
      </div>
    </div>
  );
}

function AppShell({ user, onLogout }) {
  return (
    <div className="app-shell">
      <TopNav user={user} onLogout={onLogout} />
      <main className="main-content">
        <Routes>
          <Route path="/"               element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard"      element={<Dashboard user={user} />} />
          <Route path="/bills"          element={<Bills user={user} />} />
          <Route path="/bills/new"      element={<BillForm user={user} />} />
          <Route path="/bills/:id/edit" element={<BillForm user={user} />} />
          {user.role === 'admin' && <Route path="/users" element={<Users />} />}
          <Route path="*"               element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
      <BottomTabBar user={user} onLogout={onLogout} />
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('db_user')); } catch { return null; }
  });

  const toastOpts = {
    style: { background: '#1a1a1a', color: '#f0f0f0', border: '1px solid #2e2e2e', fontFamily: 'Inter, sans-serif', fontSize: 13 },
    success: { iconTheme: { primary: '#E8471C', secondary: '#1a1a1a' } },
    error:   { iconTheme: { primary: '#ef4444', secondary: '#1a1a1a' } },
  };

  const handleLogin  = (u, t) => { localStorage.setItem('db_token', t); localStorage.setItem('db_user', JSON.stringify(u)); setUser(u); };
  const handleLogout = ()     => { localStorage.removeItem('db_token'); localStorage.removeItem('db_user'); setUser(null); };

  if (!user) return (
    <>
      <Toaster position="top-center" toastOptions={{ style: { fontFamily: 'Inter, sans-serif', fontSize: 13 } }} />
      <Login onLogin={handleLogin} />
    </>
  );

  return (
    <BrowserRouter>
      <Toaster position="top-center" toastOptions={toastOpts} />
      <AppShell user={user} onLogout={handleLogout} />
    </BrowserRouter>
  );
}
