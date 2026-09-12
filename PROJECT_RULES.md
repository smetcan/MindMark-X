# Project-Specific AI Engineering Rules

**Document:** `PROJECT_RULES.md` · **Version:** `1.4.0`

> `UNIVERSAL_RULES.md` defines **how the agent works**. This file defines **what the agent should work with in this project**.

## 1. Project Identity

- **Project Name:** MindMark X (Package Name: `MindMark-X`)
- **Description:** Self-hosted AI-powered Twitter/X bookmark manager, knowledge curator and interactive mindmap visualizer.
- **Repository:** `https://github.com/smetcan/MindMark-X.git`
- **Primary Branch:** `main`
- **Package ID:** `MindMark-X`
- **Target:** Web application (Desktop / Localhost)
- **Status:** Active

### Discovery Metadata

- **Last Discovered:** 2026-09-11 01:05
- **Discovered By:** Antigravity AI Agent
- **Revision:** `fe150d7`
- **Status:** `VERIFIED`

## 2. Technology Stack

| Area | Technology | Version | Source | Status |
| --- | --- | --- | --- | --- |
| Language | TypeScript | `^5.7.3` | `package.json`, `tsconfig.json` | `VERIFIED` |
| Framework | Next.js (App Router) | `^15.1.7` (runtime `15.5.25`) | `package.json`, `next.config.ts` | `VERIFIED` |
| Frontend | React / React-DOM | `^19.0.0` | `package.json` | `VERIFIED` |
| UI & Styling | Tailwind CSS v4 (`@tailwindcss/postcss`) | `^4.0.9` | `package.json`, `app/globals.css` | `VERIFIED` |
| UI Components | Lucide Icons (`lucide-react`) | `^0.475.0` | `package.json` | `VERIFIED` |
| Visual Graph | XYFlow / React Flow (`@xyflow/react`) | `^12.4.4` | `package.json`, `components/mindmap-canvas.tsx` | `VERIFIED` |
| Backend | Next.js Route Handlers | `^15.1.7` | `app/api/` | `VERIFIED` |
| Database / ORM | SQLite (`sqlite.db`) via `@libsql/client` & Drizzle ORM | `^0.14.0` / `^0.39.3` | `package.json`, `lib/db/index.ts` | `VERIFIED` |
| State Management | React local state (`useState`, `useEffect`) + React Flow state | N/A | `app/page.tsx`, `components/mindmap-canvas.tsx` | `OBSERVED` |
| Testing | Custom runner (`tsx test/verify.ts`) | `tsx ^4.19.3` | `package.json`, `test/verify.ts` | `VERIFIED` |
| Build | Next.js Build (`next build`), PostCSS (`^8.5.3`) | N/A | `package.json`, `postcss.config.mjs` | `VERIFIED` |
| CI/CD | None | N/A | Repository inspection | `OBSERVED` |
| Hosting | Localhost (`http://localhost:3000`) | Node.js `v24.20.0` | `components/sidebar.tsx`, `lib/import/bookmarklet.ts` | `OBSERVED` |
| AI Engines | `@google/genai` (`^2.21.0`), `openai` (`^4.85.4`), `@anthropic-ai/sdk` (`^0.125.0`) | `^2.21.0` / `^4.85.4` / `^0.125.0` | `package.json`, `lib/ai/` | `VERIFIED` |

Record only evidence-backed facts or explicit decisions.

### Dependency Policy

- **Package Manager:** npm (lockfileVersion: 3)
- **Lock File:** `package-lock.json`
- **Approved Sources:** npm official registry
- **Update Policy:** Explicit approval required before introducing new third-party dependencies.

## 3. Architecture

### 3.1 Official Architecture

- **Pattern:** Layered Next.js App Router Architecture (Client UI Components → Next.js Route Handlers → Business Services [AI, Ingestion, DB] → LibSQL/SQLite via Drizzle ORM)
- **Status:** `VERIFIED`
- **Source / ADR:** `app/`, `components/`, `lib/` directory structure and imports

