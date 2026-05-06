import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';

const LOGO_URL = 'https://img1.wsimg.com/isteam/ip/e7e3142b-3f26-4173-bc29-b2315178edb8/DI%20logo%20(2).png/:/rs=w:559,h:192,cg:true,m/cr=w:559,h:192/qt=q:95';

function fmt(n) { return Number(n||0).toLocaleString('en-IN'); }

// ── Print single bill ────────────────────────────────────────────
function printBill(bill) {
  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html><html><head><title>Bill ${bill.voucher_no}</title>
  <style>
    body{font-family:Arial,sans-serif;padding:32px;color:#1a1a1a;max-width:700px;margin:0 auto}
    .logo{text-align:center;margin-bottom:8px} .logo img{height:52px}
    .brand-line{height:3px;background:#E8471C;margin-bottom:20px}
    h2{text-align:center;margin:0 0 4px;font-size:18px;color:#E8471C;letter-spacing:2px}
    .sub{text-align:center;font-size:11px;color:#999;margin-bottom:24px}
    table{width:100%;border-collapse:collapse;margin-top:16px}
    td{padding:9px 12px;border:1px solid #e0e0e0;font-size:13px;vertical-align:top}
    td:first-child{background:#f8f8f8;font-weight:700;width:38%;color:#555;font-size:11px;text-transform:uppercase;letter-spacing:0.4px}
    .amount-row td:last-child{font-size:20px;font-weight:800;color:#E8471C}
    .footer{margin-top:32px;display:flex;justify-content:space-between;padding-top:16px;border-top:1px solid #e0e0e0}
    .sig-line{width:140px;height:1px;background:#1a1a1a;margin-bottom:4px}
    .sig-label{font-size:10px;color:#aaa}
    @media print{body{padding:16px}}
  </style></head><body>
  <div class="logo"><img src="${LOGO_URL}" alt="Deeraj Interiors" crossorigin="anonymous"/></div>
  <div class="brand-line"></div>
  <h2>EXPENSE VOUCHER</h2>
  <div class="sub">Deeraj Interiors — Internal Bill</div>
  <table>
    <tr><td>Voucher No.</td><td><strong style="color:#E8471C">${bill.voucher_no}</strong></td></tr>
    <tr><td>Date</td><td>${bill.date}</td></tr>
    <tr><td>Description</td><td>${bill.description}</td></tr>
    <tr><td>Purpose / Site</td><td>${bill.purpose_site||'—'}</td></tr>
    <tr><td>Category</td><td>${bill.category||'—'}</td></tr>
    <tr><td>Sub-category</td><td>${bill.sub_category||'—'}</td></tr>
    <tr><td>Vendor / Paid To</td><td>${bill.vendor||'—'}</td></tr>
    <tr><td>Paid By</td><td>${bill.paid_by||'—'}</td></tr>
    <tr><td>Payment Mode</td><td>${bill.payment_mode||'—'}</td></tr>
    <tr class="amount-row"><td>Amount (₹)</td><td>₹${fmt(bill.amount)}</td></tr>
    <tr><td>GST / Tax</td><td>${bill.gst_tax||'—'}</td></tr>
    <tr><td>Bill Attached?</td><td>${bill.bill_attached}</td></tr>
    <tr><td>Approved By</td><td>${bill.approved_by||'—'}</td></tr>
    <tr><td>Notes</td><td>${bill.notes||'—'}</td></tr>
    <tr><td>Created By</td><td>${bill.created_by_name||'—'}</td></tr>
  </table>
  <div class="footer">
    <div><div class="sig-line"></div><div class="sig-label">Prepared By</div></div>
    <div style="text-align:right"><div class="sig-line" style="margin-left:auto"></div><div class="sig-label">Approved By</div></div>
  </div>
  <script>window.onload=()=>{window.print();}</script>
  </body></html>`);
  w.document.close();
}

// ── Print all bills ──────────────────────────────────────────────
function printAllBills(bills, grandSum) {
  const rows = bills.map((b,i) => `
    <tr style="background:${i%2===0?'#fff':'#fafafa'}">
      <td>${b.voucher_no}</td><td>${b.date}</td>
      <td>${b.description}</td><td>${b.purpose_site||'—'}</td>
      <td>${b.category||'—'}</td><td>${b.vendor||'—'}</td>
      <td>${b.paid_by||'—'}</td><td>${b.payment_mode||'—'}</td>
      <td style="text-align:right;font-weight:700;color:#E8471C">₹${fmt(b.amount)}</td>
      <td>${b.bill_attached}</td>
    </tr>`).join('');
  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html><html><head><title>All Bills</title>
  <style>
    body{font-family:Arial,sans-serif;padding:24px;color:#1a1a1a}
    .logo img{height:44px} .brand-line{height:3px;background:#E8471C;margin:8px 0 16px}
    h2{margin:0;font-size:16px;color:#E8471C;letter-spacing:2px}
    table{width:100%;border-collapse:collapse;font-size:11px;margin-top:16px}
    th{background:#1a1a1a;color:#fff;padding:8px 10px;text-align:left;font-size:10px;letter-spacing:0.5px}
    td{padding:7px 10px;border-bottom:1px solid #eee}
    .total-row td{font-weight:800;background:#fff8f5;border-top:2px solid #E8471C;font-size:13px}
    @media print{body{padding:8px}}
  </style></head><body>
  <div class="logo"><img src="${LOGO_URL}" alt="Deeraj Interiors" crossorigin="anonymous"/></div>
  <div class="brand-line"></div>
  <h2>BILLS REPORT &nbsp;<span style="font-weight:400;font-size:12px;color:#aaa">(${bills.length} records)</span></h2>
  <table>
    <thead><tr>
      <th>Voucher</th><th>Date</th><th>Description</th><th>Site</th><th>Category</th>
      <th>Vendor</th><th>Paid By</th><th>Mode</th><th style="text-align:right">Amount (₹)</th><th>Bill</th>
    </tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr class="total-row">
      <td colspan="8">TOTAL (${bills.length} bills)</td>
      <td style="text-align:right;color:#E8471C">₹${fmt(grandSum)}</td><td></td>
    </tr></tfoot>
  </table>
  <script>window.onload=()=>{window.print();}</script>
  </body></html>`);
  w.document.close();
}

// ── Export to Excel (CSV) ────────────────────────────────────────
function exportToExcel(bills) {
  const headers = ['Voucher No','Date','Description','Purpose/Site','Category','Sub-category',
    'Vendor','Paid By','Payment Mode','Amount','GST/Tax','Bill Attached','Approved By','Notes','Created By'];
  const rows = bills.map(b => [
    b.voucher_no, b.date, `"${(b.description||'').replace(/"/g,'""')}"`,
    b.purpose_site||'', b.category||'', b.sub_category||'',
    b.vendor||'', b.paid_by||'', b.payment_mode||'',
    b.amount, b.gst_tax||'', b.bill_attached,
    b.approved_by||'', `"${(b.notes||'').replace(/"/g,'""')}"`,
    b.created_by_name||''
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `bills_${new Date().toISOString().slice(0,10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
  toast.success('Exported to CSV / Excel!');
}

export default function Bills({ user }) {
  const navigate = useNavigate();
  const [bills,    setBills]   = useState([]);
  const [total,    setTotal]   = useState(0);
  const [page,     setPage]    = useState(1);
  const [loading,  setLoading] = useState(true);
  const [search,   setSearch]  = useState('');
  const [category, setCategory]= useState('');
  const [payMode,  setPayMode] = useState('');
  const [dateFrom, setDateFrom]= useState('');
  const [dateTo,   setDateTo]  = useState('');
  const [deleting, setDeleting]= useState(null);
  const [viewFile, setViewFile]= useState(null); // { name, data, type }
  const [categories, setCategories] = useState(['Laminates','Hardware','Salary','Transport','Labour','Raw Material','Admin','EMI','Other']);
  const [modes, setModes] = useState(['Cash','UPI','Bank Transfer','Cheque','Other']);
  const LIMIT = 20;

  // Load custom dropdown options for filter
  useEffect(() => {
    api.get('/dropdowns').then(r => {
      const d = r.data.data || {};
      if (d.category?.length)     setCategories(prev => [...new Set([...prev, ...d.category])]);
      if (d.payment_mode?.length) setModes(prev => [...new Set([...prev, ...d.payment_mode])]);
    }).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (search)   params.search       = search;
      if (category) params.category     = category;
      if (payMode)  params.payment_mode = payMode;
      if (dateFrom) params.date_from    = dateFrom;
      if (dateTo)   params.date_to      = dateTo;
      const res = await api.get('/bills', { params });
      setBills(res.data.data);
      setTotal(res.data.total);
    } catch { toast.error('Failed to load bills.'); }
    setLoading(false);
  }, [page, search, category, payMode, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, category, payMode, dateFrom, dateTo]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this bill?')) return;
    setDeleting(id);
    try {
      await api.delete(`/bills/${id}`);
      toast.success('Bill deleted.');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete.');
    }
    setDeleting(null);
  };

  const totalPages = Math.ceil(total / LIMIT);
  const grandSum   = bills.reduce((s, b) => s + Number(b.amount), 0);

  return (
    <div className="page">

      {/* File viewer modal */}
      {viewFile && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',zIndex:9999,
          display:'flex',alignItems:'center',justifyContent:'center',padding:24}}
          onClick={() => setViewFile(null)}>
          <div style={{background:'#fff',borderRadius:16,padding:24,maxWidth:800,width:'100%',
            maxHeight:'90vh',overflow:'auto',position:'relative'}}
            onClick={e => e.stopPropagation()}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
              <div style={{fontWeight:700,fontSize:15,color:'#1a1a1a'}}>📎 {viewFile.name}</div>
              <div style={{display:'flex',gap:8}}>
                <a href={viewFile.data} download={viewFile.name}
                  style={{padding:'6px 14px',background:'#E8471C',color:'#fff',borderRadius:7,
                    textDecoration:'none',fontSize:13,fontWeight:700}}>
                  ⬇ Download
                </a>
                <button onClick={() => setViewFile(null)}
                  style={{padding:'6px 12px',background:'#f0f0f0',border:'none',
                    borderRadius:7,cursor:'pointer',fontSize:14,color:'#666'}}>
                  ✕ Close
                </button>
              </div>
            </div>
            {viewFile.type?.startsWith('image/') ? (
              <img src={viewFile.data} alt={viewFile.name} style={{width:'100%',borderRadius:8}} />
            ) : viewFile.type === 'application/pdf' ? (
              <iframe src={viewFile.data} style={{width:'100%',height:'65vh',border:'none',borderRadius:8}} title="PDF" />
            ) : (
              <div style={{textAlign:'center',padding:40,color:'#aaa'}}>
                <div style={{fontSize:48,marginBottom:12}}>📄</div>
                <div style={{fontSize:14}}>Preview not available for this file type.</div>
                <a href={viewFile.data} download={viewFile.name}
                  style={{display:'inline-block',marginTop:16,padding:'10px 20px',
                    background:'#E8471C',color:'#fff',borderRadius:8,textDecoration:'none',fontWeight:700}}>
                  Download File
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="page-header-row">
        <div>
          <div className="page-title">All Bills</div>
          <div className="page-sub">{total} records{search||category||payMode?` (filtered)`  :''}</div>
        </div>
        <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
          <button className="btn btn-ghost btn-sm" onClick={() => exportToExcel(bills)} title="Export to Excel">
            📊 Export Excel
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => printAllBills(bills, grandSum)} title="Print all bills">
            🖨️ Print All
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/bills/new')}>+ Add Bill</button>
        </div>
      </div>

      <div className="table-card">
        {/* Toolbar */}
        <div className="table-toolbar">
          <input className="search-box" placeholder="🔍  Search description, vendor, voucher…"
            value={search} onChange={e => setSearch(e.target.value)} />
          <select className="filter-select" value={category} onChange={e => setCategory(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
          <select className="filter-select" value={payMode} onChange={e => setPayMode(e.target.value)}>
            <option value="">All Modes</option>
            {modes.map(m => <option key={m}>{m}</option>)}
          </select>
          <input type="date" className="filter-select" value={dateFrom} onChange={e => setDateFrom(e.target.value)} title="From date" />
          <input type="date" className="filter-select" value={dateTo}   onChange={e => setDateTo(e.target.value)}   title="To date" />
          {(search||category||payMode||dateFrom||dateTo) && (
            <button className="btn btn-ghost btn-sm"
              onClick={() => { setSearch(''); setCategory(''); setPayMode(''); setDateFrom(''); setDateTo(''); }}>
              Clear ✕
            </button>
          )}
        </div>

        {loading ? (
          <div className="loading-center"><span className="spinner" /> Loading…</div>
        ) : !bills.length ? (
          <div className="empty-state">
            <div className="empty-icon">🧾</div>
            <div className="empty-text">No bills found</div>
            <div className="empty-sub">Try adjusting filters or add a new bill.</div>
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Voucher</th>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Site</th>
                    <th>Category</th>
                    <th>Vendor</th>
                    <th>Paid By</th>
                    <th>Mode</th>
                    <th style={{textAlign:'right'}}>Amount (₹)</th>
                    <th>File</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.map(b => (
                    <tr key={b.id}>
                      <td><span className="voucher-tag">{b.voucher_no}</span></td>
                      <td style={{fontFamily:'var(--mono)',fontSize:12}}>{b.date}</td>
                      <td style={{maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',color:'var(--text)'}} title={b.description}>{b.description}</td>
                      <td style={{maxWidth:120,overflow:'hidden',textOverflow:'ellipsis'}}>{b.purpose_site||'—'}</td>
                      <td>{b.category ? <span className="badge badge-cat">{b.category}</span> : '—'}</td>
                      <td>{b.vendor||'—'}</td>
                      <td>{b.paid_by||'—'}</td>
                      <td>{b.payment_mode ? <span className="badge badge-mode">{b.payment_mode}</span> : '—'}</td>
                      <td style={{textAlign:'right'}}><span className="amount-val">₹{fmt(b.amount)}</span></td>
                      <td>
                        {b.attachment_name ? (
                          <button className="action-btn" title={b.attachment_name}
                            onClick={async () => {
                              try {
                                const r = await api.get(`/bills/${b.id}`);
                                const bill = r.data.data;
                                if (bill.attachment_data) {
                                  setViewFile({ name: bill.attachment_name, data: bill.attachment_data, type: bill.attachment_type });
                                } else {
                                  toast.error('No file data found.');
                                }
                              } catch { toast.error('Failed to load file.'); }
                            }}>
                            📎 View
                          </button>
                        ) : (
                          <span style={{color:'var(--text3)',fontSize:12}}>—</span>
                        )}
                      </td>
                      <td>
                        <div style={{display:'flex',gap:5}}>
                          <button className="action-btn" onClick={() => printBill(b)} title="Print bill">🖨️</button>
                          <button className="action-btn" onClick={() => navigate(`/bills/${b.id}/edit`)}>Edit</button>
                          {/* Only admin can delete */}
                          {user.role === 'admin' && (
                            <button className="action-btn del" disabled={deleting===b.id}
                              onClick={() => handleDelete(b.id)}>
                              {deleting===b.id ? '…' : 'Del'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={8} style={{padding:'11px 14px',fontSize:12,fontWeight:700,
                      borderTop:'2px solid var(--brand)',color:'var(--text3)'}}>
                      Showing {bills.length} of {total} bills
                    </td>
                    <td style={{textAlign:'right',padding:'11px 14px',fontFamily:'var(--mono)',
                      fontWeight:800,color:'var(--brand)',borderTop:'2px solid var(--brand)',fontSize:14}}>
                      ₹{fmt(grandSum)}
                    </td>
                    <td colSpan={2} style={{borderTop:'2px solid var(--brand)'}} />
                  </tr>
                </tfoot>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button className="page-btn" disabled={page===1} onClick={() => setPage(p=>p-1)}>← Prev</button>
                {Array.from({length:Math.min(totalPages,7)},(_,i)=>{
                  const p=i+1;
                  return <button key={p} className={`page-btn ${page===p?'active':''}`} onClick={()=>setPage(p)}>{p}</button>;
                })}
                <span className="page-info">Page {page} of {totalPages}</span>
                <button className="page-btn" disabled={page===totalPages} onClick={() => setPage(p=>p+1)}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
