// src/pages/Transfer.jsx
import { useState, useEffect } from 'react';
import { api } from '../lib/api.js';

export default function Transfer({ showToast }) {
  const [urunler, setUrunler]   = useState([]);
  const [makinalar, setMakinalar] = useState([]);
  const [liste, setListe]       = useState([]);
  const [kaynak, setKaynak]     = useState('depot');
  const [hedef, setHedef]       = useState('truck');
  const [selUrun, setSelUrun]   = useState('');
  const [miktar, setMiktar]     = useState('');
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    Promise.all([api.urunler.list(), api.makinalar.list()])
      .then(([u, m]) => {
        setUrunler(u);
        setMakinalar(m);
        if (u.length) setSelUrun(u[0].id);
      })
      .catch(e => showToast('❌ ' + e.message, 'err'));
  }, []);

  const hedefOptions = [
    { value: 'depot', label: '🏭 Ana Depo' },
    { value: 'truck', label: '🚚 Araç Deposu' },
    ...makinalar.map(m => ({ value: `m${m.num}`, label: `🏪 Otomat #${m.num} — ${m.loc}` }))
  ];

  const ekle = () => {
    if (!selUrun || !miktar) return showToast('❌ Ürün ve miktar gerekli', 'err');
    const u = urunler.find(x => x.id == selUrun);
    if (!u) return;
    if (liste.find(i => i.id == selUrun)) return showToast('⚠️ Bu ürün zaten listede', 'err');
    setListe(l => [...l, { id: u.id, name: u.name, miktar: +miktar }]);
    setMiktar('');
  };

  const cikar = (id) => setListe(l => l.filter(i => i.id !== id));

  const tamamla = async () => {
    if (!liste.length) return showToast('❌ Listeye ürün ekleyin', 'err');
    if (kaynak === hedef) return showToast('❌ Kaynak ve hedef aynı olamaz', 'err');
    setLoading(true);
    try {
      await api.stok.transfer({ transferler: liste.map(i => ({ urun_id: i.id, miktar: i.miktar })), kaynak, hedef });
      showToast(`✅ Transfer tamamlandı → ${hedefOptions.find(h => h.value === hedef)?.label}`);
      setListe([]);
      const u = await api.urunler.list();
      setUrunler(u);
    } catch (e) { showToast('❌ ' + e.message, 'err'); }
    finally { setLoading(false); }
  };

  const sel = (val, onChange) => ({
    value: val, onChange: e => onChange(e.target.value),
    style: { background: 'transparent', border: 'none', fontWeight: 700, color: 'var(--accent)', textAlign: 'center', padding: 0, fontSize: 12, outline: 'none', width: '100%' }
  });

  return (
    <div>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, marginBottom: 14 }}>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>Transfer İşlemi</div>

        {/* Kaynak → Hedef */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, background: 'var(--surface2)', padding: 10, borderRadius: 12 }}>
          <div style={{ flex: 1, textAlign: 'center', padding: 8, borderRadius: 8, background: 'rgba(79,140,255,0.1)', border: '1.5px solid var(--accent2)' }}>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 3 }}>KAYNAK</div>
            <select value={kaynak} onChange={e => setKaynak(e.target.value)} style={{ background: 'transparent', border: 'none', fontWeight: 700, color: 'var(--accent2)', textAlign: 'center', fontSize: 12, outline: 'none', width: '100%' }}>
              <option value="depot">🏭 Ana Depo</option>
              <option value="truck">🚚 Araç Deposu</option>
            </select>
          </div>
          <div style={{ fontSize: 24, color: 'var(--muted)' }}>→</div>
          <div style={{ flex: 1, textAlign: 'center', padding: 8, borderRadius: 8, background: 'rgba(0,229,160,0.1)', border: '1.5px solid var(--accent)' }}>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 3 }}>HEDEF</div>
            <select value={hedef} onChange={e => setHedef(e.target.value)} style={{ background: 'transparent', border: 'none', fontWeight: 700, color: 'var(--accent)', textAlign: 'center', fontSize: 12, outline: 'none', width: '100%' }}>
              {hedefOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Ürün ekle */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: 8, marginBottom: 10 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Ürün</label>
            <select value={selUrun} onChange={e => setSelUrun(e.target.value)} style={{ width: '100%', background: 'var(--surface2)', border: '1.5px solid var(--border)', borderRadius: 10, padding: '10px 12px', color: 'var(--text)', fontSize: 12, outline: 'none', WebkitAppearance: 'none' }}>
              {urunler.map(u => <option key={u.id} value={u.id}>{u.name} (Stok: {u.stock})</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Miktar</label>
            <input value={miktar} onChange={e => setMiktar(e.target.value)} type="number" placeholder="0"
              style={{ width: '100%', background: 'var(--surface2)', border: '1.5px solid var(--border)', borderRadius: 10, padding: '10px 12px', color: 'var(--text)', fontSize: 13, outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button onClick={ekle} style={{ padding: '11px 14px', borderRadius: 10, border: 'none', background: 'var(--accent2)', color: '#fff', fontWeight: 700 }}>+ Ekle</button>
          </div>
        </div>

        {/* Transfer listesi */}
        {liste.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            {liste.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: 'var(--surface2)', borderRadius: 8, marginBottom: 6 }}>
                <span style={{ flex: 1, fontSize: 12 }}>{item.name}</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent2)', fontSize: 12 }}>{item.miktar} adet</span>
                <button onClick={() => cikar(item.id)} style={{ padding: '3px 8px', borderRadius: 6, border: 'none', background: 'rgba(255,77,109,0.15)', color: 'var(--danger)', fontSize: 11, fontWeight: 700 }}>✕</button>
              </div>
            ))}
          </div>
        )}

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '14px 0' }} />
        <button onClick={tamamla} disabled={loading || !liste.length} style={{
          width: '100%', padding: 12, borderRadius: 10, border: 'none',
          background: liste.length ? 'var(--accent2)' : 'var(--surface2)',
          color: liste.length ? '#fff' : 'var(--muted)', fontWeight: 700, fontSize: 13,
        }}>
          {loading ? '⏳...' : `🚀 Transferi Tamamla (${liste.length} ürün)`}
        </button>
      </div>

      {/* Depo durumu */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 16 }}>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 14, fontWeight: 700, marginBottom: 12 }}>📦 Ana Depo Durumu</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>{['Ürün', 'Stok', 'Durum'].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '6px 10px', color: 'var(--muted)', fontSize: 10, fontWeight: 700, borderBottom: '1px solid var(--border)' }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {urunler.length === 0
              ? <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>Ürün yok</td></tr>
              : urunler.map(u => {
                const pct = Math.min(100, (u.stock / 1000) * 100);
                const cls = pct > 50 ? 'var(--accent)' : pct > 20 ? 'var(--warn)' : 'var(--danger)';
                return (
                  <tr key={u.id}>
                    <td style={{ padding: '8px 10px', fontSize: 11 }}>{u.name}</td>
                    <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)', color: 'var(--accent2)', fontWeight: 600 }}>{u.stock}</td>
                    <td style={{ padding: '8px 10px', width: 100 }}>
                      <div style={{ background: 'var(--surface2)', borderRadius: 4, height: 5, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 4, background: cls, transition: 'width 0.4s' }} />
                      </div>
                    </td>
                  </tr>
                );
              })
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}