### 3.2 Module / Layer Structure

```text
MindMark X
├── app/                     # Next.js App Router (UI pages & API handlers)
│   ├── api/                 # Next.js Server Route Handlers
│   │   ├── bookmarks/       # GET (list/filter), DELETE (item or purge)
│   │   ├── import/          # POST (parse & insert), OPTIONS (CORS for bookmarklet)
│   │   ├── pipeline/        # GET (status), POST (start), DELETE (stop)
│   │   └── settings/        # GET (config/stats), POST (save), PUT (categories)
│   ├── import/              # Bookmark ingestion UI (File, Bookmarklet, Console)
│   ├── mindmap/             # Interactive graph visualization (XYFlow)
│   ├── pipeline/            # AI analysis monitor & batch trigger UI
│   ├── settings/            # AI provider & category management UI
│   ├── globals.css          # Tailwind CSS v4 setup & dark theme variables
│   ├── layout.tsx           # Root layout with persistent dark Sidebar
│   └── page.tsx             # Bookmark catalog, search & category filters
├── components/              # Reusable client components
│   ├── bookmark-card.tsx    # Bookmark presentation card with OCR snippet & AI badge
│   ├── bookmark-filter.tsx  # Search input, status selector & category pills
│   ├── mindmap-canvas.tsx   # React Flow interactive mindmap canvas with side drawer
│   └── sidebar.tsx          # Navigation sidebar with real-time stats badge
├── lib/                     # Core business logic & services
│   ├── ai/                  # AI orchestrator, prompts, sanitizer & providers
│   │   ├── anthropic.ts     # Official Anthropic Claude SDK client and Vision OCR
│   │   ├── gemini.ts        # Google Gemini text & Vision OCR integration
│   │   ├── openai-compat.ts # OpenAI, DeepSeek & OpenRouter client and Vision OCR
│   │   ├── pipeline.ts      # Concurrency-controlled background batch processor
│   │   ├── prompts.ts       # Turkish-enforced system and analysis prompts
│   │   ├── sanitizer.ts     # DeepSeek <think> tag stripper and dual-key resolver
│   │   └── types.ts         # TypeScript interfaces for AI modules
│   ├── db/                  # Database client and schema definitions
│   │   ├── index.ts         # LibSQL SQLite client and Drizzle instance
│   │   ├── schema.ts        # SQLite tables: categories, bookmarks, settings
│   │   └── seed.ts          # Default category set and initial provider settings
│   └── import/              # X bookmark ingestion and parsing
│       ├── bookmarklet.ts   # In-browser DOM bookmarklet script
│       └── parser.ts        # Archive & API schema normalizer with deduplication
└── test/                    # Verification and test scripts
    └── verify.ts            # Automated end-to-end integration test
```

### 3.3 Dependency Direction

`UI Components / Pages (app/*, components/*) → API Route Handlers (app/api/*) / Services (lib/*) → Data Access (lib/db/*) → SQLite (sqlite.db)`
Client components communicate with SQLite via Next.js REST API endpoints or server actions.

### 3.4 State Management

- **Pattern:** React local state (`useState`, `useEffect`) with polling for background async tasks; React Flow state hooks for graph nodes/edges
- **Library:** React native + `@xyflow/react` (`useNodesState`, `useEdgesState`)
- **Source:** `app/page.tsx`, `app/pipeline/page.tsx`, `components/mindmap-canvas.tsx`
- **Status:** `OBSERVED`

### 3.5 Data Access / Integration

- **Pattern:** ORM Repository pattern via Drizzle ORM
- **Database Access:** `@libsql/client` pointing to local `file:sqlite.db`
- **API Client:** Native `fetch` with JSON payloads
- **Caching:** In-memory job state in `lib/ai/pipeline.ts`; client-side debounce on filter inputs

### 3.6 Error Handling

