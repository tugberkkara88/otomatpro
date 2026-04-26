# 🏪 OtomatPro v2.0 — Otomat Yönetim Sistemi

**React + Node.js/Express + PostgreSQL** tabanlı tam stack web uygulaması.

---

## 📁 Proje Yapısı

```
otomatpro/
├── backend/                    ← Node.js + Express API
│   ├── db/
│   │   ├── pool.js             ← PostgreSQL bağlantı havuzu
│   │   └── init.js             ← Veritabanı şema oluşturucu
│   ├── routes/
│   │   ├── urunler.js          ← Ürün CRUD
│   │   ├── makinalar.js        ← Otomat CRUD
│   │   ├── stok.js             ← Giriş & transfer
│   │   ├── sayimlar.js         ← Sayım kayıtları
│   │   ├── maliyetler.js       ← Gider yönetimi
│   │   ├── arizalar.js         ← Arıza & bakım
│   │   └── raporlar.js         ← Dashboard & analitik
│   ├── index.js                ← Express sunucu
│   ├── package.json
│   └── .env.example
│
├── frontend/                   ← React + Vite SPA
│   ├── src/
│   │   ├── lib/api.js          ← API istemcisi
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Urunler.jsx
│   │   │   ├── Stok.jsx
│   │   │   ├── Transfer.jsx
│   │   │   ├── Sayim.jsx
│   │   │   ├── Makinalar.jsx
│   │   │   ├── Raporlar.jsx
│   │   │   ├── Arizalar.jsx
│   │   │   └── Ayarlar.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 🗄️ Veritabanı Tabloları

| Tablo | Açıklama |
|-------|----------|
| `urunler` | Ürün kataloğu (barkod, fiyat kademeleri, ABC) |
| `makinalar` | 34 otomat + konum + doluluk |
| `stok_hareketleri` | Giriş ve transfer kayıtları |
| `sayimlar` | Sayım geçmişi + ciro/kar/kayıp |
| `maliyetler` | Bakım, elektrik, kira giderleri |
| `arizalar` | Arıza & bakım takibi |

---

## 🚀 Yerel Geliştirme (Local)

### 1. Repoyu kopyala
```bash
git clone https://github.com/KULLANICI_ADIN/otomatpro.git
cd otomatpro
```

### 2. Backend kurulum
```bash
cd backend
npm install
cp .env.example .env
# .env dosyasını düzenle → DATABASE_URL ekle
```

### 3. Veritabanı oluştur
```bash
# PostgreSQL yüklüyse:
createdb otomatpro

# .env içinde:
DATABASE_URL=postgresql://postgres:sifre@localhost:5432/otomatpro

# Tabloları oluştur:
npm run db:init
```

### 4. Backend başlat
```bash
npm run dev   # → http://localhost:4000
```

### 5. Frontend kurulum (yeni terminal)
```bash
cd ../frontend
npm install
cp .env.example .env.local
# .env.local: VITE_API_URL=http://localhost:4000
npm run dev   # → http://localhost:5173
```

---

## 📦 GitHub'a Yükleme

```bash
# Proje kök dizininde:
git init
git add .
git commit -m "🚀 OtomatPro v2.0 — React + PostgreSQL"

# GitHub'da yeni repo oluştur (otomatpro)
git remote add origin https://github.com/KULLANICI_ADIN/otomatpro.git
git branch -M main
git push -u origin main
```

---

## ☁️ Render.com Deploy

### ADIM 1 — PostgreSQL veritabanı oluştur

1. [render.com](https://render.com) → **New +** → **PostgreSQL**
2. Ayarlar:
   - **Name:** `otomatpro-db`
   - **Region:** Frankfurt (EU Central)
   - **Plan:** Free
3. **Create Database** → oluşunca **Internal Database URL**'i kopyala

---

### ADIM 2 — Backend Web Service

1. **New +** → **Web Service**
2. GitHub repoyu bağla → `otomatpro` seç
3. Ayarlar:

| Alan | Değer |
|------|-------|
| **Name** | `otomatpro-api` |
| **Root Directory** | `backend` |
| **Runtime** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Plan** | Free |

4. **Environment Variables** ekle:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | (Adım 1'den kopyaladığın Internal URL) |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | (Adım 3'te oluşacak frontend URL'i — sonra güncelle) |

5. **Create Web Service** → deploy beklenir
6. Deploy bittikten sonra: **Shell** sekmesi → `node db/init.js` çalıştır

---

### ADIM 3 — Frontend Static Site

1. **New +** → **Static Site**
2. Aynı repoyu seç
3. Ayarlar:

| Alan | Değer |
|------|-------|
| **Name** | `otomatpro` |
| **Root Directory** | `frontend` |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `dist` |

4. **Environment Variables** ekle:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://otomatpro-api.onrender.com` |

