import { db } from "./index";
import { categories, settings } from "./schema";

export const DEFAULT_CATEGORIES = [
  {
    id: "dev-tools",
    name: "Yazılım & Mühendislik",
    color: "#06b6d4",
    description: "Yazılım geliştirme, mimari, frameworkler, kütüphaneler, kodlama, open-source, API, DevOps, GitHub, veritabanları, terminal araçları.",
  },
  {
    id: "ai-ml",
    name: "Yapay Zeka & ML",
    color: "#8b5cf6",
    description: "Yapay zeka, makine öğrenimi, LLM'ler, ChatGPT, Claude, Gemini, DeepSeek, prompt mühendisliği, AI agentlar, RAG sistemleri, modeller.",
  },
  {
    id: "finance-crypto",
    name: "Finans & Kripto",
    color: "#f59e0b",
    description: "Kripto para, Bitcoin, Ethereum, Solana, DeFi, borsa, hisse senetleri, yatırım, makroekonomi, finansal piyasalar.",
  },
  {
    id: "design-product",
    name: "Tasarım & Ürün",
    color: "#ec4899",
    description: "UI/UX tasarımı, Figma, ürün yönetimi, tipografi, tasarım sistemleri, kullanıcı deneyimi, arayüz prototipleri, görsel tasarım.",
  },
  {
    id: "business-startups",
    name: "Girişimcilik & İş",
    color: "#f97316",
    description: "Startup'lar, girişimcilik, SaaS, büyüme stratejileri, pazarlama, fonlama, şirket kurma, gelir modelleri.",
  },
  {
    id: "science-tech",
    name: "Bilim & Teknoloji",
    color: "#3b82f6",
    description: "Bilimsel araştırmalar, fizik, uzay, biyoloji, donanım, yeni teknolojiler, robotik, teknoloji dünyasından son gelişmeler.",
  },
  {
    id: "productivity-life",
    name: "Üretkenlik & Not Alma",
    color: "#a855f7",
    description: "Zaman yönetimi, üretkenlik sistemleri, Obsidian, Notion, ikinci beyin, alışkanlıklar, derin çalışma, zihinsel modeller.",
  },
  {
    id: "funny-culture",
    name: "Mizah & Kültür",
    color: "#eab308",
    description: "Mizah, caps/meme, eğlenceli tweetler, popüler kültür, viral içerikler, ironik yorumlar.",
  },
  {
    id: "general",
    name: "Genel",
    color: "#64748b",
    description: "Yukarıdaki kategorilerden hiçbirine doğrudan uymayan genel veya karma içerikler.",
  },
];

export async function seedCategories() {
  for (const cat of DEFAULT_CATEGORIES) {
    await db
      .insert(categories)
      .values(cat)
      .onConflictDoUpdate({
        target: categories.id,
        set: { name: cat.name, color: cat.color, description: cat.description },
      });
  }

  // Default provider settings if not existing
  await db
    .insert(settings)
    .values({ key: "active_provider", value: "google" })
    .onConflictDoNothing();

  await db
    .insert(settings)
    .values({ key: "google_model", value: "gemini-2.5-flash" })
    .onConflictDoNothing();

  await db
    .insert(settings)
    .values({ key: "deepseek_model", value: "deepseek-chat" })
    .onConflictDoNothing();

  await db
    .insert(settings)
    .values({ key: "openrouter_model", value: "deepseek/deepseek-chat" })
    .onConflictDoNothing();

  await db
    .insert(settings)
    .values({ key: "enable_vision", value: "true" })
    .onConflictDoNothing();

  console.log("Seeding completed successfully.");
}

if (require.main === module) {
  seedCategories().catch(console.error);
}
