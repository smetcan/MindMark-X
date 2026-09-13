"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, FileJson, CheckCircle2, Bookmark, Terminal, Copy, Check, ArrowRight, ExternalLink } from "lucide-react";
import { getBookmarkletHref, BOOKMARKLET_RAW_SCRIPT } from "@/lib/import/bookmarklet";
import Link from "next/link";

export default function ImportPage() {
  const [activeTab, setActiveTab] = useState<"file" | "bookmarklet" | "console">("bookmarklet");
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ imported: number; skipped: number; total: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const [bmCopied, setBmCopied] = useState(false);

  const bookmarkletRef = useRef<HTMLAnchorElement>(null);
  const bookmarkletHref = getBookmarkletHref();

  useEffect(() => {
    if (bookmarkletRef.current) {
      bookmarkletRef.current.setAttribute("href", bookmarkletHref);
    }
  }, [bookmarkletHref, activeTab]);

  const handleCopyBookmarklet = () => {
    navigator.clipboard.writeText(bookmarkletHref);
    setBmCopied(true);
    setTimeout(() => setBmCopied(false), 2000);
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setUploadResult(null);

    try {
      const text = await file.text();
      let data: any;

      // Handle Twitter archive format which starts with window.YTD.like.part0 = [ ... ]
      if (text.includes("window.YTD")) {
        const jsonStart = text.indexOf("[");
        if (jsonStart !== -1) {
          data = JSON.parse(text.slice(jsonStart));
        } else {
          throw new Error("Twitter arşiv dosyası formatı anlaşılamadı.");
        }
      } else {
        data = JSON.parse(text);
      }

      const res = await fetch("/api/import?autoStart=false", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const resJson = await res.json();
      if (!res.ok) {
        alert(resJson.error || "İçe aktarma başarısız oldu.");
      } else {
        setUploadResult(resJson);
      }
    } catch (err) {
      alert("Dosya okuma veya JSON parse hatası: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setUploading(false);
    }
  };

  const handleCopyConsole = () => {
    navigator.clipboard.writeText(BOOKMARKLET_RAW_SCRIPT.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2.5">
          <Upload className="text-blue-500" size={26} />
          Yer İmlerini İçe Aktar
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          X (Twitter) yer imlerinizi dosya yükleyerek veya tarayıcıdan tek tıkla uygulamaya çekin.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 gap-6 mb-8">
        <button
          onClick={() => setActiveTab("file")}
          className={`pb-3 text-sm font-medium transition-all relative ${
            activeTab === "file" ? "text-blue-400" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          📁 Dosya Yükleme (JSON / X Arşivi)
          {activeTab === "file" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("bookmarklet")}
          className={`pb-3 text-sm font-medium transition-all relative ${
            activeTab === "bookmarklet" ? "text-blue-400" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          🔖 Tarayıcı Butonu (Bookmarklet)
          {activeTab === "bookmarklet" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("console")}
          className={`pb-3 text-sm font-medium transition-all relative ${
            activeTab === "console" ? "text-blue-400" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          💻 Konsol Betiği
          {activeTab === "console" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
          )}
        </button>
      </div>

      {/* Tab 1: File Dropzone */}
      {activeTab === "file" && (
        <div className="space-y-6">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const file = e.dataTransfer.files[0];
              if (file) handleFileUpload(file);
            }}
            className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all ${
              dragOver
                ? "border-blue-500 bg-blue-500/10"
                : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/40"
            }`}
          >
            <input
              type="file"
              id="file-input"
              accept=".json,.js"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
            />

            <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto mb-4 text-zinc-300 shadow-inner">
              <FileJson size={28} />
            </div>

            <h3 className="text-base font-semibold text-zinc-200 mb-1">
              Dosyanızı buraya sürükleyin veya seçin
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-6">
              Siftly <code>bookmarks.json</code>, Twitter Archive (<code>bookmarks.js</code> / <code>like.js</code>) veya standart JSON listeleri desteklenir.
            </p>

            <label
              htmlFor="file-input"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-medium cursor-pointer transition-colors shadow"
            >
              {uploading ? "İçe Aktarılıyor..." : "Dosya Seç (.json, .js)"}
            </label>
          </div>

          {/* Success card */}
          {uploadResult && (
            <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-900/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={24} className="text-emerald-400 shrink-0" />
                <div>
                  <h4 className="font-semibold text-zinc-100 text-sm">İçe Aktarma Başarılı!</h4>
                  <p className="text-xs text-emerald-300/80 mt-0.5">
                    {uploadResult.imported} yeni yer imi eklendi. ({uploadResult.skipped} mükerrer atlandı).
                  </p>
                </div>
              </div>

              <Link
                href="/pipeline"
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium transition-colors"
              >
                Şimdi Analiz Et <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Bookmarklet */}
      {activeTab === "bookmarklet" && (
        <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-6">
          <div>
            <h3 className="text-base font-semibold text-zinc-100 mb-1">Tek Tıkla Yer İmlerini Çekin</h3>
            <p className="text-xs text-zinc-400">
              Bu mini aracı tarayıcınızın yer imleri çubuğuna ekleyin. Ardından X yer imleri sayfasında tek tıkla çalıştırın.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Method A: Drag & Drop */}
            <div className="p-5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 flex flex-col items-center justify-between text-center gap-3">
              <div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Yöntem A: Sürükle & Bırak
                </span>
                <p className="text-xs text-zinc-400 mt-2">
                  Aşağıdaki butonu tarayıcınızın <strong>Yer İmleri Çubuğuna</strong> sürükleyin:
                </p>
              </div>

              <a
                ref={bookmarkletRef}
                href="#"
                draggable
                onClick={(e) => {
                  e.preventDefault();
                  alert("Bu butona doğrudan tıklamak yerine, tarayıcınızın Yer İmleri (Favoriler) çubuğuna sürükleyip bırakın veya yanındaki 'Kodu Kopyala' seçeneğini kullanın!");
                }}
                className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/20 cursor-grab active:cursor-grabbing select-none transition-transform active:scale-95"
              >
                <Bookmark size={16} /> 🔖 X Bookmarks Aktar
              </a>

              <p className="text-[11px] text-zinc-500">
                Yer İmleri Çubuğu görünmüyorsa: <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-300">Ctrl + Shift + B</kbd>
              </p>
            </div>

            {/* Method B: Manual Bookmark (Most reliable) */}
            <div className="p-5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 flex flex-col items-center justify-between text-center gap-3">
              <div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Yöntem B: Kodu Kopyala (En Güvenilir)
                </span>
                <p className="text-xs text-zinc-400 mt-2">
                  Tarayıcınız sürüklemeye izin vermiyorsa kodu kopyalayıp yer imi olarak kaydedin:
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopyBookmarklet}
                className="inline-flex items-center gap-2 px-5 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 rounded-xl text-sm font-semibold shadow transition-colors"
              >
                {bmCopied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                {bmCopied ? "Kod Kopyalandı!" : "Yer İmi Kodunu Kopyala"}
              </button>

              <p className="text-[11px] text-zinc-500 text-left w-full pl-2">
                Yer imleri çubuğuna sağ tıkla → <strong>Yer imi ekle</strong> → URL kısmına yapıştır.
              </p>
            </div>
          </div>

          {/* Steps */}
          <div className="p-5 rounded-xl bg-zinc-950/40 border border-zinc-800/60 space-y-3">
            <h4 className="font-semibold text-xs text-zinc-300 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span> Nasıl Kullanılır?
            </h4>
            <ol className="space-y-2 text-xs text-zinc-400 list-decimal list-inside leading-relaxed">
              <li>Yukarıdaki iki yöntemden biriyle butonu tarayıcınızın yer imleri çubuğuna ekleyin.</li>
              <li>
                X'te yer imlerinize (geçmişinize) gidin:{" "}
                <a
                  href="https://x.com/i/history"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 underline font-medium"
                >
                  x.com/i/history <ExternalLink size={12} />
                </a>{" "}
                <span className="text-zinc-500">(veya eski arayüzde x.com/i/bookmarks)</span>
              </li>
              <li>Sayfa açıkken yer imleri çubuğundaki <strong>🔖 X Bookmarks Aktar</strong> butonuna tıklayın.</li>
              <li>Sayfanın sağ altında açılan panelden <strong>"▶ Otomatik Kaydır"</strong> butonuna basın (veya sayfayı kendiniz fareyle aşağı kaydırın; sayaç her yeni tweette otomatik artacaktır).</li>
              <li>İstediğiniz miktarda yer imi toplandığında iki yoldan birini seçin:
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1 text-zinc-300">
                  <li><strong>📥 JSON İndir (Önerilen):</strong> Tek tıkla <code>x_bookmarks.json</code> dosyasını bilgisayarınıza indirin. Ardından bu sayfadaki <strong>"📁 Dosya Yükleme"</strong> sekmesinden dosyayı sürükleyip yükleyin.</li>
                  <li><strong>🚀 Aktar:</strong> Yerel sunucu (localhost:3000) açıkken doğrudan veritabanına aktarın.</li>
                </ul>
              </li>
            </ol>
            <div className="pt-2 text-[11px] text-blue-400/90 bg-blue-500/10 border border-blue-500/20 p-2.5 rounded-lg flex items-center gap-2">
              <span>🎯</span> <span><strong>Akıllı Artımlı Tarama:</strong> Bookmarklet, veritabanınızdaki mevcut yer imlerini otomatik tanır. "Otomatik Kaydır" başladığında daha önce aktarılmış bir tweete rastladığı anda kaydırmayı otomatik durdurur; böylece yalnızca yeni eklenen tweetleri saniyeler içinde toplar.</span>
            </div>
            <div className="pt-1 text-[11px] text-emerald-400/90 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg flex items-center gap-2">
              <span>💡</span> <span><strong>İpucu:</strong> Sayfayı kendiniz kaydırsanız bile sayaç canlı olarak toplanan tweetleri anında sayar. Toplama bitince yeşil <strong>"📥 JSON İndir"</strong> butonuna basmanız yeterlidir.</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Console Script */}
      {activeTab === "console" && (
        <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-zinc-100 mb-1">Geliştirici Konsolu Betiği</h3>
              <p className="text-xs text-zinc-400">
                x.com/i/history (veya x.com/i/bookmarks) sayfasında F12 konsoluna yapıştırarak aynı işlemi çalıştırabilirsiniz.
              </p>
            </div>
            <button
              onClick={handleCopyConsole}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg text-xs font-medium transition-colors"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              {copied ? "Kopyalandı!" : "Betiği Kopyala"}
            </button>
          </div>

          <pre className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400 font-mono overflow-x-auto max-h-80">
            {BOOKMARKLET_RAW_SCRIPT.trim()}
          </pre>
        </div>
      )}
    </div>
  );
}