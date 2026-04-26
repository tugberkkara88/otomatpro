// src/pages/Ayarlar.jsx
import { useState, useEffect } from 'react';
import { api } from '../lib/api.js';
/* ─────────────────────────────────────────────────
   Ayarlar.jsx içindeki tema bölümü için örnek kod
   ───────────────────────────────────────────────── */

import { useTheme } from '../components/ThemePicker';

// Ayarlar bileşeninin içinde:
function TemaAyarlari() {
  const { theme, setTheme, themes } = useTheme();

  return (
    <section style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '24px',
      marginBottom: '20px',
    }}>
      <h2 style={{
        fontSize: '16px',
        fontWeight: 600,
        color: 'var(--text-primary)',
        margin: '0 0 6px',
      }}>🎨 Görünüm Teması</h2>
      <p style={{
        fontSize: '13px',
        color: 'var(--text-secondary)',
        margin: '0 0 20px',
      }}>
        Arayüzün renk temasını seçin. Tercih tarayıcıda saklanır.
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: '12px',
      }}>
        {themes.map(t => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              padding: '14px',
              background: theme === t.id ? 'var(--nav-active-bg)' : 'var(--bg-secondary)',
              border: `1.5px solid ${theme === t.id ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: 'inherit',
              textAlign: 'left',
            }}
          >
            {/* Büyük önizleme */}
            <div style={{
              width: '100%',
              height: '48px',
              borderRadius: '8px',
              background: t.bg,
              border: '1px solid rgba(255,255,255,0.08)',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Sahte kenar çubuğu */}
              <div style={{
                position: 'absolute',
                left: 0, top: 0, bottom: 0,
                width: '28%',
                background: t.dark
                  ? 'rgba(0,0,0,0.3)'
                  : 'rgba(0,0,0,0.05)',
              }} />
              {/* Vurgu çizgisi */}
              <div style={{
                position: 'absolute',
                left: '32%',
                right: '8%',
                bottom: '8px',
                height: '4px',
                borderRadius: '2px',
                background: t.accent,
              }} />
              {/* Sahte içerik çizgileri */}
              {[24, 16].map((w, i) => (
                <div key={i} style={{
                  position: 'absolute',
                  left: '32%',
                  top: `${10 + i * 9}px`,
                  width: `${w}%`,
                  height: '3px',
                  borderRadius: '2px',
                  background: t.dark
                    ? 'rgba(255,255,255,0.12)'
                    : 'rgba(0,0,0,0.1)',
                }} />
              ))}
            </div>

            {/* İsim ve aktif badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{
                fontSize: '13px',
                fontWeight: 600,
                color: theme === t.id ? 'var(--accent)' : 'var(--text-primary)',
              }}>
                {t.label}
              </span>
              {theme === t.id && (
                <span style={{
                  fontSize: '10px',
                  background: 'var(--accent)',
                  color: '#000',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontWeight: 700,
                }}>✓</span>
              )}
            </div>

            {/* Açık/Koyu etiketi */}
            <span style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
            }}>
              {t.dark ? '🌙 Koyu' : '☀️ Açık'}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

export default function Ayarlar({ showToast, machineCount }) {
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
