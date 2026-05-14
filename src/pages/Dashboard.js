import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';

const MONTHS  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const BRAND   = '#6366f1';
const PALETTE = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#14b8a6'];

const CAT_ICONS = {
  Laminates:'🪵', Hardware:'🔩', Salary:'💰', Transport:'🚛',
  Labour:'👷', 'Raw Material':'📦', Admin:'🏢', EMI:'🏦', Other:'📋'
};

function fmt(n)  { return Number(n||0).toLocaleString('en-IN'); }
function fmtK(n) {
  const v = Number(n||0);
  if (v >= 100000) return `₹${(v/100000).toFixed(1)}L`;
  if (v >= 1000)   return `₹${(v/1000).toFixed(1)}K`;
  return `₹${v}`;
}

function EmptyChart({ h = 140 }) {
  return (
    <div style={{ height:h, display:'flex', flexDirection:'column', alignItems:'center',
      justifyContent:'center', color:'#cbd5e1', gap:8 }}>
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="2" y="18" width="6" height="10" rx="2" fill="#e2e8f0"/>
        <rect x="11" y="10" width="6" height="18" rx="2" fill="#e2e8f0"/>
        <rect x="20" y="14" width="6" height="14" rx="2" fill="#e2e8f0"/>
      </svg>
      <span style={{ fontSize:12 }}>No data for this period</span>
    </div>
  );
}

