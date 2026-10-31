# LUMEN: Digital Dark Spot Detector
**Shinchan Online Hackathon 2026 | Team DEVENGERS**

> Search tools find information. Summarizers shorten it. **Lumen shows you what is missing from it.**

---

## 1. Project Overview

Lumen is an AI-assisted information-gap intelligence platform. When making high-stakes decisions—such as accepting a tech job offer, committing to a graduate fellowship, or signing a coding bootcamp ISA contract—people face scattered, contradictory, and outdated documents. 

Instead of generating a generic summary, Lumen executes a **3-step gap detection pipeline** that isolates:
- **Critical Information Gaps**: Crucial decision criteria omitted entirely from the materials.
- **Direct & Subtle Contradictions**: Clashing clauses (e.g. Recruiter claims immediate vesting, but Handbook enforces a 1-year cliff).
- **Staleness Warnings**: References to expired calendar cycles (e.g. 2023 remote allowances discontinued in 2024).
- **Three-Tier Evidence Classification**: Strict segregation between 🟢 **Sourced Facts**, 🟣 **AI-Found Grounded Suggestions**, and 🟠 **Uncertain Gaps**.
- **Prioritized "Verify Next" Action Checklist**: Tangible verification items to resolve ambiguities with employers, bursars, or legal counsel.

---

## 2. Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       BROWSER CLIENT (React 19 + Vite)                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  • Input: Question + Sources (Pasted Text, URLs, Scans, Digital PDFs)       │
│  • Client-Side PDF Parser: pdfjs-dist (zero binary uploads)                 │
│  • Client-Side OCR: Tesseract.js (lazy-loaded in-browser recognition)       │
│  • Editable Preview: User can correct OCR noise before processing           │
│  • Interactive 3D Spotlight: Procedural Three.js glass orb & shadow cone    │
│  • Local History: Browser localStorage (100% stateless backend)             │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ (Text-only sanitized payloads)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    NODE.JS / EXPRESS SERVERLESS BACKEND                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  [Security Layer]: In-memory rate limiting, SSRF validator (private IP block)│
│                                                                             │
│  1. POST /api/extract                                                       │
│     • Safely fetches URLs with 10s timeout & 2MB response cap               │
│     • Assigns S1..Sn IDs to sources                                         │
│     • Gemini 2.5 Flash extracts aspect-grouped facts with exact snippets    │
│                                                                             │
│  2. POST /api/analyze                                                       │
│     • Cross-references all sources and claims                               │
│     • Detects Gaps, Conflicts, Outdated warnings, and Credibility Rubrics   │
│     • Compiles prioritized verification checklist items                     │
│                                                                             │
│  3. POST /api/enrich                                                        │
│     • Uses Google Search Grounding to fill high/medium gaps                 │
│     • Extracts verified URLs from groundingMetadata.groundingChunks         │
│     • Evaluates public reputation signals without scraping review sites     │
│                                                                             │
│  4. POST /api/vision-read                                                   │
│     • Optional fallback for low-confidence OCR images using Gemini Vision   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Evidence Tier System

1. 🟢 **SOURCED (Tier 1)**: Extracted directly from user-provided source material. Accompanied by a clickable source ID chip (e.g. `[S1]`) that opens the document in the **Source Viewer** with the verbatim snippet highlighted.
2. 🟣 **AI-FOUND (Tier 2)**: Retrieved via Google Search grounding to fill identified gaps. Clearly labeled "AI-Found via search, please verify" with live citation links.
3. 🟠 **UNCERTAIN (Tier 3)**: Unanswered questions, omissions, contradictions, and outdated cycle warnings that require user verification.

---

## 4. Key Features

- **Multi-Source Ingestion**: Paste raw text, enter live web URLs, or upload PDF and image documents.
- **In-Browser OCR & Digital PDF Reading**: Files are read directly in the user's browser via `pdfjs-dist` and `tesseract.js`. No binary documents are uploaded or stored.
- **Editable Extraction Preview**: Users can review and adjust OCR-extracted text before running analysis. Includes automatic low-confidence detection and Gemini Vision fallback.
- **Click-to-Evidence Drawer**: Clicking any finding or claim opens the document in a side drawer and automatically scrolls to the highlighted snippet.
- **Conflict Side-by-Side View**: Compares contradictory claims side-by-side with exact quotations.
- **Evidence Coverage Meter**: Evaluates whether core decision dimensions (compensation, equity, renewal, deadlines, documents) are Covered, Partial, or Missing.
- **Transparent Credibility Rubric**: Evaluates Domain Authority, Freshness, Corroboration, Authorship, and Public Reputation—never an arbitrary score.
- **Prioritized Checklist**: Checkable items with completion progress, Markdown export (`.md`), and clipboard copy.
- **Interactive 3D Spotlight**: Procedural Three.js optical glass orb revealing dark spots with software-WebGL detection and reduced-motion support.
- **Dual-Theme**: Dark and Light themes with persistent state and zero hydration flash.

---

## 5. Getting Started

### Prerequisites
- Node.js 18+ installed
- Google Gemini API Key

### Installation
```bash
# Clone the repository
git clone https://github.com/devengers/lumen.git
cd lumen

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Add your GEMINI_API_KEY in .env

# Run development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## 6. Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Yes | Google Gemini API key used in server-side routes |
| `GEMINI_MODELS` | No | Comma-separated fallback chain (default: `gemini-2.5-flash,gemini-3.8-flash,gemini-2.5-flash-lite`) |
| `PORT` | No | Port for Express server (default: `3000`) |

---

## 7. Safety, Security & Responsible AI

- **Prompt-Injection Defense**: All untrusted source text is enclosed within strict delimiters (`<<<SOURCE_CONTENT_UNTRUSTED>>>`). Gemini is instructed that source text is untrusted data and instructions inside must be ignored.
- **SSRF Defense**: URL fetching resolves hostnames and explicitly blocks loopback (`127.0.0.1`), private RFC1918 ranges (`10.x`, `172.16-31.x`, `192.168.x`), link-local/cloud metadata (`169.254.169.254`), and non-HTTP protocols.
- **Payload Limits**: 500 characters for questions, 8 sources maximum, 30,000 characters per source, 10MB per file, and 10-second fetch timeout.
- **Privacy First**: Files are never stored on a server. Local history and checklist progress reside strictly in browser `localStorage`.
- **Transparent Signals**: Credibility signals are clearly marked as estimates, and findings are labeled as potential gaps rather than guaranteed facts.

---

## 8. Third-Party Licenses & Notices

- **React & React DOM**: MIT License (Meta Platforms, Inc.)
- **Express**: MIT License (OpenJS Foundation)
- **@google/genai**: Apache 2.0 License (Google LLC)
- **Three.js**: MIT License (Ricardo Cabello)
- **Lucide React**: ISC License (Lucide Contributors)
- **Zod**: MIT License (Colin McDonnell)
- **pdfjs-dist**: Apache 2.0 License (Mozilla Foundation)
- **Tesseract.js**: Apache 2.0 License (Naptha)
- **Tailwind CSS**: MIT License (Tailwind Labs)
- **Fonts**: `Plus Jakarta Sans`, `DM Sans`, `JetBrains Mono` via SIL Open Font License (OFL).

---

## 9. License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
