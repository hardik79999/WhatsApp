import { useState, useRef } from 'react';
import api from './api';

/* ── Spinner ── */
const Spinner = () => (
  <span style={{
    display:'inline-block', width:16, height:16,
    border:'2px solid rgba(255,255,255,.35)', borderTopColor:'#fff',
    borderRadius:'50%', animation:'spin .7s linear infinite',
    verticalAlign:'middle', marginRight:8,
  }} />
);

/* ── WhatsApp SVG logo ── */
const WALogo = ({ size = 64 }) => (
  <svg viewBox="0 0 212 212" fill="none" width={size} height={size}>
    <circle cx="106" cy="106" r="106" fill="#00a884"/>
    <path fill="#fff" d="M106 52c-29.8 0-54 24.2-54 54 0 9.8 2.6 19 7.2 26.9L52 160l27.5-7.2c7.6 4.1 16.3 6.4 25.5 6.4 29.8 0 54-24.2 54-54S135.8 52 106 52zm26.8 74.8c-1.1 3.1-6.5 5.9-9 6.3-2.3.4-5.2.5-8.4-.5-1.9-.6-4.4-1.5-7.5-2.9-13.2-5.7-21.8-19-22.5-19.9-.7-.9-5.7-7.6-5.7-14.5s3.6-10.3 4.9-11.7c1.3-1.4 2.8-1.7 3.7-1.7h2.7c.9 0 2.1-.3 3.2 2.5 1.2 2.8 4 9.7 4.4 10.4.4.7.6 1.5.1 2.4-.5.9-.7 1.5-1.4 2.3-.7.8-1.5 1.8-.7 3.1.8 1.3 3.5 5.8 7.5 9.4 5.2 4.6 9.5 6 10.9 6.7 1.4.7 2.2.6 3-.4.8-1 3.4-4 4.3-5.4.9-1.4 1.8-1.1 3-.7 1.2.4 7.8 3.7 9.1 4.4 1.3.7 2.2 1 2.5 1.6.4.6.4 3.4-.7 6.6z"/>
  </svg>
);

/* ── OTP digit boxes ── */
function OtpInput({ value, onChange }) {
  const refs = [useRef(), useRef(), useRef(), useRef()];
  const digits = value.split('');

  const handleKey = (i, e) => {
    if (e.key === 'Backspace') {
      const next = value.slice(0, i) + value.slice(i + 1);
      onChange(next);
      if (i > 0) refs[i - 1].current?.focus();
    } else if (/^\d$/.test(e.key)) {
      const next = (value.slice(0, i) + e.key + value.slice(i + 1)).slice(0, 4);
      onChange(next);
      if (i < 3) refs[i + 1].current?.focus();
    }
  };

  return (
    <div style={{ display:'flex', gap:12, justifyContent:'center', margin:'24px 0' }}>
      {[0,1,2,3].map((i) => (
        <input
          key={i}
          ref={refs[i]}
          className="otp-box"
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i] || ''}
          onChange={() => {}}
          onKeyDown={(e) => handleKey(i, e)}
          onFocus={(e) => e.target.select()}
          autoFocus={i === 0}
        />
      ))}
    </div>
  );
}

