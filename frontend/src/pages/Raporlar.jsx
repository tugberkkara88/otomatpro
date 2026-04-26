// src/pages/Raporlar.jsx
import { useState, useEffect } from 'react';
import { api } from '../lib/api.js';

export default function Raporlar({ showToast }) {
  const [dash, setDash]     = useState(null);
  const [abc, setAbc]       = useState([]);
  const [tab, setTab]       = useState('ozet');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.raporlar.dashboard(), api.raporlar.abc()])
      .then(([d, a]) => { setDash(d); setAbc(a); })
      .catch(e => showToast('❌ ' + e.message, 'err'))
      .finally(() => setLoading(false));
  }, []);

  const exportJSON = () => {
    const data = { dash, abc, tarih: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `otomatpro-rapor-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    showToast('📤 Rapor indirildi');
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>Yükleniyor...</div>;

  const tabs = [
    { id: 'ozet', label: '📊 Özet' },
    { id: 'abc',  label: '🏷️ ABC Analizi' },
    { id: 'maliyet', label: '💸 Giderler' },
  ];

  return (
    <div>
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 3, marginBottom: 16, background: 'var(--surface)', border: '1px solid var(--border)', padding: 3, borderRadius: 12, overflowX: 'auto' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, border: 'none',
            background: tab === t.id ? 'var(--surface2)' : 'transparent',
            color: tab === t.id ? 'var(--text)' : 'var(--muted)', whiteSpace: 'nowrap',
          }}>{t.label}</button>
        ))}
        <button onClick={exportJSON} style={{ marginLeft: 'auto', padding: '7px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, border: '1px solid var(--border)', background: 'transparent', color: 'var(--accent2)' }}>📤 JSON</button>
      </div>

      {tab === 'ozet' && dash && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 14 }}>
            {[
              { label: 'Aylık Ciro',   val: `₺${parseFloat(dash.finansal.ciro||0).toLocaleString('tr-TR',{maximumFractionDigits:0})}`,    color: 'var(--accent)' },
              { label: 'Brüt Kâr',    val: `₺${parseFloat(dash.finansal.kar||0).toLocaleString('tr-TR',{maximumFractionDigits:0})}`,      color: 'var(--accent2)' },
              { label: 'Net Kâr',     val: `₺${parseFloat(dash.finansal.net_kar||0).toLocaleString('tr-TR',{maximumFractionDigits:0})}`,  color: 'var(--warn)' },
              { label: 'Toplam Gider',val: `₺${parseFloat(dash.finansal.gider||0).toLocaleString('tr-TR',{maximumFractionDigits:0})}`,    color: 'var(--danger)' },
              { label: 'Kâr Marjı',   val: `%${dash.finansal.marj}`,                                                                        color: 'var(--accent3)' },
              { label: 'Açık Arıza',  val: dash.arizalar.acik,                                                                               color: 'var(--warn)' },
            ].map((k, i) => (
              <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px' }}>
                <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>{k.label}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 600, color: k.color }}>{k.val}</div>
              </div>
            ))}
          </div>

          {/* Makina özeti */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 16 }}>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Otomat Durumu (Son 30 gün)</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
              {[
                { label: 'Toplam',  val: dash.makinalar.toplam,  color: 'var(--text)' },
                { label: 'Dolu',    val: dash.makinalar.dolu,    color: 'var(--accent)' },
                { label: 'Orta',    val: dash.makinalar.orta,    color: 'var(--warn)' },
                { label: 'Kritik',  val: dash.makinalar.bos,     color: 'var(--danger)' },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: 'center', padding: 12, background: 'var(--surface2)', borderRadius: 10 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 600, color: s.color }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'abc' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 16 }}>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 14, fontWeight: 700, marginBottom: 12 }}>ABC Analizi — Stok Dağılımı</div>
          <div style={{ overflowX: 'auto', maxHeight: 480, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>{['Ürün', 'Stok', 'Değer', 'Kümülatif %', 'ABC'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '6px 10px', color: 'var(--muted)', fontSize: 10, fontWeight: 700, borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--surface)' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {abc.map((u, i) => (
                  <tr key={i}>
                    <td style={{ padding: '7px 10px', fontWeight: 600, fontSize: 11 }}>{u.name}</td>
                    <td style={{ padding: '7px 10px', fontFamily: 'var(--font-mono)' }}>{parseInt(u.stock).toLocaleString('tr')}</td>
                    <td style={{ padding: '7px 10px', fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>₺{parseFloat(u.deger || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</td>
                    <td style={{ padding: '7px 10px', fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>%{u.cumPct}</td>
                    <td style={{ padding: '7px 10px' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                        background: u.hesap_abc === 'A' ? 'rgba(0,229,160,0.15)' : u.hesap_abc === 'B' ? 'rgba(79,140,255,0.15)' : 'rgba(255,209,102,0.15)',
                        color: u.hesap_abc === 'A' ? 'var(--accent)' : u.hesap_abc === 'B' ? 'var(--accent2)' : 'var(--warn)',
                      }}>{u.hesap_abc}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'maliyet' && <MaliyetTab showToast={showToast} />}
    </div>
  );
}

function MaliyetTab({ showToast }) {
  const [maliyetler, setMaliyetler] = useState([]);
  const [form, setForm] = useState({ tip: 'bakim', tutar: '', aciklama: '' });

  const TIPLER = {
    bakim: '🔧 Bakım', elektrik: '⚡ Elektrik', kira: '🏢 Kira',
    personel: '👤 Personel', nakliye: '🚚 Nakliye', diger: '📋 Diğer'
  };

  const load = () => api.maliyetler.list().then(setMaliyetler).catch(e => showToast('❌ ' + e.message, 'err'));
  useEffect(() => { load(); }, []);

  const kaydet = async () => {
    if (!form.tutar) return showToast('❌ Tutar gerekli', 'err');
    try {
      await api.maliyetler.create({ tip: form.tip, tutar: +form.tutar, aciklama: form.aciklama });
      showToast('✅ Gider kaydedildi');
      setForm(f => ({ ...f, tutar: '', aciklama: '' }));
      load();
    } catch (e) { showToast('❌ ' + e.message, 'err'); }
  };

  const sil = async (id) => {
    try { await api.maliyetler.delete(id); load(); showToast('🗑️ Silindi'); }
    catch (e) { showToast('❌ ' + e.message, 'err'); }
  };

  const toplam = maliyetler.reduce((s, m) => s + parseFloat(m.tutar || 0), 0);

  return (
    <div>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, marginBottom: 14 }}>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Gider Ekle</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr auto', gap: 8 }}>
          <select value={form.tip} onChange={e => setForm(f => ({ ...f, tip: e.target.value }))}
            style={{ background: 'var(--surface2)', border: '1.5px solid var(--border)', borderRadius: 10, padding: '10px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', WebkitAppearance: 'none' }}>
            {Object.entries(TIPLER).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input type="number" placeholder="₺ Tutar" value={form.tutar} onChange={e => setForm(f => ({ ...f, tutar: e.target.value }))}
            style={{ background: 'var(--surface2)', border: '1.5px solid var(--border)', borderRadius: 10, padding: '10px 12px', color: 'var(--text)', fontSize: 13, outline: 'none' }} />
          <input placeholder="Açıklama (opsiyonel)" value={form.aciklama} onChange={e => setForm(f => ({ ...f, aciklama: e.target.value }))}
            style={{ background: 'var(--surface2)', border: '1.5px solid var(--border)', borderRadius: 10, padding: '10px 12px', color: 'var(--text)', fontSize: 13, outline: 'none' }} />
          <button onClick={kaydet} style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: 'var(--accent)', color: '#0d0f14', fontWeight: 700 }}>+</button>
        </div>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 14, fontWeight: 700 }}>Gider Geçmişi</div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: 'var(--danger)' }}>
            Toplam: ₺{toplam.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
          </span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>{['Tip', 'Tutar', 'Açıklama', 'Tarih', ''].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '6px 10px', color: 'var(--muted)', fontSize: 10, fontWeight: 700, borderBottom: '1px solid var(--border)' }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {maliyetler.length === 0
              ? <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>Gider kaydı yok</td></tr>
              : maliyetler.map(m => (
                <tr key={m.id}>
                  <td style={{ padding: '7px 10px' }}><span style={{ fontWeight: 700, fontSize: 11 }}>{TIPLER[m.tip] || m.tip}</span></td>
                  <td style={{ padding: '7px 10px', fontFamily: 'var(--font-mono)', color: 'var(--danger)', fontWeight: 700 }}>₺{parseFloat(m.tutar).toFixed(2)}</td>
                  <td style={{ padding: '7px 10px', color: 'var(--muted)', fontSize: 11 }}>{m.aciklama || '—'}</td>
                  <td style={{ padding: '7px 10px', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>{new Date(m.tarih).toLocaleDateString('tr-TR')}</td>
                  <td style={{ padding: '7px 10px' }}>
                    <button onClick={() => sil(m.id)} style={{ padding: '3px 7px', borderRadius: 6, border: 'none', background: 'rgba(255,77,109,0.15)', color: 'var(--danger)', fontSize: 11, fontWeight: 700 }}>🗑️</button>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}
