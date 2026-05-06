import React, { useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const LOGO_URL = 'https://img1.wsimg.com/isteam/ip/e7e3142b-3f26-4173-bc29-b2315178edb8/DI%20logo%20(2).png/:/rs=w:559,h:192,cg:true,m/cr=w:559,h:192/qt=q:95';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await api.post('/auth/login', { username: username.trim(), password });
      if (res.data.success) {
        toast.success(`Welcome back, ${res.data.user.display}!`);
        onLogin(res.data.user, res.data.token);
      } else {
        setError('Invalid credentials.');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Cannot reach server. Check your connection.');
    }
    setLoading(false);
  };

  return (
    <div className="login-screen">
      <div className="login-card">

        {/* ── Deeraj Logo ── */}
        <div className="login-logo">
          <img
            src={LOGO_URL}
            alt="Deeraj Interiors"
            style={{ height: 60, width: 'auto', objectFit: 'contain', display: 'block', margin: '0 auto' }}
          />
          <div className="login-divider" />
        </div>

        <h1 className="login-title">Welcome Back</h1>
        <p className="login-sub">Sign in to manage your bills</p>

        {error && (
          <div className="login-error">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6.5" stroke="#B91C1C" strokeWidth="1.2" fill="none"/>
              <path d="M7 4v3.5M7 9.5v.5" stroke="#B91C1C" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="login-field">
            <label>Username</label>
            <input type="text" placeholder="Enter username" value={username}
              onChange={e => { setUsername(e.target.value); setError(''); }}
              autoFocus autoComplete="username" />
          </div>
          <div className="login-field">
            <label>Password</label>
            <input type="password" placeholder="Enter password" value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              autoComplete="current-password" />
          </div>
          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? <span className="spinner" style={{borderTopColor:'#fff',borderColor:'rgba(255,255,255,0.3)'}} /> : 'Sign In'}
          </button>
        </form>

        <p className="login-footer">
          Deeraj Interiors &copy; {new Date().getFullYear()} — <span>DailyBills Portal</span>
        </p>
      </div>
    </div>
  );
}