- **Error Model:** Explicit HTTP status codes (`NextResponse.json({ error }, { status })`), try/catch blocks with fallback values
- **User-facing Handling:** Alert modals, error banners, badge states (`aiStatus`: `pending` | `processing` | `success` | `failed` with manual retry)
- **Logging:** Prefixed console logs (`[pipeline]`, `[sanitizer]`, `[gemini-ocr]`, `[openai-ocr]`, `[anthropic-ocr]`, `[openrouter-ocr]`, `[api/*]`)

### 3.7 Authentication / Authorization

- **Authentication:** None (Single-user local environment on localhost)
- **Authorization:** Unrestricted local access
- **Session / Token:** API keys (Gemini, OpenAI, Anthropic, DeepSeek, OpenRouter) stored locally in SQLite `settings` table
- **Source:** `lib/db/schema.ts`, `app/settings/page.tsx`
- **Status:** `VERIFIED`

## 4. Testing Strategy

- **Unit:** Unit-level verification of sanitizer, regex cleanup, dual-key category matching, and tag cleaning in `test/verify.ts`
- **Integration:** Ingestion parser validation and Drizzle ORM SQLite insert & deduplication in `test/verify.ts`
- **E2E/UI:** Manual UI validation across `/`, `/mindmap`, `/pipeline`, `/import`, `/settings`
- **Coverage:** N/A (no coverage package configured)
- **Threshold:** N/A
- **Test Data:** Mock tweet payloads with legacy and modern X core schemas embedded in `test/verify.ts`

## 5. Required Commands

Commands MUST come from repository configuration. Never invent them.

| Purpose | Command | Source | Status |
| --- | --- | --- | --- |
| Install | `npm install` | `package-lock.json` | `VERIFIED` |
| Format | N/A (No standalone formatter script) | `package.json` | `N/A` |
| Lint | `npm run lint` (`next lint`) | `package.json` | `UNVERIFIED` (ESLint unconfigured; prompts interactively) |
| Type Check | `npx tsc --noEmit` | `tsconfig.json` | `VERIFIED` (Passed with code 0) |
| Unit Test | `npx tsx test/verify.ts` | `package.json`, `test/verify.ts` | `VERIFIED` (Passed with code 0) |
| Integration/E2E | `npx tsx test/verify.ts` | `package.json`, `test/verify.ts` | `VERIFIED` (Passed with code 0) |
| Build | `npm run build` (`next build`) | `package.json` | `VERIFIED` (Passed with code 0, 11.2s) |
| Development | `npm run dev` (`next dev`) | `package.json` | `UNVERIFIED` (Interactive server) |
| Production Build | `npm run build` | `package.json` | `VERIFIED` |
| DB Schema Push | `npm run db:push` (`drizzle-kit push`) | `package.json`, `drizzle.config.ts` | `UNVERIFIED` |
| DB Seed | `npm run db:seed` (`tsx lib/db/seed.ts`) | `package.json`, `lib/db/seed.ts` | `UNVERIFIED` |
| Hermes Dataset Export | `npm run export:hermes` (`tsx scripts/export-hermes-dataset.ts`) | `package.json`, `scripts/export-hermes-dataset.ts` | `VERIFIED` |

`VERIFIED` = source found and command executed; `UNVERIFIED` = source found but execution unconfirmed; `UNKNOWN` = no reliable source; `N/A` = not applicable.

## 6. Code Conventions

- **Naming:** PascalCase for React components (`BookmarkCard`, `MindmapCanvas`), kebab-case for file names (`bookmark-card.tsx`, `openai-compat.ts`), camelCase for functions and variables (`parseTweetData`, `buildBookmarkPrompt`).
- **Formatting:** 2 spaces, double quotes in ts/tsx, semicolons enabled, Tailwind utility classes for styling.
- **Comments/Docs:** Turkish comments for domain rules (e.g. AI language enforcement, parser logic), standard TypeScript interfaces and JSDoc for types.
- **Logging:** Prefixed console logs for debugging and tracking: `[pipeline]`, `[sanitizer]`, `[gemini-ocr]`, `[openrouter-ocr]`, `[api/*]`.
- **Components/Files:** Next.js App Router conventions (`layout.tsx`, `page.tsx`, `route.ts`), `"use client"` directive on client-rendered components.