5. **Create Static Site**

---

### ADIM 4 — CORS güncelle

Backend servisine dön → Environment Variables:

```
FRONTEND_URL = https://otomatpro.onrender.com
```

**Manual Deploy** ile yeniden deploy et.

---

### ADIM 5 — Veritabanı şemasını başlat

Render Backend → **Shell** sekmesi:
```bash
node db/init.js
```

✅ Çıktı:
```
✅ OtomatPro veritabanı hazır — 6 tablo oluşturuldu
✅ 34 otomat kaydı eklendi
```

---

## 🌐 API Endpoints

### Ürünler
```
GET    /api/urunler          Ürün listesi
POST   /api/urunler          Yeni ürün
PUT    /api/urunler/:id      Güncelle
DELETE /api/urunler/:id      Sil
POST   /api/urunler/bulk     CSV import
```

### Stok
```
GET    /api/stok             Hareket geçmişi
POST   /api/stok/giris       Fatura ile giriş (ağırlıklı ort. maliyet)
POST   /api/stok/transfer    Transfer
```

### Makinalar
```
GET    /api/makinalar        Tüm otomatlar
PUT    /api/makinalar/:num   Güncelle (konum, fiyat kademesi)
POST   /api/makinalar        Yeni otomat ekle
```

### Raporlar
```
GET    /api/raporlar/dashboard      Ana panel özeti
GET    /api/raporlar/en-cok-satan   Top 10 ürün
GET    /api/raporlar/abc            ABC analizi
GET    /api/raporlar/kritik-stok    Stok uyarıları
GET    /api/raporlar/makina/:num    Makina bazlı rapor
```

---

## 🛠️ Özellikler

- ✅ **34 Otomat** yönetimi (konum, fiyat kademesi, doluluk %)
- ✅ **Ürün Kataloğu** — barkod, 3 kademe fiyat, ABC sınıflandırma
- ✅ **CSV Import** — toplu ürün yükleme
- ✅ **Stok Girişi** — ağırlıklı ortalama maliyet hesabı
- ✅ **Transfer** — Depo → Araç → Otomat
- ✅ **Sayım** — beklenen vs sayılan, ciro/kar/kayıp hesabı
- ✅ **Arıza Takibi** — öncelik, durum, kapanış
- ✅ **Raporlar** — dashboard, ABC analizi, gider takibi
- ✅ **PWA** — mobil ana ekrana eklenebilir
- ✅ **Responsive** — masaüstü sidebar + mobil bottom nav

---

## 📱 PWA Kurulumu

Mobil tarayıcıda siteyi açın → **Ana Ekrana Ekle** → uygulama gibi çalışır.

---

## ⚠️ Render Free Plan Notları

- Backend servis **15 dakika** hareketsizlikte uyur → ilk istek ~30sn sürer
- PostgreSQL veritabanı **90 gün** hareketsizlikte silinir → düzenli kullanın
- Aylık **750 saat** ücretsiz compute (1 servis için yeterli)
- Upgrade ($7/ay) ile uyku modu kalkar

---

## 🔧 Geliştirme İpuçları

```bash
# API sağlık kontrolü
curl https://otomatpro-api.onrender.com/api/health

# Yerel DB sıfırla
psql otomatpro < backend/db/init.sql

# Frontend production build test
cd frontend && npm run build && npm run preview
```
