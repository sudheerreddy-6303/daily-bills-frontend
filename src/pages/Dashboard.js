import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';

const MONTHS  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const BRAND   = '#E8471C';
const PALETTE = ['#E8471C','#c23a16','#a83010','#e06030','#d04020','#f07050','#b83010','#803010'];
const CAT_ICONS = { Laminates:'🪵', Hardware:'🔩', Salary:'💰', Transport:'🚛',
  Labour:'👷', 'Raw Material':'📦', Admin:'🏢', EMI:'🏦', Other:'📋' };

function fmt(n)  { return Number(n||0).toLocaleString('en-IN'); }
function fmtK(n) {
  const v = Number(n||0);
  if (v >= 100000) return `₹${(v/100000).toFixed(1)}L`;
  if (v >= 1000)   return `₹${(v/1000).toFixed(1)}K`;
  return `₹${v}`;
}

function EmptyChart({ h = 140 }) {
  return (
    <div style={{height:h,display:'flex',flexDirection:'column',alignItems:'center',
      justifyContent:'center',color:'#ccc',gap:8}}>
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <rect x="4" y="20" width="6" height="12" rx="2" fill="#e0e0e0"/>
        <rect x="13" y="12" width="6" height="20" rx="2" fill="#e8e8e8"/>
        <rect x="22" y="16" width="6" height="16" rx="2" fill="#e0e0e0"/>
      </svg>
      <span style={{fontSize:12}}>No data for this period</span>
    </div>
  );
}