## 7. UI / UX Conventions

- **Design System:** Custom modern dark theme dashboard styled with Tailwind CSS v4.
- **Component Library:** Tailwind CSS v4 utility classes + Lucide Icons (`lucide-react`).
- **Typography:** System UI font stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`).
- **Color Tokens:** Background: `#09090b` (`zinc-950`), Card: `#18181b` (`zinc-900`), Border: `#27272a` (`zinc-800`), Foreground: `#f4f4f5` (`zinc-100`), Primary Accent: `#3b82f6` (blue-500), Success: `#10b981` (emerald-500), Danger: `#ef4444` (red-500).
- **Spacing:** Standard Tailwind 4px grid (`gap-3`, `p-5`, `p-6`, `p-8`).
- **Responsive Rules:** Mobile-first responsive layouts with Tailwind breakpoints (`sm:`, `md:`, `lg:`), flex-wrapping and sidebar drawer.
- **Accessibility:** Semantic HTML elements, high contrast text on dark zinc backgrounds, visible focus and active states, clear category color pills.

Do not change an established design system without the approval required by `UNIVERSAL_RULES.md`.

## 8. API / External Integrations

- **API Style:** REST JSON endpoints via Next.js Route Handlers (`app/api/*`)
- **Client:** Native browser `fetch`
- **Base URL Configuration:** Relative routes (`/api/...`) within Next.js; absolute `http://localhost:3000/api/import` used by bookmarklet script.
- **Serialization:** Standard JSON (`Content-Type: application/json`)
- **Retry / Timeout:** 3 parallel workers with error catch and failure recording per bookmark in `lib/ai/pipeline.ts`.
- **Error Mapping:** JSON `{ error: string }` with HTTP status codes (400 for bad payloads, 500 for server exceptions).
- **External Services:**
  - Google Gemini API (`@google/genai`, default model `gemini-2.5-flash`) for categorization and Vision OCR
  - OpenAI API (`https://api.openai.com/v1`, default model `gpt-4o-mini`) via official OpenAI SDK for categorization and Vision OCR
  - Anthropic Claude API (`https://api.anthropic.com`, default model `claude-3-5-haiku-20241022`) via official `@anthropic-ai/sdk` for categorization and Vision OCR
  - DeepSeek API (`https://api.deepseek.com`, model `deepseek-chat`) via OpenAI SDK
  - OpenRouter API (`https://openrouter.ai/api/v1`, model `deepseek/deepseek-chat`) via OpenAI SDK
  - Twitter / X Media CDN (`pbs.twimg.com`, `ton.twimg.com`) configured in `next.config.ts`

Breaking contract changes remain subject to universal approval.

## 9. Database

- **Database:** SQLite (`sqlite.db` local file)
- **Schema Location:** `lib/db/schema.ts`
- **Migration Tool:** Drizzle Kit (`drizzle-kit` `^0.30.4`, config `drizzle.config.ts`)
- **Migration Policy:** Schema managed via `drizzle-kit push`; any schema alteration requires explicit review.
- **Seed Data:** `lib/db/seed.ts` (seeds 9 default categories: `dev-tools`, `ai-ml`, `finance-crypto`, `design-product`, `business-startups`, `science-tech`, `productivity-life`, `funny-culture`, `general` and default settings).
- **Index Strategy:** Primary keys on `categories.id`, `bookmarks.id`, `settings.key`; unique index on `bookmarks.tweetId`; foreign key constraint on `bookmarks.categoryId` -> `categories.id` (`onDelete: "set null"`).

Never record credentials or secrets here.

## 10. Environment / Secrets

