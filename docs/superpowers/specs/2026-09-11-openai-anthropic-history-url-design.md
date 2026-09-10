# Design Specification: OpenAI & Anthropic AI Providers and X History URL Update

- **Date:** 2026-09-11
- **Status:** Approved
- **Topic:** Adding OpenAI & Anthropic providers, updating X bookmarks URL to x.com/i/history

---

## 1. Objectives

1. **X Bookmarks URL Update:**
   - Update instructions, UI links, and documentation from `x.com/i/bookmarks` to `x.com/i/history` to reflect the updated Twitter/X interface, while maintaining backward-compatible references for users on legacy layouts.

2. **Official Anthropic SDK Integration:**
   - Install and integrate `@anthropic-ai/sdk`.
   - Implement `analyzeWithAnthropic` and `extractOcrWithAnthropic` in `lib/ai/anthropic.ts`.
   - Set default model to `claude-3-5-haiku-20241022`, while allowing user customization in the settings UI.

3. **OpenAI Provider Integration:**
   - Leverage the existing `openai` package (`^4.85.4`) to support official OpenAI API endpoints (`https://api.openai.com/v1`).
   - Add Vision OCR support for OpenAI (`extractOcrWithOpenAI`).
   - Set default model to `gpt-4o-mini`, while allowing user customization in the settings UI.

4. **UI & Settings Management:**
   - Add OpenAI and Anthropic to the provider switcher in `app/settings/page.tsx`.
   - Add credential and model input fields for both providers.
   - Update `app/pipeline/page.tsx` to reflect active model names for OpenAI and Anthropic.
   - Seed default settings for `openai_model` and `anthropic_model` in `lib/db/seed.ts`.

5. **Documentation & Governance:**
   - Update `PROJECT_RULES.md` and `README.md` to reflect new providers and updated package dependencies.
   - Maintain Turkish summary enforcement in prompt handling.
   - Record changes in `DEVELOPMENT_LOG.md`.

---

## 2. Architecture & Component Changes

### 2.1 Dependencies
- **New Package:** `@anthropic-ai/sdk` added to `dependencies` via `npm install @anthropic-ai/sdk`.
- **Existing Package:** `openai` (`^4.85.4`) reused for official OpenAI endpoints.

### 2.2 Core AI Types (`lib/ai/types.ts`)
- Update `AIProviderType`:
  ```typescript
  export type AIProviderType = "google" | "deepseek" | "openrouter" | "openai" | "anthropic";
  ```

### 2.3 Anthropic Client Module (`lib/ai/anthropic.ts`)
- Implements:
  - `analyzeWithAnthropic(input: BookmarkAnalysisInput, apiKey: string, model?: string): Promise<BookmarkAnalysisOutput>`
    - Uses `anthropic.messages.create` with `system` parameter (`buildSystemPrompt()`), user prompt (`buildBookmarkPrompt(input)`), and JSON parsing via `parseAndResolveAnalysis`.
  - `extractOcrWithAnthropic(imageUrl: string, apiKey: string, model?: string): Promise<string>`
    - Fetches image, converts to base64, passes as an `image` content block with `buildVisionPrompt()`.

### 2.4 OpenAI & OpenAI-Compat Module (`lib/ai/openai-compat.ts`)
- Add `extractOcrWithOpenAI(imageUrl: string, apiKey: string, model?: string): Promise<string>`:
  - Uses `client.chat.completions.create` with `image_url` and `buildVisionPrompt()`.
- Reuses `analyzeWithOpenAICompat` for `openai` provider by passing `baseURL: "https://api.openai.com/v1"`.

### 2.5 AI Pipeline Orchestrator (`lib/ai/pipeline.ts`)
- Load `openai_api_key` and `anthropic_api_key` from SQLite `settings` (with environment fallbacks `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`).
- Validate presence of API key when active provider is `openai` or `anthropic`.
- Dispatch to `extractOcrWithOpenAI` or `extractOcrWithAnthropic` in Vision OCR step.
- Dispatch to `analyzeWithOpenAICompat` (with OpenAI endpoint) or `analyzeWithAnthropic` in Categorization step.

### 2.6 Database & Seed (`lib/db/seed.ts`)
- Insert default settings:
  - `key: "openai_model"`, `value: "gpt-4o-mini"`
  - `key: "anthropic_model"`, `value: "claude-3-5-haiku-20241022"`

### 2.7 UI Components
- **`app/settings/page.tsx`**:
  - Add 2 new options to provider selector:
    - OpenAI (`api.openai.com`)
    - Anthropic Claude (`api.anthropic.com`)
  - Add form cards with password inputs for API keys and text inputs for models.
- **`app/pipeline/page.tsx`**:
  - Resolve active model for `openai` and `anthropic`.
- **`app/import/page.tsx`**:
  - Update instructions and link to `x.com/i/history`.

---

## 3. Verification Plan

1. **Static Analysis & Type Checking:**
   - Run `npx tsc --noEmit` to verify type alignment across all updated files.
2. **Automated Verification:**
   - Run `npx tsx test/verify.ts` to ensure existing parsing and database routines are untouched.
3. **Build Verification:**
   - Run `npm run build` to confirm static and dynamic Next.js compilation succeeds without runtime/SSR errors.
4. **Git & Documentation Verification:**
   - Check `git status`, update `PROJECT_RULES.md` and `DEVELOPMENT_LOG.md`.
