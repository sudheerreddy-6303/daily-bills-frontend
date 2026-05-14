import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';

const LOGO_URL = 'https://img1.wsimg.com/isteam/ip/e7e3142b-3f26-4173-bc29-b2315178edb8/DI%20logo%20(2).png/:/rs=w:559,h:192,cg:true,m/cr=w:559,h:192/qt=q:95';
const BRAND = '#000000';

function fmt(n) { return Number(n||0).toLocaleString('en-IN'); }

function printBill(bill) {
  // Format date — strip timestamp, show DD-MM-YYYY
  const rawDate = bill.date || '';
  const datePart = rawDate.slice(0, 10); // "2026-05-11"
  const [yr, mo, dy] = datePart.split('-');
  const niceDate = datePart ? `${dy}-${mo}-${yr}` : '—';

  const printedOn = new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Voucher ${bill.voucher_no} — Deeraj Interiors</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

    *{ box-sizing:border-box; margin:0; padding:0; }

    body {
      font-family: 'Inter', Arial, sans-serif;
      background: #fff;
      color: #1a1a1a;
      padding: 40px 48px;
      max-width: 780px;
      margin: 0 auto;
      font-size: 13px;
    }

    /* ── Header ── */
    .header {
      text-align: center;
      margin-bottom: 28px;
      padding-bottom: 24px;
      border-bottom: 2px solid #f0f0f0;
    }
    .logo-wrap { margin-bottom: 14px; }
    .logo-wrap img {
      height: 64px;
      width: auto;
      object-fit: contain;
    }
    .voucher-title {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: 3px;
      color: #E8471C;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .voucher-sub {
      font-size: 12px;
      color: #999;
      letter-spacing: 0.3px;
    }

    /* ── Meta strip — voucher no + date top right ── */
    .meta-strip {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #fff8f5;
      border: 1.5px solid rgba(232,71,28,0.15);
      border-radius: 10px;
      padding: 12px 18px;
      margin-bottom: 24px;
    }
    .meta-item { display: flex; flex-direction: column; gap: 2px; }
    .meta-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #aaa; }
    .meta-value { font-size: 15px; font-weight: 800; color: #E8471C; }
    .meta-value.dark { color: #1a1a1a; font-size: 13px; font-weight: 600; }

    /* ── Table ── */
    table {
      width: 100%;
      border-collapse: collapse;
      border: 1.5px solid #e8e8e8;
      border-radius: 10px;
      overflow: hidden;
      margin-bottom: 28px;
    }
    tr { border-bottom: 1px solid #f0f0f0; }
    tr:last-child { border-bottom: none; }
    tr:nth-child(even) td:first-child { background: #fafafa; }
    tr:nth-child(odd)  td:first-child { background: #f5f5f5; }
    td {
      padding: 11px 16px;
      vertical-align: middle;
      font-size: 13px;
      color: #333;
    }
    td:first-child {
      width: 36%;
      font-size: 10.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #64748b;
      border-right: 1px solid #f0f0f0;
    }
    td:last-child { font-weight: 500; color: #1a1a1a; }

    /* ── Amount row highlight ── */
    .amount-row td:first-child { background: #fff0eb !important; color: #E8471C !important; }
    .amount-row td:last-child {
      font-size: 26px;
      font-weight: 800;
      color: #E8471C;
      letter-spacing: -0.5px;
    }

    /* ── Voucher badge in table ── */
    .vchr {
      display: inline-block;
      background: #E8471C;
      color: #fff;
      font-size: 13px;
      font-weight: 800;
      padding: 3px 12px;
      border-radius: 6px;
      letter-spacing: 0.5px;
    }

    /* ── Signature section ── */
    .signatures {
      display: flex;
      justify-content: space-between;
      gap: 24px;
      margin-top: 8px;
      padding-top: 28px;
      border-top: 1.5px solid #f0f0f0;
    }
    .sig-box {
      flex: 1;
      text-align: center;
    }
    .sig-space {
      height: 44px;
      border-bottom: 1.5px solid #1a1a1a;
      margin-bottom: 8px;
    }
    .sig-name {
      font-size: 12px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 2px;
    }
    .sig-label {
      font-size: 10px;
      color: #aaa;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* ── Footer ── */
    .doc-footer {
      margin-top: 28px;
      padding-top: 14px;
      border-top: 1px dashed #e0e0e0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .doc-footer-brand { font-size: 11px; color: #ccc; font-weight: 600; letter-spacing: 0.3px; }
    .doc-footer-print { font-size: 10px; color: #ccc; }

    /* ── Print media ── */
    @media print {
      body { padding: 24px 32px; }
      @page { margin: 16mm; size: A4; }
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    <div class="logo-wrap">
      <img src="${LOGO_URL}" alt="Deeraj Interiors" crossorigin="anonymous"
           onerror="this.style.display='none';this.nextElementSibling.style.display='block'"/>
      <div style="display:none;font-size:28px;font-weight:900;color:#E8471C;letter-spacing:2px">DEERAJ INTERIORS</div>
    </div>
    <div class="voucher-title">Expense Voucher</div>
    <div class="voucher-sub">Deeraj Interiors &mdash; Internal Bill</div>
  </div>

  <!-- Voucher No + Date strip -->
  <div class="meta-strip">
    <div class="meta-item">
      <span class="meta-label">Voucher No.</span>
      <span class="meta-value">${bill.voucher_no}</span>
    </div>
    <div class="meta-item" style="text-align:right">
      <span class="meta-label">Bill Date</span>
      <span class="meta-value dark">${niceDate}</span>
    </div>
  </div>

  <!-- Details table -->
  <table>
    <tr>
      <td>Description</td>
      <td>${bill.description || '—'}</td>
    </tr>
    <tr>
      <td>Purpose / Site</td>
      <td>${bill.purpose_site || '—'}</td>
    </tr>
    <tr>
      <td>Category</td>
      <td>${bill.category || '—'}</td>
    </tr>
    <tr>
      <td>Sub-category</td>
      <td>${bill.sub_category || '—'}</td>
    </tr>
    <tr>
      <td>Vendor / Paid To</td>
      <td>${bill.vendor || '—'}</td>
    </tr>
    <tr>
      <td>Paid By</td>
      <td>${bill.paid_by || '—'}</td>
    </tr>
    <tr>
      <td>Payment Mode</td>
      <td>${bill.payment_mode || '—'}</td>
    </tr>
    <tr class="amount-row">
      <td>Amount (&#8377;)</td>
      <td>&#8377;${fmt(bill.amount)}</td>
    </tr>
    <tr>
      <td>GST / Tax</td>
      <td>${bill.gst_tax || '—'}</td>
    </tr>
    <tr>
      <td>Bill Attached?</td>
      <td>${bill.bill_attached || '—'}</td>
    </tr>
    <tr>
      <td>Approved By</td>
      <td>${bill.approved_by || '—'}</td>
    </tr>
    <tr>
      <td>Notes</td>
      <td>${bill.notes || '—'}</td>
    </tr>
    <tr>
      <td>Created By</td>
      <td>${bill.created_by_name || '—'}</td>
    </tr>
  </table>

  <!-- Signatures -->
  <div class="signatures">
    <div class="sig-box">
      <div class="sig-space"></div>
      <div class="sig-name">${bill.created_by_name || '________________'}</div>
      <div class="sig-label">Prepared By</div>
    </div>
    <div class="sig-box">
      <div class="sig-space"></div>
      <div class="sig-name">${bill.approved_by || '________________'}</div>
      <div class="sig-label">Approved By</div>
    </div>
    <div class="sig-box">
      <div class="sig-space"></div>
      <div class="sig-name">________________</div>
      <div class="sig-label">Authorised Signatory</div>
    </div>
  </div>

  <!-- Doc footer -->
  <div class="doc-footer">
    <span class="doc-footer-brand">DEERAJ INTERIORS</span>
    <span class="doc-footer-print">Printed on: ${printedOn}</span>
  </div>

  <script>
    window.onload = function() {
      // Wait for logo to load or fail before printing
      var img = document.querySelector('img');
      if (img && !img.complete) {
        img.onload  = function() { window.print(); };
        img.onerror = function() { window.print(); };
        setTimeout(function() { window.print(); }, 2000); // fallback
      } else {
        setTimeout(function() { window.print(); }, 300);
      }
    };
  </script>
</body>
</html>`);
  w.document.close();
}

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
    .logo img{height:44px}.brand-line{height:3px;background:#E8471C;margin:8px 0 16px}
    h2{margin:0;font-size:16px;color:#E8471C;letter-spacing:2px}
    table{width:100%;border-collapse:collapse;font-size:11px;margin-top:16px}
    th{background:#0f172a;color:#fff;padding:8px 10px;text-align:left;font-size:10px;letter-spacing:0.5px}
    td{padding:7px 10px;border-bottom:1px solid #eee}
    .total-row td{font-weight:800;background:#f8f9ff;border-top:2px solid #E8471C;font-size:13px}
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
  const csv  = [headers.join(','), ...rows.map(r=>r.join(','))].join('\n');
  const blob = new Blob(['\uFEFF'+csv], { type:'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href=url; a.download=`bills_${new Date().toISOString().slice(0,10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
  toast.success('Exported to CSV / Excel!');
}

export default function Bills({ user }) {
  const navigate  = useNavigate();
  const [bills,       setBills]       = useState([]);
  const [total,       setTotal]       = useState(0);
  const [stats,       setStats]       = useState(null);   // filter-aware totals
  const [page,        setPage]        = useState(1);
  const [loading,     setLoading]     = useState(true);
  const [deleting,    setDeleting]    = useState(null);
  const [viewFile,    setViewFile]    = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [search,      setSearch]      = useState('');
  const [category,    setCategory]    = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [payMode,     setPayMode]     = useState('');
  const [site,        setSite]        = useState('');
  const [paidBy,      setPaidBy]      = useState('');
  const [approvedBy,  setApprovedBy]  = useState('');
  const [dateFrom,    setDateFrom]    = useState('');
  const [dateTo,      setDateTo]      = useState('');

  // Dropdown options
  const [categories,    setCategories]    = useState(['Plywood','Laminates','Transport','Salary','IT Bills','Petty Cash','Current Bills','Rent','Stationary','Food','Maintanance']);
  const [subCategories, setSubCategories] = useState(['Raw Material','Labour','Fixed Cost','Admin','Other']);
  const [modes,         setModes]         = useState(['Cash','UPI','Bank Transfer','Cheque','Other']);
  const [sites,         setSites]         = useState([]);
  const [paidByOpts,    setPaidByOpts]    = useState([]);
  const [approvedOpts,  setApprovedOpts]  = useState([]);

  const LIMIT = 25;

  useEffect(() => {
    api.get('/dropdowns').then(r => {
      const d = r.data.data||{};
      if (d.category?.length)     setCategories(p=>[...new Set([...p,...d.category])]);
      if (d.sub_category?.length) setSubCategories(p=>[...new Set([...p,...d.sub_category])]);
      if (d.payment_mode?.length) setModes(p=>[...new Set([...p,...d.payment_mode])]);
      if (d.purpose_site?.length) setSites(p=>[...new Set([...p,...d.purpose_site])]);
      if (d.paid_by?.length)      setPaidByOpts(p=>[...new Set([...p,...d.paid_by])]);
      if (d.approved_by?.length)  setApprovedOpts(p=>[...new Set([...p,...d.approved_by])]);
    }).catch(()=>{});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit:LIMIT };
      if (search)      params.search       = search;
      if (category)    params.category     = category;
      if (payMode)     params.payment_mode = payMode;
      if (dateFrom)    params.date_from    = dateFrom;
      if (dateTo)      params.date_to      = dateTo;
      if (site)        params.site         = site;
      const res = await api.get('/bills', { params });
      setBills(res.data.data);
      setTotal(res.data.total);

      // Fetch filter-aware stats (all pages, not just current page)
      const statsParams = {};
      if (search)   statsParams.search       = search;
      if (category) statsParams.category     = category;
      if (payMode)  statsParams.payment_mode = payMode;
      if (dateFrom) statsParams.date_from    = dateFrom;
      if (dateTo)   statsParams.date_to      = dateTo;
      if (site)     statsParams.site         = site;
      try {
        const sRes = await api.get('/bills', { params: { ...statsParams, page:1, limit:9999 } });
        const allBills = sRes.data.data || [];
        const totalAmt  = allBills.reduce((s,b)=>s+Number(b.amount),0);
        const cashAmt   = allBills.filter(b=>b.payment_mode==='Cash').reduce((s,b)=>s+Number(b.amount),0);
        const upiAmt    = allBills.filter(b=>b.payment_mode==='UPI').reduce((s,b)=>s+Number(b.amount),0);
        const bankAmt   = allBills.filter(b=>b.payment_mode==='Bank Transfer').reduce((s,b)=>s+Number(b.amount),0);
        const chequeAmt = allBills.filter(b=>b.payment_mode==='Cheque').reduce((s,b)=>s+Number(b.amount),0);
        const avgAmt    = allBills.length ? totalAmt/allBills.length : 0;
        setStats({ totalAmt, cashAmt, upiAmt, bankAmt, chequeAmt, avgAmt, count: allBills.length });
      } catch { /* stats failure is non-critical */ }

    } catch { toast.error('Failed to load bills.'); }
    setLoading(false);
  }, [page, search, category, payMode, dateFrom, dateTo, site]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search,category,subCategory,payMode,site,paidBy,approvedBy,dateFrom,dateTo]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this bill?')) return;
    setDeleting(id);
    try { await api.delete(`/bills/${id}`); toast.success('Bill deleted.'); load(); }
    catch (err) { toast.error(err?.response?.data?.message||'Failed to delete.'); }
    setDeleting(null);
  };

  const clearFilters = () => {
    setSearch(''); setCategory(''); setSubCategory(''); setPayMode('');
    setSite(''); setPaidBy(''); setApprovedBy(''); setDateFrom(''); setDateTo('');
  };

  const activeCount = [search,category,subCategory,payMode,site,paidBy,approvedBy,dateFrom,dateTo].filter(Boolean).length;
  const totalPages  = Math.ceil(total/LIMIT);
  const grandSum    = bills.reduce((s,b)=>s+Number(b.amount),0);

  const inp = {
    background:'#fff', border:'1.5px solid #e2e8f0', borderRadius:8,
    padding:'7px 10px', fontSize:12.5, color:'#0f172a',
    fontFamily:'Inter,sans-serif', outline:'none',
  };

  return (
    <div className="page">

      {/* File viewer modal */}
      {viewFile && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',zIndex:9999,
          display:'flex',alignItems:'center',justifyContent:'center',padding:24}}
          onClick={()=>setViewFile(null)}>
          <div style={{background:'#fff',borderRadius:16,padding:24,maxWidth:800,width:'100%',
            maxHeight:'90vh',overflow:'auto'}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
              <div style={{fontWeight:700,fontSize:15}}>📎 {viewFile.name}</div>
              <div style={{display:'flex',gap:8}}>
                <a href={viewFile.data} download={viewFile.name}
                  style={{padding:'6px 14px',background:BRAND,color:'#fff',borderRadius:7,textDecoration:'none',fontSize:13,fontWeight:700}}>
                  ⬇ Download
                </a>
                <button onClick={()=>setViewFile(null)}
                  style={{padding:'6px 12px',background:'#f1f5f9',border:'none',borderRadius:7,cursor:'pointer',fontSize:14,color:'#666'}}>
                  ✕ Close
                </button>
              </div>
            </div>
            {viewFile.type?.startsWith('image/') ? (
              <img src={viewFile.data} alt={viewFile.name} style={{width:'100%',borderRadius:8}}/>
            ) : viewFile.type==='application/pdf' ? (
              <iframe src={viewFile.data} style={{width:'100%',height:'65vh',border:'none',borderRadius:8}} title="PDF"/>
            ) : (
              <div style={{textAlign:'center',padding:40,color:'#94a3b8'}}>
                <div style={{fontSize:48,marginBottom:12}}>📄</div>
                <a href={viewFile.data} download={viewFile.name}
                  style={{display:'inline-block',marginTop:8,padding:'10px 20px',background:BRAND,color:'#fff',borderRadius:8,textDecoration:'none',fontWeight:700}}>
                  Download File
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="page-header-row">
        <div>
          <div className="page-title">All Bills</div>
          <div className="page-sub">
            {total.toLocaleString()} records{activeCount>0?` · ${activeCount} filter${activeCount>1?'s':''} active`:''}
          </div>
        </div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
          <button className="btn btn-ghost btn-sm"
            onClick={()=>setShowFilters(f=>!f)}
            style={{borderColor:showFilters?BRAND:undefined,color:showFilters?BRAND:undefined}}>
            ⚙ Filters{activeCount>0?` (${activeCount})`:''}
          </button>
          {activeCount>0 && (
            <button className="btn btn-ghost btn-sm" onClick={clearFilters} style={{color:'#94a3b8',fontSize:12}}>✕ Clear</button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={()=>exportToExcel(bills)} title="Export to Excel">📊 Excel</button>
          <button className="btn btn-ghost btn-sm" onClick={()=>printAllBills(bills,grandSum)} title="Print">🖨️ Print</button>
          <button className="btn btn-primary" onClick={()=>navigate('/bills/new')}>+ Add Bill</button>
        </div>
      </div>

      {/* ── Summary Stat Cards (filter-aware) ── */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:12,marginBottom:20}}>
        {[
          { icon:'🧾', label:'Total Bills',    value: stats ? stats.count.toLocaleString() : total.toLocaleString(),                color:'#E8471C', border:'#E8471C' },
          { icon:'💰', label:'Total Amount',   value: stats ? `₹${fmt(stats.totalAmt)}`  : loading ? '…' : `₹${fmt(grandSum)}`,  color:'#E8471C', border:'#E8471C', big:true },
          { icon:'💵', label:'Cash',           value: stats ? `₹${fmt(stats.cashAmt)}`   : '—',                                   color:'#10b981', border:'#10b981' },
          { icon:'📲', label:'UPI',            value: stats ? `₹${fmt(stats.upiAmt)}`    : '—',                                   color:'#8b5cf6', border:'#8b5cf6' },
          { icon:'🏦', label:'Bank Transfer',  value: stats ? `₹${fmt(stats.bankAmt)}`   : '—',                                   color:'#06b6d4', border:'#06b6d4' },
          { icon:'🧮', label:'Avg per Bill',   value: stats ? `₹${fmt(Math.round(stats.avgAmt))}` : '—',                          color:'#f59e0b', border:'#f59e0b' },
        ].map((c,i) => (
          <div key={i} style={{
            background:'#fff',
            border:'1px solid #e2e8f0',
            borderLeft:`3px solid ${c.border}`,
            borderRadius:12,
            padding:'14px 16px',
            position:'relative',
            overflow:'hidden',
            transition:'transform 0.15s,box-shadow 0.15s',
          }}
            onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 6px 18px rgba(0,0,0,0.08)'; }}
            onMouseLeave={e=>{ e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}
          >
            <div style={{position:'absolute',top:10,right:12,fontSize:22,opacity:0.07}}>{c.icon}</div>
            <div style={{fontSize:16,marginBottom:6}}>{c.icon}</div>
            <div style={{fontSize:10,color:'#94a3b8',letterSpacing:0.7,textTransform:'uppercase',marginBottom:3,fontWeight:600}}>{c.label}</div>
            <div style={{
              fontFamily:'JetBrains Mono,monospace',
              fontSize: c.big ? 20 : 17,
              fontWeight:800,
              color: c.color,
              lineHeight:1.1,
            }}>
              {loading ? <span style={{color:'#e2e8f0'}}>…</span> : c.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Expanded Filter Panel ── */}
      {showFilters && (
        <div style={{background:'#fff',border:'1.5px solid #e2e8f0',borderRadius:14,
          padding:'18px 20px',marginBottom:16,boxShadow:'0 4px 14px rgba(0,0,0,0.05)'}}>
          <div style={{fontSize:11,fontWeight:700,color:'#64748b',letterSpacing:0.5,
            textTransform:'uppercase',marginBottom:14}}>Filter Bills</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))',gap:10}}>
            <div>
              <div style={{fontSize:10,color:'#94a3b8',marginBottom:4,fontWeight:700,textTransform:'uppercase',letterSpacing:0.5}}>Category</div>
              <select value={category} onChange={e=>setCategory(e.target.value)} style={{...inp,width:'100%',cursor:'pointer'}}>
                <option value="">All Categories</option>
                {categories.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <div style={{fontSize:10,color:'#94a3b8',marginBottom:4,fontWeight:700,textTransform:'uppercase',letterSpacing:0.5}}>Sub-Category</div>
              <select value={subCategory} onChange={e=>setSubCategory(e.target.value)} style={{...inp,width:'100%',cursor:'pointer'}}>
                <option value="">All</option>
                {subCategories.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <div style={{fontSize:10,color:'#94a3b8',marginBottom:4,fontWeight:700,textTransform:'uppercase',letterSpacing:0.5}}>Payment Mode</div>
              <select value={payMode} onChange={e=>setPayMode(e.target.value)} style={{...inp,width:'100%',cursor:'pointer'}}>
                <option value="">All Modes</option>
                {modes.map(m=><option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <div style={{fontSize:10,color:'#94a3b8',marginBottom:4,fontWeight:700,textTransform:'uppercase',letterSpacing:0.5}}>Site / Build By</div>
              <select value={site} onChange={e=>setSite(e.target.value)} style={{...inp,width:'100%',cursor:'pointer'}}>
                <option value="">All Sites</option>
                {sites.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <div style={{fontSize:10,color:'#94a3b8',marginBottom:4,fontWeight:700,textTransform:'uppercase',letterSpacing:0.5}}>Paid By</div>
              <select value={paidBy} onChange={e=>setPaidBy(e.target.value)} style={{...inp,width:'100%',cursor:'pointer'}}>
                <option value="">All</option>
                {paidByOpts.map(p=><option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <div style={{fontSize:10,color:'#94a3b8',marginBottom:4,fontWeight:700,textTransform:'uppercase',letterSpacing:0.5}}>Approved By</div>
              <select value={approvedBy} onChange={e=>setApprovedBy(e.target.value)} style={{...inp,width:'100%',cursor:'pointer'}}>
                <option value="">All</option>
                {approvedOpts.map(a=><option key={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <div style={{fontSize:10,color:'#94a3b8',marginBottom:4,fontWeight:700,textTransform:'uppercase',letterSpacing:0.5}}>Date From</div>
              <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} style={{...inp,width:'100%',boxSizing:'border-box'}}/>
            </div>
            <div>
              <div style={{fontSize:10,color:'#94a3b8',marginBottom:4,fontWeight:700,textTransform:'uppercase',letterSpacing:0.5}}>Date To</div>
              <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} style={{...inp,width:'100%',boxSizing:'border-box'}}/>
            </div>
          </div>
          <div style={{display:'flex',gap:8,marginTop:14}}>
            <button className="btn btn-primary btn-sm" onClick={load}>Apply</button>
            <button className="btn btn-ghost btn-sm" onClick={clearFilters}>Reset All</button>
          </div>
        </div>
      )}

      {/* ── Table Card (full width) ── */}
      <div className="table-card">
        {/* Quick search bar */}
        <div className="table-toolbar">
          <input className="search-box"
            placeholder="🔍  Search description, vendor, voucher no…"
            value={search}
            onChange={e=>setSearch(e.target.value)}
          />
          {/* Inline quick filters */}
          <select className="filter-select" value={category} onChange={e=>setCategory(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(c=><option key={c}>{c}</option>)}
          </select>
          <select className="filter-select" value={payMode} onChange={e=>setPayMode(e.target.value)}>
            <option value="">All Modes</option>
            {modes.map(m=><option key={m}>{m}</option>)}
          </select>
          <input type="date" className="filter-select date-filter-input" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} title="From date"/>
          <input type="date" className="filter-select date-filter-input" value={dateTo}   onChange={e=>setDateTo(e.target.value)}   title="To date"/>
          {activeCount>0 && (
            <button className="btn btn-ghost btn-sm" onClick={clearFilters}>Clear ✕</button>
          )}
          {/* Total shown in toolbar */}
          {grandSum>0 && !loading && (
            <div style={{marginLeft:'auto',fontFamily:'JetBrains Mono,monospace',
              fontSize:33,fontWeight:900,color:'white',whiteSpace:'nowrap',backgroundColor:'orangered',borderRadius:'10px'}}>
              ₹{fmt(grandSum)}
            </div>
          )}
        </div>

        {loading ? (
          <div className="loading-center"><span className="spinner"/> Loading…</div>
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
                    <th>Sub-cat</th>
                    <th>Vendor</th>
                    <th>Paid By</th>
                    <th>Mode</th>
                    <th>GST</th>
                    <th>Approved</th>
                    <th style={{textAlign:'right'}}>Amount (₹)</th>
                    <th>File</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.map(b => (
                    <tr key={b.id}>
                      <td><span className="voucher-tag">{b.voucher_no}</span></td>
                      <td style={{fontFamily:'JetBrains Mono,monospace',fontSize:11,color:'#64748b'}}>
                        {b.date ? b.date.slice(0,10).split('-').reverse().join('-') : '—'}
                      </td>
                      <td style={{maxWidth:220,overflow:'hidden',textOverflow:'ellipsis',color:'#0f172a',fontWeight:500}} title={b.description}>{b.description}</td>
                      <td style={{maxWidth:110,overflow:'hidden',textOverflow:'ellipsis',fontSize:12}}>{b.purpose_site||'—'}</td>
                      <td>{b.category ? <span className="badge badge-cat">{b.category}</span> : '—'}</td>
                      <td style={{fontSize:12,color:'#64748b'}}>{b.sub_category||'—'}</td>
                      <td style={{fontSize:12}}>{b.vendor||'—'}</td>
                      <td style={{fontSize:12}}>{b.paid_by||'—'}</td>
                      <td>{b.payment_mode ? <span className="badge badge-mode">{b.payment_mode}</span> : '—'}</td>
                      <td style={{fontSize:11,color:'#64748b'}}>{b.gst_tax||'—'}</td>
                      <td style={{fontSize:12,color:'#64748b'}}>{b.approved_by||'—'}</td>
                      <td style={{textAlign:'right'}}>
                        <span className="amount-val" style={{color:BRAND}}>₹{fmt(b.amount)}</span>
                      </td>
                      <td>
                        {b.attachment_name ? (
                          <button className="action-btn" title={b.attachment_name}
                            onClick={async()=>{
                              try {
                                const r=await api.get(`/bills/${b.id}`);
                                const bill=r.data.data;
                                if(bill.attachment_data) setViewFile({name:bill.attachment_name,data:bill.attachment_data,type:bill.attachment_type});
                                else toast.error('No file data found.');
                              } catch { toast.error('Failed to load file.'); }
                            }}>
                            📎 View
                          </button>
                        ) : <span style={{color:'#cbd5e1',fontSize:12}}>—</span>}
                      </td>
                      <td>
                        <div style={{display:'flex',gap:4}}>
                          <button className="action-btn" onClick={()=>printBill(b)} title="Print">🖨️</button>
                          <button className="action-btn" onClick={()=>navigate(`/bills/${b.id}/edit`)}>Edit</button>
                          {user.role==='admin' && (
                            <button className="action-btn del" disabled={deleting===b.id}
                              onClick={()=>handleDelete(b.id)}>
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
                    <td colSpan={11} style={{
                      padding:'12px 16px',
                      fontSize:12,fontWeight:700,
                      background:'#E8471C',
                      color:'rgba(255,255,255,0.85)',
                      letterSpacing:0.3,
                    }}>
                      Showing {bills.length} of {total} bills
                    </td>
                    <td style={{
                      textAlign:'right',
                      padding:'12px 16px',
                      fontFamily:'JetBrains Mono,monospace',
                      fontWeight:800,
                      fontSize:16,
                      background:'#E8471C',
                      color:'#ffffff',
                      whiteSpace:'nowrap',
                    }}>
                      ₹{fmt(grandSum)}
                    </td>
                    <td colSpan={2} style={{background:'#E8471C'}}/>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="mobile-cards">
              {bills.map(b => (
                <div key={b.id} className="mobile-card">
                  <div className="mobile-card-top">
                    <div style={{flex:1,minWidth:0}}>
                      <div className="mobile-card-desc" style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.description}</div>
                      <span className="voucher-tag" style={{marginTop:4,display:'inline-block'}}>{b.voucher_no}</span>
                    </div>
                    <div className="mobile-card-amount">₹{fmt(b.amount)}</div>
                  </div>
                  <div className="mobile-card-meta">
                    <div className="mobile-card-field"><span className="mobile-card-label">Date</span><span className="mobile-card-value">{b.date ? b.date.slice(0,10).split('-').reverse().join('-') : '—'}</span></div>
                    <div className="mobile-card-field"><span className="mobile-card-label">Category</span><span className="mobile-card-value">{b.category||'—'}</span></div>
                    <div className="mobile-card-field"><span className="mobile-card-label">Site</span><span className="mobile-card-value">{b.purpose_site||'—'}</span></div>
                    <div className="mobile-card-field"><span className="mobile-card-label">Paid By</span><span className="mobile-card-value">{b.paid_by||'—'}</span></div>
                    <div className="mobile-card-field"><span className="mobile-card-label">Vendor</span><span className="mobile-card-value">{b.vendor||'—'}</span></div>
                    <div className="mobile-card-field"><span className="mobile-card-label">Mode</span><span className="mobile-card-value">{b.payment_mode||'—'}</span></div>
                  </div>
                  <div className="mobile-card-actions">
                    <button className="action-btn" onClick={()=>navigate(`/bills/${b.id}/edit`)}>✏️ Edit</button>
                    <button className="action-btn" onClick={()=>printBill(b)}>🖨️ Print</button>
                    {b.attachment_name && (
                      <button className="action-btn" onClick={async()=>{
                        try {
                          const r=await api.get(`/bills/${b.id}`);
                          const bill=r.data.data;
                          if(bill.attachment_data) setViewFile({name:bill.attachment_name,data:bill.attachment_data,type:bill.attachment_type});
                          else toast.error('No file data found.');
                        } catch { toast.error('Failed.'); }
                      }}>📎 File</button>
                    )}
                    {user.role==='admin' && (
                      <button className="action-btn del" disabled={deleting===b.id} onClick={()=>handleDelete(b.id)}>
                        {deleting===b.id ? '…' : '🗑️ Del'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {totalPages>1 && (
              <div className="pagination">
                <button className="page-btn" disabled={page===1} onClick={()=>setPage(p=>p-1)}>← Prev</button>
                {Array.from({length:Math.min(totalPages,7)},(_,i)=>{
                  const p=i+1;
                  return <button key={p} className={`page-btn${page===p?' active':''}`} onClick={()=>setPage(p)}>{p}</button>;
                })}
                <span className="page-info">Page {page} of {totalPages}</span>
                <button className="page-btn" disabled={page===totalPages} onClick={()=>setPage(p=>p+1)}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}