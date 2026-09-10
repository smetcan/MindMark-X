"use client";

import { useEffect, useState } from "react";
import MindmapCanvas from "@/components/mindmap-canvas";
import { BookmarkData } from "@/components/bookmark-card";
import { Network, RefreshCw, Upload } from "lucide-react";
import Link from "next/link";

export default function MindmapPage() {
  const [bookmarks, setBookmarks] = useState<BookmarkData[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; color: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/bookmarks?limit=500").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ])
      .then(([bmData, settsData]) => {
        if (bmData.bookmarks) setBookmarks(bmData.bookmarks);
        if (settsData.categories) setCategories(settsData.categories);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto w-full h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2.5">
            <Network className="text-indigo-400" size={26} />
            Zihin Haritası
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Kategoriler, etiketler ve tweetler arasındaki anlamsal ilişkileri keşfedin.
          </p>
        </div>
      </div>

      {/* Canvas or Empty State */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">
          <RefreshCw className="animate-spin mr-2" size={20} /> Zihin haritası oluşturuluyor...
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="py-20 text-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-8">
          <h3 className="text-base font-semibold text-zinc-200 mb-1">Görselleştirilecek Yer İmi Yok</h3>
          <p className="text-xs text-zinc-500 mb-5">
            Zihin haritasını görebilmek için önce yer imlerinizi içeri aktarın.
          </p>
          <Link
            href="/import"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-medium"
          >
            <Upload size={14} /> İçe Aktar
          </Link>
        </div>
      ) : (
        <MindmapCanvas bookmarks={bookmarks} categories={categories} />
      )}
    </div>
  );
}