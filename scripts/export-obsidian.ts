import fs from "fs";
import path from "path";
import { db } from "../lib/db";
import { bookmarks, categories } from "../lib/db/schema";
import { eq } from "drizzle-orm";

function sanitizeFileName(name: string): string {
  // Remove characters not allowed in Windows filenames: \ / : * ? " < > |
  return name
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  const defaultVaultPath = "C:\\Users\\smetc\\Documents\\Obsidian Vault\\30-Kaynaklar\\X Yer İmlerim";
  const targetDir = path.resolve(process.argv[2] || defaultVaultPath);

  console.log(`\n🟣 MindMark-X -> Obsidian Vault Senkronizasyonu`);
  console.log(`--------------------------------------------------`);
  console.log(`Hedef Vault Klasörü: ${targetDir}`);

  if (!fs.existsSync(targetDir)) {
    console.log(`Hedef klasör oluşturuluyor: ${targetDir}`);
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // 1. Fetch categories for name mapping
  const allCategories = await db.select().from(categories);
  const categoryMap = new Map<string, string>();
  for (const cat of allCategories) {
    categoryMap.set(cat.id, cat.name);
  }

  // 2. Fetch all bookmarks with aiStatus === 'success'
  const allBookmarks = await db.select().from(bookmarks);
  const successfulBookmarks = allBookmarks.filter((b) => b.aiStatus === "success");

  console.log(`Veritabanında analiz edilmiş ${successfulBookmarks.length} yer imi bulundu.\n`);

  let createdCount = 0;
  let skippedCount = 0;

  // Group by category for index generation
  const categoryGroups = new Map<string, Array<{ fileName: string; title: string; author: string; date: string }>>();

  for (const bm of successfulBookmarks) {
    const catId = bm.categoryId || "general";
    const categoryName = categoryMap.get(catId) || "Genel";

    // Category folder inside vault
    const safeCategoryFolderName = sanitizeFileName(categoryName);
    const categoryFolderPath = path.join(targetDir, safeCategoryFolderName);
    if (!fs.existsSync(categoryFolderPath)) {
      fs.mkdirSync(categoryFolderPath, { recursive: true });
    }

    // Parse tags
    let tagsList: string[] = ["x-bookmark"];
    if (bm.tags) {
      try {
        const parsed = JSON.parse(bm.tags);
        if (Array.isArray(parsed)) {
          tagsList.push(...parsed.map((t: string) => String(t).toLowerCase().replace(/[\s_]+/g, "-")));
        }
      } catch (err) {
        /* ignore */
      }
    }
    // Add category slug as tag
    tagsList.push(catId.toLowerCase());
    // Deduplicate tags
    tagsList = Array.from(new Set(tagsList));

    // Date formatting
    const dateObj = bm.createdAt || bm.importedAt || new Date();
    const dateStr = dateObj instanceof Date ? dateObj.toISOString().slice(0, 10) : String(dateObj).slice(0, 10);

    // Clean title for filename
    let shortSummary = "";
    if (bm.summary) {
      shortSummary = bm.summary.split(/[\n.!?]/)[0].trim().slice(0, 45);
    } else {
      shortSummary = bm.text.split(/[\n.!?]/)[0].trim().slice(0, 45);
    }
    const safeTitle = sanitizeFileName(shortSummary || bm.tweetId);
    const cleanHandle = (bm.authorHandle || "@unknown").replace(/^@/, "");
    const fileName = `${dateStr} - @${cleanHandle} - ${safeTitle}.md`;
    const filePath = path.join(categoryFolderPath, fileName);

    // Build Markdown Content
    const frontmatter = [
      "---",
      `id: "${bm.tweetId}"`,
      `url: "${bm.tweetUrl}"`,
      `author: "${bm.authorName.replace(/"/g, '\\"')}"`,
      `handle: "${bm.authorHandle}"`,
      `date: ${dateStr}`,
      `category: "[[${categoryName}]]"`,
      "tags:",
      ...tagsList.map((t) => `  - ${t}`),
      "---",
    ].join("\n");

    let mdBody = `\n# ${bm.authorName} (${bm.authorHandle})\n\n`;

    if (bm.summary) {
      mdBody += `> [!abstract] 🤖 Yapay Zeka Özeti (Türkçe)\n`;
      mdBody += `> ${bm.summary.replace(/\n/g, "\n> ")}\n\n`;
    }

    mdBody += `### 💬 Orijinal Paylaşım\n\n${bm.text}\n\n`;

    if (bm.visionText) {
      mdBody += `### 🖼️ Görsel / OCR Notları\n\n${bm.visionText}\n\n`;
    }

    mdBody += `---\n🔗 **Kaynak:** [X'te Görüntüle](${bm.tweetUrl})\n`;

    const fullContent = `${frontmatter}\n${mdBody}`;

    // Incremental write check
    if (fs.existsSync(filePath)) {
      const existing = fs.readFileSync(filePath, "utf-8");
      if (existing === fullContent) {
        skippedCount++;
      } else {
        fs.writeFileSync(filePath, fullContent, "utf-8");
        createdCount++;
      }
    } else {
      fs.writeFileSync(filePath, fullContent, "utf-8");
      createdCount++;
    }

    // Record for index
    if (!categoryGroups.has(categoryName)) {
      categoryGroups.set(categoryName, []);
    }
    categoryGroups.get(categoryName)!.push({
      fileName: `${safeCategoryFolderName}/${fileName}`,
      title: shortSummary || bm.authorName,
      author: bm.authorHandle,
      date: dateStr,
    });
  }

  // 3. Generate Master Index (Fihrist)
  const indexFilePath = path.join(targetDir, "📌 X Yer İmleri Fihristi.md");
  let indexContent = `# 📌 X Yer İmleri Fihristi\n\n`;
  indexContent += `> MindMark-X tarafından otomatik senkronize edilmiştir. Son güncelleme: ${new Date().toLocaleString("tr-TR")}\n\n`;
  indexContent += `**Toplam Yer İmi:** ${successfulBookmarks.length} adet · **Kategori Sayısı:** ${categoryGroups.size}\n\n---\n\n`;

  indexContent += `## 🗂️ Kategoriler\n\n`;
  for (const [catName, items] of categoryGroups.entries()) {
    indexContent += `### 📁 [[${catName}]] (${items.length} Not)\n\n`;
    for (const item of items.slice(0, 10)) {
      indexContent += `- [[${item.fileName.replace(/\.md$/, "")}|${item.date} — ${item.author}: ${item.title}]]\n`;
    }
    if (items.length > 10) {
      indexContent += `- *...ve ${items.length - 10} not daha.*\n`;
    }
    indexContent += `\n`;
  }

  indexContent += `---\n\n## 📊 Dataview Sorgusu (Obsidian Dataview Eklentisi Varsa)\n\n`;
  indexContent += "```dataview\n";
  indexContent += 'TABLE author, date, category FROM "30-Kaynaklar/X Yer İmlerim"\n';
  indexContent += 'WHERE file.name != "📌 X Yer İmleri Fihristi"\n';
  indexContent += "SORT date DESC\n";
  indexContent += "LIMIT 50\n";
  indexContent += "```\n";

  fs.writeFileSync(indexFilePath, indexContent, "utf-8");

  console.log(`--------------------------------------------------`);
  console.log(`✅ Senkronizasyon Başarıyla Tamamlandı!`);
  console.log(`  - Yeni / Güncellenen Not: ${createdCount}`);
  console.log(`  - Değişmemiş (Atlanan):   ${skippedCount}`);
  console.log(`  - Toplam Senkronize:     ${successfulBookmarks.length}`);
  console.log(`  - Oluşturulan Fihrist:    ${indexFilePath}`);
  console.log(`--------------------------------------------------\n`);
}

main().catch((err) => {
  console.error("Hata:", err);
  process.exit(1);
});
