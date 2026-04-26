// src/pages/Ayarlar.jsx
import { useState, useEffect } from 'react';
import { api } from '../lib/api.js';

const THEMES = [
  // Koyu temalar
  { id: 'emerald',  label: 'Emerald',  accent: '#00e5a0', bg: '#0d0f14',  dark: true  },
  { id: 'ocean',    label: 'Ocean',    accent: '#38bdf8', bg: '#060e1a',  dark: true  },
  { id: 'sunset',   label: 'Sunset',   accent: '#fb923c', bg: '#110a00',  dark: true  },
  { id: 'violet',   label: 'Violet',   accent: '#a78bfa', bg: '#0c0a18',  dark: true  },
  { id: 'rose',     label: 'Rose',     accent: '#f472b6', bg: '#110810',  dark: true  },
  { id: 'arctic',   label: 'Arctic',   accent: '#67e8f9', bg: '#050f18',  dark: true  },
  { id: 'lava',     label: 'Lava',     accent: '#ff4500', bg: '#120400',  dark: true  },
  { id: 'forest',   label: 'Forest',   accent: '#4ade80', bg: '#020e06',  dark: true  },
  { id: 'midnight', label: 'Midnight', accent: '#ffffff', bg: '#000000',  dark: true  },
  { id: 'sakura',   label: 'Sakura',   accent: '#fda4af', bg: '#0f080d',  dark: true  },
  { id: 'coffee',   label: 'Coffee',   accent: '#d97706', bg: '#0e0a06',  dark: true  },
  { id: 'neon',     label: 'Neon',     accent: '#00ffcc', bg: '#000510',  dark: true  },
  // Açık tema
  { id: 'graphite', label: 'Graphite', accent: '#6366f1', bg: '#f0f2f5',  dark: false },
];

