import fs from "fs";
import path from "path";

interface RawTweetItem {
  tweet: {
    id_str: string;
    full_text?: string;
    text?: string;
    created_at: string;
    in_reply_to_status_id_str?: string;
    in_reply_to_user_id_str?: string;
    in_reply_to_screen_name?: string;
    favorite_count?: string | number;
    retweet_count?: string | number;
    entities?: {
      media?: Array<{ url: string; expanded_url?: string }>;
      urls?: Array<{ url: string; expanded_url?: string }>;
      user_mentions?: Array<{ screen_name: string }>;
    };
  };
}

interface ProcessedEntry {
  id: string;
  createdAt: Date;
  dateStr: string;
  isThread: boolean;
  tweetCount: number;
  likes: number;
  retweets: number;
  text: string;
  tweets: string[];
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function cleanTweetText(rawText: string, mediaUrls: string[] = []): string {
  let cleaned = decodeHtmlEntities(rawText);

  // Remove specific media URLs embedded in entities
  for (const mediaUrl of mediaUrls) {
    cleaned = cleaned.split(mediaUrl).join("");
  }

  // Remove trailing t.co links (usually attached media or photo links)
  cleaned = cleaned.replace(/https:\/\/t\.co\/[a-zA-Z0-9]+\s*$/g, "");

  // If text starts with multiple mentions (@user1 @user2), remove them for standalone readability
  cleaned = cleaned.replace(/^(@[a-zA-Z0-9_]+\s*)+/g, "");

  // Normalize whitespace
  cleaned = cleaned.replace(/[ \t]+/g, " ").trim();

  return cleaned;
}

async function main() {
  const inputArg = process.argv[2] || "tweets.js";
  const inputPath = path.resolve(process.cwd(), inputArg);

  console.log(`\n📂 Hermes Dataset Hazırlayıcı`);
  console.log(`-----------------------------------------------`);
  console.log(`Girdi Dosyası: ${inputPath}`);

  if (!fs.existsSync(inputPath)) {
    console.error(`\n❌ Hata: '${inputPath}' dosyası bulunamadı!`);
    console.error(`Kullanım: npx tsx scripts/export-hermes-dataset.ts [tweets.js dosya yolu]`);
    console.error(`Varsayılan olarak proje ana dizinindeki 'tweets.js' aranır.\n`);
    process.exit(1);
  }

  console.log(`Dosya okunuyor ve ayrıştırılıyor...`);
  const rawFileContent = fs.readFileSync(inputPath, "utf-8");

  let tweetItems: RawTweetItem[] = [];

  try {
    if (rawFileContent.includes("window.YTD")) {
      const jsonStart = rawFileContent.indexOf("[");
      if (jsonStart !== -1) {
        tweetItems = JSON.parse(rawFileContent.slice(jsonStart));
      } else {
        throw new Error("window.YTD formatı çözülemedi.");
      }
    } else {
      tweetItems = JSON.parse(rawFileContent);
    }
  } catch (err) {
    console.error(`❌ JSON ayrıştırma hatası:`, err);
    process.exit(1);
  }

  const totalRaw = tweetItems.length;
  console.log(`Toplam ham kayıt: ${totalRaw}`);

  // 1. Filter out Retweets and invalid items
  let retweetCount = 0;
  let shortReplyCount = 0;

  interface CleanItem {
    id: string;
    createdAt: Date;
    replyToId: string | null;
    replyToUser: string | null;
    likes: number;
    retweets: number;
    text: string;
  }

  const validItems: CleanItem[] = [];

  for (const item of tweetItems) {
    const t = item.tweet || (item as any);
    if (!t || !t.id_str) continue;

    const fullText = t.full_text || t.text || "";

    // Retweet check
    if (fullText.startsWith("RT @")) {
      retweetCount++;
      continue;
    }

    const mediaUrls = (t.entities?.media || []).map((m: any) => m.url);
    const cleanedText = cleanTweetText(fullText, mediaUrls);

    // If it's a reply to someone else and very short (< 35 chars), treat as noise
    const replyToUser = t.in_reply_to_screen_name || null;
    const replyToId = t.in_reply_to_status_id_str || null;

    if (replyToUser && cleanedText.length < 35 && !replyToId) {
      shortReplyCount++;
      continue;
    }

    if (!cleanedText || cleanedText.length < 5) {
      continue;
    }

    validItems.push({
      id: t.id_str,
      createdAt: new Date(t.created_at),
      replyToId: replyToId,
      replyToUser: replyToUser,
      likes: parseInt(String(t.favorite_count || 0), 10),
      retweets: parseInt(String(t.retweet_count || 0), 10),
      text: cleanedText,
    });
  }

  // Sort chronologically (oldest to newest) to properly chain threads
  validItems.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  // 2. Thread Reconstruction
  // Map by tweet id
  const itemMap = new Map<string, CleanItem>();
  for (const item of validItems) {
    itemMap.set(item.id, item);
  }

  const childToParent = new Map<string, string>();
  for (const item of validItems) {
    if (item.replyToId && itemMap.has(item.replyToId)) {
      childToParent.set(item.id, item.replyToId);
    }
  }

  // Find root for each tweet
  function getRootId(id: string): string {
    let curr = id;
    while (childToParent.has(curr)) {
      curr = childToParent.get(curr)!;
    }
    return curr;
  }

  // Group by root id
  const threadGroups = new Map<string, CleanItem[]>();
  for (const item of validItems) {
    const root = getRootId(item.id);
    if (!threadGroups.has(root)) {
      threadGroups.set(root, []);
    }
    threadGroups.get(root)!.push(item);
  }

  // 3. Assemble final processed entries
  const processedEntries: ProcessedEntry[] = [];

  for (const [rootId, group] of threadGroups.entries()) {
    // Sort group chronologically
    group.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    const rootItem = group[0];
    const isThread = group.length > 1;
    const allTexts = group.map((g) => g.text);
    const combinedText = allTexts.join("\n\n");

    const totalLikes = group.reduce((sum, g) => sum + g.likes, 0);
    const totalRetweets = group.reduce((sum, g) => sum + g.retweets, 0);

    processedEntries.push({
      id: rootId,
      createdAt: rootItem.createdAt,
      dateStr: rootItem.createdAt.toISOString().slice(0, 10),
      isThread,
      tweetCount: group.length,
      likes: totalLikes,
      retweets: totalRetweets,
      text: combinedText,
      tweets: allTexts,
    });
  }

  // Sort processed entries newest first for output
  processedEntries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  // Statistics
  const threadCount = processedEntries.filter((p) => p.isThread).length;
  const standaloneCount = processedEntries.filter((p) => !p.isThread).length;
  const totalWords = processedEntries.reduce(
    (sum, p) => sum + p.text.split(/\s+/).length,
    0
  );

  // 4. Write Output Files
  const outputDir = path.resolve(process.cwd(), "export_hermes");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Output 1: Markdown Corpus (RAG, Knowledge Base, NotebookLM, Claude Project)
  const mdPath = path.join(outputDir, "hermes_knowledge_corpus.md");
  let mdContent = `# Hermes AI Bilgi Tabanı & Üslup Külliyatı\n\n`;
  mdContent += `> Toplam Özgün İçerik: ${processedEntries.length} adet (${threadCount} flood/thread, ${standaloneCount} bağımsız tweet) · Toplam Kelime: ~${totalWords}\n\n---\n\n`;

  for (const entry of processedEntries) {
    const typeLabel = entry.isThread ? `🧵 Thread (${entry.tweetCount} Tweet)` : `💬 Tweet`;
    mdContent += `### [${entry.dateStr}] ${typeLabel} · ❤️ ${entry.likes} · 🔁 ${entry.retweets}\n\n`;
    mdContent += `${entry.text}\n\n---\n\n`;
  }
  fs.writeFileSync(mdPath, mdContent, "utf-8");

  // Output 2: ChatML JSONL (Fine-Tuning: Axolotl, Unsloth, OpenAI, Ollama)
  const chatmlPath = path.join(outputDir, "hermes_chatml_dataset.jsonl");
  const systemPrompt = "Sen Selçuk'un teknik bilgi birikimini, analitik vizyonunu, ödeme sistemleri uzmanlığını ve düşünce tarzını benimsemiş kişisel yapay zeka asistanı Hermes'sin.";

  const jsonlLines: string[] = [];
  for (const entry of processedEntries) {
    // Generate a contextual topic prompt from the first sentence or heading
    const firstSentence = entry.text.split(/[\n.!?]/)[0].trim().slice(0, 100);
    const userPrompt = entry.isThread
      ? `Aşağıdaki konu hakkındaki kapsamlı flood/değerlendirmelerini paylaşır mısın: "${firstSentence}"`
      : `Şu konu hakkında ne düşünüyorsun: "${firstSentence}"`;

    const chatmlObj = {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
        { role: "assistant", content: entry.text },
      ],
      metadata: {
        id: entry.id,
        date: entry.dateStr,
        is_thread: entry.isThread,
        tweet_count: entry.tweetCount,
        likes: entry.likes,
      },
    };
    jsonlLines.push(JSON.stringify(chatmlObj));
  }
  fs.writeFileSync(chatmlPath, jsonlLines.join("\n"), "utf-8");

