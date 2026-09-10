"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, Network, Cpu, Upload, Settings, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const [stats, setStats] = useState<{ total: number; success: number } | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.stats) setStats(data.stats);
      })
      .catch(() => {});
  }, [pathname]);

  const navItems = [
    { href: "/", label: "Yer İmleri", icon: Bookmark },
    { href: "/mindmap", label: "Zihin Haritası", icon: Network },
    { href: "/pipeline", label: "AI Analiz Merkezi", icon: Cpu },
    { href: "/import", label: "İçe Aktar", icon: Upload },
    { href: "/settings", label: "Ayarlar", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col h-screen sticky top-0 shrink-0">
      {/* Brand */}
      <div className="p-6 border-b border-zinc-800 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
          X
        </div>
        <div>
          <h1 className="font-semibold text-zinc-100 text-sm tracking-wide flex items-center gap-1.5">
            MindMark <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">AI</span>
          </h1>
          <p className="text-xs text-zinc-500">X Knowledge & Mindmap</p>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-blue-600/15 text-blue-400 border border-blue-500/20"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              <Icon size={18} className={isActive ? "text-blue-400" : "text-zinc-500"} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Mini Stats Card */}
      {stats && (
        <div className="p-4 m-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl space-y-2 text-xs">
          <div className="flex justify-between text-zinc-400 font-medium">
            <span>Toplam Yer İmi:</span>
            <span className="text-zinc-200 font-semibold">{stats.total}</span>
          </div>
          <div className="flex justify-between text-zinc-400 font-medium">
            <span>Analiz Edilen:</span>
            <span className="text-emerald-400 font-semibold">{stats.success}</span>
          </div>
          <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-1">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-500"
              style={{
                width: `${stats.total > 0 ? (stats.success / stats.total) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="p-4 border-t border-zinc-800 text-[11px] text-zinc-600 flex items-center justify-between">
        <span>Windows Localhost</span>
        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
      </div>
    </aside>
  );
}