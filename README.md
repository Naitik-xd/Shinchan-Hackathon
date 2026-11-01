# LUMEN: Digital Dark Spot Detector
**Information-Gap Intelligence Platform**

> Search tools find information. Summarizers shorten it. **Lumen shows you what is missing from it.**

---

### ⚠️ Operational Status & Quota Notice
> **Important Operational Notice**: Lumen is fully verified and operating reliably as intended. However, because deep multi-document cross-examination relies on Google Gemini API endpoints, upstream hard quota limits and capacity boundaries imposed by the model provider may intermittently cause processing delays or temporary rate pauses during periods of high demand. When upstream constraints are encountered, the system automatically transitions through its configured fallback model sequence and surfaces transparent diagnostic feedback.

---

### 🛡️ API Rate Limiting & Abuse Prevention Policy
To protect against automated abuse, safeguard shared token quotas, and ensure stable performance under production workloads:
- **Strict IP Rate Limit**: **Maximum 7 requests per 5-hour window** across all `/api/*` endpoints.
- **HTTP 429 Status**: Exceeded quotas return standard `Retry-After` and `X-RateLimit-*` headers with exact human-readable cooldown durations.
- **Client Resilience**: In-flight requests notify users transparently if the 5-hour threshold is reached, preventing wasted API calls.

---

## 1. Configured Gemini Models
Lumen employs a resilient multi-tier fallback architecture using official Google Gemini models in the following priority order:

1. **`gemini-2.5-flash`** *(Primary Default)*: High-throughput multimodal model balancing deep contextual reasoning with rapid fact extraction.
2. **`gemini-3.8-flash`** *(Tier 1 Fallback)*: Advanced reasoning model automatically invoked if the primary model reaches quota limits or service interruptions.
3. **`gemini-2.5-flash-lite`** *(Tier 2 Fallback)*: High-efficiency lightweight model ensuring graceful degradation and reliable completion even during peak traffic.

*Model configuration can optionally be managed via the `GEMINI_MODELS` environment variable without code changes.*

---

## 2. Project Overview

When making high-stakes decisions—such as accepting a tech job offer, evaluating university admissions, applying for scholarships, or signing agreement terms—people face scattered, contradictory, and outdated documents. 

Instead of generating a generic summary, Lumen executes a **3-step gap detection pipeline**:
- **Critical Information Gaps**: Crucial decision criteria omitted entirely from the materials.
- **Direct & Subtle Contradictions**: Clashing clauses (e.g. Recruiter claims immediate vesting, but Handbook enforces a 1-year cliff).
- **Staleness Warnings**: References to expired calendar cycles (e.g. 2023 remote allowances discontinued in 2024).
- **Three-Tier Evidence Classification**: Strict segregation between 🟢 **Sourced Facts**, 🟣 **AI-Found Grounded Suggestions**, and 🟠 **Uncertain Gaps**.
- **Prioritized Action Checklist**: Concrete, actionable verification items to resolve ambiguities with employers, bursars, or legal counsel.

---

## 3. Architecture & Data Flow

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
│  • SEO Control: robots noindex, nofollow meta tags prevent crawler indexing │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ (Text-only sanitized payloads)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    NODE.JS / EXPRESS SERVERLESS BACKEND                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  [Security Layer]: 7 req/5 hr IP rate limiter, SSRF validator (private block)│
│                                                                             │
│  1. GET /api/health                                                         │
│     • Instant status & model diagnostic endpoint (zero Gemini quota usage)  │
│                                                                             │
│  2. POST /api/extract                                                       │
│     • Safely fetches URLs with timeout & size caps                          │
│     • Single-pass multi-source extraction saving up to 60% token quota      │
│     • Assigns S1..Sn IDs to sources with verbatim snippet extraction        │
│                                                                             │
│  3. POST /api/analyze                                                       │
│     • Cross-references all sources and claims                               │
│     • Topic-aware taxonomy (Scholarships, Hackathons, Job Offers, etc.)     │
│     • Deterministic conflict detection + AI verification                    │
│                                                                             │
│  4. POST /api/enrich                                                        │
│     • Uses Google Search Grounding to fill high/medium gaps                 │
│     • Extracts verified URLs from groundingMetadata                         │
│                                                                             │
│  5. POST /api/vision-read                                                   │
│     • Fallback for low-confidence OCR images using Gemini Vision            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Vercel Deployment Guide

