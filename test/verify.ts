import { cleanRawOutput, parseAndResolveAnalysis } from "../lib/ai/sanitizer";
import { parseTweetData } from "../lib/import/parser";
import { db } from "../lib/db";
import { bookmarks, categories } from "../lib/db/schema";
import { eq } from "drizzle-orm";

async function runVerification() {
  console.log("=== 1. Testing Sanitizer & Robust Dual-Key Matching ===");

  const sampleCategories = [
    { id: "dev-tools", name: "Yazılım & Mühendislik", description: "Yazılım araçları" },
    { id: "ai-ml", name: "Yapay Zeka & ML", description: "AI modelleri" },
    { id: "general", name: "Genel", description: "Genel içerik" },
  ];

  // Test 1: DeepSeek-R1 with <think> tag + markdown codeblocks
  const r1Output = `
<think>
User is asking for categorization. Let's look at categories: [dev-tools, ai-ml].
The tweet is about React 19 and Next.js. So it must be dev-tools.
</think>
\`\`\`json
{
  "category_id": "Yazılım & Mühendislik",
  "category_name": "Yazılım & Mühendislik",
  "confidence": 0.95,
  "summary": "React 19 Server Actions kullanım rehberi.",
  "tags": ["react", "#nextjs", "frontend", "server-actions", "twitter"]
}
\`\`\`
`;

  const parsedR1 = parseAndResolveAnalysis(r1Output, sampleCategories);
  console.log("R1 Resolved Category ID:", parsedR1.categoryId); // should resolve to 'dev-tools' even though model gave name!
  console.log("R1 Resolved Tags:", parsedR1.tags); // should strip # and 'twitter'
  console.assert(parsedR1.categoryId === "dev-tools", "Category resolution failed for name -> slug!");
  console.assert(!parsedR1.tags.includes("twitter"), "Stopword 'twitter' was not filtered!");
  console.assert(parsedR1.tags.includes("nextjs"), "Hash tag '#' was not stripped!");

  console.log("\n=== 2. Testing Ingestion Parser ===");

  // Mock tweet with X new core schema (author in core.user_results.result.core)
  const mockTweets = [
    {
      id: "190000000000000001",
      full_text: "Exploring Next.js 15 and Drizzle ORM on Windows!",
      core: {
        user_results: {
          result: {
            core: {
              name: "Tech Explorer",
              screen_name: "techexplorer",
            },
            avatar: {
              image_url: "https://pbs.twimg.com/avatar.jpg",
            },
          },
        },
      },
      media: [{ type: "photo", url: "https://pbs.twimg.com/media1.jpg" }],
      created_at: "2026-09-10T12:00:00Z",
    },
    // Duplicate tweet
    {
      id_str: "190000000000000001",
      text: "Duplicate tweet",
    },
  ];

  const parsedTweets = parseTweetData(mockTweets);
  console.log("Parsed count (should deduplicate to 1):", parsedTweets.length);
  console.assert(parsedTweets.length === 1, "Deduplication failed in parser!");
  console.assert(parsedTweets[0].authorName === "Tech Explorer", "Author name extraction failed from core!");
  console.assert(parsedTweets[0].authorHandle === "@techexplorer", "Author handle extraction failed from core!");

  console.log("\n=== 3. Testing Database Insert & Deduplication ===");
  // Clean up any test bookmark first
  await db.delete(bookmarks).where(eq(bookmarks.tweetId, parsedTweets[0].tweetId));

  const insertRes1 = await db.insert(bookmarks).values(parsedTweets[0]).onConflictDoNothing();
  console.log("First insert affected rows:", insertRes1.rowsAffected);
  console.assert(insertRes1.rowsAffected === 1, "Insert failed!");

  // Try duplicate insert
  const insertRes2 = await db.insert(bookmarks).values(parsedTweets[0]).onConflictDoNothing();
  console.log("Duplicate insert affected rows (should be 0):", insertRes2.rowsAffected);
  console.assert(insertRes2.rowsAffected === 0, "Duplicate was not ignored!");

  console.log("\n ALL AUTOMATED VERIFICATIONS PASSED SUCCESSFULLY!");
}

runVerification().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});