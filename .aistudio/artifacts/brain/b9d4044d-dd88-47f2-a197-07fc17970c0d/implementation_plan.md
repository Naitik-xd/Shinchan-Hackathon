# LUMEN: Digital Dark Spot Detector

> A specialized AI-assisted information-gap intelligence platform that shifts user paradigm from "summarizing what is present" to **detecting what is missing, contradictory, and outdated** across multiple sources before high-stakes decisions.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions were confirmed via interactive user clarification and the DEVENGERS Master Plan:
>
> 1. **Interactive 3D Hero Element**: We will build an interactive procedural 3D glass orb and dark-spot spotlight using Three.js with software-WebGL fallbacks, ambient room lighting, and zero external asset dependencies.
> 2. **Featured Demo Showcase**: The primary featured sample scenario loaded on first-click will be the **"Tech Job Offer Verification"** (featuring hidden 4-year vesting cliff conflicts, unmentioned non-compete clauses, and outdated 2023 remote stipend benefits), accompanied by the **Scholarship Application** and **Coding Bootcamp Admission** scenarios.
> 3. **Gemini Vision Fallback**: When in-browser OCR confidence is low (< 65%), an automatic badge prompt with a single-click "Analyze with Gemini Vision" trigger will be displayed above the editable extracted text preview.
> 4. **Strict Server-Side Key Isolation**: All Gemini 2.5/3.8 API calls run exclusively on the Node/Express backend (`/api/extract`, `/api/analyze`, `/api/enrich`, `/api/vision-read`). No API keys or Gemini SDK imports will ever touch the browser.

---

### 1. Overview & Core Concept

- **What It Does**: Search engines index information; summarizers compress it. **Lumen reveals the dark spots**: the hidden omissions, conflicting claims between documents, stale time references, and critical unverified assumptions. Users provide a decision goal or question alongside source documents (pasted text, live URLs, digital PDFs, or scanned brochure images).
- **Target Audience**: Students applying for scholarships/admissions, job candidates evaluating employment offers, researchers vetting claims, and small-business founders validating vendor contracts or grants.
- **Core Value Proposition**:
  - **Three-Tier Evidence System**: Every statement is tagged as 🟢 **Sourced** (from user sources with verbatim snippets), 🟣 **AI-Found** (grounded via Google Search with verifiable citation links), or 🟠 **Uncertain** (identified gaps and conflicts).
  - **Evidence Coverage Meter**: Tracks vital decision dimensions (eligibility, compensation, renewal, clawbacks, deadlines, required documents).
  - **Click-to-Evidence Drawer**: Clicking any finding instantly opens the exact source document with the supporting snippet highlighted in context.
  - **Actionable Verification Checklist**: A prioritized verification checklist with checkable items, localStorage persistence, and Markdown/clipboard export.

---

### 2. User Experience & Visual Design

#### Key User Flows
1. **Landing & Exploration**: The user arrives at an uncluttered, high-contrast workspace featuring the interactive 3D spotlight hero. They can immediately pick a sample scenario (Job Offer, Scholarship, or Bootcamp) or enter their own custom goal.
2. **Multi-Source Ingestion & In-Browser Processing**:
   - The user inputs text, web URLs, or uploads PDF/image files.
   - Digital PDFs are extracted client-side via `pdfjs-dist`; scanned pages and images are processed via `tesseract.js` in the browser with real-time per-page progress.
   - An **editable extraction preview** allows users to correct OCR text before sending. If OCR confidence is low, a quick "Use Gemini Vision" badge appears.
3. **Pipeline Execution & Real-Time Progress**:
   - Clicking **"Analyze Sources"** starts the 3-phase pipeline.
   - The UI presents a dynamic progress stepper: *Extracting facts (S1, S2...) → Cross-comparing gaps & conflicts → Grounded search enrichment → Compiling verification checklist*.
4. **Interactive Intelligence Dashboard**:
   - **Overview**: Confidence gauge, evidence coverage bars, model attribution notice, and legal disclaimer.
   - **Gaps & Omissions**: High/Medium/Low severity cards with "Why It Matters" and grounded search suggestions.
   - **Conflicts**: Side-by-side comparison cards (e.g., S1 vs S2) with exact snippets.
   - **Freshness & Timeline**: Source chronology, flagging undated or stale cycle references.
   - **Credibility Signals**: Rubric-based signals (domain, freshness, corroboration, authorship, reputation) with explicit reasons—never an arbitrary score.
   - **Verify-Next Checklist**: Interactive priority checklist with progress tracking and Markdown export.
   - **Source Viewer**: Fly-out drawer showing full extracted text with highlighted snippet locator.

#### Visual Identity & Theme
- **Color Discipline (60-30-10)**:
  - *Dark Canvas (60%)*: Deep ink `#0B0D12`, structural cards `#12151D`, subtle hairline border `#232838`.
  - *Light Canvas (60%)*: Warm crisp white `#F7F7FB`, surface `#FFFFFF`, border `#E3E5EE`.
  - *Semantic Accents (10%)*: Indigo `#6366F1` (primary action), Violet `#8B5CF6` (AI-found tier), Emerald `#10B981` (Sourced tier), Amber `#F59E0B` (Uncertain/Outdated), Rose `#F43F5E` (High severity conflict).
- **Typography & Formatting**:
  - Headings: `Plus Jakarta Sans` / `Outfit` for geometric clarity.
  - Body: `DM Sans` / `Inter` with 1.6 line height and balanced headings (`text-wrap: balance`).
  - Data & Snippets: `JetBrains Mono` with tabular numerals (`tabular-nums`).
  - Zero-Pill Rule: Metadata displayed with quiet typographic separators (`·` and `/`) instead of garish badge sandwiches.
