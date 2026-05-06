import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const SITES = ['Experience Center 1','EC2','Mod Factory','Office','Site A','Site B'];
const EMPTY_FORM = { username:'', password:'', display:'', role:'user', site:'' };
const EMPTY_EDIT = { display:'', role:'user', site:'', password:'' };

const SS = {
  background:'#fff', border:'1.5px solid #e8e8ee', borderRadius:8,
  padding:'9px 13px', fontSize:13.5, color:'#1a1a1a',
  fontFamily:'DM Sans,sans-serif', outline:'none', cursor:'pointer', width:'100%',
};
const INP = {
  background:'#fff', border:'1.5px solid #e8e8ee', borderRadius:8,
  padding:'9px 13px', fontSize:13.5, color:'#1a1a1a',
  fontFamily:'DM Sans,sans-serif', outline:'none', width:'100%', boxSizing:'border-box',
};

export default function Users() {
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showAdd,  setShowAdd]  = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [addForm,  setAddForm]  = useState({ ...EMPTY_FORM });
  const [editForm, setEditForm] = useState({ ...EMPTY_EDIT });
  const [saving,   setSaving]   = useState(false);
  const [addErr,   setAddErr]   = useState('');
  const [editErr,  setEditErr]  = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data.data);
    } catch { toast.error('Failed to load users.'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault(); setAddErr('');
    if (!addForm.username || !addForm.password || !addForm.display) {
      setAddErr('Username, password and display name are required.'); return;
    }
    setSaving(true);
    try {
      await api.post('/users', addForm);
      toast.success(`User "${addForm.display}" created.`);
      setAddForm({ ...EMPTY_FORM }); setShowAdd(false); load();
    } catch (err) { setAddErr(err?.response?.data?.message || 'Failed to create user.'); }
    setSaving(false);
  };

  const openEdit = (u) => {
    setEditUser(u);
    setEditForm({ display: u.display, role: u.role, site: u.site || '', password: '' });
    setEditErr('');
  };

  const handleEdit = async (e) => {
    e.preventDefault(); setEditErr('');
    if (!editForm.display.trim()) { setEditErr('Display name is required.'); return; }
    setSaving(true);
    try {
      await api.put(`/users/${editUser.id}`, editForm);
      toast.success(`User "${editForm.display}" updated.`);
      setEditUser(null); load();
    } catch (err) { setEditErr(err?.response?.data?.message || 'Failed to update user.'); }
    setSaving(false);
  };

  const toggleActive = async (id) => {
    try { await api.patch(`/users/${id}/toggle`); load(); }
    catch { toast.error('Failed.'); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete user "${name}"?`)) return;
    try { await api.delete(`/users/${id}`); toast.success('User deleted.'); load(); }
    catch (err) { toast.error(err?.response?.data?.message || 'Failed.'); }
  };

  return (
    <div className="page">
      <div className="page-header-row">
        <div>
          <div className="page-title">User Management</div>
          <div className="page-sub">Manage login access, roles &amp; permissions for your team</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowAdd(f => !f); setAddErr(''); setAddForm({...EMPTY_FORM}); }}>
          {showAdd ? '✕ Cancel' : '+ Add User'}
        </button>
      </div>

      {/* Add user form */}
      {showAdd && (
        <div className="form-card" style={{marginBottom:24,maxWidth:720}}>
          <div style={{fontFamily:'var(--display)',fontSize:15,fontWeight:700,marginBottom:20,color:'var(--text)',display:'flex',alignItems:'center',gap:10}}>
            <span style={{background:'#E8471C',color:'#fff',borderRadius:8,padding:'4px 10px',fontSize:13}}>➕</span> New User
          </div>
          {addErr && <div className="login-error" style={{marginBottom:16}}>{addErr}</div>}
          <form onSubmit={handleAdd}>
            <div className="form-grid">
              <div className="field">
                <label>Display Name <span className="required">*</span></label>
                <input style={INP} type="text" placeholder="e.g. Ravi Kumar" value={addForm.display}
                  onChange={e => setAddForm(f => ({...f, display: e.target.value}))} />
              </div>
              <div className="field">
                <label>Username <span className="required">*</span></label>
                <input style={INP} type="text" placeholder="lowercase, no spaces" value={addForm.username}
                  onChange={e => setAddForm(f => ({...f, username: e.target.value.toLowerCase().replace(/\s/g,'')}))} />
              </div>
              <div className="field">
                <label>Password <span className="required">*</span></label>
                <input style={INP} type="password" placeholder="Min 4 characters" value={addForm.password}
                  onChange={e => setAddForm(f => ({...f, password: e.target.value}))} />
              </div>
              <div className="field">
                <label>Role &amp; Permissions</label>
                <select style={SS} value={addForm.role} onChange={e => setAddForm(f => ({...f, role: e.target.value}))}>
                  <option value="user">👤 User — Can add/edit own bills</option>
                  <option value="admin">👑 Admin — Full access + user management</option>
                </select>
              </div>
              <div className="field">
                <label>Site / Location</label>
                <select style={SS} value={addForm.site} onChange={e => setAddForm(f => ({...f, site: e.target.value}))}>
                  <option value="">— Select Site —</option>
                  {SITES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div style={{background:'#f0f9ff',border:'1px solid #bae6fd',borderRadius:10,padding:'10px 14px',marginTop:8,fontSize:12,color:'#0369a1'}}>
              💡 <strong>Permissions:</strong> Admin users can manage all bills, add/edit/delete users, and access all dashboard filters. Regular users can only manage their own bills.
            </div>
            <div className="form-actions" style={{marginTop:16}}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <><span className="spinner" /> Creating…</> : '✓ Create User'}
              </button>
              <button type="button" className="btn btn-ghost"
                onClick={() => { setShowAdd(false); setAddErr(''); setAddForm({...EMPTY_FORM}); }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit modal */}
      {editUser && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:9999,
          display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
          <div style={{background:'#fff',borderRadius:16,padding:28,maxWidth:540,width:'100%',
            boxShadow:'0 20px 60px rgba(0,0,0,0.2)'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
              <div>
                <div style={{fontFamily:'var(--display)',fontSize:16,fontWeight:700,color:'#1a1a1a'}}>✏️ Edit User</div>
                <div style={{fontSize:12,color:'#aaa',marginTop:2}}>@{editUser.username}</div>
              </div>
              <button onClick={() => setEditUser(null)}
                style={{background:'#f0f0f0',border:'none',borderRadius:8,padding:'6px 12px',cursor:'pointer',fontSize:18,color:'#666'}}>✕</button>
            </div>
            {editErr && <div className="login-error" style={{marginBottom:16}}>{editErr}</div>}
            <form onSubmit={handleEdit}>
              <div style={{display:'grid',gap:14}}>
                <div className="field" style={{margin:0}}>
                  <label>Display Name <span className="required">*</span></label>
                  <input style={INP} type="text" value={editForm.display}
                    onChange={e => setEditForm(f => ({...f, display: e.target.value}))} />
                </div>
                <div className="field" style={{margin:0}}>
                  <label>Role &amp; Permissions</label>
                  <select style={SS} value={editForm.role}
                    onChange={e => setEditForm(f => ({...f, role: e.target.value}))}>
                    <option value="user">👤 User — Can add/edit own bills only</option>
                    <option value="admin">👑 Admin — Full access + user management</option>
                  </select>
                  <div style={{fontSize:11,color:'#888',marginTop:5,lineHeight:1.5}}>
                    {editForm.role === 'admin'
                      ? '⚠️ Admin can manage all bills, all users, and full dashboard.'
                      : '🔒 User can only view/add/edit their own bills.'}
                  </div>
                </div>
                <div className="field" style={{margin:0}}>
                  <label>Site / Location</label>
                  <select style={SS} value={editForm.site}
                    onChange={e => setEditForm(f => ({...f, site: e.target.value}))}>
                    <option value="">— No site assigned —</option>
                    {SITES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="field" style={{margin:0}}>
                  <label>New Password <span style={{color:'#aaa',fontWeight:400,fontSize:11}}>(leave blank to keep current)</span></label>
                  <input style={INP} type="password" placeholder="Enter new password…"
                    value={editForm.password}
                    onChange={e => setEditForm(f => ({...f, password: e.target.value}))} />
                </div>
              </div>
              <div style={{display:'flex',gap:10,marginTop:20}}>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner" /> Saving…</> : '✓ Save Changes'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setEditUser(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users table */}
      <div className="table-card">
        {loading ? (
          <div className="loading-center"><span className="spinner" /> Loading…</div>
        ) : !users.length ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <div className="empty-text">No users yet</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Display Name</th>
                  <th>Username</th>
                  <th>Role &amp; Permissions</th>
                  <th>Site</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, idx) => (
                  <tr key={u.id}>
                    <td style={{color:'var(--text3)',fontFamily:'var(--mono)',fontSize:12}}>{idx+1}</td>
                    <td style={{color:'var(--text)',fontWeight:600}}>{u.display}</td>
                    <td><span className="voucher-tag">{u.username}</span></td>
                    <td>
                      <span className={`badge ${u.role==='admin'?'badge-cat':'badge-mode'}`}>
                        {u.role==='admin' ? '👑 Admin' : '👤 User'}
                      </span>
                      <div style={{fontSize:10,color:'#aaa',marginTop:3}}>
                        {u.role==='admin' ? 'Full access' : 'Own bills only'}
                      </div>
                    </td>
                    <td>{u.site || '—'}</td>
                    <td>
                      <span className={`badge ${u.active ? 'badge-bill-yes' : 'badge-bill-no'}`}>
                        {u.active ? '● Active' : '○ Inactive'}
                      </span>
                    </td>
                    <td style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--text3)'}}>{u.created_at?.slice(0,10)}</td>
                    <td>
                      <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                        <button className="action-btn" onClick={() => openEdit(u)}
                          style={{background:'#f0f4ff',color:'#3b5bdb',borderColor:'#c5d0fa'}}>
                          ✏️ Edit
                        </button>
                        <button className="action-btn" onClick={() => toggleActive(u.id)}>
                          {u.active ? 'Disable' : 'Enable'}
                        </button>
                        {u.role !== 'admin' && (
                          <button className="action-btn del" onClick={() => handleDelete(u.id, u.display)}>Delete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Permissions legend */}
      <div style={{marginTop:20,background:'#f8f9fa',borderRadius:12,padding:'16px 20px',border:'1px solid #e8e8ee'}}>
        <div style={{fontWeight:700,fontSize:12,color:'#555',marginBottom:10,letterSpacing:0.5}}>PERMISSIONS REFERENCE</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div style={{fontSize:12,color:'#333'}}>
            <strong style={{color:'#E8471C'}}>👑 Admin</strong>
            <ul style={{margin:'6px 0 0 16px',padding:0,lineHeight:1.8,color:'#666'}}>
              <li>View &amp; manage ALL bills</li>
              <li>Add / Edit / Delete any bill</li>
              <li>Full dashboard with all filters</li>
              <li>Manage users (add, edit, disable)</li>
              <li>Grant / revoke admin permissions</li>
            </ul>
          </div>
          <div style={{fontSize:12,color:'#333'}}>
            <strong style={{color:'#3b5bdb'}}>👤 User</strong>
            <ul style={{margin:'6px 0 0 16px',padding:0,lineHeight:1.8,color:'#666'}}>
              <li>View only their own bills</li>
              <li>Add new bills (file upload required)</li>
              <li>Edit / delete their own bills only</li>
              <li>Personal dashboard view</li>
              <li>Cannot access user management</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
