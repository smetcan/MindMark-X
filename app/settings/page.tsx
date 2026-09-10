"use client";

import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Save, Plus, Trash2, CheckCircle2, Eye, Key } from "lucide-react";

interface Category {
  id: string;
  name: string;
  color: string;
  description: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({
    active_provider: "google",
    google_api_key: "",
    google_model: "gemini-2.5-flash",
    openai_api_key: "",
    openai_model: "gpt-4o-mini",
    anthropic_api_key: "",
    anthropic_model: "claude-3-5-haiku-20241022",
    deepseek_api_key: "",
    deepseek_model: "deepseek-chat",
    openrouter_api_key: "",
    openrouter_model: "deepseek/deepseek-chat",
    enable_vision: "true",
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // New category form state
  const [newCat, setNewCat] = useState({ id: "", name: "", color: "#3b82f6", description: "" });

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) setSettings((prev) => ({ ...prev, ...data.settings }));
        if (data.categories) setCategories(data.categories);
      })
      .catch(() => {});
  }, []);

  const handleSaveSettings = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      alert("Ayarlar kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat.id || !newCat.name) {
      alert("Lütfen kategori ID (slug) ve adını girin.");
      return;
    }

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", category: newCat }),
      });
      if (res.ok) {
        setCategories((prev) => [...prev, newCat]);
        setNewCat({ id: "", name: "", color: "#3b82f6", description: "" });
      }
    } catch (err) {
      alert("Kategori eklenemedi.");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm(`"${id}" kategorisini silmek istediğinize emin misiniz?`)) return;
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", category: { id } }),
      });
      if (res.ok) {
        setCategories((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (err) {
      alert("Kategori silinemedi.");
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto w-full space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2.5">
          <SettingsIcon className="text-blue-500" size={26} />
          Uygulama Ayarları
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Yapay zeka sağlayıcılarınızı, API anahtarlarınızı ve kategori şemanızı yönetin.
        </p>
      </div>

      {/* AI Providers Section */}
      <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-6">
        <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
          <Key size={18} className="text-blue-400" /> Yapay Zeka Sağlayıcıları
        </h2>

        {/* Active Provider Selector */}
        <div>
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
            Aktif Sağlayıcı
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { id: "google", name: "Google Gemini", sub: "Ücretsiz kota, hızlı Vision OCR" },
              { id: "openai", name: "OpenAI", sub: "api.openai.com (GPT-4o, GPT-4o-mini)" },
              { id: "anthropic", name: "Anthropic Claude", sub: "api.anthropic.com (Claude 3.5 Haiku/Sonnet)" },
              { id: "deepseek", name: "DeepSeek", sub: "api.deepseek.com" },
              { id: "openrouter", name: "OpenRouter", sub: "openrouter.ai (Çoklu model)" },
            ].map((p) => {
              const isSelected = settings.active_provider === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSettings({ ...settings, active_provider: p.id })}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? "border-blue-500 bg-blue-500/10 text-white"
                      : "border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <div className="font-semibold text-sm">{p.name}</div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">{p.sub}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Google Gemini Credentials */}
        <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm text-zinc-200">Google Gemini Ayarları</span>
            <span className="text-[11px] text-emerald-400 font-medium">Önerilen</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Gemini API Key</label>
              <input
                type="password"
                value={settings.google_api_key || ""}
                onChange={(e) => setSettings({ ...settings, google_api_key: e.target.value })}
                placeholder="AIzaSy..."
                className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-blue-500/60"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Model</label>
              <input
                type="text"
                value={settings.google_model || "gemini-2.5-flash"}
                onChange={(e) => setSettings({ ...settings, google_model: e.target.value })}
                className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-blue-500/60"
              />
            </div>
          </div>
        </div>

        {/* OpenAI Credentials */}
        <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-3">
          <span className="font-semibold text-sm text-zinc-200">OpenAI Ayarları</span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">OpenAI API Key</label>
              <input
                type="password"
                value={settings.openai_api_key || ""}
                onChange={(e) => setSettings({ ...settings, openai_api_key: e.target.value })}
                placeholder="sk-proj-..."
                className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-blue-500/60"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Model</label>
              <input
                type="text"
                value={settings.openai_model || "gpt-4o-mini"}
                onChange={(e) => setSettings({ ...settings, openai_model: e.target.value })}
                className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-blue-500/60"
              />
            </div>
          </div>
        </div>

        {/* Anthropic Claude Credentials */}
        <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-3">
          <span className="font-semibold text-sm text-zinc-200">Anthropic Claude Ayarları</span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Anthropic API Key</label>
              <input
                type="password"
                value={settings.anthropic_api_key || ""}
                onChange={(e) => setSettings({ ...settings, anthropic_api_key: e.target.value })}
                placeholder="sk-ant-..."
                className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-blue-500/60"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Model</label>
              <input
                type="text"
                value={settings.anthropic_model || "claude-3-5-haiku-20241022"}
                onChange={(e) => setSettings({ ...settings, anthropic_model: e.target.value })}
                className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-blue-500/60"
              />
            </div>
          </div>
        </div>

        {/* DeepSeek Credentials */}
        <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-3">
          <span className="font-semibold text-sm text-zinc-200">DeepSeek Ayarları</span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">DeepSeek API Key</label>
              <input
                type="password"
                value={settings.deepseek_api_key || ""}
                onChange={(e) => setSettings({ ...settings, deepseek_api_key: e.target.value })}
                placeholder="sk-..."
                className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-blue-500/60"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Model</label>
              <input
                type="text"
                value={settings.deepseek_model || "deepseek-chat"}
                onChange={(e) => setSettings({ ...settings, deepseek_model: e.target.value })}
                className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-blue-500/60"
              />
            </div>
          </div>
        </div>

        {/* OpenRouter Credentials */}
        <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-3">
          <span className="font-semibold text-sm text-zinc-200">OpenRouter Ayarları</span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">OpenRouter API Key</label>
              <input
                type="password"
                value={settings.openrouter_api_key || ""}
                onChange={(e) => setSettings({ ...settings, openrouter_api_key: e.target.value })}
                placeholder="sk-or-v1-..."
                className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-blue-500/60"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Model ID</label>
              <input
                type="text"
                value={settings.openrouter_model || "deepseek/deepseek-chat"}
                onChange={(e) => setSettings({ ...settings, openrouter_model: e.target.value })}
                className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-blue-500/60"
              />
            </div>
          </div>
        </div>

        {/* Vision OCR Toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-950/40 border border-zinc-800/80">
          <div className="flex items-center gap-3">
            <Eye size={18} className="text-blue-400" />
            <div>
              <span className="font-semibold text-sm text-zinc-200">Görsel Analizi & OCR</span>
              <p className="text-xs text-zinc-500">
                Görsel içeren tweetlerde resimdeki metinleri (OCR) okuyup yapay zeka analizine katar.
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.enable_vision === "true"}
            onChange={(e) =>
              setSettings({ ...settings, enable_vision: e.target.checked ? "true" : "false" })
            }
            className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
          />
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {saved && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium animate-in fade-in">
              <CheckCircle2 size={15} /> Ayarlar kaydedildi!
            </span>
          )}
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Save size={15} /> {saving ? "Kaydediliyor..." : "Ayarları Kaydet"}
          </button>
        </div>
      </div>

      {/* Category Management Section */}
      <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-6">
        <div>
          <h2 className="text-base font-semibold text-zinc-100 mb-1">Kategori Yönetimi</h2>
          <p className="text-xs text-zinc-400">
            Yapay zekanın tweetleri sınıflandırırken kullanacağı kategori listesi. İstediğiniz gibi yeni kategoriler ekleyebilirsiniz.
          </p>
        </div>

        {/* Existing Categories Table */}
        <div className="space-y-2">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex items-center justify-between text-xs gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="w-3.5 h-3.5 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="font-semibold text-zinc-200 shrink-0">{cat.name}</span>
                <span className="font-mono text-zinc-500 text-[11px] shrink-0">[{cat.id}]</span>
                <span className="text-zinc-500 truncate hidden md:inline">{cat.description}</span>
              </div>
              <button
                onClick={() => handleDeleteCategory(cat.id)}
                className="text-zinc-500 hover:text-red-400 p-1"
                title="Kategoriyi Sil"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Add New Category Form */}
        <form onSubmit={handleAddCategory} className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-3">
          <span className="font-semibold text-xs text-zinc-300 uppercase tracking-wider">Yeni Kategori Ekle</span>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Slug (örn: mobile-dev)"
              value={newCat.id}
              onChange={(e) => setNewCat({ ...newCat, id: e.target.value })}
              className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-blue-500/60"
            />
            <input
              type="text"
              placeholder="Görünen İsim (örn: Mobil Geliştirme)"
              value={newCat.name}
              onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
              className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-blue-500/60"
            />
            <input
              type="text"
              placeholder="Açıklama (Model için kılavuz)"
              value={newCat.description}
              onChange={(e) => setNewCat({ ...newCat, description: e.target.value })}
              className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-blue-500/60"
            />
            <div className="flex gap-2">
              <input
                type="color"
                value={newCat.color}
                onChange={(e) => setNewCat({ ...newCat, color: e.target.value })}
                className="w-10 h-9 p-1 bg-zinc-900 border border-zinc-800 rounded-lg cursor-pointer shrink-0"
              />
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                <Plus size={14} /> Ekle
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Database Management & Reset */}
      <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
            <Trash2 className="text-red-400" size={18} />
            Veritabanı Yönetimi & Sıfırlama
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            İçe aktarılan yer imlerini temizleyebilir ve arşivi sıfırdan yeniden yükleyebilirsiniz.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-medium text-red-200">Tüm Yer İmlerini Sil</h4>
            <p className="text-xs text-red-300/70 mt-0.5">
              Kayıtlı tüm tweetler, AI özetleri ve etiketler silinir. Kategori tanımlarınız ve API anahtarlarınız korunur.
            </p>
          </div>

          <button
            type="button"
            onClick={async () => {
              if (!confirm("Tüm yer imlerini silmek istediğinize emin misiniz? Kategoriler ve API anahtarlarınız korunacaktır.")) return;
              try {
                const res = await fetch("/api/bookmarks?all=true", { method: "DELETE" });
                if (res.ok) {
                  alert("Tüm yer imleri başarıyla temizlendi.");
                } else {
                  alert("Silme işlemi başarısız oldu.");
                }
              } catch (err) {
                alert("Hata oluştu.");
              }
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold shrink-0 transition-colors shadow-sm"
          >
            Tüm Yer İmlerini Temizle
          </button>
        </div>
      </div>
    </div>
  );
}