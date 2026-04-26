// src/pages/Makinalar.jsx
import { useState, useEffect } from 'react';
import { api } from '../lib/api.js';

export default function Makinalar({ showToast }) {
  const [makinalar, setMakinalar] = useState([]);
  const [secili, setSecili]       = useState(null);
  const [makRapor, setMakRapor]   = useState(null);
  const [loading, setLoading]     = useState(true);

  const load = () => api.makinalar.list().then(setMakinalar).catch(e => showToast('❌ ' + e.message, 'err')).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const makSec = async (m) => {
    setSecili(m);
    try {
      const r = await api.raporlar.makina(m.num);
      setMakRapor(r);
    } catch (e) { setMakRapor(null); }
  };

  const guncelle = async (num, field, val) => {
    const m = makinalar.find(x => x.num === num);
    if (!m) return;
    const updated = { ...m, [field]: val };
    try {
      await api.makinalar.update(num, updated);
      setMakinalar(prev => prev.map(x => x.num === num ? updated : x));
      if (secili?.num === num) setSecili(updated);
    } catch (e) { showToast('❌ ' + e.message, 'err'); }
  };

  const ekle = async () => {
    try {
      const m = await api.makinalar.create({});
      setMakinalar(prev => [...prev, m]);
      showToast(`✅ Otomat #${m.num} eklendi`);
    } catch (e) { showToast('❌ ' + e.message, 'err'); }
  };

  const sil = async (num) => {
    if (!confirm(`Otomat #${num} silinecek. Emin misiniz?`)) return;
    try {
      await api.makinalar.delete(num);
      setMakinalar(prev => prev.filter(x => x.num !== num));
      if (secili?.num === num) setSecili(null);
      showToast(`🗑️ Otomat #${num} silindi`);
    } catch (e) { showToast('❌ ' + e.message, 'err'); }
  };

  const pctColor = (pct) => pct >= 70 ? 'var(--accent)' : pct >= 30 ? 'var(--warn)' : 'var(--danger)';
  const pctBg   = (pct) => pct >= 70 ? 'rgba(0,229,160,0.15)' : pct >= 30 ? 'rgba(255,209,102,0.15)' : 'rgba(255,77,109,0.15)';

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>Yükleniyor...</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: secili ? '1fr 340px' : '1fr', gap: 14 }}>
      <div>
        {/* Makina grid */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 14, fontWeight: 700 }}>
              Otomat Haritası ({makinalar.length})
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[
                { label: `${makinalar.filter(m => m.pct >= 70).length} Dolu`, color: 'var(--accent)', bg: 'rgba(0,229,160,0.15)' },
                { label: `${makinalar.filter(m => m.pct >= 30 && m.pct < 70).length} Orta`, color: 'var(--warn)', bg: 'rgba(255,209,102,0.15)' },
                { label: `${makinalar.filter(m => m.pct < 30).length} Kritik`, color: 'var(--danger)', bg: 'rgba(255,77,109,0.15)' },
              ].map((b, i) => (
                <span key={i} style={{ padding: '3px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)', background: b.bg, color: b.color }}>{b.label}</span>
              ))}
              <button onClick={ekle} style={{ padding: '4px 10px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#0d0f14', fontWeight: 700, fontSize: 11 }}>+ Ekle</button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(62px, 1fr))', gap: 6 }}>
            {makinalar.map(m => (
              <div key={m.num} onClick={() => makSec(m)} style={{
                aspectRatio: 1, borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s',
                border: `1.5px solid ${secili?.num === m.num ? 'var(--accent2)' : pctColor(m.pct)}`,
                background: secili?.num === m.num ? 'rgba(79,140,255,0.15)' : 'var(--surface2)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 1, position: 'relative',
              }}>
                <div style={{ position: 'absolute', top: 5, right: 5, width: 5, height: 5, borderRadius: '50%', background: pctColor(m.pct) }} />
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 600 }}>{m.num}</div>
                <div style={{ fontSize: 8, color: 'var(--muted)' }}>{m.pct}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Makina listesi tablosu */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 16 }}>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Otomat Listesi</div>
          <div style={{ overflowX: 'auto', maxHeight: 360, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>{['#', 'Konum', 'Fiyat Kademesi', 'Doluluk', 'Durum', ''].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '6px 10px', color: 'var(--muted)', fontSize: 10, fontWeight: 700, borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--surface)' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {makinalar.map(m => (
                  <tr key={m.num} style={{ background: secili?.num === m.num ? 'rgba(79,140,255,0.05)' : '' }}>
                    <td style={{ padding: '7px 10px', fontFamily: 'var(--font-mono)', color: 'var(--accent2)', fontWeight: 600 }}>#{m.num}</td>
                    <td style={{ padding: '7px 10px' }}>
                      <input defaultValue={m.loc} onBlur={e => guncelle(m.num, 'loc', e.target.value)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text)', fontSize: 12, outline: 'none', width: '100%' }} />
                    </td>
                    <td style={{ padding: '7px 10px' }}>
                      <select defaultValue={m.price_tier} onChange={e => guncelle(m.num, 'price_tier', e.target.value)}
                        style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 6px', color: 'var(--text)', fontSize: 11, outline: 'none' }}>
                        <option value="F1">F1 Standart</option>
                        <option value="F2">F2 Özel</option>
                        <option value="F3">F3 Premium</option>
                      </select>
                    </td>
                    <td style={{ padding: '7px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ flex: 1, background: 'var(--surface2)', borderRadius: 4, height: 6, overflow: 'hidden', minWidth: 60 }}>
                          <div style={{ width: `${m.pct}%`, height: '100%', borderRadius: 4, background: pctColor(m.pct), transition: 'width 0.4s' }} />
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: pctColor(m.pct), fontWeight: 600 }}>{m.pct}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '7px 10px' }}>
                      <span style={{ padding: '2px 7px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: pctBg(m.pct), color: pctColor(m.pct) }}>
                        {m.pct >= 70 ? '🟢 Normal' : m.pct >= 30 ? '🟡 Yenile' : '🔴 Kritik'}
                      </span>
                    </td>
                    <td style={{ padding: '7px 10px' }}>
                      <button onClick={() => sil(m.num)} style={{ padding: '3px 7px', borderRadius: 6, border: 'none', background: 'rgba(255,77,109,0.15)', color: 'var(--danger)', fontSize: 11, fontWeight: 700 }}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detay paneli */}
      {secili && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, height: 'fit-content' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 14, fontWeight: 700 }}>Makine #{secili.num}</div>
            <button onClick={() => setSecili(null)} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 18, cursor: 'pointer' }}>✕</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Konum', val: secili.loc },
              { label: 'Fiyat Kademesi', val: secili.price_tier },
              { label: 'Doluluk', val: `${secili.pct}%`, color: pctColor(secili.pct) },
              { label: 'Durum', val: secili.pct >= 70 ? '🟢 Normal' : secili.pct >= 30 ? '🟡 Yenilenmeli' : '🔴 Kritik' },
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>{row.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: row.color || 'var(--text)' }}>{row.val}</span>
              </div>
            ))}
          </div>
          {makRapor && makRapor.sayimlar.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>Son Sayımlar</div>
              {makRapor.sayimlar.slice(0, 5).map((s, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 11, borderBottom: '1px solid rgba(42,48,68,0.5)' }}>
                  <span style={{ color: 'var(--muted)' }}>{new Date(s.gun).toLocaleDateString('tr-TR')}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>₺{parseFloat(s.ciro || 0).toFixed(0)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
