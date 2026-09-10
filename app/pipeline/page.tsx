"use client";

import { useState, useEffect } from "react";
import { Cpu, Play, Square, RefreshCw, CheckCircle2, AlertTriangle, Sparkles, Clock } from "lucide-react";
import Link from "next/link";

interface PipelineStatus {
  isRunning: boolean;
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  currentTweet?: string;
  error?: string | null;
}

export default function PipelinePage() {
  const [status, setStatus] = useState<PipelineStatus>({
    isRunning: false,
    total: 0,
    processed: 0,
    succeeded: 0,
    failed: 0,
  });
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState(false);

  // Poll status
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/pipeline");
        const data = await res.json();
        setStatus(data);
      } catch (err) { /* ignore */ }
    };

    fetchStatus();
    interval = setInterval(fetchStatus, 1500);

    return () => clearInterval(interval);
  }, []);

  // Fetch settings once
  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) setSettings(data.settings);
      })
      .catch(() => {});
  }, []);

  const handleStart = async (forceAll: boolean = false) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forceAll }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Analiz başlatılamadı.");
      }
    } catch (err) {
      alert("Sunucuyla iletişim kurulamadı.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStop = async () => {
    try {
      await fetch("/api/pipeline", { method: "DELETE" });
    } catch (err) { /* ignore */ }
  };

  const progressPercent = status.total > 0 ? Math.round((status.processed / status.total) * 100) : 0;
  const activeProvider = settings.active_provider || "google";
  const activeModel =
    activeProvider === "google"
      ? settings.google_model || "gemini-2.5-flash"
      : activeProvider === "openai"
      ? settings.openai_model || "gpt-4o-mini"
      : activeProvider === "anthropic"
      ? settings.anthropic_model || "claude-3-5-haiku-20241022"
      : activeProvider === "deepseek"
      ? settings.deepseek_model || "deepseek-chat"
      : settings.openrouter_model || "deepseek/deepseek-chat";

  const providerName =
    activeProvider === "google"
      ? "Google Gemini"
      : activeProvider === "openai"
      ? "OpenAI"
      : activeProvider === "anthropic"
      ? "Anthropic Claude"
      : activeProvider === "deepseek"
      ? "DeepSeek"
      : activeProvider === "openrouter"
      ? "OpenRouter"
      : activeProvider;

  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2.5">
          <Cpu className="text-blue-500" size={26} />
          AI Analiz Merkezi
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Yer imlerinizi yapay zeka ile analiz edin, etiketler ve kategoriler üretin.
        </p>
      </div>

      {/* Active Engine Card */}
      <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between mb-6">
        <div>
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Aktif Yapay Zeka Motoru</span>
          <h2 className="text-base font-bold text-zinc-100 mt-0.5">
            {providerName} ({activeModel})
          </h2>
        </div>
        <Link
          href="/settings"
          className="text-xs px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors"
        >
          Modeli Değiştir
        </Link>
      </div>

      {/* Main Status & Progress Panel */}
      <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-6">
        {/* State Indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span
              className={`w-3 h-3 rounded-full ${
                status.isRunning ? "bg-emerald-500 animate-pulse" : "bg-zinc-600"
              }`}
            />
            <span className="font-semibold text-sm text-zinc-200">
              {status.isRunning ? "Analiz Devam Ediyor..." : "Hazır / Beklemede"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!status.isRunning ? (
              <>
                <button
                  onClick={() => handleStart(false)}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-medium transition-all shadow-md shadow-blue-500/20"
                >
                  <Play size={14} /> Eksikleri Analiz Et
                </button>
                <button
                  onClick={() => handleStart(true)}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-medium transition-colors border border-zinc-700"
                  title="Tüm yer imlerini baştan analiz eder"
                >
                  <RefreshCw size={13} /> Tümünü Yeniden Tara
                </button>
              </>
            ) : (
              <button
                onClick={handleStop}
                className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-xl text-xs font-medium transition-colors"
              >
                <Square size={14} /> Analizi Durdur
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-zinc-400 font-medium">
            <span>İlerleme Durumu</span>
            <span>
              {status.processed} / {status.total} ({progressPercent}%)
            </span>
          </div>
          <div className="w-full bg-zinc-950 h-3 rounded-full overflow-hidden border border-zinc-800/80">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-300 shadow-sm"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Live Stream: Current Tweet */}
        {status.isRunning && status.currentTweet && (
          <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-900/30 text-xs text-blue-200 flex items-start gap-2 animate-pulse">
            <Sparkles size={14} className="text-blue-400 shrink-0 mt-0.5" />
            <span className="truncate">İşleniyor: {status.currentTweet}</span>
          </div>
        )}

        {/* Counters Grid */}
        <div className="grid grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/60 text-center">
            <div className="text-xs text-zinc-500 mb-1">Başarılı</div>
            <div className="text-xl font-bold text-emerald-400">{status.succeeded}</div>
          </div>
          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/60 text-center">
            <div className="text-xs text-zinc-500 mb-1">Hatalı / Atlanan</div>
            <div className="text-xl font-bold text-red-400">{status.failed}</div>
          </div>
          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/60 text-center">
            <div className="text-xs text-zinc-500 mb-1">Kalan</div>
            <div className="text-xl font-bold text-zinc-300">
              {Math.max(0, status.total - status.processed)}
            </div>
          </div>
        </div>

        {/* Error Notice */}
        {status.error && (
          <div className="p-4 rounded-xl bg-red-950/30 border border-red-900/50 text-xs text-red-300 flex items-start gap-2.5">
            <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Hata Oluştu:</p>
              <p className="text-red-200/80 mt-0.5">{status.error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}