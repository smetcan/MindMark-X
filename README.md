# 🔖 MindMark-X

> **Yapay Zeka Destekli Twitter / X Yer İmi Yöneticisi, Türkçe Bilgi Küratörü ve Etkileşimli Zihin Haritası**

[![Next.js](https://img.shields.io/badge/Next.js-15.1.7-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/SQLite-LibSQL-003B57?style=flat&logo=sqlite)](https://sqlite.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.39-C5F74F?style=flat)](https://orm.drizzle.team/)

---

## 📖 Genel Bakış

**MindMark-X**, Twitter/X üzerinde kaydettiğiniz yüzlerce veya binlerce yer imini (bookmarks) kaybolmaktan kurtaran, kendi bilgisayarınızda (**self-hosted**) çalışan modern bir bilgi yönetim sistemidir.

Resmi Twitter API'sine veya ücretli aboneliklere ihtiyaç duymadan, tarayıcınıza ekleyeceğiniz **Bookmarklet** veya dosya yükleme aracılığıyla yer imlerinizi tek tıkla yerel veritabanınıza aktarır. Ardından **Google Gemini**, **DeepSeek** veya **OpenRouter** yapay zeka modelleriyle tweetleri otomatik olarak kategorize eder, etiketler ve **kaynak dil ne olursa olsun Türkçe özetini** çıkarır. Tüm bu bilgi havuzunu etkileşimli bir **zihin haritası (mindmap)** tuvalinde görselleştirir.

---

## ✨ Öne Çıkan Özellikler

### 1. 📥 Zahmetsiz İçe Aktarma (Ingestion)
* **Tarayıcı Bookmarklet (Önerilen):** `x.com/i/history` (veya `x.com/i/bookmarks`) sayfasında tek tıkla çalışan mini panel. Otomatik sayfa kaydırma, canlı toplanan tweet sayacı ve doğrudan yerel sunucuya (`localhost:3000`) aktarma veya tek tıkla `JSON İndir` seçeneği.
* **Dosya Yükleme (Dropzone):** Twitter Arşiv dosyaları (`bookmarks.js`, `like.js`), Siftly `bookmarks.json` veya standart JSON exportlarını sürükle-bırak desteği.
* **Geliştirici Konsolu Betiği:** Tarayıcı konsoluna (F12) yapıştırıp çalıştırabileceğiniz açık kaynaklı betik desteği.
* **Akıllı Mükerrer Önleme (Deduplication):** Aynı tweet birden fazla kez içeri aktarılsa dahi benzersiz `tweet_id` ile mükerrer kayıtlar otomatik filtrelenir.

### 2. 🧠 Yapay Zeka & Türkçe Bilgi Küratörlüğü
* **Çoklu Sağlayıcı:** Google Gemini (`gemini-2.5-flash`), DeepSeek (`deepseek-chat`) ve OpenRouter (`deepseek/deepseek-chat` vb.) arasında anında geçiş.
* **Zorunlu Türkçe Özet Kuralı:** Tweet İngilizce, Japonca veya başka bir dilde olsa dahi yapay zeka özet alanı **kesinlikle akıcı Türkçe** olarak üretilir.
* **Görsel Analizi & OCR (Vision):** Tweet görsel içeriyorsa (kod ekran görüntüleri, infografikler, makale başlıkları), OCR teknolojisiyle görseldeki metinler okunur ve analize dahil edilir.
* **Dayanıklı Çıktı Temizleyici (Sanitizer):** DeepSeek-R1 modellerinin `<think>` düşünce bloklarını ve markdown artıklarını temizler; model kategori adı yerine slug döndürse bile çift anahtarlı (*dual-key*) eşleme ile doğru kategoriye bağlar.
* **Arka Plan Boru Hattı (Pipeline):** Aynı anda 3 paralel iş parçacığıyla çalışan, durdurulabilir/devam ettirilebilir asenkron analiz motoru.

### 3. 🕸️ Etkileşimli Zihin Haritası (Mindmap Canvas)
* **XYFlow / React Flow Entegrasyonu:** Merkez kökten kategorilere ve kategorilerden popüler alt etiketlere uzanan dinamik ilişkisel ağ.
* **Yan Çekmece (Drawer):** Zihin haritasında herhangi bir kategori veya etiket düğümüne tıklandığında, eşleşen tweetleri ve Türkçe özetlerini sağ tarafta anında listeleyen panel.

### 4. 🗂️ Gelişmiş Filtreleme & Dashboard
* **Anlık Arama:** Tweet metni, yazar adı, kullanıcı adı, AI özeti ve etiketlerde gerçek zamanlı arama.
* **Durum ve Kategori Filtreleri:** Analiz edilenler, bekleyenler ve hata alanlar arasında filtreleme.
* **Kategori Yönetimi:** Uygulama arayüzünden yeni kategoriler tanımlama, renk ve açıklama belirleme, mevcutları düzenleme veya silme.

### 5. 🔒 %100 Gizlilik & Yerel Veri Sahipliği
* Verileriniz üçüncü parti bulut veritabanlarında değil, bilgisayarınızdaki yerel `sqlite.db` dosyasında saklanır.
* API anahtarlarınız yalnızca yerel veritabanınızda tutulur.

---

## 🛠️ Teknoloji Yığını

| Katman | Teknoloji | Açıklama |
| :--- | :--- | :--- |
| **Framework** | Next.js 15 (App Router) | React Server Components & Route Handlers |
| **Önyüz Kütüphanesi** | React 19 & TypeScript | Tip güvenli reaktif bileşen mimarisi |
| **Stil & Tasarım** | Tailwind CSS v4 & PostCSS | Modern koyu tema (Zinc paleti) |
| **Görselleştirme** | @xyflow/react | İnteraktif düğüm tabanlı zihin haritası |
| **İkon Seti** | Lucide React | Modern arayüz ikonları |
| **Veritabanı** | SQLite (`@libsql/client`) | Dosya tabanlı yerel ilişkisel veritabanı |
| **ORM** | Drizzle ORM & Drizzle Kit | Şema tanımları, migrasyonlar ve tohumlama |
| **AI SDK'ları** | `@google/genai`, `openai` & `@anthropic-ai/sdk` | Gemini API, OpenAI-uyumlu DeepSeek/OpenRouter ve Anthropic Claude |

---

## 🚀 Kurulum ve Başlangıç

### Gereksinimler
* [Node.js](https://nodejs.org/) v18 veya üzeri (Önerilen: v20+)
* `npm` veya uyumlu paket yöneticisi

### 1. Depoyu Klonlayın
```bash
git clone https://github.com/smetcan/MindMark-X.git
cd MindMark-X
```

### 2. Bağımlılıkları Yükleyin
```bash
npm install
```

### 3. Veritabanını Hazırlayın
Varsayılan kategorileri ve ayarları oluşturmak için veritabanını tohumlayın:
```bash
npm run db:push
npm run db:seed
```

### 4. Geliştirici Sunucusunu Başlatın
```bash
npm run dev
```
Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresini açın.

---

## ⚙️ Yapılandırma ve Kullanım

### 1. API Anahtarlarını Tanımlama
Uygulamayı açtıktan sonra sol menüden **Ayarlar** (`/settings`) sayfasına gidin:
1. Kullanmak istediğiniz sağlayıcıyı seçin (**Google Gemini**, **DeepSeek** veya **OpenRouter**).
2. İlgili sağlayıcıya ait API anahtarınızı girin ve **Ayarları Kaydet** butonuna basın.
3. İsteğe bağlı olarak **Görsel Analizi & OCR** seçeneğini aktif bırakın.

### 2. X Yer İmlerini İçe Aktarma
Sol menüden **İçe Aktar** (`/import`) sayfasına gidin:
* **Yöntem A (Bookmarklet):** `🔖 X Bookmarks Aktar` butonunu tarayıcınızın Yer İmleri (Favoriler) çubuğuna sürükleyin. [x.com/i/history](https://x.com/i/history) (veya [x.com/i/bookmarks](https://x.com/i/bookmarks)) adresindeyken butona tıklayın; sayfanın sağ altında açılan panelden **Otomatik Kaydır**'ı başlatın ve ardından **JSON İndir** veya doğrudan **Aktar** butonuna basın.
* **Yöntem B (Dosya Yükleme):** Varsa Twitter arşiv dosyanızı veya indirdiğiniz `x_bookmarks.json` dosyasını sürükleyip yükleme alanına bırakın.

### 3. Yapay Zeka Analizini Başlatma
Sol menüden **AI Analiz Merkezi** (`/pipeline`) sayfasına gidin:
* **Eksikleri Analiz Et:** Henüz analiz edilmemiş veya daha önce hata almış tüm tweetleri sırayla işler.
* **Tümünü Yeniden Tara:** Veritabanındaki tüm yer imlerini sıfırdan yapay zeka ile analiz eder.

---

## 📜 Kullanılabilir Komutlar

| Komut | Açıklama |
| :--- | :--- |
| `npm run dev` | Yerel geliştirici sunucusunu başlatır (`localhost:3000`). |
| `npm run build` | Next.js üretim derlemesini (`next build`) çalıştırır. |
| `npm run start` | Üretim derlemesini yerel sunucuda çalıştırır. |
| `npx tsc --noEmit` | TypeScript statik tip denetimini gerçekleştirir. |
| `npx tsx test/verify.ts` | Sanitizer, JSON parser ve SQLite mükerrer engelleme entegrasyon testlerini koşturur. |
| `npm run db:push` | Drizzle ORM şema değişikliklerini `sqlite.db` dosyasına yansıtır. |
| `npm run db:seed` | Varsayılan kategori kümesini ve ayarları veritabanına ekler. |

---

## 📁 Proje Dizin Yapısı

```text
MindMark-X/
├── app/                     # Next.js App Router sayfaları ve API uçları
│   ├── api/                 # REST API Route Handlers
│   │   ├── bookmarks/       # Yer imi listeleme, filtreleme ve silme API'si
│   │   ├── import/          # Toplu içe aktarma ve CORS destekli API
│   │   ├── pipeline/        # AI analiz boru hattı kontrol API'si
│   │   └── settings/        # Ayarlar ve kategori CRUD API'si
│   ├── import/              # İçe aktarma sayfası (Dropzone, Bookmarklet, Konsol)
│   ├── mindmap/             # React Flow tabanlı etkileşimli zihin haritası
│   ├── pipeline/            # AI analiz merkezi ve ilerleme paneli
│   ├── settings/            # API sağlayıcıları ve kategori yönetim sayfası
│   ├── globals.css          # Tailwind CSS v4 ve koyu tema değişkenleri
│   ├── layout.tsx           # Ana düzen ve yan menü (Sidebar)
│   └── page.tsx             # Ana sayfa: yer imleri akışı ve filtreler
├── components/              # Yeniden kullanılabilir React bileşenleri
│   ├── bookmark-card.tsx    # Tweet kartı, OCR etiketi ve AI özet rozeti
│   ├── bookmark-filter.tsx  # Arama kutusu ve kategori hapları
│   ├── mindmap-canvas.tsx   # Zihin haritası tuvali ve yan çekmece
│   └── sidebar.tsx          # Navigasyon çubuğu ve canlı istatistik kartı
├── lib/                     # Çekirdek iş mantığı ve yardımcı modüller
│   ├── ai/                  # AI motorları, promptlar, sanitizer ve pipeline
│   │   ├── gemini.ts        # Google Gemini metin & Vision OCR istemcisi
│   │   ├── openai-compat.ts # DeepSeek & OpenRouter OpenAI-uyumlu istemci
│   │   ├── pipeline.ts      # 3 kanallı asenkron arka plan analiz yürütücüsü
│   │   ├── prompts.ts       # Türkçe özet zorunlu sistem promptları
│   │   ├── sanitizer.ts     # DeepSeek <think> temizleyici & dual-key slug eşleyici
│   │   └── types.ts         # Ortak AI TypeScript arayüzleri
│   ├── db/                  # Veritabanı ve Drizzle şemaları
│   │   ├── index.ts         # LibSQL SQLite istemcisi
│   │   ├── schema.ts        # Tablo tanımları: categories, bookmarks, settings
│   │   └── seed.ts          # Varsayılan kategoriler ve ayarlar tohumlama
│   └── import/              # İçe aktarma ayrıştırıcıları
│       ├── bookmarklet.ts   # Tarayıcıda çalışan DOM kazıyıcı betik
│       └── parser.ts        # Twitter arşiv ve JSON normalleştirici
└── test/                    # Otomasyonlu testler
    └── verify.ts            # Uçtan uca doğrulama testi
```

---

## 🔒 Lisans & Katkı

Bu proje açık kaynaklıdır ve kişisel kullanım için geliştirilmiştir. Katkıda bulunmak için lütfen bir Issue açın veya Pull Request gönderin.
