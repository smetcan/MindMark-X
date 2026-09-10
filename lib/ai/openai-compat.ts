import OpenAI from "openai";
import { BookmarkAnalysisInput, BookmarkAnalysisOutput } from "./types";
import { buildSystemPrompt, buildBookmarkPrompt, buildVisionPrompt } from "./prompts";
import { parseAndResolveAnalysis } from "./sanitizer";

export async function analyzeWithOpenAICompat(
  input: BookmarkAnalysisInput,
  apiKey: string,
  baseURL: string,
  model: string = "deepseek-chat"
): Promise<BookmarkAnalysisOutput> {
  const client = new OpenAI({
    apiKey,
    baseURL,
    defaultHeaders: baseURL.includes("openrouter")
      ? {
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "X Bookmark Manager",
        }
      : undefined,
  });

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildBookmarkPrompt(input);

  const completion = await client.chat.completions.create({
    model: model || "deepseek-chat",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });

  const rawText = completion.choices[0]?.message?.content || "";
  return parseAndResolveAnalysis(rawText, input.categories, input.text);
}

export async function extractOcrWithOpenRouter(
  imageUrl: string,
  apiKey: string,
  model: string = "google/gemini-flash-1.5"
): Promise<string> {
  try {
    const client = new OpenAI({
      apiKey,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "X Bookmark Manager",
      },
    });

    const completion = await client.chat.completions.create({
      model: model || "google/gemini-flash-1.5",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: buildVisionPrompt() },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
      temperature: 0.1,
    });

    return (completion.choices[0]?.message?.content || "").trim();
  } catch (err) {
    console.warn("[openrouter-ocr] Failed to extract OCR:", err);
    return "";
  }
}