export default function Ayarlar({ showToast, machineCount, theme, setTheme }) {
  const [makinalar, setMakinalar] = useState([]);
  const [urunSayisi, setUrunSayisi] = useState(0);

  useEffect(() => {
    Promise.all([api.makinalar.list(), api.urunler.list()])
      .then(([m, u]) => { setMakinalar(m); setUrunSayisi(u.length); })
      .catch(e => showToast('❌ ' + e.message, 'err'));
  }, []);

  const exportData = async () => {
    try {
      const [urunler, makine, stok, sayim, maliyet, ariza] = await Promise.all([
        api.urunler.list(), api.makinalar.list(), api.stok.list({ limit: 9999 }),
        api.sayimlar.list({ limit: 9999 }), api.maliyetler.list({ limit: 9999 }),
        api.arizalar.list({}),
      ]);
      const blob = new Blob([JSON.stringify({ urunler, makine, stok, sayim, maliyet, ariza, tarih: new Date().toISOString() }, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `otomatpro-yedek-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      showToast('📤 Tüm veriler indirildi');
    } catch (e) { showToast('❌ ' + e.message, 'err'); }
  };

  return (
    <div>
      {/* Tema Seçici */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, marginBottom: 14 }}>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>🎨 Tema</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
          {THEMES.map(t => {
            const active = theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => { setTheme(t.id); showToast(`🎨 ${t.label} teması uygulandı`); }}
                style={{
                  position: 'relative',
                  background: t.bg,
                  border: active ? `2px solid ${t.accent}` : '2px solid transparent',
                  borderRadius: 12,
                  padding: '12px 12px 10px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  outline: 'none',
                  boxShadow: active ? `0 0 0 1px ${t.accent}40` : 'none',
                }}
              >
                {/* Preview bar */}
                <div style={{ height: 4, borderRadius: 4, background: t.accent, marginBottom: 10, width: '80%', opacity: 0.9 }} />
                {/* Label */}
                <div style={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 12, fontWeight: 700,
                  color: t.dark ? '#e8eaf2' : '#111827',
                  marginBottom: 3,
                }}>{t.label}</div>
                <div style={{ fontSize: 10, color: t.dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', gap: 3 }}>
                  {t.dark ? '🌙' : '☀️'} {t.dark ? 'Koyu' : 'Açık'}
                </div>
                {/* Active check */}
                {active && (
                  <div style={{
                    position: 'absolute', top: 8, right: 8,
                    width: 18, height: 18, borderRadius: '50%',
                    background: t.accent,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10,
                  }}>✓</div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sistem bilgisi */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, marginBottom: 14 }}>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>⚙️ Sistem Bilgisi</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
          {[
            { label: 'Toplam Ürün',   val: urunSayisi,    color: 'var(--accent)' },
            { label: 'Toplam Otomat', val: makinalar.length, color: 'var(--accent2)' },
            { label: 'Versiyon',      val: 'v2.0',         color: 'var(--warn)' },
          ].map((k, i) => (
            <div key={i} style={{ textAlign: 'center', padding: 14, background: 'var(--surface2)', borderRadius: 12 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 600, color: k.color }}>{k.val}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{k.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* API Bağlantı bilgisi */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, marginBottom: 14 }}>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>🔌 API & Veritabanı</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { label: 'Supabase URL',    val: import.meta.env.VITE_API_URL || 'http://localhost:4000' },
            { label: 'Veritabanı',     val: 'Supabase (PostgreSQL)' },
            { label: 'Auth',           val: 'Yok (iç ağ)' },
          ].map((row, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>{row.label}</span>
              <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--accent2)' }}>{row.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Makina listesi */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, marginBottom: 14 }}>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>🏪 Otomat Ayarları</div>
        <div style={{ overflowX: 'auto', maxHeight: 300, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>{['#', 'Konum', 'Fiyat Kademesi'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '6px 10px', color: 'var(--muted)', fontSize: 10, fontWeight: 700, borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--surface)' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {makinalar.map(m => (
                <tr key={m.num}>
                  <td style={{ padding: '6px 10px', fontFamily: 'var(--font-mono)', color: 'var(--accent2)' }}>#{m.num}</td>
                  <td style={{ padding: '6px 10px' }}>
                    <input defaultValue={m.loc}
                      onBlur={async e => {
                        try { await api.makinalar.update(m.num, { ...m, loc: e.target.value }); }
                        catch (err) { showToast('❌ ' + err.message, 'err'); }
                      }}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text)', fontSize: 12, outline: 'none', width: '100%' }} />
                  </td>
                  <td style={{ padding: '6px 10px' }}>
                    <select defaultValue={m.price_tier}
                      onChange={async e => {
                        try { await api.makinalar.update(m.num, { ...m, price_tier: e.target.value }); }
                        catch (err) { showToast('❌ ' + err.message, 'err'); }
                      }}
                      style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 6px', color: 'var(--text)', fontSize: 11, outline: 'none' }}>
                      <option value="F1">F1 Standart</option>
                      <option value="F2">F2 Özel</option>
                      <option value="F3">F3 Premium</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Veri yönetimi */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 16 }}>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>💾 Veri Yönetimi</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={exportData} style={{
            flex: 1, padding: 12, borderRadius: 10, border: '1px solid var(--accent2)',
            background: 'rgba(79,140,255,0.1)', color: 'var(--accent2)', fontWeight: 700, fontSize: 13,
          }}>📤 Tüm Verileri İndir (JSON)</button>
        </div>
        <div style={{ marginTop: 10, padding: 12, background: 'rgba(255,209,102,0.08)', border: '1px solid rgba(255,209,102,0.2)', borderRadius: 10, fontSize: 12, color: 'var(--warn)' }}>
          ℹ️ Veriler PostgreSQL'de güvenle saklanmaktadır. Supabase'in ücretsiz planında disk kalıcıdır ancak 500MB depolama ve 2GB bant genişliği limitli.
        </div>
      </div>
    </div>
  );
}
