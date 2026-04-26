// src/App.jsx
import { useState, useEffect, createContext, useContext } from 'react';
import { api } from './lib/api.js';

// Pages
import Dashboard  from './pages/Dashboard.jsx';
import Urunler    from './pages/Urunler.jsx';
import Stok       from './pages/Stok.jsx';
import Transfer   from './pages/Transfer.jsx';
import Sayim      from './pages/Sayim.jsx';
import Makinalar  from './pages/Makinalar.jsx';
import Raporlar   from './pages/Raporlar.jsx';
import Arizalar   from './pages/Arizalar.jsx';
import Ayarlar    from './pages/Ayarlar.jsx';

// Toast context
export const ToastCtx = createContext(null);
export const useToast = () => useContext(ToastCtx);

const SCREENS = [
  { id: 'dashboard', label: 'Panel',    icon: '📊', title: 'Ana Panel' },
  { id: 'urunler',   label: 'Ürünler',  icon: '📦', title: 'Ürün Yönetimi' },
  { id: 'stok',      label: 'Giriş',    icon: '🛒', title: 'Stok Girişi' },
  { id: 'transfer',  label: 'Transfer', icon: '🔄', title: 'Transfer' },
  { id: 'sayim',     label: 'Sayım',    icon: '🔍', title: 'Sayım' },
  { id: 'makinalar', label: 'Otomatlar',icon: '🏪', title: 'Otomat Yönetimi' },
  { id: 'raporlar',  label: 'Rapor',    icon: '📈', title: 'Raporlar' },
  { id: 'arizalar',  label: 'Arıza',    icon: '🔧', title: 'Arıza & Bakım' },
  { id: 'ayarlar',   label: 'Ayarlar',  icon: '⚙️', title: 'Ayarlar' },
];

