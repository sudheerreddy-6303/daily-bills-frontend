import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Bills from './pages/Bills';
import BillForm from './pages/BillForm';
import Users from './pages/Users';
import './App.css';

const LOGO_URL = 'https://img1.wsimg.com/isteam/ip/e7e3142b-3f26-4173-bc29-b2315178edb8/DI%20logo%20(2).png/:/rs=w:559,h:192,cg:true,m/cr=w:559,h:192/qt=q:95';

function Sidebar({ user, onLogout }) {
  const initials = user.display.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);

  const links = [
    { to: '/dashboard', icon: '◈', label: 'Dashboard' },
    { to: '/bills',     icon: '≡', label: 'All Bills'  },
    { to: '/bills/new', icon: '+', label: 'Add Bill'   },
    ...(user.role === 'admin' ? [{ to: '/users', icon: '⊕', label: 'Users' }] : []),
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img
          src={LOGO_URL}
          alt="Deeraj Interiors"
          className="sidebar-logo-img"
          onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
        />
        <div className="brand-mark" style={{display:'none'}}>DI</div>
      </div>

      <nav className="sidebar-nav">
        {links.map(l => (
          <NavLink key={l.to} to={l.to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">{l.icon}</span>
            <span>{l.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-chip">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{user.display}</div>
            <div className="user-role">{user.role === 'admin' ? 'Admin' : user.site || 'User'}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={onLogout} title="Sign out">⎋</button>
      </div>
    </aside>
  );
}

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('db_user')); } catch { return null; }
  });

  const handleLogin = (userData, token) => {
    localStorage.setItem('db_token', token);
    localStorage.setItem('db_user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('db_token');
    localStorage.removeItem('db_user');
    setUser(null);
  };

  if (!user) return (
    <>
      <Toaster position="top-right" toastOptions={{
        style: { fontFamily: 'DM Sans, sans-serif', fontSize: 13 },
      }} />
      <Login onLogin={handleLogin} />
    </>
  );

  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{
        style: {
          background: '#1a1a1a', color: '#f0f0f0',
          border: '1px solid #2e2e2e',
          fontFamily: 'DM Sans, sans-serif', fontSize: 13,
        },
        success: { iconTheme: { primary: '#E8471C', secondary: '#1a1a1a' } },
        error:   { iconTheme: { primary: '#c0392b', secondary: '#1a1a1a' } },
      }} />
      <div className="app-shell">
        <Sidebar user={user} onLogout={handleLogout} />
        <main className="main-content">
          <Routes>
            <Route path="/"               element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard"      element={<Dashboard user={user} />} />
            <Route path="/bills"          element={<Bills user={user} />} />
            <Route path="/bills/new"      element={<BillForm user={user} />} />
            <Route path="/bills/:id/edit" element={<BillForm user={user} />} />
            {user.role === 'admin' && <Route path="/users" element={<Users />} />}
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
