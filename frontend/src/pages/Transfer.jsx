// src/pages/Transfer.jsx
import { useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import { useBarcodeScanner, BarcodeModal, ScanBtn } from '../lib/useBarcode.jsx';

export default function Transfer({ showToast }) {
  const [urunler, setUrunler]     = useState([]);
  const [makinalar, setMakinalar] = useState([]);
  const [liste, setListe]         = useState([]);
  const [kaynak, setKaynak]       = useState('depot');
  const [hedef, setHedef]         = useState('truck');
  const [selUrun, setSelUrun]     = useState('');
  const [miktar, setMiktar]       = useState('');
  const [loading, setLoading]     = useState(false);

  useEffect(() => {
    Promise.all([api.urunler.list(), api.makinalar.list()])
      .then(([u, m]) => {
        setUrunler(u); setMakinalar(m);
        if (u.length) setSelUrun(u[0].id);
      })
      .catch(e => showToast('❌ ' + e.message, 'err'));
  }, []);

  const hedefOptions = [
    { value:'depot', label:'🏭 Ana Depo' },
    { value:'truck', label:'🚚 Araç Deposu' },
    ...makinalar.map(m => ({ value:`m${m.num}`, label:`🏪 Otomat #${m.num} — ${m.loc}` }))
  ];

  // ── Seçili ürün + kaynak depodaki stok bilgisi ──────────────────────────
  const secilenUrun = urunler.find(x => x.id == selUrun);

  // Stok hesabı: depoya göre farklı alan göster
  // Şu an API'da her ürünün "stock" = Ana Depo stoku
  // truck/makina stoku için stok_hareketleri'nden hesaplanır (basit gösterim)
  const getKaynakStok = (u) => {
    if (!u) return null;
    if (kaynak === 'depot') return { label:'Ana Depo', stok: u.stock ?? 0, color: u.stock < 10 ? 'var(--danger)' : u.stock < 50 ? 'var(--warn)' : 'var(--accent)' };
    if (kaynak === 'truck') return { label:'Araç Deposu', stok: u.truck_stock ?? '?', color: 'var(--accent2)' };
    const num = kaynak.replace('m','');
    const mak = makinalar.find(m => String(m.num) === num);
    return { label: `Otomat #${num}${mak?' — '+mak.loc:''}`, stok: '?', color: 'var(--accent2)' };
  };
  const kaynakStok = getKaynakStok(secilenUrun);

  // ── Barkod tarayıcı: barkodla ürün seç ──────────────────────────────────
  const scanner = useBarcodeScanner({
    onDetected: (barcode) => {
      const found = urunler.find(u => u.barcode === barcode);
      if (found) { setSelUrun(found.id); showToast('✅ ' + found.name + ' seçildi'); }
      else showToast('⚠️ Barkod bulunamadı: ' + barcode, 'warn');
    },
  });

  const ekle = () => {
    if (!selUrun || !miktar) return showToast('❌ Ürün ve miktar gerekli', 'err');
    const u = urunler.find(x => x.id == selUrun);
    if (!u) return;
    if (liste.find(i => i.id == selUrun)) return showToast('⚠️ Bu ürün zaten listede', 'err');

    // Kaynak depoda yeterli stok kontrolü (yalnızca depot için kesin bilgi var)
    if (kaynak === 'depot' && +miktar > (u.stock ?? 0)) {
      showToast(`⚠️ Yetersiz stok! Ana Depoda: ${u.stock} adet`, 'warn');
    }

    setListe(l => [...l, { id:u.id, name:u.name, barcode:u.barcode||'', miktar:+miktar,
      kaynakStok: kaynak==='depot' ? u.stock : '?' }]);
    setMiktar('');
  };

  const cikar = (id) => setListe(l => l.filter(i => i.id !== id));

  const tamamla = async () => {
    if (!liste.length) return showToast('❌ Listeye ürün ekleyin', 'err');
    if (kaynak === hedef) return showToast('❌ Kaynak ve hedef aynı olamaz', 'err');
    setLoading(true);
    try {
      await api.stok.transfer({ transferler: liste.map(i => ({ urun_id:i.id, miktar:i.miktar })), kaynak, hedef });
      showToast(`✅ Transfer tamamlandı → ${hedefOptions.find(h => h.value===hedef)?.label}`);
      setListe([]);
      const u = await api.urunler.list(); setUrunler(u);
    } catch(e) { showToast('❌ ' + e.message, 'err'); }
    finally { setLoading(false); }
  };

  const inputStyle = { background:'var(--surface2)', border:'1.5px solid var(--border)', borderRadius:10, padding:'10px 12px', color:'var(--text)', fontSize:12, outline:'none', width:'100%', WebkitAppearance:'none' };

  return (
    <div>
      <BarcodeModal scanner={scanner} title="Transfer Ürünü Tara" />

      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:16, marginBottom:14 }}>
        <div style={{ fontFamily:'var(--font-head)', fontSize:11, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:1, marginBottom:14 }}>
          🔄 Transfer İşlemi
        </div>

        {/* Kaynak → Hedef */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16, background:'var(--surface2)', padding:10, borderRadius:12 }}>
          <div style={{ flex:1, textAlign:'center', padding:8, borderRadius:8, background:'rgba(79,140,255,0.1)', border:'1.5px solid var(--accent2)' }}>
            <div style={{ fontSize:10, color:'var(--muted)', marginBottom:3 }}>KAYNAK</div>
            <select value={kaynak} onChange={e => setKaynak(e.target.value)} style={{ background:'transparent', border:'none', fontWeight:700, color:'var(--accent2)', textAlign:'center', fontSize:12, outline:'none', width:'100%' }}>
              <option value="depot">🏭 Ana Depo</option>
              <option value="truck">🚚 Araç Deposu</option>
              {makinalar.map(m => <option key={m.num} value={`m${m.num}`}>🏪 Otomat #{m.num}</option>)}
            </select>
          </div>
          <div style={{ fontSize:24, color:'var(--muted)' }}>→</div>
          <div style={{ flex:1, textAlign:'center', padding:8, borderRadius:8, background:'rgba(0,229,160,0.1)', border:'1.5px solid var(--accent)' }}>
            <div style={{ fontSize:10, color:'var(--muted)', marginBottom:3 }}>HEDEF</div>
            <select value={hedef} onChange={e => setHedef(e.target.value)} style={{ background:'transparent', border:'none', fontWeight:700, color:'var(--accent)', textAlign:'center', fontSize:12, outline:'none', width:'100%' }}>
              {hedefOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Ürün seçimi — barkod butonlu */}
        <div style={{ marginBottom:8 }}>
          <label style={{ fontSize:11, fontWeight:700, color:'var(--muted)', display:'block', marginBottom:4 }}>Ürün</label>
          <div style={{ display:'flex', gap:6 }}>
            <select value={selUrun} onChange={e => setSelUrun(e.target.value)} style={{ ...inputStyle, flex:1 }}>
              {urunler.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <ScanBtn onClick={scanner.open} />
          </div>

          {/* ── Kaynak depodaki stok bilgisi ─────────────────────────────── */}
          {secilenUrun && kaynakStok && (
            <div style={{ marginTop:8, padding:'10px 14px', borderRadius:10, background:'rgba(0,0,0,0.2)', border:'1px solid var(--border)', display:'flex', gap:16, flexWrap:'wrap', alignItems:'center' }}>
              <div style={{ fontSize:11, color:'var(--muted)' }}>
                📍 <b style={{ color:'var(--text)' }}>{kaynakStok.label}</b> stoku:
              </div>
              <div style={{ fontFamily:'var(--font-mono)', fontWeight:800, fontSize:18, color:kaynakStok.color }}>
                {kaynakStok.stok}
                <span style={{ fontFamily:'inherit', fontSize:11, fontWeight:400, color:'var(--muted)', marginLeft:4 }}> adet</span>
              </div>
              {kaynak === 'depot' && secilenUrun.stock < 10 && (
                <span style={{ padding:'2px 8px', borderRadius:6, background:'rgba(255,77,109,0.15)', color:'var(--danger)', fontSize:10, fontWeight:700 }}>⚠️ Kritik Stok</span>
              )}
              <div style={{ marginLeft:'auto', fontSize:11, color:'var(--muted)' }}>
                Barkod: <span style={{ fontFamily:'var(--font-mono)', color:'var(--text)' }}>{secilenUrun.barcode||'—'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Miktar */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:8, marginBottom:10 }}>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:'var(--muted)', display:'block', marginBottom:4 }}>Miktar</label>
            <input value={miktar} onChange={e => setMiktar(e.target.value)} type="number" placeholder="0"
              style={{ ...inputStyle, WebkitAppearance:'none' }}
              onKeyDown={e => e.key === 'Enter' && ekle()} />
          </div>
          <div style={{ display:'flex', alignItems:'flex-end' }}>
            <button onClick={ekle} style={{ padding:'11px 18px', borderRadius:10, border:'none', background:'var(--accent2)', color:'#fff', fontWeight:700, whiteSpace:'nowrap' }}>
              + Ekle
            </button>
          </div>
        </div>

        {/* Transfer listesi */}
        {liste.length > 0 && (
          <div style={{ marginBottom:12, background:'var(--surface2)', borderRadius:10, padding:10 }}>
            <div style={{ fontSize:10, fontWeight:700, color:'var(--muted)', marginBottom:8, fontFamily:'var(--font-head)', textTransform:'uppercase', letterSpacing:1 }}>
              Transfer Listesi ({liste.length} ürün)
            </div>
            {liste.map((item, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px', background:'var(--surface)', borderRadius:8, marginBottom:6 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:600 }}>{item.name}</div>
                  {item.barcode && <div style={{ fontSize:10, color:'var(--muted)', fontFamily:'var(--font-mono)' }}>{item.barcode}</div>}
                </div>
                <div style={{ textAlign:'right' }}>
                  <span style={{ fontFamily:'var(--font-mono)', color:'var(--accent2)', fontSize:13, fontWeight:700 }}>{item.miktar} adet</span>
                  {item.kaynakStok !== '?' && (
                    <div style={{ fontSize:10, color:'var(--muted)' }}>Kalan: {item.kaynakStok - item.miktar}</div>
                  )}
                </div>
                <button onClick={() => cikar(item.id)} style={{ padding:'3px 8px', borderRadius:6, border:'none', background:'rgba(255,77,109,0.15)', color:'var(--danger)', fontSize:11, fontWeight:700 }}>✕</button>
              </div>
            ))}
            {/* Toplam özeti */}
            <div style={{ borderTop:'1px solid var(--border)', paddingTop:8, marginTop:4, display:'flex', justifyContent:'space-between', fontSize:11 }}>
              <span style={{ color:'var(--muted)' }}>Toplam ürün çeşidi: <b style={{ color:'var(--text)' }}>{liste.length}</b></span>
              <span style={{ color:'var(--muted)' }}>Toplam adet: <b style={{ color:'var(--accent2)', fontFamily:'var(--font-mono)' }}>{liste.reduce((s,i)=>s+i.miktar,0)}</b></span>
            </div>
          </div>
        )}

        <hr style={{ border:'none', borderTop:'1px solid var(--border)', margin:'14px 0' }} />
        <button onClick={tamamla} disabled={loading || !liste.length} style={{
          width:'100%', padding:12, borderRadius:10, border:'none',
          background: liste.length ? 'var(--accent2)' : 'var(--surface2)',
          color: liste.length ? '#fff' : 'var(--muted)', fontWeight:700, fontSize:13,
        }}>
          {loading ? '⏳...' : `🚀 Transferi Tamamla (${liste.length} ürün)`}
        </button>
      </div>

      {/* Depo durumu */}
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:16 }}>
        <div style={{ fontFamily:'var(--font-head)', fontSize:14, fontWeight:700, marginBottom:12 }}>📦 Ana Depo Durumu</div>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
          <thead><tr>{['Ürün','Barkod','Stok','Durum'].map(h => (
            <th key={h} style={{ textAlign:'left', padding:'6px 10px', color:'var(--muted)', fontSize:10, fontWeight:700, borderBottom:'1px solid var(--border)' }}>{h}</th>
          ))}</tr></thead>
          <tbody>
            {urunler.length === 0
              ? <tr><td colSpan={4} style={{ textAlign:'center', color:'var(--muted)', padding:24 }}>Ürün yok</td></tr>
              : urunler.map(u => {
                const pct = Math.min(100, (u.stock/1000)*100);
                const cls = pct > 50 ? 'var(--accent)' : pct > 20 ? 'var(--warn)' : 'var(--danger)';
                return (
                  <tr key={u.id} onClick={() => setSelUrun(u.id)}
                    style={{ cursor:'pointer', background: selUrun==u.id ? 'rgba(0,229,160,0.06)' : 'transparent', transition:'background 0.1s' }}>
                    <td style={{ padding:'8px 10px', fontSize:11 }}>{u.name}</td>
                    <td style={{ padding:'8px 10px', fontFamily:'var(--font-mono)', color:'var(--muted)', fontSize:10 }}>{u.barcode||'—'}</td>
                    <td style={{ padding:'8px 10px', fontFamily:'var(--font-mono)', color:cls, fontWeight:600 }}>{u.stock}</td>
                    <td style={{ padding:'8px 10px', width:100 }}>
                      <div style={{ background:'var(--surface2)', borderRadius:4, height:5, overflow:'hidden' }}>
                        <div style={{ width:`${pct}%`, height:'100%', borderRadius:4, background:cls, transition:'width 0.4s' }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