function HBarChart({ data, labelKey, valueKey='total', height=200 }) {
  if (!data?.length || data.every(d => Number(d[valueKey])===0)) return <EmptyChart h={height}/>;
  const items = data.slice(0,7);
  const max   = Math.max(...items.map(d => Number(d[valueKey])), 1);
  const ROW_H=26, GAP=8, LABEL_W=90, barW=300;
  const svgH  = items.length*(ROW_H+GAP);
  return (
    <svg viewBox={`0 0 ${LABEL_W+barW+90} ${svgH}`} style={{width:'100%',height:svgH,overflow:'visible'}}>
      {items.map((d,i) => {
        const y  = i*(ROW_H+GAP);
        const bw = Math.max((Number(d[valueKey])/max)*barW, 2);
        const label = String(d[labelKey]||'—');
        return (
          <g key={i}>
            <text x={LABEL_W-8} y={y+ROW_H/2+4} textAnchor="end" fontSize="11" fill="#64748b" style={{fontFamily:'Inter,sans-serif'}}>
              {label.length>14 ? label.slice(0,14)+'…' : label}
            </text>
            <rect x={LABEL_W} y={y+3} width={barW} height={ROW_H-6} rx="5" fill="#f1f5f9"/>
            <rect x={LABEL_W} y={y+3} width={bw}  height={ROW_H-6} rx="5" fill={PALETTE[i%PALETTE.length]}>
              <animate attributeName="width" from="0" to={bw} dur="0.6s" fill="freeze"/>
            </rect>
            <text x={LABEL_W+bw+7} y={y+ROW_H/2+4} fontSize="10" fill="#94a3b8" style={{fontFamily:'JetBrains Mono,monospace'}}>
              {fmtK(d[valueKey])}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function VBarChart({ data, labelKey='day' }) {
  if (!data?.length || data.every(d=>Number(d.total)===0)) return <EmptyChart h={160}/>;
  const vals = data.map(d=>Number(d.total));
  const max  = Math.max(...vals,1);
  const W=480, H=130, PAD_B=22, PAD_T=10;
  const barW = Math.max(Math.floor((W-20)/data.length)-3, 4);
  const usableH = H-PAD_B-PAD_T;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:H+20,overflow:'visible'}}>
      {[0.25,0.5,0.75,1].map(f => {
        const y = PAD_T+usableH*(1-f);
        return (
          <g key={f}>
            <line x1="10" y1={y} x2={W-10} y2={y} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4,3"/>
            <text x="8" y={y+3} fontSize="8" fill="#cbd5e1" textAnchor="end" style={{fontFamily:'JetBrains Mono,monospace'}}>{fmtK(max*f)}</text>
          </g>
        );
      })}
      {data.map((d,i) => {
        const x  = 12+i*(barW+3);
        const bh = Math.max((vals[i]/max)*usableH,2);
        const y  = PAD_T+usableH-bh;
        const isMax = vals[i]===max;
        return (
          <g key={i}>
            <rect x={x} y={PAD_T+usableH} width={barW} height={0} rx="3" fill={isMax ? BRAND : 'rgba(99,102,241,0.45)'}>
              <animate attributeName="y" from={PAD_T+usableH} to={y} dur="0.6s" fill="freeze"/>
              <animate attributeName="height" from="0" to={bh} dur="0.6s" fill="freeze"/>
            </rect>
            <title>Day {d[labelKey]}: ₹{fmt(d.total)}</title>
            {data.length<=15 && (
              <text x={x+barW/2} y={H-4} fontSize="8" fill="#cbd5e1" textAnchor="middle" style={{fontFamily:'JetBrains Mono,monospace'}}>{d[labelKey]}</text>
            )}
          </g>
        );
      })}
      <line x1="10" y1={PAD_T+usableH} x2={W-10} y2={PAD_T+usableH} stroke="#e2e8f0" strokeWidth="1"/>
    </svg>
  );
}

function AreaChart({ data, labelKey='month_label', height=130 }) {
  if (!data?.length || data.every(d=>Number(d.total)===0)) return <EmptyChart h={height}/>;
  const vals = data.map(d=>Number(d.total));
  const max  = Math.max(...vals,1);
  const W=480, H=height, PAD=14;
  const usableH = H-PAD*2-18;
  const pts = vals.map((v,i) => {
    const x = PAD+(i/Math.max(vals.length-1,1))*(W-PAD*2);
    const y = PAD+usableH-(v/max)*usableH;
    return [x,y];
  });
  const smooth = pts.map((p,i) => {
    if (i===0) return `M${p[0]},${p[1]}`;
    const prev=pts[i-1], cpx=(prev[0]+p[0])/2;
    return `C${cpx},${prev[1]} ${cpx},${p[1]} ${p[0]},${p[1]}`;
  }).join(' ');
  const area = smooth+` L${pts[pts.length-1][0]},${H-18} L${pts[0][0]},${H-18} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:H,overflow:'visible'}}>
      <defs>
        <linearGradient id="areafill2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={BRAND} stopOpacity="0.18"/>
          <stop offset="100%" stopColor={BRAND} stopOpacity="0.02"/>
        </linearGradient>
      </defs>
      {[0.25,0.5,0.75].map(f => {
        const y=PAD+usableH*(1-f);
        return <line key={f} x1={PAD} y1={y} x2={W-PAD} y2={y} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4,3"/>;
      })}
      <path d={area} fill="url(#areafill2)"/>
      <path d={smooth} fill="none" stroke={BRAND} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>
      {pts.map(([x,y],i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="4.5" fill="#fff" stroke={BRAND} strokeWidth="2.5"/>
          <title>{data[i][labelKey]}: ₹{fmt(data[i].total)}</title>
          <text x={x} y={y-8} fontSize="9" fill={BRAND} textAnchor="middle" style={{fontFamily:'JetBrains Mono,monospace',fontWeight:700}}>{fmtK(data[i].total)}</text>
        </g>
      ))}
      {data.map((d,i) => {
        const x=PAD+(i/Math.max(vals.length-1,1))*(W-PAD*2);
        return <text key={i} x={x} y={H-2} fontSize="9" fill="#94a3b8" textAnchor="middle" style={{fontFamily:'Inter,sans-serif'}}>{d[labelKey]}</text>;
      })}
    </svg>
  );
}

function DonutChart({ segments }) {
  const hasData = segments.some(s=>Number(s.value)>0);
  if (!hasData) return <EmptyChart h={180}/>;
  const total = segments.reduce((s,sg)=>s+Number(sg.value),0);
  const R=58,CX=78,CY=78,STROKE=20;
  let cumAngle=-90;
  const arcs=segments.filter(s=>Number(s.value)>0).map(s => {
    const pct=Number(s.value)/total;
    const angle=pct*360;
    const start=cumAngle;
    cumAngle+=angle;
    return {...s,pct,angle,start,end:cumAngle};
  });
  function polarToXY(cx,cy,r,angleDeg) {
    const rad=(angleDeg*Math.PI)/180;
    return [cx+r*Math.cos(rad),cy+r*Math.sin(rad)];
  }
  function arcPath(cx,cy,r,start,end) {
    const [x1,y1]=polarToXY(cx,cy,r,start);
    const [x2,y2]=polarToXY(cx,cy,r,end);
    const large=end-start>180?1:0;
    return `M${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2}`;
  }
  return (
    <div style={{display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>
      <svg viewBox="0 0 156 156" style={{width:156,height:156,flexShrink:0}}>
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#f1f5f9" strokeWidth={STROKE}/>
        {arcs.map((a,i) => (
          <path key={i} d={arcPath(CX,CY,R,a.start,a.end-0.5)}
            fill="none" stroke={a.color} strokeWidth={STROKE} strokeLinecap="butt">
            <title>{a.label}: ₹{fmt(a.value)}</title>
          </path>
        ))}
        <text x={CX} y={CY-5} textAnchor="middle" fontSize="9" fill="#94a3b8" style={{fontFamily:'Inter,sans-serif'}}>TOTAL</text>
        <text x={CX} y={CY+11} textAnchor="middle" fontSize="12" fill="#0f172a" fontWeight="700" style={{fontFamily:'JetBrains Mono,monospace'}}>{fmtK(total)}</text>
      </svg>
      <div style={{flex:1,display:'flex',flexDirection:'column',gap:9}}>
        {segments.map((s,i) => {
          const pct=total>0?Math.round((Number(s.value)/total)*100):0;
          return (
            <div key={i} style={{display:'flex',alignItems:'center',gap:8}}>
              <div style={{width:9,height:9,borderRadius:3,background:s.color,flexShrink:0}}/>
              <div style={{flex:1,fontSize:12,color:'#475569'}}>{s.label}</div>
              <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:10,color:'#94a3b8'}}>{pct}%</div>
              <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:11,color:'#0f172a',fontWeight:600,minWidth:58,textAlign:'right'}}>{fmtK(s.value)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const SS = {
  background:'#fff',border:'1.5px solid #e2e8f0',borderRadius:8,
  padding:'7px 10px',fontSize:12.5,color:'#0f172a',
  fontFamily:'Inter,sans-serif',outline:'none',cursor:'pointer',
};

export default function Dashboard({ user }) {
  const navigate  = useNavigate();
  const now       = new Date();
  const [month,       setMonth]       = useState(now.getMonth()+1);
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

  const activeFilterCount = [site,dateFrom,dateTo,category,subCategory,paidBy,payMode,approvedBy,createdBy].filter(Boolean).length;

  const load = useCallback(() => {
    setLoading(true); setError('');
    const params = {};
    if (dateFrom||dateTo) { if(dateFrom) params.date_from=dateFrom; if(dateTo) params.date_to=dateTo; }
    else { params.month=month; params.year=year; }
    if (site)        params.site         = site;
    if (category)    params.category     = category;
    if (subCategory) params.sub_category = subCategory;
    if (paidBy)      params.paid_by      = paidBy;
    if (payMode)     params.payment_mode = payMode;
    if (approvedBy)  params.approved_by  = approvedBy;
    if (createdBy)   params.created_by   = createdBy;
    api.get('/bills/dashboard', { params })
      .then(r => { if(r.data.success) setData(r.data.data); else setError(r.data.message||'Failed.'); })
      .catch(err => { const m=err?.response?.data?.message||'Cannot load. Check connection.'; setError(m); toast.error(m); })
      .finally(() => setLoading(false));
  }, [month,year,site,dateFrom,dateTo,category,subCategory,paidBy,payMode,approvedBy,createdBy]);

  useEffect(() => { load(); }, [load]);

  const clearFilters = () => {
    setSite(''); setDateFrom(''); setDateTo(''); setCategory('');
    setSubCategory(''); setPaidBy(''); setPayMode(''); setApprovedBy(''); setCreatedBy('');
    setMonth(now.getMonth()+1); setYear(now.getFullYear());
  };

  const t = data?.totals||{};
  const modeSegments = [
    { label:'Cash',          value:t.cash_total,   color:'#6366f1' },
    { label:'UPI',           value:t.upi_total,    color:'#8b5cf6' },
    { label:'Bank Transfer', value:t.bank_total,   color:'#06b6d4' },
    { label:'Cheque',        value:t.cheque_total, color:'#10b981' },
  ];

  const periodLabel = dateFrom||dateTo
    ? `${dateFrom||'…'} → ${dateTo||'…'}`
    : `${MONTHS[month-1]} ${year}`;

  return (
    <div className="page">

      {/* File Modal */}
      {viewFile && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.65)',zIndex:9999,
          display:'flex',alignItems:'center',justifyContent:'center',padding:24}}
          onClick={()=>setViewFile(null)}>
          <div style={{background:'#fff',borderRadius:16,padding:24,maxWidth:760,width:'100%',
            maxHeight:'88vh',overflow:'auto'}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
              <div style={{fontWeight:700,fontSize:14}}>📎 {viewFile.name}</div>
              <div style={{display:'flex',gap:8}}>
                <a href={viewFile.data} download={viewFile.name}
                  style={{padding:'6px 14px',background:BRAND,color:'#fff',borderRadius:7,textDecoration:'none',fontSize:13,fontWeight:700}}>⬇ Download</a>
                <button onClick={()=>setViewFile(null)}
                  style={{padding:'6px 12px',background:'#f1f5f9',border:'none',borderRadius:7,cursor:'pointer',fontSize:13}}>✕</button>
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

      {/* ── Page Header ── */}
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:12,marginBottom:22}}>
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-sub">
            {periodLabel}{site?` · ${site}`:''}
            {activeFilterCount>0 && (
              <span style={{background:BRAND,color:'#fff',borderRadius:20,padding:'1px 8px',
                fontSize:10,fontWeight:700,marginLeft:8,verticalAlign:'middle'}}>
                {activeFilterCount} filter{activeFilterCount>1?'s':''}
              </span>
            )}
          </div>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
          <button className="btn btn-ghost btn-sm"
            onClick={()=>setShowFilters(f=>!f)}
            style={{borderColor:showFilters?BRAND:undefined,color:showFilters?BRAND:undefined}}>
            ⚙ Filters{activeFilterCount>0?` (${activeFilterCount})`:''}
          </button>
          {activeFilterCount>0 && (
            <button className="btn btn-ghost btn-sm" onClick={clearFilters} style={{color:'#94a3b8',fontSize:12}}>✕ Clear</button>
          )}
          <button className="btn btn-primary btn-sm" onClick={()=>navigate('/bills/new')}>+ Add Bill</button>
        </div>
      </div>

      {/* ── Filter Panel ── */}
      {showFilters && (
        <div style={{background:'#fff',border:'1.5px solid #e2e8f0',borderRadius:14,
          padding:'20px 22px',marginBottom:22,boxShadow:'0 4px 14px rgba(0,0,0,0.06)'}}>
          <div style={{fontSize:11,fontWeight:700,color:'#64748b',letterSpacing:0.5,marginBottom:14,textTransform:'uppercase'}}>
            Filter Options {user.role!=='admin'?'(your bills only)':''}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(175px,1fr))',gap:12}}>
            <div>
              <div style={{fontSize:11,color:'#94a3b8',marginBottom:5,fontWeight:600,textTransform:'uppercase',letterSpacing:0.5}}>Date From</div>
              <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} style={{...SS,width:'100%',boxSizing:'border-box'}}/>
            </div>
            <div>
              <div style={{fontSize:11,color:'#94a3b8',marginBottom:5,fontWeight:600,textTransform:'uppercase',letterSpacing:0.5}}>Date To</div>
              <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} style={{...SS,width:'100%',boxSizing:'border-box'}}/>
            </div>
            <div style={{opacity:(dateFrom||dateTo)?0.4:1}}>
              <div style={{fontSize:11,color:'#94a3b8',marginBottom:5,fontWeight:600,textTransform:'uppercase',letterSpacing:0.5}}>Month</div>
              <select value={month} onChange={e=>setMonth(+e.target.value)} style={{...SS,width:'100%'}} disabled={!!(dateFrom||dateTo)}>
                {MONTHS.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
              </select>
            </div>
            <div style={{opacity:(dateFrom||dateTo)?0.4:1}}>
              <div style={{fontSize:11,color:'#94a3b8',marginBottom:5,fontWeight:600,textTransform:'uppercase',letterSpacing:0.5}}>Year</div>
              <select value={year} onChange={e=>setYear(+e.target.value)} style={{...SS,width:'100%'}} disabled={!!(dateFrom||dateTo)}>
                {[2023,2024,2025,2026,2027].map(y=><option key={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <div style={{fontSize:11,color:'#94a3b8',marginBottom:5,fontWeight:600,textTransform:'uppercase',letterSpacing:0.5}}>Site / Build By</div>
              <select value={site} onChange={e=>setSite(e.target.value)} style={{...SS,width:'100%'}}>
                <option value="">All Sites</option>
                {(data?.allSites||[]).map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <div style={{fontSize:11,color:'#94a3b8',marginBottom:5,fontWeight:600,textTransform:'uppercase',letterSpacing:0.5}}>Category</div>
              <select value={category} onChange={e=>setCategory(e.target.value)} style={{...SS,width:'100%'}}>
                <option value="">All Categories</option>
                {(data?.allCategories||[]).map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <div style={{fontSize:11,color:'#94a3b8',marginBottom:5,fontWeight:600,textTransform:'uppercase',letterSpacing:0.5}}>Sub-Category</div>
              <select value={subCategory} onChange={e=>setSubCategory(e.target.value)} style={{...SS,width:'100%'}}>
                <option value="">All</option>
                {(data?.allSubCategories||[]).map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <div style={{fontSize:11,color:'#94a3b8',marginBottom:5,fontWeight:600,textTransform:'uppercase',letterSpacing:0.5}}>Paid By</div>
              <select value={paidBy} onChange={e=>setPaidBy(e.target.value)} style={{...SS,width:'100%'}}>
                <option value="">All</option>
                {(data?.allPaidBy||[]).map(p=><option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <div style={{fontSize:11,color:'#94a3b8',marginBottom:5,fontWeight:600,textTransform:'uppercase',letterSpacing:0.5}}>Payment Mode</div>
              <select value={payMode} onChange={e=>setPayMode(e.target.value)} style={{...SS,width:'100%'}}>
                <option value="">All Modes</option>
                {(data?.paymentModes||['Cash','UPI','Bank Transfer','Cheque','Other']).map(m=><option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <div style={{fontSize:11,color:'#94a3b8',marginBottom:5,fontWeight:600,textTransform:'uppercase',letterSpacing:0.5}}>Approved By</div>
              <select value={approvedBy} onChange={e=>setApprovedBy(e.target.value)} style={{...SS,width:'100%'}}>
                <option value="">All</option>
                {(data?.allApprovedBy||[]).map(a=><option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            {user.role==='admin' && (
              <div>
                <div style={{fontSize:11,color:'#94a3b8',marginBottom:5,fontWeight:600,textTransform:'uppercase',letterSpacing:0.5}}>Added By User</div>
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
        <div style={{background:'#fef2f2',border:'1px solid #fecaca',color:'#b91c1c',
          borderRadius:10,padding:'12px 16px',marginBottom:20,fontSize:13,
          display:'flex',alignItems:'center',gap:12}}>
          <span>⚠️ {error}</span>
          <button onClick={load} style={{background:'none',border:'none',color:BRAND,cursor:'pointer',fontWeight:700,textDecoration:'underline'}}>Retry</button>
        </div>
      )}

      {loading ? (
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:100,gap:14,color:'#94a3b8'}}>
          <span className="spinner"/> Loading dashboard…
        </div>
      ) : (
        <>
          {/* ── KPI Strip ── */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:10,marginBottom:20}}>
            {[
              { icon:'💸', label:'Total Spend',    value:`₹${fmt(t.total_amount)}`, sub:`${t.total_count||0} bills · ${periodLabel}`, color:'#6366f1', bg:'rgba(99,102,241,0.06)' },
              { icon:'💵', label:'Cash',            value:`₹${fmt(t.cash_total)}`,   color:'#10b981', bg:'rgba(16,185,129,0.06)' },
              { icon:'📲', label:'UPI',             value:`₹${fmt(t.upi_total)}`,    color:'#8b5cf6', bg:'rgba(139,92,246,0.06)' },
              { icon:'🏦', label:'Bank Transfer',   value:`₹${fmt(t.bank_total)}`,   color:'#06b6d4', bg:'rgba(6,182,212,0.06)' },
              { icon:'🧾', label:'Cheque',          value:`₹${fmt(t.cheque_total)}`, color:'#f59e0b', bg:'rgba(245,158,11,0.06)' },
            ].map((c,i) => (
              <div key={i} style={{
                background:'#fff', border:'1px solid #e2e8f0',
                borderRadius:14, padding:'16px 18px',
                borderLeft:`3px solid ${c.color}`,
                position:'relative', overflow:'hidden',
                transition:'transform 0.15s,box-shadow 0.15s',
                cursor:'default',
              }}
                onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 6px 18px rgba(0,0,0,0.08)'; }}
                onMouseLeave={e=>{ e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow=''; }}
              >
                <div style={{position:'absolute',top:12,right:14,fontSize:24,opacity:0.07}}>{c.icon}</div>
                <div style={{fontSize:18,marginBottom:8}}>{c.icon}</div>
                <div style={{fontSize:10,color:'#94a3b8',letterSpacing:0.8,textTransform:'uppercase',marginBottom:4,fontWeight:600}}>{c.label}</div>
                <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:20,fontWeight:800,color:'#0f172a',lineHeight:1.1}}>{c.value}</div>
                {c.sub && <div style={{fontSize:11,color:'#94a3b8',marginTop:5}}>{c.sub}</div>}
              </div>
            ))}
          </div>

          {/* ── Row 1: Category bar + Payment donut ── */}
          <div className='dash-chart-row' style={{display:'grid',gridTemplateColumns:'3fr 2fr',gap:14,marginBottom:14}}>
            <div className="chart-card">
              <div className="chart-title">Spend by Category</div>
              <div className="chart-sub">Top categories · {periodLabel}</div>
              <HBarChart data={data?.byCategory} labelKey="category" height={200}/>
            </div>
            <div className="chart-card">
              <div className="chart-title">Payment Mode Split</div>
              <div className="chart-sub">Where the money went</div>
              <DonutChart segments={modeSegments}/>
            </div>
          </div>

          {/* ── Row 2: Daily bar + Site bar ── */}
          <div className='dash-chart-row' style={{display:'grid',gridTemplateColumns:'3fr 2fr',gap:14,marginBottom:14}}>
            <div className="chart-card">
              <div className="chart-title">Daily Spend — {periodLabel}</div>
              <div className="chart-sub">Each bar = one day with expenses</div>
              <VBarChart data={data?.daily} labelKey="day"/>
            </div>
            <div className="chart-card">
              <div className="chart-title">Spend by Site / Purpose</div>
              <div className="chart-sub">Top locations</div>
              <HBarChart data={data?.bySite} labelKey="purpose_site" height={180}/>
            </div>
          </div>

          {/* ── Row 3: Monthly trend + Paid By ── */}
          <div className='dash-chart-row' style={{display:'grid',gridTemplateColumns:'3fr 2fr',gap:14,marginBottom:14}}>
            <div className="chart-card">
              <div className="chart-title">Monthly Trend</div>
              <div className="chart-sub">Last 6 months total spend</div>
              <AreaChart data={data?.monthly} labelKey="month_label" height={150}/>
            </div>
            <div className="chart-card">
              <div className="chart-title">Spend by Paid By</div>
              <div className="chart-sub">Who made the payments</div>
              <HBarChart data={data?.byPaidBy} labelKey="paid_by" height={180}/>
            </div>
          </div>

          {/* ── Recent Bills ── */}
          <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:16,
            overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
            <div style={{padding:'14px 20px',borderBottom:'1px solid #f1f5f9',
              display:'flex',alignItems:'center',justifyContent:'space-between',
              background:'#fafbff'}}>
              <div style={{fontWeight:700,fontSize:13,color:'#0f172a',letterSpacing:0.2}}>
                🕐 Recent Bills
              </div>
              <button className="btn btn-ghost btn-sm" onClick={()=>navigate('/bills')}>View All →</button>
            </div>

            {!data?.recent?.length ? (
              <div style={{textAlign:'center',padding:'48px 24px',color:'#cbd5e1'}}>
                <div style={{fontSize:36,marginBottom:10}}>🧾</div>
                <div style={{fontSize:14}}>No bills for this filter —{' '}
                  <span style={{color:BRAND,cursor:'pointer',fontWeight:600}} onClick={()=>navigate('/bills/new')}>add one</span>
                </div>
              </div>
            ) : data.recent.map(b => (
              <div key={b.id} style={{display:'flex',alignItems:'center',gap:14,
                padding:'12px 20px',borderBottom:'1px solid #f8fafc',
                cursor:'pointer',transition:'background 0.14s'}}
                onMouseEnter={e=>e.currentTarget.style.background='#fafbff'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                onClick={()=>navigate(`/bills/${b.id}/edit`)}>
                <div style={{width:36,height:36,background:'rgba(99,102,241,0.08)',borderRadius:9,
                  display:'flex',alignItems:'center',justifyContent:'center',
                  fontSize:16,flexShrink:0,border:'1px solid rgba(99,102,241,0.12)'}}>
                  {CAT_ICONS[b.category]||'📋'}
                </div>
                <div style={{flex:1,overflow:'hidden'}}>
                  <div style={{fontSize:13.5,fontWeight:600,color:'#0f172a',
                    whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                    {b.description}
                  </div>
                  <div style={{fontSize:11,color:'#94a3b8',marginTop:2,display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
                    <span style={{background:'rgba(99,102,241,0.08)',color:BRAND,
                      padding:'1px 7px',borderRadius:4,fontFamily:'JetBrains Mono,monospace',
                      fontSize:10,fontWeight:600}}>{b.voucher_no}</span>
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
                      if(bill.attachment_data) setViewFile({name:bill.attachment_name,data:bill.attachment_data,type:bill.attachment_type});
                      else toast.error('No file data found.');
                    }).catch(()=>toast.error('Failed to load file.'));
                  }} style={{background:'rgba(99,102,241,0.07)',border:'1px solid rgba(99,102,241,0.2)',
                    color:BRAND,padding:'4px 10px',borderRadius:6,cursor:'pointer',
                    fontSize:11,fontWeight:600,whiteSpace:'nowrap',flexShrink:0}}>
                    📎 {b.attachment_name.length>14 ? b.attachment_name.slice(0,14)+'…' : b.attachment_name}
                  </button>
                )}
                <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:15,fontWeight:800,
                  color:BRAND,marginLeft:4,flexShrink:0}}>
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
