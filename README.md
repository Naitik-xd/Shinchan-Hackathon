# LUMEN: Digital Dark Spot Detector
**Information-Gap Intelligence Platform**

> Search tools find information. Summarizers shorten it. **Lumen shows you what is missing from it.**

---

### ⚠️ Operational Status, Prototype Notice & Quota Disclaimer
> **Important Operational Notice**: Lumen is an active pre-release prototype and is **not yet a finished commercial product**; minor bugs or edge cases may occur as development continues. The core platform operates reliably as designed, though because deep multi-document cross-examination depends on Google Gemini API endpoints, upstream hard quota limits and capacity boundaries imposed by the model provider may intermittently cause processing delays or temporary pauses during peak demand. When upstream constraints occur, the system automatically transitions through its configured fallback model sequence and surfaces transparent diagnostic feedback.

---

### 🛡️ Persistent Supabase IP Rate Limiting & Abuse Prevention Policy
Because serverless platforms such as Vercel spin down after periods of inactivity, Lumen persists IP rate-limiting state in **Supabase** (table: `lumen_iprate`) so limits cannot be reset by serverless cold starts:
- **Strict IP Rate Limit**: **Maximum 2 analysis requests per IP address per 5-hour window**.
- **Automatic 5-Hour Reset**: Once 5 hours have elapsed since the start of an IP's window, the counter automatically resets to `0`.
- **Single-Run Token Binding**: Clicking **"Analyze Sources"** logs 1 request in `lumen_iprate` and issues a short-lived, IP-bound HMAC token for the internal `/api/analyze` and `/api/enrich` stages—preventing triple-charging legitimate users while still blocking direct endpoint abuse.
- **HTTP 429 Response**: Exceeded limits immediately return HTTP `429` with `"Your limit is reached. Try back in 5 hours again."` along with `Retry-After` and `X-RateLimit-*` headers.
- **Server-Side Only**: All Supabase and Gemini requests execute strictly on the server (Vercel serverless functions). Zero credentials are ever bundled into or exposed to the frontend.

#### Required Supabase Table Setup (`lumen_iprate`)
Run the following SQL once in your **Supabase SQL Editor**:

```sql
CREATE TABLE IF NOT EXISTS public.lumen_iprate (
  ip TEXT PRIMARY KEY,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security and allow server-side API access with the anon key
ALTER TABLE public.lumen_iprate ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow lumen_iprate read"
  ON public.lumen_iprate FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow lumen_iprate insert"
  ON public.lumen_iprate FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow lumen_iprate update"
  ON public.lumen_iprate FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);
```

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
- **Legal Transparency**: Dedicated **Privacy Policy** (`/privacy`) and **Terms & Conditions** (`/terms`) pages accessible from the footer.

---

## 3. Vercel Deployment Guide

Lumen is configured for seamless deployment to **Vercel** with static frontend assets and serverless Node.js API functions.

### Step 1: Create the `lumen_iprate` Table in Supabase
Run the SQL snippet above in your Supabase project's SQL Editor.

### Step 2: Import into Vercel
1. In the Vercel Dashboard, click **Add New Project** and select your repository.
2. Deployment settings are pre-configured in `vercel.json`:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **API Routes**: Handled serverlessly by `/api/index.ts`

### Step 3: Configure Environment Variables (Server-Side Secrets)
In Vercel Project Settings → **Environment Variables**, add:
- `GEMINI_API_KEY`: Your Google Gemini API key.
- `SUPABASE_URL`: Your Supabase project URL (`https://<project-ref>.supabase.co`).
- `SUPABASE_ANON_KEY`: Your Supabase anon/public key.
- `GEMINI_MODELS` *(optional)*: `gemini-2.5-flash,gemini-3.8-flash,gemini-2.5-flash-lite`

*(Do NOT add `VITE_` prefixes to these variables so they remain strictly server-side.)*

### Step 4: Deploy
Click **Deploy**. Vercel builds the Vite SPA and deploys the serverless API routes with persistent Supabase IP rate limiting.

---

## 4. Environment Variables Reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `GEMINI_API_KEY` | **Yes** | — | Google Gemini API key used strictly in server-side routes |
| `SUPABASE_URL` | **Yes** (Prod) | — | Supabase project URL for persistent `lumen_iprate` rate limiting |
| `SUPABASE_ANON_KEY` | **Yes** (Prod) | — | Supabase anon/public key used strictly server-side |
| `GEMINI_MODELS` | No | `gemini-2.5-flash,gemini-3.8-flash,gemini-2.5-flash-lite` | Ordered fallback model chain |
| `PORT` | No | `3000` | Port for local Express server |

---

## 5. Safety, Privacy & Responsible AI

- **Persistent Anti-Abuse Rate Limiting**: Strict 2 requests per 5 hours per IP address stored in Supabase (`lumen_iprate`).
- **Search Engine De-Indexing**: `<meta name="robots" content="noindex, nofollow" />` active on all pages.
- **Zero Credential Leakage**: All Gemini and Supabase keys are strictly server-side and scrubbed from logs and error responses.
- **Prompt-Injection & SSRF Defense**: Untrusted source content is isolated inside strict delimiters; URL fetching blocks loopback, RFC1918 private IPs, and cloud metadata endpoints.
- **Privacy First**: Documents are never persisted on our servers; PDF/OCR parsing runs locally in-browser and history lives solely in browser `localStorage`.

---

## 6. License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