  // Output 3: Raw Text Lines (Pretraining / Embedding corpus)
  const rawPath = path.join(outputDir, "hermes_clean_texts.jsonl");
  const rawLines = processedEntries.map((e) =>
    JSON.stringify({
      id: e.id,
      date: e.dateStr,
      is_thread: e.isThread,
      tweet_count: e.tweetCount,
      text: e.text,
    })
  );
  fs.writeFileSync(rawPath, rawLines.join("\n"), "utf-8");

  console.log(`\n✅ İşlem Başarıyla Tamamlandı!`);
  console.log(`-----------------------------------------------`);
  console.log(`📊 Filtreleme & Birleştirme İstatistikleri:`);
  console.log(`  - Toplam Ham Tweet:        ${totalRaw}`);
  console.log(`  - Elenen Retweet (RT):     ${retweetCount}`);
  console.log(`  - Elenen Kısa Yanıt:       ${shortReplyCount}`);
  console.log(`  - Kurtarılan Özgün Girdi:  ${processedEntries.length}`);
  console.log(`    ├── Birleştirilen Flood: ${threadCount}`);
  console.log(`    └── Bağımsız Tweet:      ${standaloneCount}`);
  console.log(`  - Toplam Kelime Sayısı:    ~${totalWords}`);
  console.log(`\n📁 Üretilen Çıktı Dosyaları (./export_hermes/):`);
  console.log(`  1. hermes_knowledge_corpus.md -> RAG, NotebookLM, Claude Projects veya System Prompt`);
  console.log(`  2. hermes_chatml_dataset.jsonl -> LoRA / Fine-tuning (Unsloth, Axolotl, Llama)`);
  console.log(`  3. hermes_clean_texts.jsonl    -> Vektör veritabanları & gömme (embeddings)`);
  console.log(`-----------------------------------------------\n`);
}

main().catch((err) => {
  console.error("Beklenmeyen hata:", err);
  process.exit(1);
});
