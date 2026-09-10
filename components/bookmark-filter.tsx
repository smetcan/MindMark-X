"use client";

import { Search, X, Filter } from "lucide-react";

interface Category {
  id: string;
  name: string;
  color: string;
}

export default function BookmarkFilter({
  search,
  onSearchChange,
  categories,
  selectedCategory,
  onSelectCategory,
  selectedStatus,
  onSelectStatus,
  selectedTag,
  onClearTag,
}: {
  search: string;
  onSearchChange: (s: string) => void;
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
  selectedTag: string;
  onClearTag: () => void;
}) {
  return (
    <div className="space-y-4 mb-6">
      {/* Top Search & Status Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Search input */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={17} />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tweetlerde, yazarlarda, özetlerde veya etiketlerde ara..."
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500/60 transition-colors"
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Status Dropdown */}
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <select
            value={selectedStatus}
            onChange={(e) => onSelectStatus(e.target.value)}
            className="w-full sm:w-auto px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-300 focus:outline-none focus:border-blue-500/60"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="success">✅ Analiz Edilenler</option>
            <option value="pending">⏳ Bekleyenler</option>
            <option value="failed">❌ Hata Alanlar</option>
          </select>
        </div>
      </div>

      {/* Active Tag indicator */}
      {selectedTag && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-500">Seçili Etiket:</span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30">
            #{selectedTag}
            <button onClick={onClearTag} className="hover:text-white">
              <X size={12} />
            </button>
          </span>
        </div>
      )}

      {/* Category Pills Slider */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => onSelectCategory("all")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
            selectedCategory === "all"
              ? "bg-zinc-100 text-zinc-900 font-semibold shadow"
              : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
          }`}
        >
          Tüm Kategoriler
        </button>

        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border flex items-center gap-1.5"
              style={{
                backgroundColor: isSelected ? cat.color : "#18181b",
                borderColor: isSelected ? cat.color : "#27272a",
                color: isSelected ? "#ffffff" : "#a1a1aa",
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: isSelected ? "#ffffff" : cat.color }}
              />
              {cat.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}