function HBarChart({ data, labelKey, valueKey = 'total', height = 200 }) {
  if (!data?.length || data.every(d => Number(d[valueKey]) === 0)) return <EmptyChart h={height} />;
  const items = data.slice(0, 7);
  const max   = Math.max(...items.map(d => Number(d[valueKey])), 1);
  const ROW_H = 28, GAP = 8, LABEL_W = 90, barW = 320;
  const svgH  = items.length * (ROW_H + GAP);
  return (
    <svg viewBox={`0 0 ${LABEL_W + barW + 80} ${svgH}`} style={{width:'100%',height:svgH,overflow:'visible'}}>
      {items.map((d, i) => {
        const y = i * (ROW_H + GAP);
        const bw = Math.max((Number(d[valueKey]) / max) * barW, 2);
        const label = String(d[labelKey] || '—');
        return (
          <g key={i}>
            <text x={LABEL_W - 8} y={y + ROW_H/2 + 4} textAnchor="end" fontSize="11" fill="#666" style={{fontFamily:'DM Sans,sans-serif'}}>
              {label.length > 12 ? label.slice(0,12)+'…' : label}
            </text>
            <rect x={LABEL_W} y={y + 4} width={barW} height={ROW_H - 8} rx="5" fill="#f3f3f3" />
            <rect x={LABEL_W} y={y + 4} width={bw} height={ROW_H - 8} rx="5" fill={PALETTE[i % PALETTE.length]}>
              <animate attributeName="width" from="0" to={bw} dur="0.7s" fill="freeze"/>
            </rect>
            <text x={LABEL_W + bw + 6} y={y + ROW_H/2 + 4} fontSize="10" fill="#888" style={{fontFamily:'DM Mono,monospace'}}>
              {fmtK(d[valueKey])}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function VBarChart({ data, labelKey = 'day' }) {
  if (!data?.length || data.every(d => Number(d.total) === 0)) return <EmptyChart h={160} />;
  const vals = data.map(d => Number(d.total));
  const max  = Math.max(...vals, 1);
  const W = 480, H = 130, PAD_B = 22, PAD_T = 10;
  const barW = Math.max(Math.floor((W - 20) / data.length) - 3, 4);
  const usableH = H - PAD_B - PAD_T;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:H+20,overflow:'visible'}}>
      {[0.25,0.5,0.75,1].map(f => {
        const y = PAD_T + usableH * (1 - f);
        return (
          <g key={f}>
            <line x1="10" y1={y} x2={W-10} y2={y} stroke="#f0f0f0" strokeWidth="1" strokeDasharray="4,3"/>
            <text x="8" y={y+3} fontSize="8" fill="#ccc" textAnchor="end" style={{fontFamily:'DM Mono,monospace'}}>{fmtK(max * f)}</text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const x = 12 + i * (barW + 3);
        const bh = Math.max((vals[i] / max) * usableH, 2);
        const y  = PAD_T + usableH - bh;
        return (
          <g key={i}>
            <rect x={x} y={PAD_T + usableH} width={barW} height={0} rx="3" fill={vals[i] === max ? BRAND : 'rgba(232,71,28,0.55)'}>
              <animate attributeName="y" from={PAD_T + usableH} to={y} dur="0.6s" fill="freeze"/>
              <animate attributeName="height" from="0" to={bh} dur="0.6s" fill="freeze"/>
            </rect>
            <title>Day {d[labelKey]}: ₹{fmt(d.total)}</title>
            {data.length <= 15 && (
              <text x={x + barW/2} y={H - 4} fontSize="8" fill="#bbb" textAnchor="middle" style={{fontFamily:'DM Mono,monospace'}}>{d[labelKey]}</text>
            )}
          </g>
        );
      })}
      <line x1="10" y1={PAD_T + usableH} x2={W-10} y2={PAD_T + usableH} stroke="#e0e0e0" strokeWidth="1"/>
    </svg>
  );
}

function AreaChart({ data, labelKey = 'month_label', height = 130 }) {
  if (!data?.length || data.every(d => Number(d.total) === 0)) return <EmptyChart h={height} />;
  const vals = data.map(d => Number(d.total));
  const max  = Math.max(...vals, 1);
  const W = 480, H = height, PAD = 14;
  const usableH = H - PAD * 2 - 18;
  const pts = vals.map((v, i) => {
    const x = PAD + (i / Math.max(vals.length - 1, 1)) * (W - PAD * 2);
    const y = PAD + usableH - (v / max) * usableH;
    return [x, y];
  });
  const smooth = pts.map((p, i) => {
    if (i === 0) return `M${p[0]},${p[1]}`;
    const prev = pts[i-1];
    const cpx  = (prev[0] + p[0]) / 2;
    return `C${cpx},${prev[1]} ${cpx},${p[1]} ${p[0]},${p[1]}`;
  }).join(' ');
  const area = smooth + ` L${pts[pts.length-1][0]},${H - 18} L${pts[0][0]},${H - 18} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:H,overflow:'visible'}}>
      <defs>
        <linearGradient id="areafill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={BRAND} stopOpacity="0.2"/>
          <stop offset="100%" stopColor={BRAND} stopOpacity="0.02"/>
        </linearGradient>
      </defs>
      {[0.25,0.5,0.75].map(f => {
        const y = PAD + usableH * (1 - f);
        return <line key={f} x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="#f0f0f0" strokeWidth="1" strokeDasharray="4,3"/>;
      })}
      <path d={area} fill="url(#areafill)"/>
      <path d={smooth} fill="none" stroke={BRAND} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>
      {pts.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="5" fill="#fff" stroke={BRAND} strokeWidth="2.5"/>
          <title>{data[i][labelKey]}: ₹{fmt(data[i].total)}</title>
          <text x={x} y={y - 8} fontSize="9" fill={BRAND} textAnchor="middle" style={{fontFamily:'DM Mono,monospace',fontWeight:700}}>{fmtK(data[i].total)}</text>
        </g>
      ))}
      {data.map((d, i) => {
        const x = PAD + (i / Math.max(vals.length - 1, 1)) * (W - PAD * 2);
        return <text key={i} x={x} y={H - 2} fontSize="9" fill="#aaa" textAnchor="middle" style={{fontFamily:'DM Sans,sans-serif'}}>{d[labelKey]}</text>;
      })}
    </svg>
  );
}

function DonutChart({ segments }) {
  const hasData = segments.some(s => Number(s.value) > 0);
  if (!hasData) return <EmptyChart h={180} />;
  const total = segments.reduce((s, sg) => s + Number(sg.value), 0);
  const R = 60, CX = 80, CY = 80, STROKE = 22;
  let cumAngle = -90;
  const arcs = segments.filter(s => Number(s.value) > 0).map(s => {
    const pct   = Number(s.value) / total;
    const angle = pct * 360;
    const start = cumAngle;
    cumAngle   += angle;
    return { ...s, pct, angle, start, end: cumAngle };
  });
  function polarToXY(cx, cy, r, angleDeg) {
    const rad = (angleDeg * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  }
  function arcPath(cx, cy, r, start, end) {
    const [x1, y1] = polarToXY(cx, cy, r, start);
    const [x2, y2] = polarToXY(cx, cy, r, end);
    const large     = end - start > 180 ? 1 : 0;
    return `M${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2}`;
  }
  return (
    <div style={{display:'flex',alignItems:'center',gap:16}}>
      <svg viewBox="0 0 160 160" style={{width:160,height:160,flexShrink:0}}>
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#f3f3f3" strokeWidth={STROKE}/>
        {arcs.map((a, i) => (
          <path key={i} d={arcPath(CX, CY, R, a.start, a.end - 0.5)}
            fill="none" stroke={a.color} strokeWidth={STROKE} strokeLinecap="butt">
            <title>{a.label}: ₹{fmt(a.value)}</title>
          </path>
        ))}
        <text x={CX} y={CY - 6} textAnchor="middle" fontSize="9" fill="#aaa" style={{fontFamily:'DM Sans,sans-serif'}}>TOTAL</text>
        <text x={CX} y={CY + 10} textAnchor="middle" fontSize="12" fill="#1a1a1a" fontWeight="700" style={{fontFamily:'DM Mono,monospace'}}>{fmtK(total)}</text>
      </svg>
      <div style={{flex:1,display:'flex',flexDirection:'column',gap:8}}>
        {segments.map((s, i) => {
          const pct = total > 0 ? Math.round((Number(s.value)/total)*100) : 0;
          return (
            <div key={i} style={{display:'flex',alignItems:'center',gap:8}}>
              <div style={{width:10,height:10,borderRadius:3,background:s.color,flexShrink:0}}/>
              <div style={{flex:1,fontSize:12,color:'#555'}}>{s.label}</div>
              <div style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'#888'}}>{pct}%</div>
              <div style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'#1a1a1a',fontWeight:600,minWidth:60,textAlign:'right'}}>{fmtK(s.value)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children, action }) {
  return (
    <div style={{background:'#fff',border:'1px solid #e8e8ee',borderRadius:16,
      padding:'20px 22px',boxShadow:'0 2px 10px rgba(0,0,0,0.05)'}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:18}}>
        <div>
          <div style={{fontSize:12,fontWeight:700,color:'#1a1a1a',letterSpacing:0.2}}>{title}</div>
          {subtitle && <div style={{fontSize:11,color:'#aaa',marginTop:2}}>{subtitle}</div>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div style={{background:'#fff',border:'1px solid #e8e8ee',borderRadius:14,
      padding:'18px 20px',position:'relative',overflow:'hidden',
      boxShadow:'0 2px 8px rgba(0,0,0,0.05)',transition:'transform 0.2s,box-shadow 0.2s'}}
      onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 6px 20px rgba(0,0,0,0.1)'; }}
      onMouseLeave={e=>{ e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,0.05)'; }}>
      <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:color||BRAND,borderRadius:'16px 16px 0 0'}}/>
      <div style={{position:'absolute',top:14,right:16,fontSize:28,opacity:0.08}}>{icon}</div>
      <div style={{fontSize:22,marginBottom:10}}>{icon}</div>
      <div style={{fontSize:10,color:'#aaa',letterSpacing:1,textTransform:'uppercase',marginBottom:4}}>{label}</div>
      <div style={{fontFamily:'Playfair Display,serif',fontSize:24,fontWeight:700,color:'#1a1a1a',lineHeight:1.1}}>{value}</div>
      {sub && <div style={{fontSize:11,color:'#aaa',marginTop:5}}>{sub}</div>}
    </div>
  );
}

const SS = {
  background:'#fff', border:'1px solid #e0e0e8', borderRadius:8,
  padding:'7px 10px', fontSize:12.5, color:'#333',
  fontFamily:'DM Sans,sans-serif', outline:'none', cursor:'pointer',
};

export default function Dashboard({ user }) {
  const navigate = useNavigate();
  const now = new Date();
  const [month,       setMonth]       = useState(now.getMonth() + 1);
  const [year,        setYear]        = useState(now.getFullYear());
  const [site,        setSite]        = useState('');
  const [dateFrom,    setDateFrom]    = useState('');
  const [dateTo,      setDateTo]      = useState('');
  const [category,    setCategory]    = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [paidBy,      setPaidBy]      = useState('');
  const [payMode,     setPayMode]     = useState('');
  const [approvedBy,  setApprovedBy]  = useState('');
  const [createdBy,   setCreatedBy]   = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [data,        setData]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [viewFile,    setViewFile]    = useState(null);

  const activeFilterCount = [site, dateFrom, dateTo, category, subCategory, paidBy, payMode, approvedBy, createdBy].filter(Boolean).length;

  const load = useCallback(() => {
    setLoading(true); setError('');
    const params = {};
    if (dateFrom || dateTo) {
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo)   params.date_to   = dateTo;
    } else {
      params.month = month;
      params.year  = year;
    }
    if (site)        params.site         = site;
    if (category)    params.category     = category;
    if (subCategory) params.sub_category = subCategory;
    if (paidBy)      params.paid_by      = paidBy;
    if (payMode)     params.payment_mode = payMode;
    if (approvedBy)  params.approved_by  = approvedBy;
    if (createdBy)   params.created_by   = createdBy;
    api.get('/bills/dashboard', { params })
      .then(r => { if (r.data.success) setData(r.data.data); else setError(r.data.message||'Failed.'); })
      .catch(err => { const m = err?.response?.data?.message||'Cannot load. Check connection.'; setError(m); toast.error(m); })
      .finally(() => setLoading(false));
  }, [month, year, site, dateFrom, dateTo, category, subCategory, paidBy, payMode, approvedBy, createdBy]);

  useEffect(() => { load(); }, [load]);

  const clearFilters = () => {
    setSite(''); setDateFrom(''); setDateTo(''); setCategory('');
    setSubCategory(''); setPaidBy(''); setPayMode(''); setApprovedBy(''); setCreatedBy('');
    setMonth(now.getMonth() + 1); setYear(now.getFullYear());
  };

  const t = data?.totals || {};
  const modeSegments = [
    { label:'Cash',          value: t.cash_total,   color:'#E8471C' },
    { label:'UPI',           value: t.upi_total,    color:'#c23a16' },
    { label:'Bank Transfer', value: t.bank_total,   color:'#a83010' },
    { label:'Cheque',        value: t.cheque_total, color:'#803010' },
  ];

  const periodLabel = dateFrom || dateTo
    ? `${dateFrom||'…'} → ${dateTo||'…'}`
    : `${MONTHS[month-1]} ${year}`;

  return (
    <div className="page">

      {/* File Modal */}
      {viewFile && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:9999,
          display:'flex',alignItems:'center',justifyContent:'center',padding:24}}
          onClick={()=>setViewFile(null)}>
          <div style={{background:'#fff',borderRadius:16,padding:24,maxWidth:760,width:'100%',
            maxHeight:'88vh',overflow:'auto'}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
              <div style={{fontWeight:700,fontSize:14,color:'#1a1a1a'}}>📎 {viewFile.name}</div>
              <div style={{display:'flex',gap:8}}>
                <a href={viewFile.data} download={viewFile.name}
                  style={{padding:'6px 14px',background:BRAND,color:'#fff',borderRadius:7,textDecoration:'none',fontSize:13,fontWeight:700}}>⬇ Download</a>
                <button onClick={()=>setViewFile(null)}
                  style={{padding:'6px 12px',background:'#f0f0f0',border:'none',borderRadius:7,cursor:'pointer',fontSize:13}}>✕</button>
              </div>
            </div>
            {viewFile.type?.startsWith('image/') ? (
              <img src={viewFile.data} alt={viewFile.name} style={{width:'100%',borderRadius:8}}/>
            ) : viewFile.type==='application/pdf' ? (
              <iframe src={viewFile.data} style={{width:'100%',height:'62vh',border:'none',borderRadius:8}} title="PDF"/>
            ) : (
              <div style={{textAlign:'center',padding:40}}>
                <div style={{fontSize:48,marginBottom:12}}>📄</div>
                <a href={viewFile.data} download={viewFile.name}
                  style={{padding:'10px 22px',background:BRAND,color:'#fff',borderRadius:8,textDecoration:'none',fontWeight:700}}>Download File</a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:12,marginBottom:20}}>
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-sub">
            {periodLabel}{site ? ` · ${site}` : ''}
            {activeFilterCount > 0 && <span style={{background:'#E8471C',color:'#fff',borderRadius:20,padding:'1px 8px',fontSize:10,fontWeight:700,marginLeft:8}}>{activeFilterCount} filter{activeFilterCount>1?'s':''}</span>}
          </div>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowFilters(f => !f)}
            style={{position:'relative',border: showFilters ? '1.5px solid #E8471C' : undefined,color: showFilters ? '#E8471C' : undefined}}>
            🔽 Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>
          {activeFilterCount > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={clearFilters} style={{color:'#aaa',fontSize:12}}>✕ Clear</button>
          )}
          <button className="btn btn-primary btn-sm" onClick={()=>navigate('/bills/new')}>+ Add Bill</button>
        </div>
      </div>

      {/* ── FILTER PANEL ── */}
      {showFilters && (
        <div style={{background:'#fff',border:'1.5px solid #e8e8ee',borderRadius:14,
          padding:'20px 22px',marginBottom:20,boxShadow:'0 4px 16px rgba(0,0,0,0.06)'}}>
          <div style={{fontSize:12,fontWeight:700,color:'#555',letterSpacing:0.5,marginBottom:14}}>
            🔍 FILTER OPTIONS {user.role !== 'admin' ? '(your bills only)' : ''}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:12}}>

            {/* Date Range or Month/Year */}
            <div>
              <div style={{fontSize:11,color:'#aaa',marginBottom:5,fontWeight:600}}>DATE FROM</div>
              <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} style={{...SS,width:'100%',boxSizing:'border-box'}} />
            </div>
            <div>
              <div style={{fontSize:11,color:'#aaa',marginBottom:5,fontWeight:600}}>DATE TO</div>
              <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} style={{...SS,width:'100%',boxSizing:'border-box'}} />
            </div>

            {/* Month/Year (disabled if date range set) */}
            <div style={{opacity: (dateFrom||dateTo) ? 0.4 : 1}}>
              <div style={{fontSize:11,color:'#aaa',marginBottom:5,fontWeight:600}}>MONTH</div>
              <select value={month} onChange={e=>setMonth(+e.target.value)} style={{...SS,width:'100%'}} disabled={!!(dateFrom||dateTo)}>
                {MONTHS.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
              </select>
            </div>
            <div style={{opacity: (dateFrom||dateTo) ? 0.4 : 1}}>
              <div style={{fontSize:11,color:'#aaa',marginBottom:5,fontWeight:600}}>YEAR</div>
              <select value={year} onChange={e=>setYear(+e.target.value)} style={{...SS,width:'100%'}} disabled={!!(dateFrom||dateTo)}>
                {[2023,2024,2025,2026,2027].map(y=><option key={y}>{y}</option>)}
              </select>
            </div>

            {/* Site */}
            <div>
              <div style={{fontSize:11,color:'#aaa',marginBottom:5,fontWeight:600}}>SITE / BUILD BY</div>
              <select value={site} onChange={e=>setSite(e.target.value)} style={{...SS,width:'100%'}}>
                <option value="">All Sites</option>
                {(data?.allSites||[]).map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Category */}
            <div>
              <div style={{fontSize:11,color:'#aaa',marginBottom:5,fontWeight:600}}>CATEGORY</div>
              <select value={category} onChange={e=>setCategory(e.target.value)} style={{...SS,width:'100%'}}>
                <option value="">All Categories</option>
                {(data?.allCategories||[]).map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Sub-category */}
            <div>
              <div style={{fontSize:11,color:'#aaa',marginBottom:5,fontWeight:600}}>SUB-CATEGORY</div>
              <select value={subCategory} onChange={e=>setSubCategory(e.target.value)} style={{...SS,width:'100%'}}>
                <option value="">All Sub-categories</option>
                {(data?.allSubCategories||[]).map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Paid By */}
            <div>
              <div style={{fontSize:11,color:'#aaa',marginBottom:5,fontWeight:600}}>PAID BY</div>
              <select value={paidBy} onChange={e=>setPaidBy(e.target.value)} style={{...SS,width:'100%'}}>
                <option value="">All</option>
                {(data?.allPaidBy||[]).map(p=><option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            {/* Payment Mode */}
            <div>
              <div style={{fontSize:11,color:'#aaa',marginBottom:5,fontWeight:600}}>PAYMENT MODE</div>
              <select value={payMode} onChange={e=>setPayMode(e.target.value)} style={{...SS,width:'100%'}}>
                <option value="">All Modes</option>
                {(data?.paymentModes||['Cash','UPI','Bank Transfer','Cheque','Other']).map(m=><option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* Approved By */}
            <div>
              <div style={{fontSize:11,color:'#aaa',marginBottom:5,fontWeight:600}}>APPROVED BY</div>
              <select value={approvedBy} onChange={e=>setApprovedBy(e.target.value)} style={{...SS,width:'100%'}}>
                <option value="">All</option>
                {(data?.allApprovedBy||[]).map(a=><option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            {/* Created By (admin only) */}
            {user.role === 'admin' && (
              <div>
                <div style={{fontSize:11,color:'#aaa',marginBottom:5,fontWeight:600}}>ADDED BY USER</div>
                <select value={createdBy} onChange={e=>setCreatedBy(e.target.value)} style={{...SS,width:'100%'}}>
                  <option value="">All Users</option>
                  {(data?.allUsers||[]).map(u=><option key={u.id} value={u.id}>{u.display}</option>)}
                </select>
              </div>
            )}
          </div>

          <div style={{display:'flex',gap:10,marginTop:16}}>
            <button className="btn btn-primary btn-sm" onClick={load}>Apply Filters</button>
            <button className="btn btn-ghost btn-sm" onClick={clearFilters}>Reset All</button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{background:'#FEF2F2',border:'1px solid #FECACA',color:'#B91C1C',
          borderRadius:10,padding:'12px 16px',marginBottom:20,fontSize:13,display:'flex',alignItems:'center',gap:12}}>
          <span>⚠️ {error}</span>
          <button onClick={load} style={{background:'none',border:'none',color:BRAND,cursor:'pointer',fontWeight:700,textDecoration:'underline',fontSize:13}}>Retry</button>
        </div>
      )}

      {loading ? (
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:100,gap:14,color:'#aaa'}}>
          <span className="spinner"/> Loading dashboard…
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:14,marginBottom:24}}>
            <StatCard icon="💸" label="Total Spend"   value={`₹${fmt(t.total_amount)}`}  sub={`${t.total_count||0} bills · ${periodLabel}`} color={BRAND}/>
            <StatCard icon="💵" label="Cash"          value={`₹${fmt(t.cash_total)}`}    color="#c23a16"/>
            <StatCard icon="📲" label="UPI"           value={`₹${fmt(t.upi_total)}`}     color="#a83010"/>
            <StatCard icon="🏦" label="Bank Transfer" value={`₹${fmt(t.bank_total)}`}    color="#803010"/>
            <StatCard icon="🧾" label="Cheque"        value={`₹${fmt(t.cheque_total)}`}  color="#555"/>
          </div>

          {/* Row 1: Category + Donut */}
          <div style={{display:'grid',gridTemplateColumns:'3fr 2fr',gap:18,marginBottom:18}}>
            <ChartCard title="Spend by Category" subtitle={`Top categories · ${periodLabel}`}>
              <HBarChart data={data?.byCategory} labelKey="category" height={200}/>
            </ChartCard>
            <ChartCard title="Payment Mode Split" subtitle="Where the money went">
              <DonutChart segments={modeSegments}/>
            </ChartCard>
          </div>

          {/* Row 2: Daily + Site */}
          <div style={{display:'grid',gridTemplateColumns:'3fr 2fr',gap:18,marginBottom:18}}>
            <ChartCard title={`Daily Spend — ${periodLabel}`} subtitle="Each bar = one day with expenses">
              <VBarChart data={data?.daily} labelKey="day"/>
            </ChartCard>
            <ChartCard title="Spend by Site / Purpose" subtitle="Top locations">
              <HBarChart data={data?.bySite} labelKey="purpose_site" height={180}/>
            </ChartCard>
          </div>

          {/* Row 3: Monthly + Paid By */}
          <div style={{display:'grid',gridTemplateColumns:'3fr 2fr',gap:18,marginBottom:24}}>
            <ChartCard title="Monthly Trend" subtitle="Last 6 months total spend">
              <AreaChart data={data?.monthly} labelKey="month_label" height={150}/>
            </ChartCard>
            <ChartCard title="Spend by Paid By" subtitle="Who made the payments">
              <HBarChart data={data?.byPaidBy} labelKey="paid_by" height={180}/>
            </ChartCard>
          </div>

          {/* Recent Bills */}
          <div style={{background:'#fff',border:'1px solid #e8e8ee',borderRadius:16,
            overflow:'hidden',boxShadow:'0 2px 10px rgba(0,0,0,0.05)'}}>
            <div style={{padding:'16px 22px',borderBottom:'1px solid #f0f0f0',
              display:'flex',alignItems:'center',justifyContent:'space-between',
              background:'linear-gradient(to right,#fff,#fffaf9)'}}>
              <div style={{fontWeight:700,fontSize:13,color:'#1a1a1a',letterSpacing:0.3}}>🕐 Recent Bills</div>
              <button className="btn btn-ghost btn-sm" onClick={()=>navigate('/bills')}>View All →</button>
            </div>
            {!data?.recent?.length ? (
              <div style={{textAlign:'center',padding:'48px 24px',color:'#ccc'}}>
                <div style={{fontSize:36,marginBottom:10}}>🧾</div>
                <div style={{fontSize:14}}>No bills for this filter —{' '}
                  <span style={{color:BRAND,cursor:'pointer',fontWeight:600}} onClick={()=>navigate('/bills/new')}>add a bill</span>
                </div>
              </div>
            ) : data.recent.map(b => (
              <div key={b.id} style={{display:'flex',alignItems:'center',gap:14,
                padding:'13px 22px',borderBottom:'1px solid #f5f5f5',
                cursor:'pointer',transition:'background 0.15s'}}
                onMouseEnter={e=>e.currentTarget.style.background='#fffaf9'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                onClick={()=>navigate(`/bills/${b.id}/edit`)}>
                <div style={{width:38,height:38,background:'#fff4f0',borderRadius:10,
                  display:'flex',alignItems:'center',justifyContent:'center',
                  fontSize:17,flexShrink:0,border:'1px solid rgba(232,71,28,0.12)'}}>
                  {CAT_ICONS[b.category]||'📋'}
                </div>
                <div style={{flex:1,overflow:'hidden'}}>
                  <div style={{fontSize:13.5,fontWeight:600,color:'#1a1a1a',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{b.description}</div>
                  <div style={{fontSize:11,color:'#aaa',marginTop:3,display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
                    <span style={{background:'#fff4f0',color:BRAND,padding:'1px 7px',borderRadius:4,fontFamily:'DM Mono,monospace',fontSize:10,fontWeight:600}}>{b.voucher_no}</span>
                    <span>{b.date}</span>
                    {b.purpose_site && <span>· {b.purpose_site}</span>}
                    {b.vendor       && <span>· {b.vendor}</span>}
                    {b.created_by_name && <span>· by {b.created_by_name}</span>}
                  </div>
                </div>
                {b.attachment_name && (
                  <button onClick={e=>{
                    e.stopPropagation();
                    api.get(`/bills/${b.id}`).then(r=>{
                      const bill=r.data.data;
                      if (bill.attachment_data) setViewFile({name:bill.attachment_name,data:bill.attachment_data,type:bill.attachment_type});
                      else toast.error('No file data found.');
                    }).catch(()=>toast.error('Failed to load file.'));
                  }} style={{background:'rgba(232,71,28,0.07)',border:'1px solid rgba(232,71,28,0.18)',
                    color:BRAND,padding:'4px 10px',borderRadius:6,cursor:'pointer',
                    fontSize:11,fontWeight:600,whiteSpace:'nowrap',flexShrink:0}}>
                    📎 {b.attachment_name.length>14 ? b.attachment_name.slice(0,14)+'…' : b.attachment_name}
                  </button>
                )}
                <div style={{fontFamily:'DM Mono,monospace',fontSize:15,fontWeight:700,color:BRAND,marginLeft:6,flexShrink:0}}>
                  ₹{fmt(b.amount)}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