export default function Login({ onLoginSuccess }) {
  const [step, setStep]       = useState('phone');
  const [phone, setPhone]     = useState('');
  const [otp, setOtp]         = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [info, setInfo]       = useState('');

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError(''); setInfo('');
    if (!phone.trim()) { setError('Please enter your phone number.'); return; }
    setLoading(true);
    try {
      await api.post('/auth/send-otp', { phone: phone.trim() });
      setInfo('OTP sent! Check the backend terminal for your code.');
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send OTP. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (otp.length < 4) { setError('Please enter the 4-digit OTP.'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { phone: phone.trim(), otp: otp.trim() });
      if (data.csrf_access_token)  localStorage.setItem('csrf_access_token',  data.csrf_access_token);
      if (data.csrf_refresh_token) localStorage.setItem('csrf_refresh_token', data.csrf_refresh_token);
      onLoginSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Incorrect OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── shared input style ── */
  const inputStyle = {
    width:'100%', boxSizing:'border-box',
    background:'#2a3942', border:'none', borderBottom:'2px solid #00a884',
    borderRadius:'4px 4px 0 0', padding:'14px 16px',
    color:'#e9edef', fontSize:16, outline:'none', caretColor:'#00a884',
  };

  const btnStyle = (disabled) => ({
    width:'100%', padding:'14px 0', border:'none', borderRadius:8,
    background: disabled ? '#2a3942' : '#00a884',
    color: disabled ? '#8696a0' : '#111b21',
    fontSize:15, fontWeight:700, cursor: disabled ? 'not-allowed' : 'pointer',
    transition:'background .2s', letterSpacing:'.3px', marginTop:8,
  });

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .login-fade { animation: fadeUp .3s ease; }
        .phone-input::placeholder { color: #8696a0; }
        .phone-input:focus { outline: none; }
      `}</style>

      <div style={{ display:'flex', minHeight:'100vh', background:'#111b21', fontFamily:'"Segoe UI", system-ui, sans-serif' }}>

        {/* ── LEFT decorative panel ── */}
        <div style={{
          flex:'1 1 55%', background:'#202c33',
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          padding:'48px 40px', position:'relative', overflow:'hidden',
        }}>
          {/* Decorative circles */}
          <div style={{ position:'absolute', width:400, height:400, borderRadius:'50%', border:'1px solid #2a3942', top:-100, left:-100, opacity:.5 }} />
          <div style={{ position:'absolute', width:300, height:300, borderRadius:'50%', border:'1px solid #2a3942', bottom:-80, right:-80, opacity:.5 }} />

          <div style={{ position:'relative', zIndex:1, textAlign:'center', color:'#e9edef', maxWidth:420 }}>
            <WALogo size={80} />
            <h1 style={{ fontSize:38, fontWeight:300, margin:'28px 0 12px', letterSpacing:'-0.5px' }}>WhatsApp Web</h1>
            <p style={{ fontSize:15, color:'#8696a0', lineHeight:1.7, margin:'0 0 48px' }}>
              Send and receive messages without keeping your phone online.<br/>
              Use WhatsApp on up to 4 linked devices and 1 phone.
            </p>

            <div style={{ display:'flex', flexDirection:'column', gap:20, textAlign:'left' }}>
              {[
                ['💬', 'Real-time messaging', 'Instant delivery with read receipts'],
                ['🔒', 'End-to-end encrypted', 'Only you and the recipient can read messages'],
                ['📎', 'Share files & media', 'Photos, videos, documents and more'],
                ['🌐', 'Works everywhere', 'Desktop, tablet, and mobile browsers'],
              ].map(([icon, title, sub]) => (
                <div key={title} style={{ display:'flex', alignItems:'center', gap:16 }}>
                  <div style={{ width:44, height:44, borderRadius:'50%', background:'#2a3942', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>
                    {icon}
                  </div>
                  <div>
                    <div style={{ color:'#e9edef', fontSize:14, fontWeight:600 }}>{title}</div>
                    <div style={{ color:'#8696a0', fontSize:13 }}>{sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT form panel ── */}
        <div style={{
          flex:'0 0 440px', background:'#111b21',
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          padding:'48px 40px', borderLeft:'1px solid #2a3942',
        }}>
          <div style={{ width:'100%', maxWidth:360 }} className="login-fade">

            {/* ── STEP 1: Phone ── */}
            {step === 'phone' && (
              <>
                <div style={{ textAlign:'center', marginBottom:32 }}>
                  <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:64, height:64, borderRadius:'50%', background:'#202c33', marginBottom:20 }}>
                    <WALogo size={40} />
                  </div>
                  <div style={{ display:'inline-block', background:'#2a3942', color:'#00a884', fontSize:11, fontWeight:700, letterSpacing:1, padding:'3px 10px', borderRadius:20, marginBottom:12 }}>
                    STEP 1 OF 2
                  </div>
                  <h2 style={{ color:'#e9edef', fontSize:22, fontWeight:600, margin:'0 0 8px' }}>Enter your phone number</h2>
                  <p style={{ color:'#8696a0', fontSize:14, margin:0, lineHeight:1.6 }}>
                    We'll send a one-time password to verify your identity.
                  </p>
                </div>

                {error && (
                  <div style={{ background:'#2a1515', border:'1px solid #5c2020', borderRadius:8, padding:'10px 14px', marginBottom:16, color:'#ff6b6b', fontSize:13, display:'flex', gap:8 }}>
                    <span>⚠️</span><span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSendOtp}>
                  <div style={{ marginBottom:20 }}>
                    <label style={{ display:'block', color:'#8696a0', fontSize:11, fontWeight:700, letterSpacing:1, textTransform:'uppercase', marginBottom:8 }}>
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="+91 9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      autoFocus
                      className="phone-input"
                      style={inputStyle}
                    />
                  </div>
                  <button type="submit" disabled={loading} style={btnStyle(loading)}>
                    {loading ? <><Spinner />Sending OTP…</> : 'Send OTP →'}
                  </button>
                </form>
              </>
            )}

            {/* ── STEP 2: OTP ── */}
            {step === 'otp' && (
              <>
                <button
                  onClick={() => { setStep('phone'); setError(''); setInfo(''); setOtp(''); }}
                  style={{ background:'none', border:'none', color:'#00a884', cursor:'pointer', fontSize:13, fontWeight:600, padding:0, marginBottom:24, display:'flex', alignItems:'center', gap:6 }}
                >
                  ← Change number
                </button>

                <div style={{ textAlign:'center', marginBottom:24 }}>
                  <div style={{ display:'inline-block', background:'#2a3942', color:'#00a884', fontSize:11, fontWeight:700, letterSpacing:1, padding:'3px 10px', borderRadius:20, marginBottom:12 }}>
                    STEP 2 OF 2
                  </div>
                  <h2 style={{ color:'#e9edef', fontSize:22, fontWeight:600, margin:'0 0 8px' }}>Verify OTP</h2>
                  <p style={{ color:'#8696a0', fontSize:14, margin:0 }}>
                    OTP sent to <strong style={{ color:'#e9edef' }}>{phone}</strong>
                  </p>
                </div>

                <div style={{ background:'#2a3942', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:12.5, color:'#8696a0', lineHeight:1.6 }}>
                  💡 <strong style={{ color:'#e9edef' }}>Dev mode:</strong> The OTP is printed in the backend terminal.
                </div>

                {info  && <div style={{ background:'#0d2b1e', border:'1px solid #1a5c3a', borderRadius:8, padding:'10px 14px', marginBottom:16, color:'#25d366', fontSize:13, display:'flex', gap:8 }}><span>✅</span><span>{info}</span></div>}
                {error && <div style={{ background:'#2a1515', border:'1px solid #5c2020', borderRadius:8, padding:'10px 14px', marginBottom:16, color:'#ff6b6b', fontSize:13, display:'flex', gap:8 }}><span>⚠️</span><span>{error}</span></div>}

                <form onSubmit={handleVerifyOtp}>
                  <label style={{ display:'block', color:'#8696a0', fontSize:11, fontWeight:700, letterSpacing:1, textTransform:'uppercase', marginBottom:4, textAlign:'center' }}>
                    One-Time Password
                  </label>
                  <OtpInput value={otp} onChange={setOtp} />

                  <button type="submit" disabled={loading || otp.length < 4} style={btnStyle(loading || otp.length < 4)}>
                    {loading ? <><Spinner />Verifying…</> : 'Verify & Login ✓'}
                  </button>

                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={loading}
                    style={{ width:'100%', marginTop:10, padding:'12px 0', background:'none', border:'1px solid #2a3942', borderRadius:8, color:'#00a884', fontWeight:600, cursor: loading ? 'not-allowed' : 'pointer', fontSize:14 }}
                  >
                    Resend OTP
                  </button>
                </form>
              </>
            )}

            <p style={{ fontSize:11, color:'#3b4a54', textAlign:'center', marginTop:32 }}>
              WhatsApp Clone © {new Date().getFullYear()} · All rights reserved
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
