"use client";

import { useState, useEffect, useCallback } from "react";
import BookmarkCard, { BookmarkData } from "@/components/bookmark-card";
import BookmarkFilter from "@/components/bookmark-filter";
import { Upload, Sparkles, RefreshCw, Layers, Trash2 } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const [bookmarks, setBookmarks] = useState<BookmarkData[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; color: string }[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedTag, setSelectedTag] = useState("");

  const loadBookmarks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (selectedCategory && selectedCategory !== "all") params.set("categoryId", selectedCategory);
      if (selectedStatus && selectedStatus !== "all") params.set("status", selectedStatus);
      if (selectedTag) params.set("tag", selectedTag);
      params.set("limit", "100");

      const res = await fetch(`/api/bookmarks?${params.toString()}`);
      const data = await res.json();
      if (data.bookmarks) {
        setBookmarks(data.bookmarks);
        setTotal(data.total);
      }
    } catch (err) {
      console.error("Failed to load bookmarks:", err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, selectedStatus, selectedTag]);

  // Load categories once
  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) setCategories(data.categories);
      })
      .catch(() => {});
  }, []);

  // Reload bookmarks when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      loadBookmarks();
    }, 200);
    return () => clearTimeout(timer);
  }, [loadBookmarks]);

  const handleDelete = async (id: string) => {
    if (!confirm("Bu yer imini silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/bookmarks?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setBookmarks((prev) => prev.filter((b) => b.id !== id));
        setTotal((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      alert("Silme işlemi başarısız oldu.");
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Tüm yer imlerini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.")) return;
    try {
      const res = await fetch("/api/bookmarks?all=true", { method: "DELETE" });
      if (res.ok) {
        setBookmarks([]);
        setTotal(0);
        alert("Tüm yer imleri başarıyla temizlendi.");
      }
    } catch (err) {
      alert("Silme işlemi başarısız oldu.");
    }
  };

  const handleSingleAnalyze = async (id: string) => {
    try {
      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookmarkIds: [id] }),
      });
      if (res.ok) {
        // Poll for a couple seconds
        setTimeout(() => loadBookmarks(), 2500);
      }
    } catch (err) {
      alert("Analiz başlatılamadı.");
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2.5">
            <Layers className="text-blue-500" size={26} />
            X Yer İmleri
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Yapay zeka ile organize edilen ve kategorilere ayrılan Twitter/X arşiviniz.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {total > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-red-950/20 hover:bg-red-900/30 text-red-400 border border-red-900/40 rounded-xl text-sm font-medium transition-all"
              title="Tüm yer imlerini veritabanından sil"
            >
              <Trash2 size={16} />
              Tümünü Temizle
            </button>
          )}
          <Link
            href="/pipeline"
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-medium shadow-md shadow-blue-500/20 transition-all"
          >
            <Sparkles size={16} />
            AI Analiz Başlat
          </Link>
          <Link
            href="/import"
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 rounded-xl text-sm font-medium transition-all"
          >
            <Upload size={16} />
            İçe Aktar
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <BookmarkFilter
        search={search}
        onSearchChange={setSearch}
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        selectedStatus={selectedStatus}
        onSelectStatus={setSelectedStatus}
        selectedTag={selectedTag}
        onClearTag={() => setSelectedTag("")}
      />

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-zinc-500 mb-4 px-1">
        <span>Toplam {total} yer imi bulundu</span>
        <button
          onClick={loadBookmarks}
          className="flex items-center gap-1 hover:text-zinc-300 transition-colors"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Yenile
        </button>
      </div>

      {/* Content Grid */}
      {loading && bookmarks.length === 0 ? (
        <div className="py-20 text-center text-zinc-500 text-sm">
          <RefreshCw className="animate-spin mx-auto mb-3" size={24} />
          Yer imleri yükleniyor...
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="py-20 text-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-8">
          <div className="w-12 h-12 rounded-full bg-zinc-800/80 flex items-center justify-center mx-auto mb-4 text-zinc-400">
            <Upload size={22} />
          </div>
          <h3 className="text-base font-semibold text-zinc-200 mb-1">Henüz yer imi bulunamadı</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-5">
            {search || selectedCategory !== "all" || selectedTag
              ? "Arama kriterlerinize uyan bir yer imi bulunamadı."
              : "X arşivinizi veya yer imleri JSON dosyanızı yükleyerek başlayın."}
          </p>
          <Link
            href="/import"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-medium transition-all"
          >
            <Upload size={14} /> Hemen İçe Aktar
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {bookmarks.map((bm) => (
            <BookmarkCard
              key={bm.id}
              bookmark={bm}
              onDelete={handleDelete}
              onTagClick={(tag) => setSelectedTag(tag)}
              onAnalyze={handleSingleAnalyze}
            />
          ))}
        </div>
      )}
    </div>
  );
}