- **Environment Files:** None committed; environment variables optionally read from environment (`GOOGLE_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `DEEPSEEK_API_KEY`, `OPENROUTER_API_KEY`).
- **Secret Provider:** Local SQLite `settings` table (`sqlite.db` key-value store edited via `/settings` UI).
- **Local Setup:** Enter API keys in the `/settings` web UI; saved locally in SQLite.
- **Production Secret Handling:** Never commit secrets, API keys, or database credentials.

## 11. Build / Deployment

- **Build Targets:** Next.js production build (`.next/`) targeting Node.js runtime.
- **Deployment:** Self-hosted local server (`npm run start` or `npm run dev` at `http://localhost:3000`).
- **CI/CD:** N/A (No automated remote CI/CD pipeline).
- **Release Process:** Local verification and build (`npx tsc --noEmit && npm run build`).
- **Production Approval:** N/A (Self-hosted personal tool).

## 12. Git Workflow

- **Primary Branch:** `main`
- **Remote Origin:** `https://github.com/smetcan/MindMark-X.git`
- **Branch Prefixes:** `feat/`, `fix/`, `refactor/`, `chore/`, `docs/`.
- **Commit Convention:** Conventional Commits (`feat:`, `fix:`, `chore:`, etc.).
- **PR Requirement:** N/A (Direct repository maintainer workflow).
- **Required Checks:** `npx tsc --noEmit` and `npx tsx test/verify.ts` must pass before finishing tasks.

May add project requirements; may not weaken universal branch/merge rules.

## 13. Important Files / Entry Points

| Purpose | Path | Source / Notes |
| --- | --- | --- |
| Root Layout | `app/layout.tsx` | Base HTML, dark theme setup, persistent Sidebar |
| Dashboard Page | `app/page.tsx` | Main bookmark grid, real-time search and filters |
| Mindmap Page | `app/mindmap/page.tsx` | Interactive React Flow mindmap canvas |
| Pipeline Page | `app/pipeline/page.tsx` | AI batch categorization and progress monitor |
| Import Page | `app/import/page.tsx` | File upload dropzone, bookmarklet instructions, console script |
| Settings Page | `app/settings/page.tsx` | AI credentials and category schema management |
| Bookmarks API | `app/api/bookmarks/route.ts` | GET (filtering/search/pagination), DELETE (item or bulk) |
| Import API | `app/api/import/route.ts` | POST (batch ingest with deduplication on tweetId), OPTIONS (CORS) |
| Pipeline API | `app/api/pipeline/route.ts` | GET (status), POST (start), DELETE (stop) |
| Settings API | `app/api/settings/route.ts` | GET (config & stats), POST (save keys), PUT (category CRUD) |
| AI Pipeline Engine | `lib/ai/pipeline.ts` | Concurrency-controlled multi-worker processor |
| AI Sanitizer | `lib/ai/sanitizer.ts` | DeepSeek `<think>` block stripper and dual-key slug matcher |
| AI Prompts | `lib/ai/prompts.ts` | Turkish summary enforcement and system/user prompts |
| Gemini Client | `lib/ai/gemini.ts` | Google GenAI SDK integration and Vision OCR |
| OpenAI-compat Client | `lib/ai/openai-compat.ts` | OpenAI, DeepSeek and OpenRouter client integrations with Vision OCR |
| Anthropic Client | `lib/ai/anthropic.ts` | Official Anthropic Claude SDK integration with Vision OCR |
| Database Schema | `lib/db/schema.ts` | Drizzle ORM definitions for SQLite tables |
| Database Client | `lib/db/index.ts` | LibSQL SQLite client connection |
| Database Seed | `lib/db/seed.ts` | Default taxonomy and initial configuration seed script |
| Bookmark Parser | `lib/import/parser.ts` | Normalizer for Twitter archive, Siftly and bookmarklet JSON |
| Bookmarklet Script | `lib/import/bookmarklet.ts` | In-browser DOM scraper script for x.com/i/history (or x.com/i/bookmarks) |
| Next.js Config | `next.config.ts` | Server actions body limit and image remote patterns |
| TypeScript Config | `tsconfig.json` | Strict TypeScript compiler options |
| Drizzle Config | `drizzle.config.ts` | Drizzle Kit SQLite configuration |
| Verification Test | `test/verify.ts` | Automated end-to-end unit & integration verification |
| Hermes Dataset Script | `scripts/export-hermes-dataset.ts` | Twitter archive tweets.js to ChatML & Markdown dataset converter |
| Development Log | `DEVELOPMENT_LOG.md` | Activity data only; format governed by `UNIVERSAL_RULES.md` |

Only verified paths belong here.

## 14. Skills / MCP / External Tools

### Skills

```text
- `using-superpowers`
- `brainstorming`
- `systematic-debugging`
- `test-driven-development`
- `verification-before-completion`
- `modern-web-guidance`
- `ui-ux-pro-max`
- `frontend-design`
```

### MCP / Tools

| Tool | Purpose | Access | Required | Source |
| --- | --- | --- | --- | --- |
| `context7` | Framework and library documentation querying | Read | No | MCP config |
| `github` | Remote repository operations and issues | Read / Write | No | MCP config |
| `supabase` | Database and backend service operations | Read / Write | No | MCP config |
| `yapaykit` | Project and task tracking | Read / Write | No | MCP config |

Do not infer tool capabilities from a name alone.

## 15. Constraints and Non-Goals

### Constraints

```text
- Turkish Summary Enforcement: AI summary outputs MUST strictly be generated in Turkish, regardless of tweet origin language (lib/ai/prompts.ts).
- Self-Hosted Localhost Execution: App runs locally on Windows (Node.js localhost:3000); requires no external cloud backend.
- SQLite Compatibility: File-based SQLite operations via @libsql/client using path.resolve for Windows path safety (lib/db/index.ts).
- Bookmarklet CORS: /api/import must maintain CORS headers (Access-Control-Allow-Origin: *) to allow direct POST from x.com.
- No Guessing / Repository Reality: Verify paths, types, and commands before making changes.
```

### Non-Goals

```text
- Multi-user authentication, cloud multi-tenancy, or public SaaS deployment.
- Paid Twitter/X Official API integration (utilizes client-side bookmarklet and JSON export parsing).
- Cloud database hosting (strictly local sqlite.db).
```

Use these to prevent scope creep.

## 16. Web Quality Targets

Applies only to public/user-facing web applications/websites. Since this is a private local desktop/self-hosted web utility (`localhost:3000`), public search indexation is N/A.

### 16.1 SEO and Search Discoverability

- **SEO Required:** No (Private local application)
- **SEO Target:** N/A
- **Indexability:** N/A
- **Sitemap:** N/A
- **Robots:** N/A
- **Canonical URL Strategy:** N/A
- **Structured Data:** N/A
- **Open Graph / Social Metadata:** N/A
- **Current SEO Status:** `N/A`

### 16.2 Agentic Search Readiness

- **Required:** No
- **Content Discoverability Target:** N/A
- **Machine-readable Content:** N/A
- **Structured Information Strategy:** N/A
- **Special AI Search Files / Markup:** N/A
- **Current Status:** `N/A`

Do not record unsupported search claims.

### 16.3 Accessibility

- **Accessibility Required:** Yes (Local UI readability and usability)
- **Target Standard:** Dark Theme High-Contrast (Tailwind zinc palette)
- **Keyboard Accessibility:** Partial (Standard browser navigation for form inputs and action buttons)
- **Screen Reader Support:** Partial
- **Color Contrast Target:** High contrast zinc scale (`zinc-100` text against `zinc-950` / `zinc-900` surfaces)
- **Reduced Motion:** Standard CSS transitions
- **Current Status:** `OBSERVED`

### 16.4 Performance

- **Performance Priority:** High (Fast local navigation & smooth React Flow graph interactions)
- **Lighthouse Target:** N/A (Local personal tool)
- **Performance Target:** Sub-second page loads, responsive filtering, and seamless canvas zooming
- **LCP Target:** N/A
- **INP Target:** N/A
- **CLS Target:** N/A
- **Performance Budget:** N/A
- **Real User Monitoring:** N/A
- **Current Status:** `OBSERVED`

### 16.5 Web Quality Validation

- **Lighthouse:** N/A
- **SEO:** N/A
- **Accessibility:** Manual visual verification
- **Performance:** Next.js production build output metrics (`npm run build`)
- **Representative Routes:** `/`, `/mindmap`, `/pipeline`, `/import`, `/settings`
- **Mobile/Desktop Required:** Desktop primary (Windows localhost)

### 16.6 Web Quality Discovery

For web projects, inspect relevant framework/config, metadata, routing, `robots.txt`, sitemap, structured data and quality tooling.

`DECLARED` = explicit target; `VERIFIED` = confirmed; `OBSERVED` = observed; `UNKNOWN` = insufficient evidence. Never invent targets.

## 17. Project Discovery Protocol

### Trigger

Run onboarding discovery **before implementation** when:

- this file is newly introduced,
- core sections contain placeholders,
- `Configuration Status` is not `VERIFIED`,
- repository evidence may have materially changed,
- the user requests onboarding/discovery.

If current and verified, use targeted discovery only.

### Procedure

```text
1. Git baseline
2. Dependency manifests/locks
3. Build/tool configuration
4. Test configuration
5. Source tree/entry points
6. Docs/ADRs
7. CI/CD/deployment
8. Web Quality Targets evidence (web projects)
9. Compare with this file
10. Update evidence-backed fields
11. Verify critical commands when safe
12. Record unknowns/conflicts
13. Update Discovery Metadata
```

### Evidence Rules

- Prefer concrete evidence over inference.
- Record `Source` for important facts.
- Keep `OBSERVED` separate from `DECLARED`.
- Never invent commands, versions, architecture, policies, targets or production behavior.
- If evidence conflicts and intent is unclear, record the conflict and request clarification.

### Safe Self-Update

Agent MAY update this file during discovery; updates must be targeted, evidence-backed, durable, secret-free and project-configuration-only.

## 18. Maintenance Protocol

Update for durable changes to framework/language, major dependencies, commands, architecture, CI/CD, conventions, tools, important paths or declared quality targets. Do not update for every small implementation change.

## 19. ADRs

- **ADR Location:** N/A (No ADR documentation directory in repository)
- **ADR Convention:** N/A

Observations are not official architecture decisions without an explicit decision/ADR.

## 20. Project-Specific Definition of Done

```text
[ ] npx tsc --noEmit passes with zero TypeScript errors
[ ] npx tsx test/verify.ts passes all automated test suites
[ ] npm run build compiles successfully and generates all static/dynamic routes
[ ] Turkish summary requirement strictly preserved in prompts and AI handlers
[ ] SQLite schema integrity and Windows file path safety preserved
[ ] DEVELOPMENT_LOG.md updated per UNIVERSAL_RULES.md canonical schema
```

For web projects, add only genuinely required SEO/accessibility/performance/Lighthouse checks.

Universal completion requirements remain mandatory.

## 21. Configuration Integrity

Entries may be `VERIFIED`, `OBSERVED`, `DECLARED`, `UNVERIFIED`, `UNKNOWN` or `N/A`.

Do not label facts `VERIFIED` or `DECLARED` without evidence or an explicit project decision.

### Known Conflicts / Observations:
- **Git Status:** Git repository initialized with `main` tracking remote `origin` (`https://github.com/smetcan/MindMark-X.git`).
- **Linter Status:** `npm run lint` (`next lint`) is unconfigured in this Next.js 15 repository; running it triggers an interactive setup prompt.

If repository evidence conflicts:

1. inspect current state,
2. determine current technical reality,
3. correct the file when intent is unambiguous,
4. otherwise request human clarification.

## 22. Do Not Invent

Never invent framework/package versions, commands, architecture decisions, schema, API contracts, CI/CD providers, tool capabilities, security policies, business rules, compliance requirements, production configuration or project quality targets.