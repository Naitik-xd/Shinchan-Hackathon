import React from "react";
import {
  ArrowLeft,
  Shield,
  FileText,
  AlertTriangle,
  Database,
  Server,
  HardDrive,
  Globe,
  Scale,
  Clock,
} from "lucide-react";

export type LegalPageType = "privacy" | "terms";

interface LegalPageProps {
  page: LegalPageType;
  onNavigate: (page: "home" | LegalPageType) => void;
}

export const LegalPage: React.FC<LegalPageProps> = ({ page, onNavigate }) => {
  const isPrivacy = page === "privacy";

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-8 space-y-6 animate-in fade-in duration-200">
      {/* Top Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#232838]">
        <button
          type="button"
          onClick={() => onNavigate("home")}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#12151D] hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-[#232838] rounded-xl transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Lumen</span>
        </button>

        <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-[#12151D] border border-slate-200 dark:border-[#232838]">
          <button
            type="button"
            onClick={() => onNavigate("privacy")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              isPrivacy
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Privacy Policy</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate("terms")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              !isPrivacy
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Terms &amp; Conditions</span>
          </button>
        </div>
      </div>

      {/* Formal Prototype / Pre-Release Advisory Banner */}
      <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-950/25 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs leading-relaxed">
          <p className="font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider font-mono text-[11px]">
            Pre-Release Prototype Notice
          </p>
          <p className="text-slate-700 dark:text-slate-300">
            Lumen is currently an experimental, early-stage prototype and{" "}
            <strong>is not a finished commercial product</strong>. The platform is under
            active development and may contain software bugs, incomplete features, analytical
            inaccuracies, or intermittent interruptions due to upstream AI quota limits. Please
            do not rely solely on this tool for binding decisions or submit highly sensitive,
            confidential, or legally regulated personal records.
          </p>
        </div>
      </div>

      {/* Main Document Card */}
      <article className="rounded-3xl border border-slate-200 dark:border-[#232838] bg-white dark:bg-[#12151D] p-6 sm:p-10 shadow-sm space-y-8">
        {isPrivacy ? (
          <>
            <header className="space-y-2 border-b border-slate-200 dark:border-[#232838] pb-6">
              <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-semibold">
                <Shield className="w-3.5 h-3.5" />
                <span>Legal Documentation</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Privacy Policy
              </h1>
              <p className="text-xs font-mono text-slate-500">
                Effective Date: November 2026 · Applicable to Lumen (Digital Dark Spot Detector)
              </p>
            </header>

            <section className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                1. Overview &amp; Commitment to Minimal Data Collection
              </h2>
              <p>
                Lumen is designed around strict data minimization. Because Lumen is a pre-release
                prototype built to help users detect missing details and contradictions across
                documents, we collect only the minimal technical information necessary to operate
                the service safely, prevent automated abuse, and protect shared AI API quotas. We
                do not operate user accounts, do not run advertising trackers, and never sell or
                monetize user data.
              </p>
            </section>

            <section className="space-y-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                2. Information We Collect &amp; Exact Purpose
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#232838] bg-slate-50/70 dark:bg-[#0B0D12]/60 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-xs uppercase font-mono">
                    <Database className="w-4 h-4 shrink-0" />
                    <span>IP Address &amp; Rate-Limit Counter</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    <strong>What is collected:</strong> Your public IP address, request count, and
                    rate-limit window timestamp when you click to run an analysis or invoke an API
                    endpoint.
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    <strong>Purpose:</strong> Stored persistently in our Supabase database (
                    <code className="font-mono text-[11px] px-1 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800">
                      lumen_iprate
                    </code>
                    ) strictly to enforce our fair-use limit of{" "}
                    <strong>2 requests per IP address every 5 hours</strong>, prevent API abuse,
                    and protect upstream Gemini API quotas. After 5 hours, your request counter
                    resets to zero.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#232838] bg-slate-50/70 dark:bg-[#0B0D12]/60 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-xs uppercase font-mono">
                    <Server className="w-4 h-4 shrink-0" />
                    <span>Submitted Questions, Text &amp; URLs</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    <strong>What is processed:</strong> The question, pasted source excerpts,
                    extracted text, and public web URLs you submit for cross-source analysis.
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    <strong>Purpose:</strong> Processed transiently in server memory and forwarded
                    to Google Gemini API models solely to extract claims, identify omissions or
                    conflicts, and perform public search grounding. We do{" "}
                    <strong>not</strong> persist your submitted documents or questions in any
                    server database.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#232838] bg-slate-50/70 dark:bg-[#0B0D12]/60 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-xs uppercase font-mono">
                    <HardDrive className="w-4 h-4 shrink-0" />
                    <span>Uploaded PDFs &amp; Image Scans</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    <strong>What is processed:</strong> PDF documents and images you select for
                    text extraction.
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    <strong>Purpose:</strong> Parsed locally inside your web browser using
                    client-side PDF and OCR engines so raw files remain on your device. Only if
                    you manually choose the optional Gemini Vision fallback for a low-confidence
                    scan is the image sent transiently for transcription and immediately discarded.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#232838] bg-slate-50/70 dark:bg-[#0B0D12]/60 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-xs uppercase font-mono">
                    <Globe className="w-4 h-4 shrink-0" />
                    <span>Local Browser Storage</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    <strong>What is stored locally:</strong> Your dark/light theme preference and
                    up to 10 recent analysis reports and checklist states in your browser&apos;s{" "}
                    <code className="font-mono text-[11px] px-1 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800">
                      localStorage
                    </code>
                    .
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    <strong>Purpose:</strong> Allows you to review recent runs without creating an
                    account. This data never leaves your browser and can be cleared at any time
                    from the History modal or your browser settings.
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                3. Third-Party Infrastructure &amp; Service Providers
              </h2>
              <p>
                To deliver the application reliably, server-side requests interact with the
                following third-party infrastructure providers strictly for the purposes stated:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                <li>
                  <strong>Vercel</strong> — Hosts the web frontend and executes server-side API
                  functions securely so API credentials are never exposed to the browser.
                </li>
                <li>
                  <strong>Supabase</strong> — Hosts the persistent{" "}
                  <code className="font-mono text-xs">lumen_iprate</code> PostgreSQL table used
                  exclusively for 5-hour IP rate limiting.
                </li>
                <li>
                  <strong>Google Gemini API</strong> — Performs automated text extraction,
                  cross-source gap detection, optional vision OCR, and grounded web search
                  enrichment.
                </li>
              </ul>
            </section>

            <section className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                4. Data Retention, Security &amp; Prototype Limitations
              </h2>
              <p>
                IP rate-limit timestamps and counters in Supabase are retained solely for ongoing
                abuse prevention and rate-window management. Submitted source texts are never
                written to permanent server storage by Lumen. All API keys and database
                credentials remain strictly server-side and are scrubbed from error responses.
                However, because Lumen is an experimental prototype and not a finished commercial
                product, you should avoid submitting sensitive personal identifiers (such as
                government ID numbers, bank credentials, medical records, or confidential legal
                secrets).
              </p>
            </section>

            <section className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                5. Search Engine Privacy &amp; Policy Updates
              </h2>
              <p>
                Lumen sets <code className="font-mono text-xs">noindex, nofollow</code> directives
                to discourage search engine indexing. Because this application is under active
                development, this Privacy Policy may be updated as features evolve. Continued use
                of the platform constitutes acknowledgment of the current policy.
              </p>
            </section>
          </>
        ) : (
          <>
            <header className="space-y-2 border-b border-slate-200 dark:border-[#232838] pb-6">
              <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-semibold">
                <Scale className="w-3.5 h-3.5" />
                <span>Legal Documentation</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Terms &amp; Conditions
              </h1>
              <p className="text-xs font-mono text-slate-500">
                Effective Date: November 2026 · Applicable to Lumen (Digital Dark Spot Detector)
              </p>
            </header>

            <section className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                1. Acceptance of Terms
              </h2>
              <p>
                By accessing or using Lumen (&quot;the Service&quot;), you agree to be bound by
                these Terms &amp; Conditions and our{" "}
                <button
                  type="button"
                  onClick={() => onNavigate("privacy")}
                  className="text-indigo-600 dark:text-indigo-400 underline hover:opacity-80 cursor-pointer font-medium"
                >
                  Privacy Policy
                </button>
                . If you do not agree with these terms, please discontinue use of the Service.
              </p>
            </section>

            <section className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                2. Pre-Release Prototype Status (&quot;As-Is&quot; Disclaimer)
              </h2>
              <p>
                You expressly acknowledge and agree that{" "}
                <strong>Lumen is currently a prototype and is not a finished product</strong>. The
                software is under ongoing development and is known to contain potential bugs,
                edge-case defects, extraction errors, incomplete coverage, and temporary
                instability. The Service is provided strictly on an <strong>&quot;AS IS&quot;</strong>{" "}
                and <strong>&quot;AS AVAILABLE&quot;</strong> basis, without warranties of any kind,
                whether express, implied, or statutory, including implied warranties of accuracy,
                reliability, merchantability, or fitness for a particular purpose.
              </p>
            </section>

            <section className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                3. AI-Assisted Output &amp; No Professional Advice
              </h2>
              <p>
                All detected gaps, contradictions, outdated-cycle alerts, credibility signals, and
                grounded search enrichments are generated with the assistance of artificial
                intelligence models. AI outputs may omit critical facts or misinterpret source
                documents. Nothing produced by Lumen constitutes legal, financial, employment,
                immigration, academic, or professional advice. You are solely responsible for
                independently verifying all claims directly with official issuing institutions or
                qualified advisors before making any decision.
              </p>
            </section>

            <section className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-500" />
                <span>4. Fair Usage Policy &amp; Persistent Rate Limits</span>
              </h2>
              <p>
                To safeguard shared AI API keys against abuse and ensure equitable access, Lumen
                enforces a strict rate limit of{" "}
                <strong>2 analysis requests per IP address within any 5-hour window</strong>,
                managed persistently via Supabase. Once your IP address reaches 2 requests,
                subsequent requests will be declined until the 5-hour window elapses, at which
                point your counter automatically resets to zero. Attempting to circumvent rate
                limits through automated scripts, proxy rotation, or abusive traffic is strictly
                prohibited.
              </p>
            </section>

            <section className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                5. Upstream Model Quota &amp; Service Interruptions
              </h2>
              <p>
                Because Lumen depends on third-party Google Gemini API infrastructure, upstream
                provider hard quota limits, rate throttling, or capacity constraints may
                occasionally cause requests to pause, fall back to secondary models, or fail
                temporarily. We do not guarantee uninterrupted uptime or response latency.
              </p>
            </section>

            <section className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                6. Acceptable Use &amp; User Content Responsibility
              </h2>
              <p>
                You agree to use Lumen solely for lawful informational review. You must not submit
                malicious payloads, attempt prompt-injection attacks, probe internal network
                addresses (SSRF), or upload copyrighted or confidential third-party materials that
                you are not authorized to process.
              </p>
            </section>

            <section className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                7. Limitation of Liability
              </h2>
              <p>
                To the maximum extent permitted by applicable law, the creators, contributors, and
                maintainers of Lumen shall not be liable for any direct, indirect, incidental,
                special, consequential, or punitive damages—including missed deadlines, lost
                opportunities, financial loss, or reliance on inaccurate or buggy output—arising
                out of or in connection with your use of or inability to use this prototype.
              </p>
            </section>

            <section className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                8. Open-Source Licensing &amp; Modifications
              </h2>
              <p>
                Lumen&apos;s source code is distributed under the MIT License using open-source
                third-party dependencies. We reserve the right to modify, suspend, or discontinue
                the Service or revise these Terms &amp; Conditions at any time without prior
                notice.
              </p>
            </section>
          </>
        )}
      </article>
    </div>
  );
};
