// src/pages/Urunler.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../lib/api.js';

export default function Urunler({ showToast }) {
  const [urunler, setUrunler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [catFilter, setCat]   = useState('');
  const [form, setForm]       = useState({ barcode:'', name:'', cat:'📦 Diğer', unit:'Adet', abc:'B', f1:'', f2:'', f3:'' });
  const [editId, setEditId]   = useState(null);
  const [csvFile, setCsvFile] = useState(null);
  const [scanMode, setScanMode] = useState(false);
  const [scanError, setScanError] = useState('');
  const fileRef = useRef();
  const videoRef = useRef();
  const streamRef = useRef(null);
  const animRef = useRef(null);

  // Barcode Scanner helpers
  const stopCamera = useCallback(() => {
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
  }, []);

  const startCamera = useCallback(async () => {
    setScanError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 } } });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      // Use BarcodeDetector if available
      if ('BarcodeDetector' in window) {
        const detector = new window.BarcodeDetector({ formats: ['ean_13','ean_8','upc_a','upc_e','code_128','code_39','qr_code','data_matrix'] });
        const scan = async () => {
          if (!videoRef.current || !streamRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes.length > 0) {
              const val = codes[0].rawValue;
              setForm(f => ({ ...f, barcode: val }));
              // search existing
              const found = urunler.find(u => u.barcode === val);
              if (found) { startEdit(found); showToast('✅ Ürün bulundu: ' + found.name); }
              else { showToast('📦 Barkod tarandı: ' + val, 'info'); }
              stopCamera();
              setScanMode(false);
              return;
            }
          } catch {}
          animRef.current = requestAnimationFrame(scan);
        };
        animRef.current = requestAnimationFrame(scan);
      } else {
        setScanError('Tarayıcınız BarcodeDetector desteklemiyor. Barkodu manuel girin.');
      }
    } catch (e) {
      setScanError('Kamera erişimi reddedildi. Ayarlardan izin verin.');
    }
  }, [urunler, stopCamera]);

  useEffect(() => {
    if (scanMode) startCamera();
    else stopCamera();
    return () => stopCamera();
  }, [scanMode]);

  const load = () => {
    api.urunler.list({ search, cat: catFilter })
      .then(setUrunler).catch(e => showToast('❌ ' + e.message, 'err'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search, catFilter]);

  const save = async () => {
    try {
      if (!form.name) return showToast('❌ Ürün adı gerekli', 'err');
      const payload = { ...form, f1:+form.f1||0, f2:+form.f2||0, f3:+form.f3||0 };
      if (editId) { await api.urunler.update(editId, payload); showToast('✅ Ürün güncellendi'); }
      else { await api.urunler.create(payload); showToast('✅ Ürün eklendi'); }
      setForm({ barcode:'', name:'', cat:'📦 Diğer', unit:'Adet', abc:'B', f1:'', f2:'', f3:'' });
      setEditId(null);
      load();
    } catch(e) { showToast('❌ ' + e.message, 'err'); }
  };

  const startEdit = (u) => {
    setEditId(u.id);
    setForm({ barcode:u.barcode||'', name:u.name, cat:u.cat, unit:u.unit, abc:u.abc, f1:u.f1, f2:u.f2, f3:u.f3 });
    window.scrollTo(0,0);
  };

  const del = async (id, name) => {
    if (!confirm(`"${name}" silinecek. Emin misiniz?`)) return;
    try { await api.urunler.delete(id); showToast('🗑️ Silindi'); load(); }
    catch(e) { showToast('❌ ' + e.message, 'err'); }
  };

  const handleCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target.result;
      const lines = text.trim().split('\n').map(l => l.trim()).filter(l => l);
      if (lines.length < 2) return showToast('❌ CSV boş', 'err');
      const sep = lines[0].includes(';') ? ';' : ',';
      const headers = lines[0].split(sep).map(h => h.trim().toLowerCase().replace(/['"]/g,''));
      const idx = (names) => { for (const n of names) { const i = headers.indexOf(n); if (i!==-1) return i; } return -1; };
      const iName = idx(['ad','adi','urun','name']); if (iName===-1) return showToast('❌ "ad" sütunu yok', 'err');
      const rows = lines.slice(1).map(l => {
        const c = l.split(sep).map(x => x.trim().replace(/['"]/g,''));
        return { barcode:c[idx(['barkod','barcode'])]||'', name:c[iName], cat:c[idx(['kategori','cat'])]||'📦 Diğer',
          unit:c[idx(['birim','unit'])]||'Adet', abc:c[idx(['abc'])]||'B',
          f1:+c[idx(['f1','fiyat1'])]||0, f2:+c[idx(['f2','fiyat2'])]||0, f3:+c[idx(['f3','fiyat3'])]||0 };
      }).filter(r => r.name);
      try {
        const result = await api.urunler.bulk(rows);
        showToast(`✅ ${result.added} eklendi, ${result.updated} güncellendi`);
        load();
      } catch(e) { showToast('❌ ' + e.message, 'err'); }
      e.target.value = '';
    };
    reader.readAsText(file, 'UTF-8');
  };

  const cats = ['🍫 Atıştırmalık','🥤 İçecek','🍬 Şekerleme','🥜 Kuruyemiş','🍪 Bisküvi','🧃 Meyve Suyu','🍵 Sıcak İçecek','🥛 Süt Ürünleri','🍱 Hazır Yemek','📦 Diğer'];
  const units = ['Adet','Kutu','Şişe','Paket','Koli','Kg','Lt','Gr'];

  const inp = (id) => ({
    value: form[id],
    onChange: e => setForm(f => ({...f, [id]: e.target.value})),
    style: { width:'100%', background:'var(--surface2)', border:'1.5px solid var(--border)', borderRadius:10, padding:'10px 12px', color:'var(--text)', fontSize:14, outline:'none' }
  });

  return (
    <div>
      {/* Form */}
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:16, marginBottom:14 }}>
        <div style={{ fontFamily:'var(--font-head)', fontSize:11, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:1, marginBottom:12 }}>
          {editId ? '✏️ Ürün Düzenle' : '✨ Yeni Ürün Ekle'}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:'var(--muted)', display:'block', marginBottom:4 }}>Barkod</label>
            <div style={{ display:'flex', gap:6 }}>
              <input {...inp('barcode')} placeholder="8690597820016" style={{ ...inp('barcode').style, flex:1 }} />
              <button onClick={() => setScanMode(true)} title="Kamera ile barkod tara" style={{
                padding:'10px 12px', borderRadius:10, border:'1.5px solid var(--border)',
                background:'var(--surface2)', color:'var(--accent2)', fontSize:18, cursor:'pointer', flexShrink:0,
              }}>📷</button>
            </div>
          </div>
          <div><label style={{ fontSize:11, fontWeight:700, color:'var(--muted)', display:'block', marginBottom:4 }}>Ürün Adı *</label><input {...inp('name')} placeholder="Coca-Cola 330ml" /></div>
        </div>

        {/* Barcode Scanner Modal */}
        {scanMode && (
          <div style={{
            position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', zIndex:9999,
            display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          }}>
            <div style={{ background:'var(--surface)', borderRadius:20, padding:20, width:'min(95vw,420px)', border:'1px solid var(--border)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                <span style={{ fontFamily:'var(--font-head)', fontWeight:700, fontSize:14 }}>📷 Barkod Tara</span>
                <button onClick={() => setScanMode(false)} style={{ padding:'4px 10px', borderRadius:8, border:'none', background:'rgba(255,77,109,0.15)', color:'var(--danger)', fontWeight:700, fontSize:13, cursor:'pointer' }}>✕ Kapat</button>
              </div>
              <div style={{ position:'relative', borderRadius:14, overflow:'hidden', background:'#000', aspectRatio:'4/3' }}>
                <video ref={videoRef} autoPlay playsInline muted style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
                  <div style={{ width:'70%', height:'24%', border:'2.5px solid var(--accent)', borderRadius:8, boxShadow:'0 0 0 2000px rgba(0,0,0,0.38)' }} />
                </div>
                <div style={{ position:'absolute', bottom:10, left:0, right:0, textAlign:'center', color:'rgba(255,255,255,0.8)', fontSize:11 }}>
                  Barkodu çerçeve içine getirin
                </div>
              </div>
              {scanError && (
                <div style={{ marginTop:12, padding:'10px 12px', borderRadius:10, background:'rgba(255,77,109,0.12)', color:'var(--danger)', fontSize:12, textAlign:'center' }}>
                  ⚠️ {scanError}
                </div>
              )}
              <div style={{ marginTop:12, textAlign:'center', fontSize:11, color:'var(--muted)' }}>
                Barkod algılandığında kamera otomatik kapanır
              </div>
            </div>
          </div>
        )}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:8 }}>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:'var(--muted)', display:'block', marginBottom:4 }}>Kategori</label>
            <select {...inp('cat')} style={{ ...inp('cat').style, WebkitAppearance:'none' }}>
              {cats.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:'var(--muted)', display:'block', marginBottom:4 }}>Birim</label>
            <select {...inp('unit')} style={{ ...inp('unit').style, WebkitAppearance:'none' }}>
              {units.map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:'var(--muted)', display:'block', marginBottom:4 }}>ABC Sınıfı</label>
            <select {...inp('abc')} style={{ ...inp('abc').style, WebkitAppearance:'none' }}>
              <option value="A">A — Yüksek</option><option value="B">B — Orta</option><option value="C">C — Düşük</option>
            </select>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:12 }}>
          {['f1','f2','f3'].map((f,i) => (
            <div key={f}>
              <label style={{ fontSize:11, fontWeight:700, color:'var(--muted)', display:'block', marginBottom:4 }}>
                {['💵 Fiyat 1','💴 Fiyat 2','💶 Fiyat 3'][i]}
              </label>
              <input {...inp(f)} type="number" placeholder="0.00" step="0.01"
                style={{ ...inp(f).style, borderColor:['var(--accent)','var(--accent2)','var(--accent3)'][i] }} />
            </div>
          ))}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={save} style={{
            flex:1, padding:'11px 16px', borderRadius:10, border:'none', background:'var(--accent)',
            color:'#0d0f14', fontWeight:700, fontSize:13,
          }}>
            {editId ? '✅ Güncelle' : '💾 Kaydet'}
          </button>
          {editId && <button onClick={() => { setEditId(null); setForm({ barcode:'', name:'', cat:'📦 Diğer', unit:'Adet', abc:'B', f1:'', f2:'', f3:'' }); }} style={{ padding:'11px 16px', borderRadius:10, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text)', fontWeight:700 }}>✕ İptal</button>}
          <button onClick={() => fileRef.current.click()} style={{ padding:'11px 16px', borderRadius:10, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--accent2)', fontWeight:700 }}>📊 CSV</button>
          <input ref={fileRef} type="file" accept=".csv,.txt" style={{ display:'none' }} onChange={handleCSV} />
        </div>
      </div>

      {/* List */}
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:16 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <div style={{ fontFamily:'var(--font-head)', fontSize:14, fontWeight:700 }}>
            Ürün Listesi ({urunler.length})
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Ara..."
              style={{ width:130, background:'var(--surface2)', border:'1.5px solid var(--border)', borderRadius:8, padding:'6px 10px', color:'var(--text)', fontSize:12, outline:'none' }} />
            <select value={catFilter} onChange={e=>setCat(e.target.value)}
              style={{ background:'var(--surface2)', border:'1.5px solid var(--border)', borderRadius:8, padding:'6px 10px', color:'var(--text)', fontSize:12, outline:'none', WebkitAppearance:'none' }}>
              <option value="">Tüm Kategoriler</option>
              {cats.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        {loading ? <div style={{ textAlign:'center', color:'var(--muted)', padding:30 }}>Yükleniyor...</div> : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr>{['Ürün','Barkod','Birim','ABC','F1','F2','F3','Maliyet','Stok','İşlem'].map(h => (
                  <th key={h} style={{ textAlign:'left', padding:'7px 10px', color:'var(--muted)', fontSize:10, fontWeight:700, fontFamily:'var(--font-head)', textTransform:'uppercase', letterSpacing:0.8, borderBottom:'1px solid var(--border)' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {urunler.length === 0 ? (
                  <tr><td colSpan={10} style={{ textAlign:'center', color:'var(--muted)', padding:30 }}>Ürün bulunamadı</td></tr>
                ) : urunler.map(u => (
                  <tr key={u.id}>
                    <td style={{ padding:'9px 10px', fontWeight:600 }}>{u.name}</td>
                    <td style={{ padding:'9px 10px', fontFamily:'var(--font-mono)', color:'var(--muted)', fontSize:11 }}>{u.barcode||'—'}</td>
                    <td style={{ padding:'9px 10px' }}>{u.unit}</td>
                    <td style={{ padding:'9px 10px' }}>
                      <span style={{ padding:'2px 7px', borderRadius:6, fontSize:10, fontWeight:700,
                        background:u.abc==='A'?'rgba(0,229,160,0.15)':u.abc==='B'?'rgba(79,140,255,0.15)':'rgba(255,209,102,0.15)',
                        color:u.abc==='A'?'var(--accent)':u.abc==='B'?'var(--accent2)':'var(--warn)',
                      }}>{u.abc}</span>
                    </td>
                    <td style={{ padding:'9px 10px', fontFamily:'var(--font-mono)', color:'var(--accent)' }}>₺{parseFloat(u.f1||0).toFixed(2)}</td>
                    <td style={{ padding:'9px 10px', fontFamily:'var(--font-mono)', color:'var(--accent2)' }}>₺{parseFloat(u.f2||0).toFixed(2)}</td>
                    <td style={{ padding:'9px 10px', fontFamily:'var(--font-mono)', color:'var(--accent3)' }}>₺{parseFloat(u.f3||0).toFixed(2)}</td>
                    <td style={{ padding:'9px 10px', fontFamily:'var(--font-mono)', color:'var(--warn)' }}>₺{parseFloat(u.cost||0).toFixed(2)}</td>
                    <td style={{ padding:'9px 10px', fontFamily:'var(--font-mono)', color:u.stock<10?'var(--danger)':u.stock<50?'var(--warn)':'var(--text)', fontWeight:600 }}>{u.stock}</td>
                    <td style={{ padding:'9px 10px' }}>
                      <div style={{ display:'flex', gap:4 }}>
                        <button onClick={() => startEdit(u)} style={{ padding:'4px 8px', borderRadius:6, border:'none', background:'rgba(79,140,255,0.15)', color:'var(--accent2)', fontSize:11, fontWeight:700 }}>✏️</button>
                        <button onClick={() => del(u.id, u.name)} style={{ padding:'4px 8px', borderRadius:6, border:'none', background:'rgba(255,77,109,0.15)', color:'var(--danger)', fontSize:11, fontWeight:700 }}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
