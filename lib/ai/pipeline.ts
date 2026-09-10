import { db } from "../db";
import { bookmarks, categories, settings, type Bookmark } from "../db/schema";
import { eq, or, inArray, and } from "drizzle-orm";
import { analyzeWithGemini, extractOcrWithGemini } from "./gemini";
import { analyzeWithAnthropic, extractOcrWithAnthropic } from "./anthropic";
import { analyzeWithOpenAICompat, extractOcrWithOpenAI, extractOcrWithOpenRouter } from "./openai-compat";
import { BookmarkAnalysisInput, CategoryInfo } from "./types";

interface PipelineState {
  isRunning: boolean;
  shouldStop: boolean;
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  currentTweet?: string;
  error?: string | null;
}

const state: PipelineState = {
  isRunning: false,
  shouldStop: false,
  total: 0,
  processed: 0,
  succeeded: 0,
  failed: 0,
};

export function getPipelineStatus(): PipelineState {
  return { ...state };
}

export function stopPipeline(): void {
  if (state.isRunning) {
    state.shouldStop = true;
  }
}

export async function startPipeline(options: {
  forceAll?: boolean;
  bookmarkIds?: string[];
} = {}): Promise<{ started: boolean; message: string }> {
  if (state.isRunning) {
    return { started: false, message: "Pipeline is already running." };
  }

  // Load all settings
  const settingsRows = await db.select().from(settings);
  const config = new Map(settingsRows.map((s) => [s.key, s.value]));

  const provider = config.get("active_provider") || "google";
  const googleKey = config.get("google_api_key") || process.env.GOOGLE_API_KEY || "";
  const deepseekKey = config.get("deepseek_api_key") || process.env.DEEPSEEK_API_KEY || "";
  const openrouterKey = config.get("openrouter_api_key") || process.env.OPENROUTER_API_KEY || "";
  const openaiKey = config.get("openai_api_key") || process.env.OPENAI_API_KEY || "";
  const anthropicKey = config.get("anthropic_api_key") || process.env.ANTHROPIC_API_KEY || "";
  const enableVision = config.get("enable_vision") === "true";

  // Validate API key for active provider
  if (provider === "google" && !googleKey) {
    throw new Error("Google Gemini API Key is missing. Please set it in Settings.");
  }
  if (provider === "openai" && !openaiKey) {
    throw new Error("OpenAI API Key is missing. Please set it in Settings.");
  }
  if (provider === "anthropic" && !anthropicKey) {
    throw new Error("Anthropic API Key is missing. Please set it in Settings.");
  }
  if (provider === "deepseek" && !deepseekKey) {
    throw new Error("DeepSeek API Key is missing. Please set it in Settings.");
  }
  if (provider === "openrouter" && !openrouterKey) {
    throw new Error("OpenRouter API Key is missing. Please set it in Settings.");
  }

  // Fetch categories
  const catRows = await db.select().from(categories);
  const catList: CategoryInfo[] = catRows.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
  }));

  // Query bookmarks to process
  let targetBookmarks: Bookmark[] = [];
  if (options.bookmarkIds && options.bookmarkIds.length > 0) {
    targetBookmarks = await db
      .select()
      .from(bookmarks)
      .where(inArray(bookmarks.id, options.bookmarkIds));
  } else if (options.forceAll) {
    targetBookmarks = await db.select().from(bookmarks);
  } else {
    targetBookmarks = await db
      .select()
      .from(bookmarks)
      .where(or(eq(bookmarks.aiStatus, "pending"), eq(bookmarks.aiStatus, "failed")));
  }

  if (targetBookmarks.length === 0) {
    return { started: false, message: "No bookmarks to analyze." };
  }

  // Initialize state
  state.isRunning = true;
  state.shouldStop = false;
  state.total = targetBookmarks.length;
  state.processed = 0;
  state.succeeded = 0;
  state.failed = 0;
  state.error = null;

  // Run in background asynchronously
  (async () => {
    const CONCURRENCY = 3;
    let index = 0;

    async function processNext(): Promise<void> {
      while (index < targetBookmarks.length) {
        if (state.shouldStop) break;

        const bm = targetBookmarks[index++];
        if (!bm) break;

        state.currentTweet = `${bm.authorName}: ${bm.text.slice(0, 80)}...`;

        try {
          // Parse media
          let mediaItems: { type: string; url: string }[] = [];
          if (bm.media) {
            try {
              mediaItems = JSON.parse(bm.media);
            } catch { /* ignore */ }
          }

          // Step 1: Optional Vision OCR
          let visionText = bm.visionText;
          if (enableVision && !visionText && mediaItems.length > 0) {
            const photo = mediaItems.find((m) => m.type === "photo" && m.url);
            if (photo) {
              if (provider === "google" && googleKey) {
                visionText = await extractOcrWithGemini(
                  photo.url,
                  googleKey,
                  config.get("google_model") || "gemini-2.5-flash"
                );
              } else if (provider === "openai" && openaiKey) {
                visionText = await extractOcrWithOpenAI(
                  photo.url,
                  openaiKey,
                  config.get("openai_model") || "gpt-4o-mini"
                );
              } else if (provider === "anthropic" && anthropicKey) {
                visionText = await extractOcrWithAnthropic(
                  photo.url,
                  anthropicKey,
                  config.get("anthropic_model") || "claude-3-5-haiku-20241022"
                );
              } else if (provider === "openrouter" && openrouterKey) {
                visionText = await extractOcrWithOpenRouter(
                  photo.url,
                  openrouterKey,
                  config.get("openrouter_model") || "google/gemini-flash-1.5"
                );
              }
            }
          }

          // Step 2: Categorization & Tagging
          const input: BookmarkAnalysisInput = {
            tweetId: bm.tweetId,
            text: bm.text,
            authorName: bm.authorName,
            authorHandle: bm.authorHandle,
            tweetUrl: bm.tweetUrl,
            media: mediaItems,
            visionText,
            categories: catList,
          };

          let result;
          if (provider === "google") {
            result = await analyzeWithGemini(
              input,
              googleKey,
              config.get("google_model") || "gemini-2.5-flash"
            );
          } else if (provider === "openai") {
            result = await analyzeWithOpenAICompat(
              input,
              openaiKey,
              "https://api.openai.com/v1",
              config.get("openai_model") || "gpt-4o-mini"
            );
          } else if (provider === "anthropic") {
            result = await analyzeWithAnthropic(
              input,
              anthropicKey,
              config.get("anthropic_model") || "claude-3-5-haiku-20241022"
            );
          } else if (provider === "deepseek") {
            result = await analyzeWithOpenAICompat(
              input,
              deepseekKey,
              "https://api.deepseek.com",
              config.get("deepseek_model") || "deepseek-chat"
            );
          } else {
            result = await analyzeWithOpenAICompat(
              input,
              openrouterKey,
              "https://openrouter.ai/api/v1",
              config.get("openrouter_model") || "deepseek/deepseek-chat"
            );
          }

          // Step 3: Write success to DB
          await db
            .update(bookmarks)
            .set({
              categoryId: result.categoryId,
              summary: result.summary,
              tags: JSON.stringify(result.tags),
              visionText: visionText || null,
              aiStatus: "success",
              aiError: null,
            })
            .where(eq(bookmarks.id, bm.id));

          state.succeeded++;
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          console.error(`[pipeline] Error analyzing bookmark ${bm.tweetId}:`, errMsg);

          await db
            .update(bookmarks)
            .set({
              aiStatus: "failed",
              aiError: errMsg,
            })
            .where(eq(bookmarks.id, bm.id));

          state.failed++;
        } finally {
          state.processed++;
        }
      }
    }

    const workers = Array.from({ length: CONCURRENCY }, () => processNext());
    await Promise.all(workers);

    state.isRunning = false;
    state.shouldStop = false;
    state.currentTweet = undefined;
  })().catch((err) => {
    console.error("[pipeline] Critical pipeline error:", err);
    state.isRunning = false;
    state.error = err instanceof Error ? err.message : String(err);
  });

  return { started: true, message: `Pipeline started for ${targetBookmarks.length} bookmarks.` };
}