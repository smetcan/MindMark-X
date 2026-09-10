export type AIProviderType = "google" | "deepseek" | "openrouter";

export interface CategoryInfo {
  id: string; // slug, e.g. 'dev-tools'
  name: string; // 'Yazılım & Mühendislik'
  description: string;
}

export interface MediaItem {
  type: string;
  url: string;
}

export interface BookmarkAnalysisInput {
  tweetId: string;
  text: string;
  authorName: string;
  authorHandle: string;
  tweetUrl: string;
  media?: MediaItem[];
  visionText?: string | null;
  categories: CategoryInfo[];
}

export interface BookmarkAnalysisOutput {
  categoryId: string; // matched slug
  categoryName: string; // human readable
  confidence: number;
  summary: string;
  tags: string[];
}

export interface ProviderConfig {
  provider: AIProviderType;
  apiKey: string;
  model: string;
}