- **Theme Toggle**: Accessible dark/light mode toggle with persistent `localStorage` support and no hydration flash.

---

### 3. Key Product Decisions & Trade-Offs

| Decision Area | Selected Approach | Rationale & Trade-Offs |
|---|---|---|
| **Multi-Stage API Architecture** | 3 separate endpoints: `/api/extract`, `/api/analyze`, `/api/enrich` | Keeps individual serverless execution times well under limits, enables progressive dashboard rendering, and isolates search grounding from strict JSON schemas. |
| **Search Grounding vs JSON Schema** | `/api/enrich` uses Google Search grounding with lenient JSON parsing & Zod validation | Gemini grounding tools cannot be combined with strict `responseSchema` on certain models. Real citation URLs are extracted directly from `groundingMetadata`. |
| **Model Selection & Fallback** | `gemini-2.5-flash` → `gemini-3.8-flash` → `gemini-2.5-flash-lite` | Provides high-speed analysis with automatic failover if rate limits or model quota thresholds are encountered. The model used is displayed in the UI. |
| **File Processing Strategy** | Client-side text parsing (`pdfjs-dist`) & OCR (`tesseract.js`) | Zero server file uploads; preserves privacy and prevents heavy server memory spikes. Only sanitized text payloads are sent to backend routes. |
| **SSRF & Input Defense** | Server-side URL validator blocking private/loopback/metadata IP ranges | Prevents Server-Side Request Forgery when users provide URLs; enforces a 10s fetch timeout and 2MB payload cap. |
| **Persistence** | Browser `localStorage` for analysis history and checklist state | Zero server database required; 100% stateless backend with private history remaining strictly on the user's device. |

---

### 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT BROWSER (React + Vite)                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│  [Hero + 3D Spotlight]     [Theme Toggle]      [Sample Scenario Selector]       │
│                                                                                 │
│  [Input Panel: Goal / Question + Sources (Pasted Text | URLs | Files)]          │
│       │                                                                         │
│       ├─► pdfjs-dist (Digital PDF text extractor)                               │
│       ├─► tesseract.js (In-browser OCR for scans/images with progress bar)      │
│       └─► Editable Preview Component (allows user error corrections)            │
│                                                                                 │
│  [Pipeline Orchestrator Hook] ─── (Sends clean text payloads to backend) ──────┐│
└────────────────────────────────────────────────────────────────────────────────┼┘
                                                                                 │
┌────────────────────────────────────────────────────────────────────────────────▼┐
│                     EXPRESS BACKEND SERVER (`server.ts`)                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│  [Security Layer]: SSRF URL check, input character limits, in-memory rate-limit │
│                                                                                 │
│  1. POST /api/extract ────────────────────────────────────────────────────────┐ │
│     - Fetches URLs safely                                                     │ │
│     - Assigns S1..Sn IDs                                                      │ │
│     - Calls Gemini with structured JSON schema                                │ │
│     - Extracts aspect-grouped facts with exact verbatim snippets              │ │
│                                                                               │ │
│  2. POST /api/analyze ────────────────────────────────────────────────────────┤ │
│     - Cross-references facts & sources                                        │ │
│     - Identifies Gaps, Conflicts, Outdated/Undated warnings, Coverage meter   │ │
│     - Compiles prioritized verification checklist items                       │ │
│                                                                               │ │
│  3. POST /api/enrich ─────────────────────────────────────────────────────────┤ │
│     - Calls Gemini with `tools: [{ googleSearch: {} }]`                       │ │
│     - Fills critical gaps and checks public reputation signals                │ │
│     - Extracts verified URLs from `groundingMetadata.groundingChunks`         │ │
│                                                                               │ │
│  4. POST /api/vision-read ────────────────────────────────────────────────────┘ │
│     - Optional fallback for low-confidence OCR images using Gemini multimodal   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Core Data Entities & Zod Contracts
- `Source`: `{ id, kind, title, url?, text, ocrConfidence?, publishedDate?, dateStatus }`
- `Fact`: `{ id, aspect, claim, sourceId, snippet, tier: "sourced" }`
- `Gap`: `{ id, aspect, description, severity, whyItMatters, checkedSources, tier: "uncertain" }`
- `Conflict`: `{ id, aspect, claims: [{ sourceId, claim, snippet }], note, tier: "uncertain" }`
- `Enrichment`: `{ gapId, finding, confidence, references: [{ title, url }], tier: "ai_found" }`
- `ChecklistItem`: `{ id, priority, action, reason, relatedIds, completed: boolean }`

---

### Verification & Delivery Steps
1. **Dependencies**: Install required packages (`zod`, `three`, `@types/three`, `pdfjs-dist`, `tesseract.js`).
2. **Server Architecture**: Implement `server.ts` with Vite development middleware, SSRF URL fetcher, rate limiter, and Gemini fallback client.
3. **AI Pipeline Routes**: Build and test `/api/extract`, `/api/analyze`, `/api/enrich`, and `/api/vision-read`.
4. **Client-Side File Processing**: Configure `pdfjs-dist` worker and lazy `tesseract.js` OCR runner with live progress and editable preview.
5. **Interactive UI & 3D Hero**: Create the Three.js glass orb & spotlight canvas, dark/light theme tokens, sample scenario cards, and results dashboard with click-to-evidence highlighting.
6. **Verification**: Run `compile_applet` and test end-to-end with sample scenarios and exports.
