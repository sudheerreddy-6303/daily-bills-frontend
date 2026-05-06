import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';

// Default options — merged with custom DB options
const DEFAULTS = {
  category:     ['Laminates','Hardware','Salary','Transport','Labour','Raw Material','Admin','EMI','Other'],
  sub_category: ['Raw Material','Labour','Fixed Cost','Admin','Other'],
  purpose_site: ['Experience Center 1','EC2','Mod Factory','Office','Site A','Site B'],
  paid_by:      ['Ramya','Teja','Sundar','Bank'],
  approved_by:  ['Ramya','Sundar','Seshagiri Raju'],
  payment_mode: ['Cash','UPI','Bank Transfer','Cheque','Other'],
};

const today = () => new Date().toISOString().slice(0,10);
const EMPTY = {
  date:'', description:'', purpose_site:'', category:'', sub_category:'',
  vendor:'', paid_by:'', payment_mode:'Cash', amount:'',
  gst_tax:'', bill_attached:'No', approved_by:'', notes:'',
  attachment_name:null, attachment_data:null, attachment_type:null,
  submitted_by:'',
};

const toBase64 = (file) => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(r.result);
  r.onerror = rej;
  r.readAsDataURL(file);
});

// Smart dropdown with "+ Add New" option
function SmartSelect({ label, fieldName, value, onChange, options, required, placeholder, onOptionAdded }) {
  const [adding, setAdding] = useState(false);
  const [newVal, setNewVal] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    const trimmed = newVal.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await api.post('/dropdowns', { field_name: fieldName, value: trimmed });
      onChange(trimmed);
      // Immediately push new option into parent state — no reload needed
      if (onOptionAdded) onOptionAdded(fieldName, trimmed);
      toast.success(`"${trimmed}" added!`);
      setNewVal(''); setAdding(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to add.');
    }
    setSaving(false);
  };

  return (
    <div className="field">
      <label>{label}{required && <span className="required"> *</span>}</label>
      {!adding ? (
        <select value={value} onChange={e => {
          if (e.target.value === '__add_new') { setAdding(true); }
          else onChange(e.target.value);
        }}>
          <option value="">{placeholder || `— Select ${label} —`}</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
          <option value="__add_new" style={{color:'#E8471C',fontWeight:700}}>＋ Add New…</option>
        </select>
      ) : (
        <div style={{display:'flex',gap:8}}>
          <input
            autoFocus
            className="field-inline-input"
            placeholder={`New ${label}…`}
            value={newVal}
            onChange={e => setNewVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
            style={{flex:1,padding:'10px 14px',border:'1.5px solid #E8471C',borderRadius:8,
              fontSize:14,fontFamily:'inherit',outline:'none',background:'#fff',color:'#1a1a1a'}}
          />
          <button type="button" onClick={handleAdd} disabled={saving}
            style={{padding:'8px 14px',background:'#E8471C',color:'#fff',border:'none',
              borderRadius:8,cursor:'pointer',fontWeight:700,fontSize:13}}>
            {saving ? '…' : '✓'}
          </button>
          <button type="button" onClick={() => { setAdding(false); setNewVal(''); }}
            style={{padding:'8px 12px',background:'#f0f0f0',border:'none',
              borderRadius:8,cursor:'pointer',fontSize:13,color:'#666'}}>
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

export default function BillForm({ user }) {
  const navigate   = useNavigate();
  const { id }     = useParams();
  const isEdit     = Boolean(id);
  const fileRef    = useRef();

  const [form,     setForm]     = useState({ ...EMPTY, date: today(), submitted_by: user?.display || '' });
  const [loading,  setLoading]  = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [options,  setOptions]  = useState({ ...DEFAULTS });
  const [filePreview, setFilePreview] = useState(null);

  // Immediately add new option to local state — no page reload needed
  const handleOptionAdded = (fieldName, newValue) => {
    setOptions(prev => ({
      ...prev,
      [fieldName]: prev[fieldName].includes(newValue)
        ? prev[fieldName]
        : [...prev[fieldName], newValue],
    }));
  };

  // Load custom dropdown options
  useEffect(() => {
    api.get('/dropdowns').then(r => {
      const custom = r.data.data || {};
      setOptions(prev => {
        const merged = { ...prev };
        Object.keys(DEFAULTS).forEach(k => {
          const combined = [...DEFAULTS[k], ...(custom[k] || [])];
          merged[k] = [...new Set(combined)];
        });
        return merged;
      });
    }).catch(() => {});
  }, []);

  // Load existing bill
  useEffect(() => {
    if (!isEdit) return;
    api.get(`/bills/${id}`)
      .then(r => {
        const b = r.data.data;
        setForm({
          date:            b.date?.slice(0,10) || today(),
          description:     b.description    || '',
          purpose_site:    b.purpose_site   || '',
          category:        b.category       || '',
          sub_category:    b.sub_category   || '',
          vendor:          b.vendor         || '',
          paid_by:         b.paid_by        || '',
          payment_mode:    b.payment_mode   || 'Cash',
          amount:          b.amount         || '',
          gst_tax:         b.gst_tax        || '',
          bill_attached:   b.bill_attached  || 'No',
          approved_by:     b.approved_by    || '',
          notes:           b.notes          || '',
          attachment_name: b.attachment_name || null,
          attachment_data: b.attachment_data || null,
          attachment_type: b.attachment_type || null,
          submitted_by:    b.submitted_by || b.created_by_name || user?.display || '',
        });
        if (b.attachment_name) setFilePreview({ name: b.attachment_name, existing: true });
      })
      .catch(() => { toast.error('Bill not found.'); navigate('/bills'); })
      .finally(() => setFetching(false));
  }, [id, isEdit, navigate]);

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('File too large. Max 5 MB.'); return; }
    const data = await toBase64(file);
    setForm(f => ({ ...f,
      attachment_name: file.name,
      attachment_data: data,
      attachment_type: file.type,
      bill_attached: 'Yes',
    }));
    setFilePreview({ name: file.name, type: file.type, data });
    toast.success(`File "${file.name}" attached.`);
  };

  const removeFile = () => {
    setForm(f => ({ ...f, attachment_name: null, attachment_data: null, attachment_type: null, bill_attached: 'No' }));
    setFilePreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.date)        { toast.error('Date is required.');        return; }
    if (!form.description) { toast.error('Description is required.'); return; }
    if (!form.amount || isNaN(Number(form.amount))) { toast.error('Enter a valid amount.'); return; }
    if (!form.attachment_data && !form.attachment_name) {
      toast.error('File attachment is mandatory. Please attach a bill file.');
      return;
    }
    setLoading(true);
    try {
      const payload = { ...form, amount: parseFloat(form.amount) || 0 };
      if (isEdit) {
        await api.put(`/bills/${id}`, payload);
        toast.success('Bill updated!');
      } else {
        const res = await api.post('/bills', payload);
        toast.success(`Saved! Voucher: ${res.data.voucher_no}`);
      }
      navigate('/bills');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save.');
    }
    setLoading(false);
  };

  if (fetching) return <div className="loading-center"><span className="spinner" /> Loading…</div>;

  return (
    <div className="page">
      <div className="page-header-row" style={{marginBottom:24}}>
        <div>
          <div className="page-title">{isEdit ? 'Edit Bill' : 'Add New Bill'}</div>
          <div className="page-sub">{isEdit ? 'Update bill details' : 'Fill in the expense details'}</div>
        </div>
        <button className="btn btn-ghost" onClick={() => navigate('/bills')}>← Back</button>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">

            {/* Date + Voucher */}
            <div className="field">
              <label>Date <span className="required">*</span></label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)} required />
            </div>
            <div className="field">
              <label>Voucher No.</label>
              <input value={isEdit ? '(existing)' : '(auto-generated)'} readOnly
                style={{background:'#f5f5f5',color:'#aaa',cursor:'not-allowed',border:'1.5px solid #e8e8e8'}} />
            </div>

            {/* Submitted By — auto-filled from logged-in user, locked */}
            <div className="field full">
              <label>
                Submitted By
                <span style={{marginLeft:8,fontSize:11,fontWeight:400,color:'#aaa',background:'#f0f0f0',
                  padding:'2px 8px',borderRadius:20,letterSpacing:0.3}}>
                  🔒 Auto-filled · cannot be changed
                </span>
              </label>
              <div style={{display:'flex',alignItems:'center',gap:10,
                background:'#f7f7f7',border:'1.5px solid #e8e8e8',borderRadius:9,
                padding:'10px 14px',cursor:'not-allowed'}}>
                <div style={{width:32,height:32,background:'#E8471C',borderRadius:8,
                  display:'flex',alignItems:'center',justifyContent:'center',
                  color:'#fff',fontWeight:700,fontSize:13,flexShrink:0}}>
                  {(user?.display||'U').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)}
                </div>
                <div>
                  <div style={{fontSize:14,fontWeight:600,color:'#1a1a1a'}}>{user?.display}</div>
                  <div style={{fontSize:11,color:'#aaa'}}>{user?.role === 'admin' ? 'Admin' : user?.site || 'User'} · @{user?.username}</div>
                </div>
              </div>
              <input type="hidden" value={form.submitted_by} />
            </div>

            {/* Description */}
            <div className="field full">
              <label>Description <span className="required">*</span></label>
              <input type="text" placeholder="e.g. Laminates — Lotus Marketing"
                value={form.description} onChange={e => set('description', e.target.value)} required />
            </div>

            {/* Smart dropdowns */}
            {/* <SmartSelect label="Build By" fieldName="purpose_site"
              value={form.purpose_site} onChange={v => set('purpose_site', v)} options={options.purpose_site}
              onOptionAdded={handleOptionAdded} /> */}

            <SmartSelect label="Category" fieldName="category"
              value={form.category} onChange={v => set('category', v)} options={options.category}
              onOptionAdded={handleOptionAdded} />

            <SmartSelect label="Sub-category" fieldName="sub_category"
              value={form.sub_category} onChange={v => set('sub_category', v)} options={options.sub_category}
              onOptionAdded={handleOptionAdded} />

                 <SmartSelect label="Build By" fieldName="purpose_site"
              value={form.purpose_site} onChange={v => set('purpose_site', v)} options={options.purpose_site}
              onOptionAdded={handleOptionAdded} />

            {/* Vendor — free text */}
            <div className="field">
              <label>Vendor / Paid To</label>
              <input type="text" placeholder="e.g. Lotus Marketing"
                value={form.vendor} onChange={e => set('vendor', e.target.value)} />
            </div>

            <SmartSelect label="Paid By" fieldName="paid_by"
              value={form.paid_by} onChange={v => set('paid_by', v)} options={options.paid_by}
              onOptionAdded={handleOptionAdded} />

            <SmartSelect label="Payment Mode" fieldName="payment_mode"
              value={form.payment_mode} onChange={v => set('payment_mode', v)} options={options.payment_mode}
              onOptionAdded={handleOptionAdded} />

            {/* Amount */}
            <div className="field amount-field">
              <label>Amount (₹) <span className="required">*</span></label>
              <input type="number" step="0.01" min="0" placeholder="0.00"
                value={form.amount} onChange={e => set('amount', e.target.value)} required />
            </div>

            {/* GST */}
            <div className="field">
              <label>GST / Tax</label>
              <input type="text" placeholder="Yes / No / 18%"
                value={form.gst_tax} onChange={e => set('gst_tax', e.target.value)} />
            </div>

            {/* Bill Attached */}
            <div className="field">
              <label>Bill Attached?</label>
              <select value={form.bill_attached} onChange={e => set('bill_attached', e.target.value)}>
                <option>Yes</option>
                <option>No</option>
              </select>
            </div>

            <SmartSelect label="Approved By" fieldName="approved_by"
              value={form.approved_by} onChange={v => set('approved_by', v)} options={options.approved_by}
              onOptionAdded={handleOptionAdded} />

            {/* Notes */}
            <div className="field full">
              <label>Notes</label>
              <textarea placeholder="Context for unusual items, remarks…"
                value={form.notes} onChange={e => set('notes', e.target.value)} />
            </div>

            {/* File Attachment — MANDATORY */}
            <div className="field full">
              <label>Attach File <span className="required"> *</span> <span style={{color:'#aaa',fontWeight:400,textTransform:'none',fontSize:11}}>(PDF, Image, Word — max 5 MB — Required)</span></label>
              {filePreview ? (
                <div style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',
                  background:'#fff8f5',border:'1.5px solid #E8471C',borderRadius:10}}>
                  <span style={{fontSize:24}}>{
                    filePreview.type?.includes('pdf') ? '📄' :
                    filePreview.type?.includes('image') ? '🖼️' : '📎'
                  }</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600,color:'#1a1a1a'}}>{filePreview.name}</div>
                    {filePreview.existing && <div style={{fontSize:11,color:'#aaa'}}>Previously attached</div>}
                  </div>
                  {filePreview.data && !filePreview.existing && (
                    <a href={filePreview.data} download={filePreview.name}
                      style={{fontSize:12,color:'#E8471C',textDecoration:'underline',cursor:'pointer'}}>
                      Download
                    </a>
                  )}
                  <button type="button" onClick={removeFile}
                    style={{background:'none',border:'none',cursor:'pointer',color:'#aaa',fontSize:18,lineHeight:1}}>✕</button>
                </div>
              ) : (
                <div style={{border:`2px dashed ${!filePreview ? '#E8471C' : '#e0e0e0'}`,borderRadius:10,padding:'24px',
                  textAlign:'center',cursor:'pointer',background: !filePreview ? '#fff8f5' : '#fafafa',transition:'all 0.2s'}}
                  onClick={() => fileRef.current?.click()}
                  onMouseEnter={e => e.currentTarget.style.borderColor='#E8471C'}
                  onMouseLeave={e => e.currentTarget.style.borderColor= !filePreview ? '#E8471C' : '#e0e0e0'}>
                  <div style={{fontSize:28,marginBottom:8}}>📎</div>
                  <div style={{fontSize:13,color:'#E8471C',fontWeight:600}}>Click to attach a file <span style={{color:'#c0392b'}}>*</span></div>
                  <div style={{fontSize:11,color:'#aaa',marginTop:4}}>PDF, JPG, PNG, DOC — max 5 MB (Required)</div>
                </div>
              )}
              <input ref={fileRef} type="file" style={{display:'none'}}
                accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx"
                onChange={handleFileChange} />
            </div>

          </div>

          {/* Amount preview */}
          {form.amount && !isNaN(Number(form.amount)) && Number(form.amount) > 0 && (
            <div style={{background:'#fff8f5',border:'1.5px solid rgba(232,71,28,0.2)',
              borderRadius:10,padding:'14px 18px',marginTop:20,
              display:'flex',gap:24,flexWrap:'wrap',alignItems:'center'}}>
              <div>
                <div style={{fontSize:10,color:'#aaa',marginBottom:3,letterSpacing:0.5}}>AMOUNT</div>
                <div style={{fontFamily:'DM Mono,monospace',fontSize:22,fontWeight:700,color:'#E8471C'}}>
                  ₹{Number(form.amount).toLocaleString('en-IN')}
                </div>
              </div>
              {form.category   && <div><div style={{fontSize:10,color:'#aaa',marginBottom:3}}>CATEGORY</div><div style={{fontSize:14,color:'#1a1a1a',fontWeight:600}}>{form.category}</div></div>}
              {form.payment_mode && <div><div style={{fontSize:10,color:'#aaa',marginBottom:3}}>MODE</div><div style={{fontSize:14,color:'#1a1a1a',fontWeight:600}}>{form.payment_mode}</div></div>}
              {form.vendor     && <div><div style={{fontSize:10,color:'#aaa',marginBottom:3}}>VENDOR</div><div style={{fontSize:14,color:'#1a1a1a',fontWeight:600}}>{form.vendor}</div></div>}
              {filePreview     && <div><div style={{fontSize:10,color:'#aaa',marginBottom:3}}>FILE</div><div style={{fontSize:13,color:'#E8471C'}}>📎 {filePreview.name}</div></div>}
            </div>
          )}

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><span className="spinner" style={{borderTopColor:'#fff',borderColor:'rgba(255,255,255,0.3)'}} /> Saving…</> : isEdit ? '✓ Update Bill' : '✓ Save Bill'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/bills')}>Cancel</button>
            {!isEdit && (
              <button type="button" className="btn btn-ghost" style={{marginLeft:'auto'}}
                onClick={() => { setForm({...EMPTY, date:today(), submitted_by: user?.display || ''}); setFilePreview(null); }}>
                Clear Form
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
