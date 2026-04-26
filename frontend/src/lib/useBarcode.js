// src/lib/useBarcode.js
// Paylaşılan barkod tarayıcı hook'u — tüm sayfalarda kullanılır
import { useState, useRef, useCallback, useEffect } from 'react';

export function useBarcodeScanner({ onDetected, onClose }) {
  const [active, setActive]     = useState(false);
  const [error, setError]       = useState('');
  const videoRef  = useRef(null);
  const streamRef = useRef(null);
  const animRef   = useRef(null);

  const stop = useCallback(() => {
    if (animRef.current)  { cancelAnimationFrame(animRef.current); animRef.current = null; }
    if (streamRef.current){ streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
  }, []);

  const start = useCallback(async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      if (!('BarcodeDetector' in window)) {
        setError('Tarayıcınız kamera barkod okumayı desteklemiyor. Barkodu manuel girin.');
        return;
      }
      const detector = new window.BarcodeDetector({
        formats: ['ean_13','ean_8','upc_a','upc_e','code_128','code_39','qr_code','data_matrix']
      });
      const scan = async () => {
        if (!videoRef.current || !streamRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes.length > 0) {
            const val = codes[0].rawValue;
            stop();
            setActive(false);
            onDetected(val);
            return;
          }
        } catch {}
        animRef.current = requestAnimationFrame(scan);
      };
      animRef.current = requestAnimationFrame(scan);
    } catch {
      setError('Kamera erişimi reddedildi. Tarayıcı ayarlarından izin verin.');
    }
  }, [onDetected, stop]);

  useEffect(() => {
    if (active) start();
    else stop();
    return stop;
  }, [active]);

  const open  = () => setActive(true);
  const close = () => { stop(); setActive(false); onClose?.(); };

  return { active, open, close, error, videoRef };
}

// ─── Barkod Modal Bileşeni ───────────────────────────────────────────────────
export function BarcodeModal({ scanner, title = 'Barkod Tara' }) {
  if (!scanner.active) return null;
  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.9)', zIndex:9999,
      display:'flex', alignItems:'center', justifyContent:'center',
    }}>
      <div style={{
        background:'var(--surface)', borderRadius:20, padding:20,
        width:'min(95vw,420px)', border:'1px solid var(--border)',
      }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <span style={{ fontFamily:'var(--font-head)', fontWeight:700, fontSize:14 }}>📷 {title}</span>
          <button onClick={scanner.close} style={{
            padding:'4px 12px', borderRadius:8, border:'none',
            background:'rgba(255,77,109,0.15)', color:'var(--danger)',
            fontWeight:700, fontSize:13, cursor:'pointer',
          }}>✕ Kapat</button>
        </div>

        {/* Video */}
        <div style={{ position:'relative', borderRadius:14, overflow:'hidden', background:'#000', aspectRatio:'4/3' }}>
          <video ref={scanner.videoRef} autoPlay playsInline muted
            style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
          {/* Tarama çerçevesi */}
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
            <div style={{
              width:'72%', height:'26%',
              border:'2.5px solid var(--accent)', borderRadius:10,
              boxShadow:'0 0 0 3000px rgba(0,0,0,0.42)',
            }}>
              {/* Köşe işaretleri */}
              {[['0%','0%'],['100%','0%'],['0%','100%'],['100%','100%']].map(([r,b],i) => (
                <div key={i} style={{
                  position:'absolute',
                  top: b==='0%' ? -2 : 'auto', bottom: b==='100%' ? -2 : 'auto',
                  left: r==='0%' ? -2 : 'auto', right: r==='100%' ? -2 : 'auto',
                  width:14, height:14,
                  borderTop: b==='0%' ? '3px solid var(--accent)' : 'none',
                  borderBottom: b==='100%' ? '3px solid var(--accent)' : 'none',
                  borderLeft: r==='0%' ? '3px solid var(--accent)' : 'none',
                  borderRight: r==='100%' ? '3px solid var(--accent)' : 'none',
                }} />
              ))}
            </div>
          </div>
          {/* Tarama çizgisi animasyonu */}
          <style>{`@keyframes scanline{0%{top:30%}50%{top:65%}100%{top:30%}}`}</style>
          <div style={{
            position:'absolute', left:'14%', right:'14%', height:2,
            background:'linear-gradient(90deg,transparent,var(--accent),transparent)',
            animation:'scanline 2s ease-in-out infinite', pointerEvents:'none',
          }} />
          <div style={{ position:'absolute', bottom:8, left:0, right:0, textAlign:'center', color:'rgba(255,255,255,0.75)', fontSize:11 }}>
            Barkodu çerçeve içine getirin
          </div>
        </div>

        {scanner.error && (
          <div style={{ marginTop:12, padding:'10px 12px', borderRadius:10, background:'rgba(255,77,109,0.12)', color:'var(--danger)', fontSize:12, textAlign:'center' }}>
            ⚠️ {scanner.error}
          </div>
        )}
        <div style={{ marginTop:10, textAlign:'center', fontSize:11, color:'var(--muted)' }}>
          Barkod algılandığında kamera otomatik kapanır
        </div>
      </div>
    </div>
  );
}

// ─── Barkod Butonu — input yanına eklenir ────────────────────────────────────
export function ScanBtn({ onClick, style }) {
  return (
    <button onClick={onClick} title="Kamera ile barkod tara" style={{
      padding:'10px 12px', borderRadius:10,
      border:'1.5px solid var(--border)',
      background:'var(--surface2)', color:'var(--accent2)',
      fontSize:18, cursor:'pointer', flexShrink:0,
      transition:'all 0.15s', ...style,
    }}>📷</button>
  );
}