export default function App() {
  const [screen, setScreen]     = useState('dashboard');
  const [toast, setToast]       = useState(null);
  const [apiOk, setApiOk]       = useState(null);
  const [machineCount, setMachineCount] = useState('—');

  // Toast helper
  const showToast = (msg, type = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Check API health on mount
  useEffect(() => {
    api.health()
      .then(() => {
        setApiOk(true);
        return api.makinalar.list();
      })
      .then(m => setMachineCount(m.length))
      .catch(() => setApiOk(false));
  }, []);

  const current = SCREENS.find(s => s.id === screen);

  const renderPage = () => {
    switch (screen) {
      case 'dashboard':  return <Dashboard  showToast={showToast} />;
      case 'urunler':    return <Urunler    showToast={showToast} />;
      case 'stok':       return <Stok       showToast={showToast} />;
      case 'transfer':   return <Transfer   showToast={showToast} />;
      case 'sayim':      return <Sayim      showToast={showToast} />;
      case 'makinalar':  return <Makinalar  showToast={showToast} />;
      case 'raporlar':   return <Raporlar   showToast={showToast} />;
      case 'arizalar':   return <Arizalar   showToast={showToast} />;
      case 'ayarlar':    return <Ayarlar    showToast={showToast} machineCount={machineCount} />;
      default:           return <Dashboard  showToast={showToast} />;
    }
  };

  return (
    <ToastCtx.Provider value={showToast}>
      {/* Toast */}
      {toast && (
        <div style={{
          position:'fixed', top:16, left:'50%', transform:'translateX(-50%)',
          background:'var(--surface)', border:`1px solid ${toast.type==='ok'?'rgba(0,229,160,0.4)':toast.type==='err'?'rgba(255,77,109,0.4)':'rgba(79,140,255,0.4)'}`,
          padding:'8px 18px', borderRadius:20, fontSize:12, fontWeight:700,
          color: toast.type==='ok'?'var(--accent)':toast.type==='err'?'var(--danger)':'var(--accent2)',
          zIndex:9999, whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:8,
          animation:'fadeIn 0.2s ease',
        }}>{toast.msg}</div>
      )}

      <div style={{ display:'flex', flex:1, overflow:'hidden', height:'100%' }}>

        {/* SIDEBAR — tablet/desktop */}
        <nav style={{
          width:72, background:'var(--surface)', borderRight:'1px solid var(--border)',
          display:'flex', flexDirection:'column', alignItems:'center',
          padding:'12px 0', gap:4, flexShrink:0, overflowY:'auto',
        }} className="sidebar-nav">
          <div style={{
            fontFamily:'var(--font-head)', fontSize:10, fontWeight:800,
            color:'var(--accent)', writingMode:'vertical-rl', transform:'rotate(180deg)',
            letterSpacing:2, padding:'8px 0 14px', borderBottom:'1px solid var(--border)',
            marginBottom:6, width:'100%', textAlign:'center',
          }}>OTOMAT PRO</div>

          {SCREENS.map(s => (
            <button key={s.id} onClick={() => setScreen(s.id)} style={{
              width:52, height:52, borderRadius:14,
              border: screen===s.id ? '1px solid var(--accent)' : '1px solid transparent',
              background: screen===s.id ? 'rgba(0,229,160,0.12)' : 'transparent',
              color: screen===s.id ? 'var(--accent)' : 'var(--muted)',
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
              gap:3, fontSize:8.5, fontWeight:700, letterSpacing:0.2,
              transition:'all 0.18s', padding:'6px 4px',
            }}>
              <span style={{ fontSize:18, lineHeight:1 }}>{s.icon}</span>
              {s.label}
            </button>
          ))}

          {/* API status */}
          <div style={{ marginTop:'auto', paddingBottom:8, display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
            <div style={{
              width:7, height:7, borderRadius:'50%',
              background: apiOk===null ? 'var(--muted)' : apiOk ? 'var(--accent)' : 'var(--danger)',
              animation: apiOk ? 'pulse 2s infinite' : 'none',
            }} />
            <span style={{ fontSize:7, color:'var(--muted)' }}>API</span>
          </div>
        </nav>

        {/* MAIN */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

          {/* TOPBAR */}
          <div style={{
            background:'var(--surface)', borderBottom:'1px solid var(--border)',
            padding:'10px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0,
          }}>
            <div>
              <div style={{ fontFamily:'var(--font-head)', fontSize:16, fontWeight:700 }}>{current?.title}</div>
              <div style={{ fontSize:11, color:'var(--muted)', marginTop:1 }}>
                {apiOk===true ? '🟢 Supabase Bağlı' : apiOk===false ? '🔴 Supabase Bağlanamadı' : '⏳ Bağlanıyor...'}
              </div>
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <span style={{
                padding:'3px 8px', borderRadius:20, fontSize:10, fontWeight:700,
                fontFamily:'var(--font-mono)', background:'rgba(0,229,160,0.15)',
                color:'var(--accent)', border:'1px solid rgba(0,229,160,0.3)',
                animation:'pulse 2s infinite',
              }}>
                {apiOk ? '🟢 Canlı' : '🔴 Offline'}
              </span>
              <span style={{
                padding:'3px 8px', borderRadius:20, fontSize:10, fontWeight:700,
                fontFamily:'var(--font-mono)', background:'rgba(79,140,255,0.15)',
                color:'var(--accent2)', border:'1px solid rgba(79,140,255,0.3)',
              }}>
                {machineCount} Otomat
              </span>
            </div>
          </div>

          {/* CONTENT */}
          <div style={{ flex:1, overflowY:'auto', padding:16, WebkitOverflowScrolling:'touch' }}>
            {apiOk === false ? (
              <div style={{ textAlign:'center', padding:'60px 20px' }}>
                <div style={{ fontSize:48, marginBottom:16 }}>⚠️</div>
                <div style={{ fontFamily:'var(--font-head)', fontSize:18, fontWeight:700, marginBottom:8 }}>Supabase Bağlantısı Yok</div>
                <div style={{ color:'var(--muted)', fontSize:13, marginBottom:20 }}>
                  VITE_SUPABASE_URL veya VITE_SUPABASE_ANON_KEY eksik.
                </div>
                <div style={{
                  background:'var(--surface)', border:'1px solid var(--border)',
                  borderRadius:12, padding:16, textAlign:'left', fontSize:12,
                  fontFamily:'var(--font-mono)', color:'var(--accent2)', maxWidth:400, margin:'0 auto',
                }}>
                  <div>1. cd backend && npm install</div>
                  <div>2. cp .env.example .env</div>
                  <div>3. .env → DATABASE_URL doldur</div>
                  <div>4. npm run db:init</div>
                  <div>5. npm run dev</div>
                </div>
              </div>
            ) : renderPage()}
          </div>
        </div>
      </div>

      {/* BOTTOM NAV — mobile */}
      <style>{`
        @media (max-width: 640px) {
          .sidebar-nav { display: none !important; }
          .bottom-nav-mobile { display: flex !important; }
          div[style*="padding:16px"] { margin-bottom: calc(64px + var(--safe-bottom)); }
        }
      `}</style>
      <div className="bottom-nav-mobile" style={{
        display:'none', background:'var(--surface)', borderTop:'1px solid var(--border)',
        padding:`6px 0 calc(6px + var(--safe-bottom))`, justifyContent:'space-around',
        position:'fixed', bottom:0, left:0, right:0, zIndex:100,
        backdropFilter:'blur(20px)',
      }}>
        {SCREENS.slice(0, 5).map(s => (
          <button key={s.id} onClick={() => setScreen(s.id)} style={{
            display:'flex', flexDirection:'column', alignItems:'center', gap:2,
            padding:'6px 8px', borderRadius:12, border:'none',
            background:'transparent',
            color: screen===s.id ? 'var(--accent)' : 'var(--muted)',
            fontSize:9, fontWeight:700, minWidth:44,
          }}>
            <span style={{ fontSize:20, lineHeight:1 }}>{s.icon}</span>
            {s.label}
          </button>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