Lumen is configured for seamless deployment to **Vercel** with static frontend assets and serverless Node.js API functions.

### Step 1: Push Repository
Push this repository to your GitHub, GitLab, or Bitbucket account.

### Step 2: Import into Vercel
1. In the Vercel Dashboard, click **Add New Project** and select your repository.
2. The deployment settings are pre-configured in `vercel.json`:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **API Routes**: Handled serverlessly by `/api/index.ts`

### Step 3: Configure Environment Variables
In the Vercel project settings under **Environment Variables**, add:
- `GEMINI_API_KEY`: Your Google Gemini API key.
- `GEMINI_MODELS` *(optional)*: `gemini-2.5-flash,gemini-3.8-flash,gemini-2.5-flash-lite`

### Step 4: Deploy
Click **Deploy**. Vercel will build the Vite SPA and deploy the serverless API routes with global CDN edge routing.

---

## 5. Local Development

### Prerequisites
- Node.js 18+ installed
- Google Gemini API Key

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/lumen.git
cd lumen

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env and supply your GEMINI_API_KEY

# Run full-stack dev server (Express + Vite)
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## 6. Environment Variables Reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `GEMINI_API_KEY` | **Yes** | — | Google Gemini API key used in server-side routes |
| `GEMINI_MODELS` | No | `gemini-2.5-flash,gemini-3.8-flash,gemini-2.5-flash-lite` | Ordered fallback model chain |
| `PORT` | No | `3000` | Port for local Express server |

---

## 7. Safety, Security & Responsible AI

- **Anti-Abuse Rate Limiting**: Strict window of 7 requests per 5 hours per IP address to safeguard upstream quotas.
- **Search Engine De-Indexing**: Header `<meta name="robots" content="noindex, nofollow" />` active on all pages.
- **Prompt-Injection Defense**: All untrusted source text is enclosed within strict delimiters (`<<<SOURCE_CONTENT_UNTRUSTED>>>`). Gemini is instructed that source text is untrusted data and instructions inside must be ignored.
- **SSRF Defense**: URL fetching resolves hostnames and explicitly blocks loopback (`127.0.0.1`), private RFC1918 ranges (`10.x`, `172.16-31.x`, `192.168.x`), link-local/cloud metadata (`169.254.169.254`), and non-HTTP protocols.
- **Payload Limits**: 500 characters for questions, 8 sources maximum, 30,000 characters per source, 10MB per file, and 10-second fetch timeout.
- **Privacy First**: Files are never stored on a server. Local history and checklist progress reside strictly in browser `localStorage`.
- **Transparent Signals**: Credibility signals are clearly marked as estimates, and findings are labeled as potential gaps rather than guaranteed facts.

---

## 8. Legal, Licensing & Copyright Compliance

All code, assets, and libraries used in Lumen are **100% legal, free, and open-source**:
- **React & React DOM**: MIT License (Meta Platforms, Inc.)
- **Express**: MIT License (OpenJS Foundation)
- **@google/genai**: Apache 2.0 License (Google LLC)
- **Three.js**: MIT License (Ricardo Cabello)
- **Lucide React**: ISC License (Lucide Contributors)
- **Zod**: MIT License (Colin McDonnell)
- **pdfjs-dist**: Apache 2.0 License (Mozilla Foundation)
- **Tesseract.js**: Apache 2.0 License (Naptha)
- **Tailwind CSS**: MIT License (Tailwind Labs)
- **Typography**: `Plus Jakarta Sans`, `DM Sans`, `JetBrains Mono` via the SIL Open Font License (OFL).
- **Procedural Graphics**: All visual artifacts (such as the 3D optical lens) are procedurally computed in code with zero external proprietary media assets.

---

## 9. License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
