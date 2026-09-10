"use client";

import { ExternalLink, Sparkles, Tag, AlertCircle, Trash2, CheckCircle2, Clock } from "lucide-react";
import { useState } from "react";

interface MediaItem {
  type: string;
  url: string;
}

export interface BookmarkData {
  id: string;
  tweetId: string;
  text: string;
  authorName: string;
  authorHandle: string;
  authorAvatar?: string | null;
  tweetUrl: string;
  createdAt?: string | null;
  importedAt: string;
  media?: string | null;
  summary?: string | null;
  tags?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  categoryColor?: string | null;
  visionText?: string | null;
  aiStatus: "pending" | "processing" | "success" | "failed";
  aiError?: string | null;
}

export default function BookmarkCard({
  bookmark,
  onDelete,
  onTagClick,
  onAnalyze,
}: {
  bookmark: BookmarkData;
  onDelete: (id: string) => void;
  onTagClick?: (tag: string) => void;
  onAnalyze?: (id: string) => void;
}) {
  const [analyzing, setAnalyzing] = useState(false);

  let mediaList: MediaItem[] = [];
  if (bookmark.media) {
    try {
      mediaList = JSON.parse(bookmark.media);
    } catch { /* ignore */ }
  }

  let tagList: string[] = [];
  if (bookmark.tags) {
    try {
      tagList = JSON.parse(bookmark.tags);
    } catch { /* ignore */ }
  }

  const handleAnalyzeClick = async () => {
    if (analyzing || !onAnalyze) return;
    setAnalyzing(true);
    try {
      await onAnalyze(bookmark.id);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="bg-zinc-900/80 border border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-black/40 group">
      {/* Header: Author & Actions */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            {bookmark.authorAvatar ? (
              <img
                src={bookmark.authorAvatar}
                alt={bookmark.authorName}
                className="w-10 h-10 rounded-full border border-zinc-800 object-cover shrink-0"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-zinc-400 shrink-0">
                {bookmark.authorName?.[0] || "?"}
              </div>
            )}
            <div className="min-w-0">
              <h3 className="font-semibold text-zinc-100 text-sm truncate leading-tight">
                {bookmark.authorName}
              </h3>
              <p className="text-xs text-zinc-500 truncate">{bookmark.authorHandle}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
            <a
              href={bookmark.tweetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
              title="X'te Aç"
            >
              <ExternalLink size={15} />
            </a>
            <button
              onClick={() => onDelete(bookmark.id)}
              className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Sil"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Tweet Text */}
        <p className="text-sm text-zinc-300 whitespace-pre-line leading-relaxed mb-4 line-clamp-6">
          {bookmark.text}
        </p>

        {/* Media Preview (if photos exist) */}
        {mediaList.length > 0 && (
          <div className="mb-4 rounded-xl overflow-hidden border border-zinc-800/80 bg-black/40">
            <img
              src={mediaList[0].url}
              alt="Tweet Görseli"
              className="w-full max-h-56 object-cover hover:scale-[1.02] transition-transform duration-300"
              loading="lazy"
            />
          </div>
        )}

        {/* AI Summary (if analyzed) */}
        {bookmark.summary && (
          <div className="mb-3.5 p-3 rounded-xl bg-blue-950/20 border border-blue-900/30 text-xs text-blue-200/90 leading-relaxed flex items-start gap-2">
            <Sparkles size={14} className="text-blue-400 shrink-0 mt-0.5" />
            <span>{bookmark.summary}</span>
          </div>
        )}

        {/* Vision OCR text snippet if available */}
        {bookmark.visionText && (
          <div className="mb-3.5 p-2.5 rounded-lg bg-zinc-950/50 border border-zinc-800/60 text-[11px] text-zinc-400 font-mono line-clamp-2">
            <span className="text-zinc-500 font-sans font-semibold mr-1.5">OCR:</span>
            {bookmark.visionText}
          </div>
        )}
      </div>

      {/* Footer: Category & Tags & Status */}
      <div className="pt-3 border-t border-zinc-800/60 mt-2 space-y-2.5">
        {/* Category & Status */}
        <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
          {bookmark.categoryName ? (
            <span
              className="px-2.5 py-1 rounded-md font-medium text-xs border"
              style={{
                backgroundColor: `${bookmark.categoryColor || "#3b82f6"}18`,
                color: bookmark.categoryColor || "#60a5fa",
                borderColor: `${bookmark.categoryColor || "#3b82f6"}35`,
              }}
            >
              {bookmark.categoryName}
            </span>
          ) : (
            <span className="text-zinc-500 text-xs italic">Kategorilenmedi</span>
          )}

          {/* Status Badge */}
          {bookmark.aiStatus === "success" && (
            <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md font-medium">
              <CheckCircle2 size={12} /> Analiz Edildi
            </span>
          )}
          {bookmark.aiStatus === "pending" && (
            <button
              onClick={handleAnalyzeClick}
              disabled={analyzing}
              className="flex items-center gap-1 text-[11px] text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 px-2 py-0.5 rounded-md font-medium cursor-pointer transition-colors"
              title="Şimdi Analiz Et"
            >
              <Clock size={12} /> {analyzing ? "Analiz Ediliyor..." : "Analiz Et"}
            </button>
          )}
          {bookmark.aiStatus === "failed" && (
            <button
              onClick={handleAnalyzeClick}
              disabled={analyzing}
              className="flex items-center gap-1 text-[11px] text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-2 py-0.5 rounded-md font-medium cursor-pointer transition-colors"
              title={bookmark.aiError || "Hata oluştu. Tekrar denemek için tıklayın."}
            >
              <AlertCircle size={12} /> {analyzing ? "Deneniyor..." : "Tekrar Dene"}
            </button>
          )}
        </div>

        {/* Tags pills */}
        {tagList.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {tagList.map((tag) => (
              <button
                key={tag}
                onClick={() => onTagClick?.(tag)}
                className="px-2 py-0.5 rounded-md bg-zinc-800/70 hover:bg-zinc-700 text-zinc-300 text-[11px] transition-colors"
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}