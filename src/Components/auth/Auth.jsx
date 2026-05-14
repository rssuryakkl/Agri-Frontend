/**
 * src/Components/auth/Auth.jsx
 *
 * Fixes:
 * - Firebase 400 errors are now decoded into human-readable messages.
 *   The most common cause is "EMAIL_NOT_FOUND", "INVALID_PASSWORD",
 *   or "OPERATION_NOT_ALLOWED" (Email/Password provider disabled in
 *   Firebase console).
 * - Error codes mapped: operation-not-allowed, email-already-in-use,
 *   user-not-found, wrong-password, weak-password, invalid-email,
 *   too-many-requests, network-request-failed.
 */
import React, { useState, useEffect } from 'react';

// ── Keyframe injection ────────────────────────────────────────────────────────
const injectStyles = () => {
  if (document.getElementById('auth-styles')) return;
  const style = document.createElement('style');
  style.id = 'auth-styles';
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');
    @keyframes float-card  { 0%,100%{transform:translateY(0px) rotate(-1deg)} 50%{transform:translateY(-12px) rotate(-1deg)} }
    @keyframes float-card2 { 0%,100%{transform:translateY(0px) rotate(2deg)}  50%{transform:translateY(-8px) rotate(2deg)}  }
    @keyframes pulse-ring  { 0%{transform:scale(.8);opacity:.8} 100%{transform:scale(1.4);opacity:0} }
    @keyframes slide-up    { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
    @keyframes rotate-slow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    @keyframes fade-in     { from{opacity:0} to{opacity:1} }
    @keyframes pulse       { 0%,100%{opacity:1} 50%{opacity:.4} }
    .auth-su   {animation:slide-up .6s ease forwards}
    .auth-su1  {animation:slide-up .6s .1s ease both}
    .auth-su2  {animation:slide-up .6s .2s ease both}
    .auth-su3  {animation:slide-up .6s .3s ease both}
    .auth-su4  {animation:slide-up .6s .4s ease both}
    .auth-inp:focus  {outline:none;border-color:#22c55e!important;box-shadow:0 0 0 3px rgba(34,197,94,.15)!important}
    .auth-btn:hover  {transform:translateY(-1px);box-shadow:0 8px 24px rgba(34,197,94,.4)!important}
    .auth-btn:active {transform:translateY(0)}
    .auth-link:hover {color:#4ade80!important}
  `;
  document.head.appendChild(style);
};

// ── Map Firebase error codes → friendly messages ──────────────────────────────
const friendlyError = (err) => {
  const code = err?.code || '';
  const msg  = (err?.message || '').toLowerCase();

  if (code === 'auth/operation-not-allowed' || msg.includes('operation-not-allowed'))
    return 'Email/Password sign-in is not enabled. Please go to your Firebase console → Authentication → Sign-in method and enable "Email/Password".';
  if (code === 'auth/email-already-in-use')
    return 'An account with this email already exists. Try signing in instead.';
  if (code === 'auth/user-not-found' || code === 'auth/invalid-credential')
    return 'No account found with this email. Please check and try again.';
  if (code === 'auth/wrong-password')
    return 'Incorrect password. Please try again or reset your password.';
  if (code === 'auth/weak-password')
    return 'Password must be at least 6 characters.';
  if (code === 'auth/invalid-email')
    return 'Please enter a valid email address.';
  if (code === 'auth/too-many-requests')
    return 'Too many failed attempts. Please wait a few minutes and try again.';
  if (code === 'auth/network-request-failed')
    return 'Network error. Check your internet connection and try again.';
  if (code === 'auth/user-disabled')
    return 'This account has been disabled. Contact support.';
  if (code === 'auth/popup-closed-by-user')
    return 'Sign-in popup was closed. Please try again.';

  // Strip raw Firebase boilerplate
  return (err?.message || 'Authentication failed')
    .replace('Firebase: ', '')
    .replace(/\s*\(auth\/[^)]*\)\.?\s*$/, '')
    .trim() || 'Authentication failed';
};

// ── Floating stat card ────────────────────────────────────────────────────────
const StatCard = ({ style, title, value, change, positive, delay }) => (
  <div style={{
    position:'absolute', background:'rgba(15,20,30,.75)', backdropFilter:'blur(20px)',
    border:'1px solid rgba(255,255,255,.1)', borderRadius:16, padding:'16px 20px',
    minWidth:160, fontFamily:'DM Sans,sans-serif',
    animation:`${delay%2===0?'float-card':'float-card2'} ${3+delay*.5}s ease-in-out infinite`,
    animationDelay:`${delay*.4}s`, ...style,
  }}>
    <div style={{fontSize:11,color:'rgba(255,255,255,.45)',letterSpacing:'.08em',textTransform:'uppercase',marginBottom:8}}>{title}</div>
    <div style={{fontSize:22,fontWeight:700,color:'#fff',fontFamily:'Syne,sans-serif',lineHeight:1}}>{value}</div>
    <div style={{fontSize:12,color:positive?'#4ade80':'#f87171',marginTop:6,display:'flex',alignItems:'center',gap:4}}>
      <span>{positive?'↑':'↓'}</span>{change}
    </div>
  </div>
);

// ── Main Auth Component ───────────────────────────────────────────────────────
const Auth = ({ onLogin, onSignup, onResetPassword }) => {
  const [view, setView]     = useState('login');
  const [form, setForm]     = useState({ email:'', password:'', confirmPassword:'', displayName:'' });
  const [loading, setLoad]  = useState(false);
  const [error, setError]   = useState('');
  const [success, setSucc]  = useState('');

  useEffect(() => { injectStyles(); }, []);

  const set = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setLoad(true);
    try   { await onLogin(form.email, form.password); }
    catch (err) { setError(friendlyError(err)); }
    finally { setLoad(false); }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');
    if (form.password.length < 6)              return setError('Password must be at least 6 characters.');
    setLoad(true);
    try   { await onSignup(form.email, form.password, form.displayName); }
    catch (err) { setError(friendlyError(err)); }
    finally { setLoad(false); }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError(''); setLoad(true);
    try   { await onResetPassword(form.email); setSucc('Reset link sent — check your inbox.'); }
    catch (err) { setError(friendlyError(err)); }
    finally { setLoad(false); }
  };

  const switchView = (v) => { setView(v); setError(''); setSucc(''); };

  const INP = {
    width:'100%', boxSizing:'border-box', padding:'13px 16px',
    background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)',
    borderRadius:10, color:'#fff', fontSize:14, fontFamily:'DM Sans,sans-serif', transition:'all .2s',
  };
  const LBL = { display:'block', fontSize:13, fontWeight:500, color:'rgba(255,255,255,.6)', marginBottom:8, fontFamily:'DM Sans,sans-serif' };
  const BTN = (disabled) => ({
    width:'100%', padding:14,
    background: disabled ? 'rgba(34,197,94,.4)' : 'linear-gradient(135deg,#22c55e,#16a34a)',
    color:'#fff', border:'none', borderRadius:10, fontSize:15, fontWeight:600,
    cursor: disabled ? 'not-allowed' : 'pointer', fontFamily:'Syne,sans-serif',
    letterSpacing:'-.01em', transition:'all .2s', boxShadow:'0 4px 16px rgba(34,197,94,.3)',
  });
  const LINK = {
    background:'none', border:'none', color:'#22c55e', cursor:'pointer',
    fontSize:14, fontFamily:'DM Sans,sans-serif', fontWeight:500, padding:0, transition:'color .2s',
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', background:'#080c14', fontFamily:'DM Sans,sans-serif', overflow:'hidden' }}>

      {/* ── Left: form ── */}
      <div style={{
        width:'100%', maxWidth:480, display:'flex', flexDirection:'column',
        justifyContent:'center', padding:'60px 56px', position:'relative', zIndex:10,
        background:'rgba(8,12,20,.97)', borderRight:'1px solid rgba(255,255,255,.06)',
      }}>
        {/* Logo */}
        <div className="auth-su" style={{ display:'flex', alignItems:'center', gap:12, marginBottom:52 }}>
          <div style={{ width:38, height:38, background:'linear-gradient(135deg,#22c55e,#16a34a)',
            borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 4px 16px rgba(34,197,94,.4)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a9 9 0 0 1 9 9c0 4-2.5 7.5-6 9l-3-5-3 5c-3.5-1.5-6-5-6-9a9 9 0 0 1 9-9z"/>
              <line x1="12" y1="2" x2="12" y2="11"/>
            </svg>
          </div>
          <span style={{ fontSize:18, fontWeight:700, color:'#fff', fontFamily:'Syne,sans-serif', letterSpacing:'-.02em' }}>SmartCrop AI</span>
        </div>

        {/* Heading */}
        {view === 'login'  && <><div className="auth-su1" style={{ fontSize:30, fontWeight:800, color:'#fff', fontFamily:'Syne,sans-serif', letterSpacing:'-.03em', lineHeight:1.1, marginBottom:8 }}>Welcome back</div><div className="auth-su1" style={{ fontSize:14, color:'rgba(255,255,255,.4)', marginBottom:36 }}>New to SmartCrop? <button onClick={()=>switchView('signup')} className="auth-link" style={LINK}>Create an account.</button></div></>}
        {view === 'signup' && <><div className="auth-su1" style={{ fontSize:30, fontWeight:800, color:'#fff', fontFamily:'Syne,sans-serif', letterSpacing:'-.03em', lineHeight:1.1, marginBottom:8 }}>Create account</div><div className="auth-su1" style={{ fontSize:14, color:'rgba(255,255,255,.4)', marginBottom:36 }}>Already have one? <button onClick={()=>switchView('login')} className="auth-link" style={LINK}>Sign in.</button></div></>}
        {view === 'forgot' && <><div className="auth-su1" style={{ fontSize:30, fontWeight:800, color:'#fff', fontFamily:'Syne,sans-serif', letterSpacing:'-.03em', lineHeight:1.1, marginBottom:8 }}>Reset password</div><div className="auth-su1" style={{ fontSize:14, color:'rgba(255,255,255,.4)', marginBottom:36 }}>Enter your email and we'll send a reset link.</div></>}

        {/* Error banner */}
        {error && (
          <div style={{ background:'rgba(239,68,68,.12)', border:'1px solid rgba(239,68,68,.3)', borderRadius:10,
            padding:'12px 16px', marginBottom:20, fontSize:13, color:'#f87171', lineHeight:1.5 }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ background:'rgba(34,197,94,.12)', border:'1px solid rgba(34,197,94,.3)', borderRadius:10,
            padding:'12px 16px', marginBottom:20, fontSize:13, color:'#4ade80' }}>
            {success}
          </div>
        )}

        {/* ── LOGIN ── */}
        {view === 'login' && (
          <form onSubmit={handleLogin}>
            <div className="auth-su2" style={{ marginBottom:20 }}>
              <label style={LBL}>Email</label>
              <input className="auth-inp" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required style={INP}/>
            </div>
            <div className="auth-su3" style={{ marginBottom:12 }}>
              <label style={LBL}>Password</label>
              <input className="auth-inp" type="password" placeholder="••••••••••" value={form.password} onChange={set('password')} required style={INP}/>
            </div>
            <div className="auth-su3" style={{ display:'flex', justifyContent:'flex-end', marginBottom:28 }}>
              <button type="button" onClick={()=>switchView('forgot')} className="auth-link" style={{ ...LINK, fontSize:13 }}>Forgot password?</button>
            </div>
            <div className="auth-su4">
              <button type="submit" disabled={loading} className="auth-btn" style={BTN(loading)}>
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </div>
          </form>
        )}

        {/* ── SIGNUP ── */}
        {view === 'signup' && (
          <form onSubmit={handleSignup}>
            {[
              { key:'displayName', label:'Full Name',        type:'text',     ph:'John Doe' },
              { key:'email',       label:'Email',            type:'email',    ph:'you@example.com' },
              { key:'password',    label:'Password',         type:'password', ph:'Min 6 characters' },
              { key:'confirmPassword', label:'Confirm Password', type:'password', ph:'••••••••••' },
            ].map(({ key, label, type, ph }, i) => (
              <div key={key} className={`auth-su${i+2}`} style={{ marginBottom: i === 3 ? 28 : 16 }}>
                <label style={LBL}>{label}</label>
                <input className="auth-inp" type={type} placeholder={ph} value={form[key]} onChange={set(key)} required style={INP}/>
              </div>
            ))}
            <div className="auth-su4">
              <button type="submit" disabled={loading} className="auth-btn" style={BTN(loading)}>
                {loading ? 'Creating account…' : 'Create account'}
              </button>
            </div>
          </form>
        )}

        {/* ── FORGOT ── */}
        {view === 'forgot' && (
          <form onSubmit={handleReset}>
            <div className="auth-su2" style={{ marginBottom:28 }}>
              <label style={LBL}>Email</label>
              <input className="auth-inp" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required style={INP}/>
            </div>
            <div className="auth-su3">
              <button type="submit" disabled={loading} className="auth-btn" style={{ ...BTN(loading), marginBottom:12 }}>
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
              <button type="button" onClick={()=>switchView('login')} style={{
                width:'100%', padding:14, background:'rgba(255,255,255,.06)',
                border:'1px solid rgba(255,255,255,.1)', color:'rgba(255,255,255,.7)',
                borderRadius:10, fontSize:14, cursor:'pointer', fontFamily:'DM Sans,sans-serif', transition:'all .2s',
              }}>
                ← Back to login
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ── Right: visual ── */}
      <div style={{
        flex:1, position:'relative', overflow:'hidden',
        background:'linear-gradient(135deg,#0a1628 0%,#0d1f0f 40%,#071510 100%)',
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        <div style={{ position:'absolute', top:'15%', left:'20%', width:300, height:300, background:'radial-gradient(circle,rgba(34,197,94,.12) 0%,transparent 70%)', borderRadius:'50%', filter:'blur(20px)' }}/>
        <div style={{ position:'absolute', bottom:'20%', right:'15%', width:250, height:250, background:'radial-gradient(circle,rgba(16,185,129,.1) 0%,transparent 70%)', borderRadius:'50%', filter:'blur(20px)' }}/>

        <StatCard style={{top:'18%',left:'10%'}}  title="Crop Health Index" value="87.4%"  change="+5.2% this week"       positive delay={0}/>
        <StatCard style={{top:'38%',right:'8%'}}  title="Soil Moisture"    value="34.2%"  change="+1.8% today"           positive delay={1}/>
        <StatCard style={{bottom:'28%',left:'14%'}} title="Pest Risk Score" value="Low — 18" change="−12 from yesterday" positive delay={2}/>
        <StatCard style={{bottom:'14%',right:'12%'}} title="NDVI Average"  value="0.68"   change="+0.04 vs last week"    positive delay={3}/>

        {/* Central ring */}
        <div style={{ position:'relative', width:180, height:180 }}>
          <div style={{ position:'absolute', inset:0,   borderRadius:'50%', border:'1px solid rgba(34,197,94,.15)', animation:'pulse-ring 3s linear infinite' }}/>
          <div style={{ position:'absolute', inset:20,  borderRadius:'50%', border:'1px solid rgba(34,197,94,.2)',  animation:'pulse-ring 3s 1s linear infinite' }}/>
          <div style={{ position:'absolute', inset:40,  borderRadius:'50%', border:'2px solid rgba(34,197,94,.3)',  animation:'rotate-slow 12s linear infinite' }}/>
          <div style={{
            position:'absolute', inset:60, borderRadius:'50%',
            background:'linear-gradient(135deg,#22c55e,#16a34a)',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 0 40px rgba(34,197,94,.4)',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a9 9 0 0 1 9 9c0 4-2.5 7.5-6 9l-3-5-3 5c-3.5-1.5-6-5-6-9a9 9 0 0 1 9-9z"/>
              <line x1="12" y1="2" x2="12" y2="11"/>
            </svg>
          </div>
        </div>

        <div style={{ position:'absolute', bottom:'8%', left:'50%', transform:'translateX(-50%)', textAlign:'center', animation:'fade-in 1s .5s both' }}>
          <div style={{ fontSize:20, fontWeight:800, color:'#fff', fontFamily:'Syne,sans-serif', letterSpacing:'-.03em', whiteSpace:'nowrap' }}>
            AI-Powered Farm Intelligence
          </div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,.35)', marginTop:6, fontFamily:'DM Sans,sans-serif' }}>
            Real-time satellite · ML predictions · Smart alerts
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;