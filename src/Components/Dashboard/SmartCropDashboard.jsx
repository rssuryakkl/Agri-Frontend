import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../Context/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://agri-backend-9vtz.onrender.com/api';

// ── Moved outside component so it's stable and doesn't trigger exhaustive-deps ──
const DAY_LABELS = ['Day 7','Day 6','Day 5','Day 4','Day 3','Day 2','Today'];

const injectStyles = () => {
  if (document.getElementById('scd-styles')) return;
  const s = document.createElement('style');
  s.id = 'scd-styles';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #070b12; font-family: 'DM Sans', sans-serif; }
    ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
    @keyframes fadeUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
    @keyframes slideIn { from { transform:translateX(120%); opacity:0; } to { transform:translateX(0); opacity:1; } }
    @keyframes barGrow { from { height:0; opacity:0; } to { height:var(--h); opacity:1; } }
    @keyframes donutFill { from { stroke-dashoffset: var(--full); } to { stroke-dashoffset: var(--offset); } }
    .fu  { animation: fadeUp .45s ease both; }
    .fu1 { animation: fadeUp .45s .07s ease both; }
    .fu2 { animation: fadeUp .45s .14s ease both; }
    .fu3 { animation: fadeUp .45s .21s ease both; }
    .fu4 { animation: fadeUp .45s .28s ease both; }
    .nav-i { transition: background .15s, color .15s; border-radius: 10px; cursor: pointer; }
    .nav-i:hover { background: rgba(255,255,255,0.06) !important; color: #fff !important; }
    .nav-i.on { background: rgba(34,197,94,0.13) !important; color: #22c55e !important; }
    .card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 24px; }
    .card-lift { transition: transform .2s, box-shadow .2s; }
    .card-lift:hover { transform: translateY(-2px); box-shadow: 0 16px 48px rgba(0,0,0,.45) !important; }
    .inp { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; font-family: 'DM Sans',sans-serif; border-radius: 10px; font-size: 14px; padding: 11px 14px; width: 100%; transition: border-color .2s; }
    .inp:focus { outline: none; border-color: #22c55e; box-shadow: 0 0 0 3px rgba(34,197,94,.12); }
    .inp::placeholder { color: rgba(255,255,255,.25); }
    .sel { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; font-family: 'DM Sans',sans-serif; border-radius: 10px; font-size: 14px; padding: 11px 14px; width: 100%; cursor: pointer; }
    .sel:focus { outline: none; border-color: #22c55e; }
    .sel option { background: #1a2234; }
    .btn-p { background: linear-gradient(135deg,#22c55e,#15803d); color:#fff; border:none; border-radius:10px; cursor:pointer; font-family:'Syne',sans-serif; font-weight:700; font-size:14px; padding:12px 22px; transition: transform .15s, box-shadow .15s; display:flex; align-items:center; justify-content:center; gap:8px; }
    .btn-p:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 8px 24px rgba(34,197,94,.35); }
    .btn-p:disabled { opacity:.45; cursor:not-allowed; }
    .btn-g { background: rgba(255,255,255,0.07); color: rgba(255,255,255,.7); border: 1px solid rgba(255,255,255,.1); border-radius:10px; cursor:pointer; font-family:'DM Sans',sans-serif; font-size:14px; padding:12px 20px; transition: background .15s; }
    .btn-g:hover { background: rgba(255,255,255,.12); color:#fff; }
    .btn-g:disabled { opacity:.4; cursor:not-allowed; }
    .tag { border-radius:6px; padding:3px 10px; font-size:11px; font-weight:700; letter-spacing:.04em; }
    .toast-item { animation: slideIn .35s ease; }
    .bar-col { animation: barGrow .6s ease both; transform-origin: bottom; }
    .file-lbl { background: rgba(255,255,255,0.05); border: 1px dashed rgba(255,255,255,0.15); border-radius: 10px; padding: 11px 14px; cursor:pointer; display:flex; align-items:center; gap:10px; color:rgba(255,255,255,.45); font-size:14px; transition: border-color .2s; }
    .file-lbl:hover { border-color: #22c55e; color:#22c55e; }
    .stat-value { font-size: 26px; font-weight: 800; color: #fff; font-family: 'Syne',sans-serif; letter-spacing: -0.025em; line-height: 1; margin-bottom: 5px; transition: all 0.4s ease; }
    .donut-circle { transition: stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1); }
  `;
  document.head.appendChild(s);
};

const fmt = (n, d = 1) => (n === undefined || n === null || isNaN(Number(n)) ? '—' : Number(n).toFixed(d));
const fmtVal = (n, d = 1) => (n === undefined || n === null || isNaN(Number(n)) ? null : Number(n).toFixed(d));

const ago = (ts) => {
  if (!ts) return '—';
  const d = Date.now() - new Date(ts).getTime();
  if (isNaN(d) || d < 0) return 'just now';
  if (d < 60000) return 'just now';
  if (d < 3600000) return `${Math.floor(d / 60000)}m ago`;
  if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`;
  return `${Math.floor(d / 86400000)}d ago`;
};

const riskCol = r => ({ high: '#ef4444', medium: '#f59e0b', low: '#22c55e' }[r?.toLowerCase()] ?? '#64748b');
const urgCol  = u => ({ high: '#ef4444', medium: '#f59e0b', low: '#22c55e', none: '#64748b' }[u?.toLowerCase()] ?? '#fff');
const healthCol = s => s?.toLowerCase().includes('severe') ? '#ef4444' : s?.toLowerCase().includes('moderate') ? '#f59e0b' : '#22c55e';

/* ── Toast ── */
const Toasts = ({ items }) => (
  <div style={{ position:'fixed', top:24, right:24, zIndex:9999, display:'flex', flexDirection:'column', gap:10, pointerEvents:'none' }}>
    {items.map(t => (
      <div key={t.id} className="toast-item" style={{
        padding:'13px 18px', borderRadius:12, backdropFilter:'blur(24px)', fontFamily:"'DM Sans',sans-serif", fontSize:13, maxWidth:340,
        background: t.type==='error'?'rgba(239,68,68,.14)':t.type==='success'?'rgba(34,197,94,.14)':'rgba(255,255,255,.1)',
        border:`1px solid ${t.type==='error'?'rgba(239,68,68,.35)':t.type==='success'?'rgba(34,197,94,.35)':'rgba(255,255,255,.15)'}`,
        color: t.type==='error'?'#f87171':t.type==='success'?'#4ade80':'#e2e8f0',
        display:'flex', alignItems:'flex-start', gap:10, boxShadow:'0 8px 32px rgba(0,0,0,.5)',
      }}>
        <span style={{flexShrink:0,marginTop:1}}>{t.type==='error'?'✕':t.type==='success'?'✓':'ℹ'}</span>
        <span>{t.message}</span>
      </div>
    ))}
  </div>
);

/* ── Spinner ── */
const Spinner = ({ size=16, color='#fff' }) => (
  <span style={{ width:size, height:size, border:`2px solid rgba(255,255,255,.25)`, borderTopColor:color, borderRadius:'50%', animation:'spin .75s linear infinite', display:'inline-block', flexShrink:0 }} />
);

/* ── StatCard ── */
const StatCard = ({ icon, label, value, sub, accent, trend, cls='' }) => (
  <div className={`card card-lift ${cls}`} style={{ position:'relative', overflow:'hidden' }}>
    <div style={{ position:'absolute', top:0, right:0, width:90, height:90, background:`radial-gradient(circle at top right, ${accent}1a, transparent 65%)` }} />
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
      <div style={{ width:40, height:40, background:`${accent}1c`, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{icon}</div>
      {trend !== undefined && (
        <span style={{ fontSize:12, fontWeight:700, padding:'3px 9px', borderRadius:20, color:trend>=0?'#4ade80':'#f87171', background:trend>=0?'rgba(74,222,128,.1)':'rgba(248,113,113,.1)' }}>
          {trend>=0?'↑':'↓'} {Math.abs(trend)}%
        </span>
      )}
    </div>
    <div className="stat-value">{value}</div>
    <div style={{ fontSize:13, color:'rgba(255,255,255,.5)', fontWeight:500 }}>{label}</div>
    {sub && <div style={{ fontSize:11, color:'rgba(255,255,255,.3)', marginTop:3 }}>{sub}</div>}
  </div>
);

/* ── Donut gauge ── */
const Donut = ({ value=0, max=100, color='#22c55e', label, size=84 }) => {
  const r = 32, circ = 2 * Math.PI * r;
  const pct = Math.min(Math.max(value / max, 0), 1);
  const offset = circ * (1 - pct);
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
      <svg width={size} height={size} viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="8" />
        <circle
          cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 40 40)"
          className="donut-circle"
          style={{ transition:'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)', stroke: value > 0 ? color : 'rgba(255,255,255,.07)' }}
        />
        <text x="40" y="40" textAnchor="middle" dominantBaseline="middle" fill={value > 0 ? '#fff' : 'rgba(255,255,255,.3)'} fontSize="13" fontFamily="Syne,sans-serif" fontWeight="700">
          {value > 0 ? fmt(value, 0) : '0'}
        </text>
      </svg>
      <div style={{ fontSize:11, color:'rgba(255,255,255,.4)', textAlign:'center' }}>{label}</div>
    </div>
  );
};

/* ── Bar chart ── */
const BarChart = ({ data, color, unit='' }) => {
  const max = Math.max(...data.map(d => d.v), 1);
  return (
    <div>
      <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:90 }}>
        {data.map((d, i) => {
          const h = Math.max((d.v / max) * 70, d.v > 0 ? 4 : 0);
          return (
            <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', height:'100%', justifyContent:'flex-end', gap:4 }}>
              <div style={{ fontSize:9, color:'rgba(255,255,255,.4)', minHeight:14, display:'flex', alignItems:'center' }}>
                {d.v > 0 ? fmt(d.v, 0) : ''}
              </div>
              <div
                className="bar-col"
                style={{
                  width:'100%',
                  background: i === data.length-1 ? color : `${color}66`,
                  borderRadius:'4px 4px 2px 2px',
                  '--h': `${h}px`,
                  height: `${h}px`,
                  animationDelay: `${i * 0.06}s`,
                  minHeight: d.v > 0 ? 4 : 0,
                }}
              />
              <div style={{ fontSize:9, color:'rgba(255,255,255,.3)' }}>{d.l}</div>
            </div>
          );
        })}
      </div>
      {unit && <div style={{ fontSize:11, color:'rgba(255,255,255,.3)', textAlign:'right', marginTop:4 }}>unit: {unit}</div>}
    </div>
  );
};

/* ── Activity item ── */
const ActivityItem = ({ icon, text, time, color }) => (
  <div style={{ display:'flex', gap:12, padding:'11px 0', borderBottom:'1px solid rgba(255,255,255,.05)', alignItems:'flex-start' }}>
    <div style={{ width:32, height:32, background:`${color}1c`, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:15 }}>{icon}</div>
    <div style={{ flex:1 }}>
      <div style={{ fontSize:13, color:'rgba(255,255,255,.75)', lineHeight:1.45 }}>{text}</div>
      <div style={{ fontSize:11, color:'rgba(255,255,255,.28)', marginTop:3 }}>{time}</div>
    </div>
  </div>
);

/* ── Section header ── */
const SH = ({ title, sub, right }) => (
  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:20 }}>
    <div>
      <div style={{ fontSize:17, fontWeight:700, color:'#fff', fontFamily:'Syne,sans-serif', letterSpacing:'-0.02em' }}>{title}</div>
      {sub && <div style={{ fontSize:13, color:'rgba(255,255,255,.35)', marginTop:3 }}>{sub}</div>}
    </div>
    {right}
  </div>
);

/* ── Rec item ── */
const RecItem = ({ text, priority }) => {
  const col = { high:'#ef4444', medium:'#f59e0b', low:'#22c55e' }[priority] ?? '#64748b';
  return (
    <div style={{ display:'flex', gap:10, padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,.05)', alignItems:'flex-start' }}>
      <span style={{ color:col, flexShrink:0, fontSize:13, marginTop:1 }}>→</span>
      <span style={{ fontSize:13, color:'rgba(255,255,255,.7)', lineHeight:1.45 }}>{text}</span>
    </div>
  );
};

/* ── Result card ── */
const ResultCard = ({ borderColor, emoji, title, badge, badgeBg, badgeColor, rows, extra, cls='' }) => (
  <div className={`card ${cls}`} style={{ borderTop:`3px solid ${borderColor}` }}>
    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
      <div style={{ width:42, height:42, background:`${borderColor}20`, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>{emoji}</div>
      <div>
        <div style={{ fontSize:15, fontWeight:700, color:'#fff', fontFamily:'Syne,sans-serif' }}>{title}</div>
        {badge && <span className="tag" style={{ background:badgeBg, color:badgeColor, marginTop:4, display:'inline-block' }}>{badge}</span>}
      </div>
    </div>
    {rows.map(([k,v,c]) => (
      <div key={k} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,.05)' }}>
        <span style={{ fontSize:13, color:'rgba(255,255,255,.42)' }}>{k}</span>
        <span style={{ fontSize:13, fontWeight:700, color:c||'#fff', textTransform:'capitalize' }}>{v}</span>
      </div>
    ))}
    {extra}
  </div>
);

/* ── Logout button ── */
const LogoutButton = ({ sidebarOpen, logout, toast }) => {
  const [busy, setBusy] = React.useState(false);
  const handle = async () => {
    if (busy) return;
    setBusy(true);
    try { await logout(); } catch (e) { toast('Sign out failed','error'); setBusy(false); }
  };
  return (
    <div onClick={handle} className="nav-i" style={{ display:'flex', alignItems:'center', gap:10, padding:sidebarOpen?'10px 12px':'10px', color:'rgba(255,255,255,.45)', fontSize:13, justifyContent:sidebarOpen?'flex-start':'center', cursor:'pointer' }}>
      {busy ? <Spinner size={15} color="rgba(255,255,255,.5)" /> : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>}
      {sidebarOpen && <span>{busy?'Signing out…':'Sign out'}</span>}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  MAIN DASHBOARD                                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

const SmartCropDashboard = () => {
  const { getIdToken, currentUser, logout } = useAuth();
  const farmId = currentUser?.uid ? `farm_${currentUser.uid.slice(0,8)}` : 'farm_001';
  useEffect(() => injectStyles(), []);

  const [section, setSection]       = useState('overview');
  const [sidebarOpen, setSidebar]   = useState(true);
  const [toasts, setToasts]         = useState([]);
  const [history, setHistory]       = useState([]);
  const [histLoading, setHistLoad]  = useState(false);
  const [activity, setActivity]     = useState([]);

  // ── Satellite ──
  const [coords, setCoords]         = useState({ lat:'', lng:'' });
  const [mapData, setMapData]       = useState(null);
  const [mapLoading, setMapLoading] = useState(false);

  // ── Analysis form ──
  const [form, setForm]         = useState({ soil_moisture:'', temperature:'', humidity:'', rainfall:'', crop_type:'rice', image:null });
  const [imgPreview, setImgPreview] = useState(null);
  const [analyzing, setAnalyzing]  = useState(false);
  const [results, setResults]      = useState(null);

  // ── Live snapshot (updated immediately after analysis, no Firestore round-trip needed) ──
  const [liveSnap, setLiveSnap] = useState(null);

  const tcRef = useRef(0);
  const toast = useCallback((message, type='info') => {
    const id = `${Date.now()}_${++tcRef.current}`;
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4500);
  }, []);

  /* ── Central authenticated fetch ── */
  const apiFetch = useCallback(async (url, opts={}) => {
    const token = await getIdToken();
    if (!token) throw new Error('Not authenticated — please sign in again');
    const headers = { 'Authorization':`Bearer ${token}`, ...(opts.headers||{}) };
    if (opts.body && typeof opts.body==='string') headers['Content-Type']='application/json';
    const res = await fetch(url, { ...opts, headers });
    if (res.status===401) throw new Error('Session expired — please sign in again');
    if (!res.ok) {
      let msg = `Server error ${res.status}`;
      try { const d = await res.json(); msg = d.error||msg; } catch(_) {}
      throw new Error(msg);
    }
    return res.json();
  }, [getIdToken]);

  /* ── Sanitize a Firestore doc (timestamps become strings) ── */
  const sanitize = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v && typeof v === 'object' && typeof v.toDate === 'function') {
        out[k] = v.toDate().toISOString();
      } else if (v instanceof Date) {
        out[k] = v.toISOString();
      } else if (v && typeof v === 'object' && !Array.isArray(v) && v.seconds !== undefined) {
        out[k] = new Date(v.seconds * 1000).toISOString();
      } else {
        out[k] = v;
      }
    }
    return out;
  };

  /* ── Load history ── */
  const loadHistory = useCallback(async () => {
    setHistLoad(true);
    try {
      const data = await apiFetch(`${API_BASE_URL}/sensor/history?farm_id=${farmId}&limit=7`);
      if (data.success && Array.isArray(data.readings)) {
        const cleaned = data.readings.map(sanitize);
        setHistory(cleaned);

        const acts = [];
        cleaned.slice(0,5).forEach((r) => {
          const ts = ago(r.timestamp || r.created_at);
          if (r.predictions?.irrigation?.action !== 'no_irrigation')
            acts.push({ icon:'💧', text:`Irrigation ${r.predictions?.irrigation?.action?.replace(/_/g,' ')} — ${r.crop_type}`, time:ts, color:'#3b82f6' });
          if (r.predictions?.pest_risk?.risk_level !== 'low')
            acts.push({ icon:'🐛', text:`${r.predictions?.pest_risk?.risk_level?.toUpperCase()} pest risk — humidity ${fmt(r.humidity,0)}%`, time:ts, color:'#f59e0b' });
          if (Number(r.temperature) > 35)
            acts.push({ icon:'⚠️', text:`High temperature: ${fmt(r.temperature,1)}°C`, time:ts, color:'#ef4444' });
        });
        setActivity(acts.length ? acts : [{ icon:'📡', text:'No recent alerts. Farm conditions normal.', time:'now', color:'#22c55e' }]);
      }
    } catch (e) {
      console.error('loadHistory:', e.message);
      setActivity([{ icon:'📡', text:'Run an analysis to see activity here.', time:'—', color:'#22c55e' }]);
    } finally { setHistLoad(false); }
  }, [apiFetch, farmId]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  /* ── Load satellite map ── */
  const loadMap = async () => {
    const lat = parseFloat(coords.lat), lng = parseFloat(coords.lng);
    if (isNaN(lat)||isNaN(lng)) return toast('Enter valid latitude and longitude','error');
    if (lat<-90||lat>90) return toast('Latitude must be -90 to 90','error');
    if (lng<-180||lng>180) return toast('Longitude must be -180 to 180','error');
    setMapLoading(true); setMapData(null);
    try {
      const data = await apiFetch(`${API_BASE_URL}/vegetation/map`, { method:'POST', body:JSON.stringify({ latitude:lat, longitude:lng, farm_id:farmId }) });
      if (data.success) { setMapData(data); toast('Vegetation map loaded','success'); }
      else toast(data.error||'Failed to load map','error');
    } catch (e) { toast(`Map error: ${e.message}`,'error'); }
    finally { setMapLoading(false); }
  };

  /* ── Run analysis ── */
  const runAnalysis = async () => {
    const { soil_moisture, temperature, humidity, rainfall, crop_type, image } = form;
    if (!soil_moisture||!temperature||!humidity) return toast('Soil moisture, temperature and humidity are required','error');
    setAnalyzing(true); setResults(null);

    const snap = {
      soil_moisture: parseFloat(soil_moisture),
      temperature:   parseFloat(temperature),
      humidity:      parseFloat(humidity),
      rainfall:      parseFloat(rainfall||0),
      crop_type,
      timestamp:     new Date().toISOString(),
    };

    try {
      const sensorRes = await apiFetch(`${API_BASE_URL}/sensor/upload`, {
        method:'POST',
        body:JSON.stringify({
          soil_moisture: snap.soil_moisture,
          temperature:   snap.temperature,
          humidity:      snap.humidity,
          rainfall:      snap.rainfall,
          crop_type,
          farm_id: farmId,
        }),
      });

      let r = {};
      if (sensorRes.success) {
        r.irrigation = sensorRes.predictions?.irrigation;
        r.pest = sensorRes.predictions?.pest_risk;

        snap.predictions = { irrigation: r.irrigation, pest_risk: r.pest };
        setLiveSnap(snap);

        loadHistory();
      } else {
        toast(sensorRes.error||'Sensor analysis failed','error');
      }

      if (image) {
        const token = await getIdToken();
        if (!token) throw new Error('No auth token for image upload');
        const fd = new FormData();
        fd.append('image', image);
        fd.append('farm_id', farmId);
        const hr = await fetch(`${API_BASE_URL}/crop-health/analyze`, { method:'POST', headers:{ 'Authorization':`Bearer ${token}` }, body:fd });
        if (!hr.ok) throw new Error(`Image upload ${hr.status}`);
        const hd = await hr.json();
        if (hd.success) {
          r.health = { status:hd.health_status, ndvi:hd.ndvi, confidence:hd.confidence, recommendations:hd.recommendations||[] };
        } else {
          toast(hd.error||'Crop health analysis failed','error');
        }
      }

      setResults(r);
      if (Object.keys(r).length > 0) { toast('Analysis complete','success'); setSection('results'); }
    } catch (e) {
      toast(`Analysis failed: ${e.message}`,'error');
    } finally {
      setAnalyzing(false);
    }
  };

  /* ── Reset form ── */
  const resetForm = () => {
    setForm({ soil_moisture:'', temperature:'', humidity:'', rainfall:'', crop_type:'rice', image:null });
    setResults(null); setImgPreview(null);
    const fi = document.getElementById('img-up'); if (fi) fi.value='';
    toast('Form cleared','info');
  };

  /* ── Chart data helpers ──
     DAY_LABELS is defined at module level (outside component) to keep it stable */
  const mkChart = useCallback((key) => {
    const src = history.length ? [...history].slice(-7) : [];
    if (!src.length) {
      if (liveSnap && liveSnap[key] != null) {
        return DAY_LABELS.map((l, i) => ({ l, v: i === 6 ? Number(liveSnap[key]) : 0 }));
      }
      return DAY_LABELS.map(l => ({ l, v:0 }));
    }
    return src.map((r, i) => ({
      l: DAY_LABELS[i + Math.max(0, 7 - src.length)],
      v: Number(r[key]) || 0,
    }));
  }, [history, liveSnap]);

  const moistureChart = mkChart('soil_moisture');
  const tempChart     = mkChart('temperature');
  const humChart      = mkChart('humidity');

  /* ── Latest reading: prefer Firestore history, fall back to live snap ── */
  const latest  = history.length ? sanitize(history[history.length - 1]) : (liveSnap || {});
  const prevDay = history.length > 1 ? sanitize(history[history.length - 2]) : {};

  const calcTrend = (cur, prev) => {
    const c = Number(cur), p = Number(prev);
    if (!c || !p || isNaN(c) || isNaN(p)) return undefined;
    return +((c - p) / p * 100).toFixed(1);
  };
  const mTrend = calcTrend(latest.soil_moisture, prevDay.soil_moisture);
  const tTrend = calcTrend(latest.temperature,   prevDay.temperature);
  const hTrend = calcTrend(latest.humidity,      prevDay.humidity);

  const hasLatest = latest.soil_moisture != null;

  /* ── Nav items ── */
  const NAV = [
    { id:'overview',  icon:'⊞', label:'Overview'      },
    { id:'satellite', icon:'🛰', label:'Satellite Map' },
    { id:'analysis',  icon:'🧬', label:'Crop Analysis' },
    { id:'results',   icon:'📊', label:'Results'       },
  ];

  const LBL = { fontSize:12, fontWeight:600, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:'.07em', display:'block', marginBottom:7 };
  const EMPTY = (msg) => (
    <div style={{ height:80, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,.25)', fontSize:13, flexDirection:'column', gap:8 }}>
      <span style={{ fontSize:24 }}>📊</span>
      <span>{msg}</span>
    </div>
  );

  /* ═══════════════════════════════════════════════════════════════════════ */

  return (
    <div style={{ display:'flex', height:'100vh', background:'#070b12', overflow:'hidden', fontFamily:"'DM Sans',sans-serif" }}>
      <Toasts items={toasts} />

      {/* SIDEBAR */}
      <aside style={{ width:sidebarOpen?240:66, flexShrink:0, background:'rgba(255,255,255,.025)', borderRight:'1px solid rgba(255,255,255,.07)', display:'flex', flexDirection:'column', transition:'width .22s ease', overflow:'hidden' }}>
        <div style={{ padding:sidebarOpen?'22px 18px 18px':'22px 15px 18px', display:'flex', alignItems:'center', gap:12, borderBottom:'1px solid rgba(255,255,255,.06)', flexShrink:0 }}>
          <div onClick={()=>setSidebar(p=>!p)} style={{ width:36, height:36, flexShrink:0, background:'linear-gradient(135deg,#22c55e,#15803d)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', boxShadow:'0 4px 14px rgba(34,197,94,.35)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2a9 9 0 0 1 9 9c0 4-2.5 7.5-6 9l-3-5-3 5c-3.5-1.5-6-5-6-9a9 9 0 0 1 9-9z"/><line x1="12" y1="2" x2="12" y2="11"/></svg>
          </div>
          {sidebarOpen && <span style={{ fontSize:15, fontWeight:700, color:'#fff', fontFamily:'Syne,sans-serif', whiteSpace:'nowrap' }}>SmartCrop AI</span>}
        </div>

        <nav style={{ flex:1, padding:'10px 9px', overflowY:'auto' }}>
          {NAV.map(n => (
            <div key={n.id} onClick={()=>setSection(n.id)} className={`nav-i${section===n.id?' on':''}`}
              style={{ display:'flex', alignItems:'center', gap:11, padding:sidebarOpen?'11px 12px':'11px', marginBottom:3, color:section===n.id?'#22c55e':'rgba(255,255,255,.48)', fontSize:14, fontWeight:500, justifyContent:sidebarOpen?'flex-start':'center' }}>
              <span style={{ fontSize:16, flexShrink:0 }}>{n.icon}</span>
              {sidebarOpen && <span style={{ whiteSpace:'nowrap' }}>{n.label}</span>}
              {n.id==='results' && results && sidebarOpen && (
                <span style={{ marginLeft:'auto', background:'#22c55e', color:'#000', fontSize:10, fontWeight:800, borderRadius:20, padding:'2px 7px' }}>NEW</span>
              )}
            </div>
          ))}
        </nav>

        <div style={{ padding:'10px 9px', borderTop:'1px solid rgba(255,255,255,.06)' }}>
          {sidebarOpen && (
            <div style={{ padding:'8px 12px', marginBottom:6, background:'rgba(255,255,255,.04)', borderRadius:10 }}>
              <div style={{ fontSize:13, fontWeight:600, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{currentUser?.displayName||'Farmer'}</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,.32)', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{currentUser?.email}</div>
              <div style={{ fontSize:10, color:'rgba(34,197,94,.7)', marginTop:4, display:'flex', alignItems:'center', gap:5 }}>
                <span style={{ width:6, height:6, background:'#22c55e', borderRadius:'50%', animation:'pulse 2s infinite' }} />
                Farm ID: {farmId}
              </div>
            </div>
          )}
          <LogoutButton sidebarOpen={sidebarOpen} logout={logout} toast={toast} />
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column' }}>

        {/* Topbar */}
        <div style={{ padding:'18px 32px', borderBottom:'1px solid rgba(255,255,255,.06)', display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(7,11,18,.85)', backdropFilter:'blur(14px)', position:'sticky', top:0, zIndex:100 }}>
          <div>
            <div style={{ fontSize:19, fontWeight:800, color:'#fff', fontFamily:'Syne,sans-serif', letterSpacing:'-0.03em' }}>{NAV.find(n=>n.id===section)?.label}</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,.3)', marginTop:2 }}>{new Date().toLocaleDateString('en-US',{ weekday:'long', year:'numeric', month:'long', day:'numeric' })}</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <button className="btn-g" onClick={loadHistory} disabled={histLoading} style={{ padding:'8px 14px', fontSize:12, display:'flex', alignItems:'center', gap:6 }}>
              {histLoading ? <Spinner size={12}/> : '↺'} Refresh
            </button>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ width:8, height:8, background:'#22c55e', borderRadius:'50%', animation:'pulse 2s infinite' }} />
              <span style={{ fontSize:12, color:'rgba(255,255,255,.38)' }}>System live</span>
            </div>
            <div style={{ width:36, height:36, background:'linear-gradient(135deg,#22c55e,#15803d)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:700, color:'#fff' }}>
              {(currentUser?.displayName||currentUser?.email||'?')[0].toUpperCase()}
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding:'28px 32px', flex:1 }}>

          {/* ══ OVERVIEW ══ */}
          {section==='overview' && (
            <>
              {/* Stat cards */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))', gap:16, marginBottom:24 }}>
                <StatCard cls="fu"  icon="💧" label="Soil Moisture"
                  value={fmtVal(latest.soil_moisture) != null ? `${fmt(latest.soil_moisture)}%` : '—'}
                  sub={hasLatest ? (latest.crop_type || 'Latest reading') : 'Run an analysis'}
                  accent="#3b82f6" trend={mTrend} />
                <StatCard cls="fu1" icon="🌡️" label="Temperature"
                  value={fmtVal(latest.temperature) != null ? `${fmt(latest.temperature)}°C` : '—'}
                  sub={ago(latest.timestamp)}
                  accent="#f59e0b" trend={tTrend} />
                <StatCard cls="fu2" icon="💨" label="Humidity"
                  value={fmtVal(latest.humidity) != null ? `${fmt(latest.humidity)}%` : '—'}
                  sub={latest.rainfall != null ? `Rain: ${fmt(latest.rainfall,1)}mm` : '—'}
                  accent="#8b5cf6" trend={hTrend} />
                <StatCard cls="fu3" icon="🌿" label="NDVI Index"
                  value={mapData?.ndvi ?? (results?.health?.ndvi ? fmt(results.health.ndvi * 100, 0) : '—')}
                  sub={mapData?.vegetation_status || (results?.health?.status || 'Load satellite map')}
                  accent="#22c55e" />
              </div>

              {/* Charts row 1 */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
                <div className="card fu1">
                  <SH title="Soil Moisture History" sub="Last 7 readings (%)" />
                  {histLoading
                    ? <div style={{display:'flex',justifyContent:'center',padding:'20px 0'}}><Spinner size={20} color="#3b82f6"/></div>
                    : (!hasLatest && !liveSnap)
                      ? EMPTY('Run an analysis to see history')
                      : <BarChart data={moistureChart} color="#3b82f6" unit="%" />
                  }
                </div>
                <div className="card fu2">
                  <SH title="Temperature History" sub="Last 7 readings (°C)" />
                  {histLoading
                    ? <div style={{display:'flex',justifyContent:'center',padding:'20px 0'}}><Spinner size={20} color="#f59e0b"/></div>
                    : (!hasLatest && !liveSnap)
                      ? EMPTY('Run an analysis to see history')
                      : <BarChart data={tempChart} color="#f59e0b" unit="°C" />
                  }
                </div>
              </div>

              {/* Charts row 2 + gauges */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:20, marginBottom:20 }}>
                <div className="card fu3">
                  <SH title="Humidity History" sub="Last 7 readings (%)" />
                  {histLoading
                    ? <div style={{display:'flex',justifyContent:'center',padding:'20px 0'}}><Spinner size={20} color="#8b5cf6"/></div>
                    : (!hasLatest && !liveSnap)
                      ? EMPTY('Run an analysis to see history')
                      : <BarChart data={humChart} color="#8b5cf6" unit="%" />
                  }
                </div>

                {/* Live Gauges */}
                <div className="card fu3">
                  <SH title="Live Gauges" sub="Latest reading" />
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                    <Donut value={Number(latest.soil_moisture)||0} max={100} color="#3b82f6" label="Moisture %" />
                    <Donut value={Number(latest.humidity)||0}      max={100} color="#8b5cf6" label="Humidity %" />
                    <Donut value={Number(latest.temperature)||0}   max={50}  color="#f59e0b" label="Temp °C"   />
                    <Donut value={Number(latest.rainfall)||0}      max={150} color="#06b6d4" label="Rain mm"   />
                  </div>
                  {!hasLatest && !liveSnap && (
                    <div style={{ textAlign:'center', fontSize:12, color:'rgba(255,255,255,.25)', marginTop:12 }}>
                      No data yet — run an analysis
                    </div>
                  )}
                </div>
              </div>

              {/* Recent activity */}
              <div className="card fu4">
                <SH title="Recent Activity" sub="From latest sensor readings"
                  right={<button className="btn-g" onClick={()=>setSection('analysis')} style={{ padding:'7px 14px', fontSize:12 }}>+ New Analysis</button>} />
                {activity.length === 0
                  ? <div style={{ fontSize:13, color:'rgba(255,255,255,.3)', padding:'12px 0' }}>No activity yet.</div>
                  : activity.map((a, i) => <ActivityItem key={i} {...a} />)
                }
              </div>
            </>
          )}

          {/* ══ SATELLITE ══ */}
          {section==='satellite' && (
            <div className="fu">
              <div className="card">
                <SH title="Vegetation & NDVI Satellite Analysis" sub="Real-time satellite imagery with vegetation health overlay" />
                <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:24, alignItems:'flex-end' }}>
                  <div style={{ flex:1, minWidth:160 }}>
                    <label style={LBL}>Latitude *</label>
                    <input className="inp" type="number" step="0.0001" placeholder="e.g. 11.6643" value={coords.lat} onChange={e=>setCoords(p=>({...p,lat:e.target.value}))} />
                  </div>
                  <div style={{ flex:1, minWidth:160 }}>
                    <label style={LBL}>Longitude *</label>
                    <input className="inp" type="number" step="0.0001" placeholder="e.g. 78.1460" value={coords.lng} onChange={e=>setCoords(p=>({...p,lng:e.target.value}))} />
                  </div>
                  <button className="btn-p" disabled={mapLoading} onClick={loadMap} style={{ height:44 }}>
                    {mapLoading ? <><Spinner />Loading…</> : '🛰 Load Map'}
                  </button>
                </div>

                {!mapData && !mapLoading && (
                  <div style={{ background:'rgba(255,255,255,.02)', border:'1px dashed rgba(255,255,255,.08)', borderRadius:12, height:260, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12 }}>
                    <span style={{ fontSize:40 }}>🛰</span>
                    <div style={{ fontSize:14, color:'rgba(255,255,255,.3)', textAlign:'center' }}>Enter GPS coordinates and click Load</div>
                    <div style={{ fontSize:12, color:'rgba(255,255,255,.2)' }}>Example: Lat 11.6643, Lng 78.1460</div>
                  </div>
                )}

                {mapData && (
                  <div className="fu">
                    <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:16 }}>
                      {[
                        ['📍 Location', `${fmt(mapData.latitude,4)}°N, ${fmt(mapData.longitude,4)}°E`, null],
                        ['🌿 NDVI', mapData.ndvi, '#22c55e'],
                        ['📊 Status', mapData.vegetation_status, '#22c55e'],
                        ['📡 Source', mapData.data_source, '#8b5cf6'],
                      ].map(([l,v,c]) => (
                        <div key={l} style={{ background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.08)', borderRadius:10, padding:'9px 14px' }}>
                          <div style={{ fontSize:10, color:'rgba(255,255,255,.32)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:3 }}>{l}</div>
                          <div style={{ fontSize:13, fontWeight:700, color:c||'#fff', fontFamily:'Syne,sans-serif' }}>{v}</div>
                        </div>
                      ))}
                    </div>
                    {mapData.map_url && (
                      <div style={{ borderRadius:12, overflow:'hidden', border:'1px solid rgba(255,255,255,.08)' }}>
                        <img src={mapData.map_url} alt="Satellite vegetation map" style={{ width:'100%', display:'block', maxHeight:500, objectFit:'cover' }} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ ANALYSIS ══ */}
          {section==='analysis' && (
            <div className="fu">
              <div className="card">
                <SH title="Sensor Data Input" sub="Enter field conditions for AI-powered analysis" />
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16, marginBottom:18 }}>
                  {[
                    { key:'soil_moisture', label:'Soil Moisture (%)', ph:'e.g. 28', req:true },
                    { key:'temperature',   label:'Temperature (°C)',  ph:'e.g. 35', req:true },
                    { key:'humidity',      label:'Humidity (%)',      ph:'e.g. 65', req:true },
                    { key:'rainfall',      label:'Rainfall (mm)',     ph:'e.g. 5',  req:false },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={LBL}>{f.label}{f.req && <span style={{ color:'#22c55e' }}> *</span>}</label>
                      <input className="inp" type="number" step="0.1" placeholder={f.ph}
                        value={form[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} />
                    </div>
                  ))}
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
                  <div>
                    <label style={LBL}>Crop Type *</label>
                    <select className="sel" value={form.crop_type} onChange={e=>setForm(p=>({...p,crop_type:e.target.value}))}>
                      <option value="rice">🌾 Rice</option>
                      <option value="wheat">🌾 Wheat</option>
                      <option value="corn">🌽 Corn</option>
                      <option value="cotton">🪴 Cotton</option>
                    </select>
                  </div>
                  <div>
                    <label style={LBL}>Crop Image (optional)</label>
                    <label htmlFor="img-up" className="file-lbl">
                      <span>📷</span>
                      <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {form.image ? form.image.name : 'Click to upload .jpg / .png'}
                      </span>
                    </label>
                    <input id="img-up" type="file" accept=".jpg,.jpeg,.png,.tif,.tiff" style={{ display:'none' }}
                      onChange={e => {
                        const f = e.target.files[0]; if (!f) return;
                        setForm(p=>({...p,image:f}));
                        const rd = new FileReader(); rd.onloadend=()=>setImgPreview(rd.result); rd.readAsDataURL(f);
                      }} />
                  </div>
                </div>

                {imgPreview && (
                  <div style={{ display:'flex', gap:14, alignItems:'center', marginBottom:20, padding:'12px 14px', background:'rgba(255,255,255,.04)', borderRadius:12 }}>
                    <img src={imgPreview} alt="preview" style={{ width:72, height:72, objectFit:'cover', borderRadius:10 }} />
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, color:'rgba(255,255,255,.7)' }}>{form.image?.name}</div>
                      <div style={{ fontSize:11, color:'#22c55e', marginTop:4 }}>✓ Health analysis enabled</div>
                    </div>
                    <button onClick={()=>{ setForm(p=>({...p,image:null})); setImgPreview(null); }}
                      style={{ background:'none', border:'none', color:'#ef4444', cursor:'pointer', fontSize:18 }}>✕</button>
                  </div>
                )}

                <div style={{ display:'flex', gap:12 }}>
                  <button className="btn-p" disabled={analyzing} onClick={runAnalysis} style={{ flex:1, padding:'13px 0' }}>
                    {analyzing ? <><Spinner color="#fff" />Running…</> : '🧬 Run Full Analysis'}
                  </button>
                  <button className="btn-g" disabled={analyzing} onClick={resetForm} style={{ padding:'13px 20px' }}>↺ Reset</button>
                </div>
              </div>
            </div>
          )}

          {/* ══ RESULTS ══ */}
          {section==='results' && (
            <div className="fu">
              {!results ? (
                <div className="card" style={{ minHeight:320, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, textAlign:'center' }}>
                  <span style={{ fontSize:48 }}>📊</span>
                  <div style={{ fontSize:16, color:'rgba(255,255,255,.5)' }}>
                    No results yet.<br />
                    <span style={{ color:'#22c55e', cursor:'pointer', fontWeight:600 }} onClick={()=>setSection('analysis')}>Go to Crop Analysis →</span>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom:20, padding:'12px 18px', background:'rgba(34,197,94,.08)', border:'1px solid rgba(34,197,94,.2)', borderRadius:12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div style={{ fontSize:14, color:'#4ade80', fontWeight:600 }}>✓ Analysis complete — {Object.values(results).filter(Boolean).length} result(s)</div>
                    <button className="btn-g" onClick={()=>setSection('analysis')} style={{ padding:'7px 14px', fontSize:12 }}>+ New Analysis</button>
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(290px,1fr))', gap:20 }}>
                    {results.irrigation && (
                      <ResultCard cls="fu1" borderColor="#3b82f6" emoji="💧" title="Irrigation Recommendation"
                        badge={results.irrigation.model} badgeBg="rgba(59,130,246,.15)" badgeColor="#60a5fa"
                        rows={[
                          ['Recommended Action', results.irrigation.action?.replace(/_/g,' '), null],
                          ['Urgency', results.irrigation.urgency, urgCol(results.irrigation.urgency)],
                          ['Confidence', `${fmt(results.irrigation.confidence*100,0)}%`, '#22c55e'],
                        ]}
                        extra={<div style={{ marginTop:14, padding:12, background:'rgba(59,130,246,.08)', borderRadius:10, fontSize:13, color:'rgba(255,255,255,.6)', lineHeight:1.5 }}>{results.irrigation.reason}</div>}
                      />
                    )}

                    {results.pest && (
                      <ResultCard cls="fu2" borderColor={riskCol(results.pest.risk_level)} emoji="🐛" title="Pest Risk Assessment"
                        badge={results.pest.risk_level?.toUpperCase()} badgeBg={`${riskCol(results.pest.risk_level)}20`} badgeColor={riskCol(results.pest.risk_level)}
                        rows={[
                          ['Risk Score', results.pest.risk_score, riskCol(results.pest.risk_level)],
                          ['Confidence', `${fmt(results.pest.confidence*100,0)}%`, '#22c55e'],
                          ['Model', results.pest.model, null],
                        ]}
                        extra={results.pest.factors && (
                          <div style={{ marginTop:14, display:'flex', gap:10 }}>
                            {[['🌡️ Temp',`${results.pest.factors.temperature}°C`,'#f59e0b'],['💨 Humidity',`${results.pest.factors.humidity}%`,'#8b5cf6']].map(([l,v,c]) => (
                              <div key={l} style={{ flex:1, padding:10, background:'rgba(255,255,255,.04)', borderRadius:9, textAlign:'center' }}>
                                <div style={{ fontSize:11, color:'rgba(255,255,255,.35)', marginBottom:4 }}>{l}</div>
                                <div style={{ fontSize:17, fontWeight:800, color:c, fontFamily:'Syne,sans-serif' }}>{v}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      />
                    )}

                    {results.health ? (
                      <div className="card fu3" style={{ borderTop:`3px solid ${healthCol(results.health.status)}` }}>
                        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
                          <div style={{ width:42, height:42, background:`${healthCol(results.health.status)}20`, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>🌿</div>
                          <div>
                            <div style={{ fontSize:15, fontWeight:700, color:'#fff', fontFamily:'Syne,sans-serif' }}>Crop Health Analysis</div>
                            <span className="tag" style={{ background:`${healthCol(results.health.status)}20`, color:healthCol(results.health.status), marginTop:4, display:'inline-block' }}>{results.health.status}</span>
                          </div>
                        </div>
                        <div style={{ display:'flex', justifyContent:'space-around', marginBottom:20 }}>
                          <Donut value={(results.health.ndvi||0)*100} max={100} color={healthCol(results.health.status)} label="NDVI Score" />
                          <Donut value={(results.health.confidence||0)*100} max={100} color="#22c55e" label="Confidence %" />
                        </div>
                        {results.health.recommendations?.length > 0 && (
                          <>
                            <div style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,.35)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:8 }}>AI Recommendations</div>
                            {results.health.recommendations.map((r,i) => (
                              <RecItem key={i} text={r} priority={results.health.status?.toLowerCase().includes('severe')?'high':results.health.status?.toLowerCase().includes('moderate')?'medium':'low'} />
                            ))}
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="card fu3" style={{ borderTop:'3px solid rgba(255,255,255,.1)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, minHeight:200, textAlign:'center' }}>
                        <span style={{ fontSize:36 }}>🌿</span>
                        <div style={{ fontSize:14, color:'rgba(255,255,255,.4)' }}>No crop health analysis</div>
                        <div style={{ fontSize:12, color:'rgba(255,255,255,.25)' }}>Upload an image in the Analysis tab</div>
                        <button className="btn-g" onClick={()=>setSection('analysis')} style={{ padding:'8px 16px', fontSize:12, marginTop:4 }}>Upload Image →</button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default SmartCropDashboard;