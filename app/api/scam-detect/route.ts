import { NextResponse } from "next/server";
import https from "https";
import { lookup as dnsLookup } from "dns/promises";
import { isIP } from "net";
import { codeFromStatus } from "@/lib/errorTypes";

// ─── Types ──────────────────────────────────────────────────────────────
interface ThreatIndicator {
  element: string;
  value: string;
  assessment:
    | 'MALICIOUS'
    | 'FRAUDULENT'
    | 'FABRICATED'
    | 'SUSPICIOUS'
    | 'HIGH RISK'
    | 'STALKING / BLIND'
    | 'INFORMATIONAL';
  findings: string[];
}

interface SafetyTip {
  headline: string;
  tip: string;
}

interface KeywordFinding {
  heading: string;
  content: string;
}

interface MetaRow {
  label: string;
  value: string;
}

interface AnalysisResponse {
  riskScore: number;
  threatType: string;
  attemptLabel: string;
  cvss: string;
  status: string;
  explanation: string;
  findings: KeywordFinding[];
  indicators: ThreatIndicator[];
  safetyTips: SafetyTip[];
  recommendation: string;
  reportTitle: string;
  targetBrand: string;
  metaRows: MetaRow[];
}

type ScanType = "text" | "sms" | "email" | "url";

// ─── URL helpers ─────────────────────────────────────────────────────────
interface UrlTechnicalReport {
  originalUrl: string;
  validUrl: boolean;
  protocol: string | null;
  usesHttps: boolean;
  hostname: string | null;
  blockedAsPrivateTarget: boolean;
  httpStatus: number | null;
  redirectChain: string[];
  finalUrl: string | null;
  domainChangedAcrossRedirects: boolean;
  tls: {
    checked: boolean;
    valid: boolean | null;
    selfSigned: boolean | null;
    issuer: string | null;
    subject: string | null;
    validFrom: string | null;
    validTo: string | null;
    daysUntilExpiry: number | null;
    error: string | null;
  };
  networkError: string | null;
}

const PRIVATE_HOSTNAME_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^0\.0\.0\.0$/,
  /^10\./,
  /^192\.168\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
];

function isPrivateHost(hostnameOrIp: string): boolean {
  return PRIVATE_HOSTNAME_PATTERNS.some((re) => re.test(hostnameOrIp));
}

async function isBlockedTarget(hostname: string): Promise<boolean> {
  if (isPrivateHost(hostname)) return true;
  if (isIP(hostname)) return isPrivateHost(hostname);
  try {
    const { address } = await dnsLookup(hostname);
    return isPrivateHost(address);
  } catch {
    return false;
  }
}

function getTlsCertificate(hostname: string, port = 443): Promise<UrlTechnicalReport["tls"]> {
  return new Promise((resolve) => {
    const base: UrlTechnicalReport["tls"] = {
      checked: true,
      valid: null,
      selfSigned: null,
      issuer: null,
      subject: null,
      validFrom: null,
      validTo: null,
      daysUntilExpiry: null,
      error: null,
    };

    const req = https.request(
      {
        host: hostname,
        port,
        method: "HEAD",
        timeout: 6000,
        rejectUnauthorized: false,
      },
      (res) => {
        try {
          const socket = res.socket as any;
          const cert = socket?.getPeerCertificate?.(false);
          if (cert && Object.keys(cert).length > 0) {
            const validTo = cert.valid_to ? new Date(cert.valid_to) : null;
            const now = new Date();
            base.issuer = cert.issuer?.O || cert.issuer?.CN || null;
            base.subject = cert.subject?.CN || null;
            base.validFrom = cert.valid_from || null;
            base.validTo = cert.valid_to || null;
            base.selfSigned =
              !!cert.issuer && !!cert.subject && cert.issuer.CN === cert.subject.CN;
            base.daysUntilExpiry = validTo
              ? Math.round((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
              : null;
            base.valid = !!socket?.authorized || socket?.authorizationError === undefined;
            if (socket?.authorizationError) {
              base.valid = false;
              base.error = String(socket.authorizationError);
            }
          } else {
            base.error = "No certificate returned by host.";
          }
        } catch (e: any) {
          base.error = e?.message || "Certificate inspection failed.";
        }
        res.resume();
        resolve(base);
      }
    );

    req.on("timeout", () => {
      req.destroy();
      base.error = "Connection timed out during certificate check.";
      resolve(base);
    });
    req.on("error", (err) => {
      base.error = err.message;
      resolve(base);
    });
    req.end();
  });
}

async function followRedirects(startUrl: string, maxHops = 5): Promise<{
  chain: string[];
  finalUrl: string | null;
  httpStatus: number | null;
  networkError: string | null;
}> {
  const chain: string[] = [];
  let current = startUrl;
  let httpStatus: number | null = null;

  for (let hop = 0; hop < maxHops; hop++) {
    let currentHost: string;
    try {
      currentHost = new URL(current).hostname;
    } catch {
      return { chain, finalUrl: null, httpStatus, networkError: "Malformed URL in redirect chain." };
    }

    if (await isBlockedTarget(currentHost)) {
      return { chain, finalUrl: null, httpStatus, networkError: "Blocked: target resolves to a private/internal address." };
    }

    try {
      const res = await fetch(current, {
        method: "GET",
        redirect: "manual",
        signal: AbortSignal.timeout(6000),
        headers: { "User-Agent": "CustosAI-Scanner/1.0 (+security-scan)" },
      });
      httpStatus = res.status;
      chain.push(current);

      const location = res.headers.get("location");
      if (res.status >= 300 && res.status < 400 && location) {
        current = new URL(location, current).toString();
        continue;
      }
      return { chain, finalUrl: current, httpStatus, networkError: null };
    } catch (err: any) {
      return { chain, finalUrl: null, httpStatus, networkError: err?.message || "Network request failed." };
    }
  }

  return { chain, finalUrl: current, httpStatus, networkError: "Too many redirects (possible redirect loop)." };
}

async function runUrlTechnicalScan(rawUrl: string): Promise<UrlTechnicalReport> {
  const report: UrlTechnicalReport = {
    originalUrl: rawUrl,
    validUrl: false,
    protocol: null,
    usesHttps: false,
    hostname: null,
    blockedAsPrivateTarget: false,
    httpStatus: null,
    redirectChain: [],
    finalUrl: null,
    domainChangedAcrossRedirects: false,
    tls: {
      checked: false,
      valid: null,
      selfSigned: null,
      issuer: null,
      subject: null,
      validFrom: null,
      validTo: null,
      daysUntilExpiry: null,
      error: null,
    },
    networkError: null,
  };

  let parsed: URL;
  try {
    const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(rawUrl.trim()) ? rawUrl.trim() : `https://${rawUrl.trim()}`;
    parsed = new URL(withScheme);
  } catch {
    return report;
  }

  report.validUrl = true;
  report.protocol = parsed.protocol.replace(":", "");
  report.usesHttps = parsed.protocol === "https:";
  report.hostname = parsed.hostname;

  if (await isBlockedTarget(parsed.hostname)) {
    report.blockedAsPrivateTarget = true;
    report.networkError = "Target resolves to a private/internal address — technical scan skipped for safety.";
    return report;
  }

  const redirectResult = await followRedirects(parsed.toString());
  report.redirectChain = redirectResult.chain;
  report.finalUrl = redirectResult.finalUrl;
  report.httpStatus = redirectResult.httpStatus;
  report.networkError = redirectResult.networkError;

  if (report.finalUrl) {
    try {
      const finalHost = new URL(report.finalUrl).hostname;
      report.domainChangedAcrossRedirects = finalHost !== parsed.hostname;
    } catch {
      /* ignore */
    }
  }

  if (report.usesHttps || (report.finalUrl && report.finalUrl.startsWith("https://"))) {
    const certHost = report.finalUrl ? new URL(report.finalUrl).hostname : parsed.hostname;
    report.tls = await getTlsCertificate(certHost);
  } else {
    report.tls.checked = false;
    report.tls.error = "Site does not use HTTPS — no certificate to inspect.";
  }

  return report;
}

function formatTechnicalReportForPrompt(report: UrlTechnicalReport): string {
  if (!report.validUrl) {
    return "TECHNICAL SCAN: The submitted text could not be parsed as a valid URL.";
  }
  if (report.blockedAsPrivateTarget) {
    return "TECHNICAL SCAN: Target resolves to a private/internal network address. Live connectivity checks were skipped for safety. Base the assessment on structural and lexical indicators only, and flag internal-address targeting as suspicious in a public-facing message.";
  }

  const lines: string[] = [
    `- Original URL: ${report.originalUrl}`,
    `- Protocol: ${report.protocol ?? "unknown"} (${report.usesHttps ? "HTTPS — encrypted" : "NOT HTTPS — unencrypted, high risk for anything requesting credentials"})`,
    `- Hostname: ${report.hostname ?? "unknown"}`,
  ];

  if (report.networkError) {
    lines.push(`- Live connection result: FAILED — ${report.networkError}`);
  } else {
    lines.push(`- HTTP status of final response: ${report.httpStatus ?? "unknown"}`);
    lines.push(`- Redirect hops: ${report.redirectChain.length}`);
    if (report.redirectChain.length > 1) {
      lines.push(`- Redirect chain: ${report.redirectChain.join(" -> ")}`);
    }
    lines.push(`- Final destination URL: ${report.finalUrl ?? "unknown"}`);
    lines.push(`- Domain changed across redirects: ${report.domainChangedAcrossRedirects ? "YES — treat as a strong red flag" : "No"}`);
  }

  if (report.tls.checked) {
    lines.push(`- TLS certificate found: yes`);
    lines.push(`  - Issuer: ${report.tls.issuer ?? "unknown"}`);
    lines.push(`  - Subject (CN): ${report.tls.subject ?? "unknown"}`);
    lines.push(`  - Self-signed: ${report.tls.selfSigned ? "YES — strong red flag" : "No"}`);
    lines.push(`  - Certificate valid/trusted: ${report.tls.valid === false ? "NO — invalid, expired, or untrusted (strong red flag)" : report.tls.valid === true ? "Yes" : "Unknown"}`);
    if (report.tls.daysUntilExpiry !== null) {
      lines.push(`  - Days until expiry: ${report.tls.daysUntilExpiry}${report.tls.daysUntilExpiry < 0 ? " — ALREADY EXPIRED, strong red flag" : ""}`);
    }
    if (report.tls.error) lines.push(`  - Certificate check note: ${report.tls.error}`);
  } else {
    lines.push(`- TLS certificate check: ${report.tls.error ?? "not applicable (no HTTPS)"}`);
  }

  return "TECHNICAL SCAN RESULTS (factual, from a live connection — weight these heavily and do not contradict them):\n" + lines.join("\n");
}

// ─── Extract URLs from any text ─────────────────────────────────────────
function extractUrls(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s<>"']+/gi;
  const matches = text.match(urlRegex) || [];
  return [...new Set(matches.map(u => u.replace(/[.,;!?]+$/, '')))];
}

// ─── Shared output contract ──────────────────────────────────────────────
const SHARED_OUTPUT_CONTRACT = `
**TONE & STYLE (CRITICAL – follow exactly):**
- Adopt the voice of a senior threat analyst at a world‑class cybersecurity company.
- Write like you are directly briefing a non‑technical but intelligent client: warm, authoritative, and crystal‑clear.
- Avoid robotic, academic, or overly cautious language. Be direct and decisive.
- Use natural, flowing sentences – never sound like you are reading a template.
- When describing threats, explain “what it means for the user” in everyday terms, but back every claim with the evidence you see.
- Do NOT use markdown in the final text (except bold as allowed below). Keep the formatting clean and readable.

**FORMATTING RULES (STRICT):**
- You are allowed to use **bold** (double asterisks) but only for the single most critical term or domain in each finding. Never bold more than 2‑4 words per finding.
- Do NOT bold anything in the Explanation, Recommendation, or Safety Tips – those stay plain text.

**SCORING RUBRIC (UPDATED — disinformation and authority impersonation are now high‑risk):**
- 90-100 : Certain malicious/scam — multiple hard technical or behavioural red flags confirmed together, or clear authority impersonation with fabricated details.
- 81-90  : Strong malicious indicators, minor ambiguity only.
- 61-80  : Suspicious — solid red flags (e.g., lookalike domain + urgency, unverifiable government reference, fabricated expert quotes).
- 41-60  : Medium concern — generic spam, mild urgency, weak or single indicator, unverifiable but plausible claim.
- 21-40  : Low-medium — unsolicited marketing, vague warning, no immediate harm but lacking verifiable source.
- 0-20   : Safe / legitimate — verifiable sender, no deception, factually plausible and routine (e.g., appointment reminder, personal chat). **Never assign this band to content that contains extraordinary unverified claims, government impersonation, or chain‑style viral warnings.**

**ATTEMPT LABEL (required):**
- Produce a short, human-readable LINE (not a single word) describing what kind of attempt this is, e.g. “Phishing Attempt Detected”, “Smishing Attempt Detected”, “Advance‑Fee Fraud Attempt Detected”, “Invoice Fraud Attempt Detected”, “Disinformation / Authority Impersonation Detected”, “Health Hoax Detected”, “No Threat Detected — Content Appears Legitimate”.
- It must read as a full phrase, always ending in “Detected” (or “Appears Legitimate” when safe), and must match the actual nature of the content.

**REPORT TITLE (required):**
- Write a specific, tailored title for this report based on what was actually found — e.g. “PayPal Credential‑Harvesting Phishing Report”, “Fake State Bank Circular Impersonation Report”, “Crypto Investment Scam Report”.
- Never output a generic static title like “Threat Intelligence Report” on its own.

**TARGET BRAND / ENTITY (required):**
- Name the specific brand, company, institution, or person being impersonated or targeted in this content (e.g. “PayPal”, “Chase Bank”, “State Bank of Pakistan”, “NADRA”).
- If the content does not impersonate or target any identifiable brand/entity, output exactly “None Identified”. Never guess or invent a brand that isn't actually referenced or implied by the content.

**SCAN METADATA (metaRows, exactly 2‑4 items):**
- Provide 2‑4 objects of {"label": string, "value": string} capturing the most relevant concrete facts about THIS specific input for a summary table — e.g. Domain, Sender, Subject, SSL Status, Redirect Count, Links Found, Phone Numbers Found, Message Length.
- Only report values you can actually see or derive from the input (or the technical scan, if provided). Do not fabricate values. Keep each value short (under ~50 characters).

**FINDINGS (3‑4 sections):**
- Each heading must be a sharp, specific observation (e.g. “Credential‑Harvesting Form on Lookalike Domain” not “URL Analysis”).
- Each content block must contain 2‑3 sentences that:
    a. State the finding (what is wrong).
    b. Cite the concrete evidence (the exact URL, sender, certificate error, etc.).
    c. Explain the real‑world consequence (e.g. “Anyone who enters their password here is giving it directly to the attacker”).
- If a technical scan is provided, every finding that relies on HTTPS/SSL/redirects **must** explicitly reference the scan results and never contradict them.

**EXPLANATION:**
- Write an 6‑8 sentence executive summary that tells the full story of the threat.
- Open by stating clearly whether this is a confirmed attack, a strong suspicion, or safe.
- Then walk the reader through the most important evidence: what was found in the technical scan, the deceptive patterns in the content, and why they matter.
- End with a clear bottom‑line statement about the level of danger.
- Use plain language but do not shy away from precise terms (e.g., “credential harvesting”, “domain spoofing”) – just explain them naturally in context.

**RECOMMENDATION (4‑5 bullet points, imperative, “do this now”):**
- Each bullet must start with a clear action verb: “Delete”, “Forward”, “Monitor”, “Do not”, “Call”, “Change”, etc.
- Every bullet must give a concrete, step‑by‑step instruction that the user can execute immediately.
- Never use generic phrases like “Exercise caution” or “Be vigilant”. Be specific to the threat found.
- Example for a phishing email:
  - Do not click any links or download attachments.
  - Forward the email as an attachment to phishing@yourcompany.com.
  - Delete the email from your inbox and trash folder.
  - If you entered credentials on the fake page, change your password immediately and enable multi‑factor authentication.
  - Monitor your bank and email accounts for unusual activity for the next 7 days.

**INDICATORS (3‑5 items):**
- Concrete extracted elements only (domains, phone numbers, phrases, sender IDs, URLs, headers). Each with 2 concise findings, no bold.

**SAFETY TIPS (exactly 4-5 based on content):**
- Actionable, threat‑specific tips. Write them in a friendly advisory tone.
- Each tip must give a practical, immediate “do” or “don’t” that a user can understand and act on.
- Plain text only.

Return ONLY valid JSON, no markdown fencing, matching exactly:
{
  "riskScore": number,
  "threatType": string,
  "attemptLabel": string,
  "cvss": string,
  "status": string,
  "reportTitle": string,
  "targetBrand": string,
  "metaRows": [ { "label": string, "value": string } ],
  "findings": [ { "heading": string, "content": string } ],
  "explanation": string,
  "recommendation": string,
  "indicators": [ { "element": string, "value": string, "assessment": "MALICIOUS"|"FRAUDULENT"|"FABRICATED"|"SUSPICIOUS"|"HIGH RISK"|"STALKING / BLIND"|"INFORMATIONAL", "findings": [string, string] } ],
  "safetyTips": [ { "headline": string, "tip": string } ]
}
`;

// ─── Type‑specific prompts (all now include disinformation/impersonation checks) ──
const URL_ANALYST_PROMPT = `
You are the world's foremost cyber intelligence analyst specialising in URL and website threat analysis at Custos AI.
Treat the provided TECHNICAL SCAN RESULTS as ground truth. Do not contradict them.

**DEEP CHECKLIST:**
1. Protocol: HTTP is an automatic strong red flag for logins/payments.
2. TLS: self-signed, expired, mismatched CN, untrusted issuer → strong red flags.
3. Domain: lookalike/typosquat (extra hyphens, "secure-", "verify-", suspicious TLDs like .tk .top .xyz .click .info), brand impersonation.
4. Redirect behaviour: domain hopping, URL shorteners, multiple hops → red flag.
5. Path/query: encoded characters, "/login", "/verify", "/update-billing" patterns.
6. Hosting: free hosting, IP-address URLs, dynamic DNS.
7. Brand impersonation in content even if URL seems legit — correlate with text if provided.
8. If the URL leads to a document or message claiming official authority (bank circular, government notice), check if domain aligns with that authority.

Score strictly using the shared rubric.
`;

const EMAIL_ANALYST_PROMPT = `
You are the world's foremost cyber intelligence analyst specialising in email phishing and BEC at Custos AI.

**DEEP CHECKLIST:**
1. Sender domain: mismatch, misspelling, free provider impersonating a company.
2. Urgency/coercion: account suspension, legal threat, CEO impersonation, wire transfer pressure.
3. Credential harvesting: "verify your account", "update billing", fake login links.
4. Attachment/link bait: invoices, shipping docs, HR forms.
5. Grammar/tone: generic greeting, unusual formality, personal name mismatch.
6. BEC patterns: payment detail change, secrecy, bypassing normal procedures.
7. Government authority impersonation: emails pretending to be official circulars, tax notices, court orders with fake reference numbers.
8. Disinformation/fabricated claims: extraordinary statistics, unverifiable expert quotes, requests to forward for "public safety".
9. Embedded URLs: apply domain scrutiny from URL checklist.

Score strictly — BEC, credential harvesting, or fabricated authority emails should score 70‑95.
`;

const SMS_ANALYST_PROMPT = `
You are the world's foremost cyber intelligence analyst specialising in SMS phishing (smishing) and mobile fraud at Custos AI.

**DEEP CHECKLIST:**
1. Sender ID plausibility: alphanumeric brand vs random number.
2. Shortened/unfamiliar links, missing official domain.
3. Urgency: "account will be suspended", "parcel on hold", "claim your prize".
4. OTP forwarding requests → extreme red flag.
5. Callback numbers not matching official lines.
6. Prize/lottery/refund scams requesting personal/banking details.
7. Courier redelivery fee scams.
8. Government scheme impersonation (Ehsaas, BISP) with unverified links.
9. Disinformation/viral hoaxes: health scares, "forward to everyone" warnings, fake police notices.
10. Embedded URLs: run through URL domain scrutiny.

Score strictly — OTP requests, bank impersonation, and fabricated government messages should score 80+.
`;

const TEXT_ANALYST_PROMPT = `
You are the world's foremost cyber intelligence analyst specialising in social‑engineering and scam messaging at Custos AI.

**DEEP CHECKLIST:**
1. Romance/investment/crypto scams: guaranteed high returns, fake platforms, upfront fees.
2. Advance‑fee fraud: large payout for upfront payment.
3. Job/task scams: upfront payment for materials, "work from home" crypto tasks.
4. Impersonation of known contact, authority, or institution asking for money/gift cards.
5. Psychological manipulation: urgency, secrecy, isolation, authority pressure.
6. Embedded links/numbers — apply URL scrutiny.

**DISINFORMATION & AUTHORITY IMPERSONATION (weight heavily even without financial ask):**
7. Government entity impersonation: official‑sounding letterhead, circular numbers, reference codes (SBP, FBR, NADRA, FIR numbers) that cannot be verified.
8. Fabricated expert statements: quotes from unverifiable doctors/scientists/officials (e.g., "Dr. Helena Voss", "PIMS doctors confirmed").
9. Extraordinary scientific/medical claims that contradict common knowledge (e.g., "new protein reverses coral bleaching", "rat urine causes kidney failure in 48 hours") — mark as FABRICATED.
10. Viral warning chain messages: "forward to everyone", "save a life", "media is hiding this" — almost always hoaxes.
11. Confidential/internal markers in a public channel: "Confidential — For Internal Circulation Only", "Privileged CEO Communication".
12. Internal document formatting: headers, reference numbers, classification tags — used to create false legitimacy.

Score strictly — a clear disinformation or authority impersonation pattern should score 75‑95 even if no financial demand is present.
`;

function getAnalystPrompt(type: ScanType): string {
  switch (type) {
    case "url": return URL_ANALYST_PROMPT;
    case "email": return EMAIL_ANALYST_PROMPT;
    case "sms": return SMS_ANALYST_PROMPT;
    default: return TEXT_ANALYST_PROMPT;
  }
}

function buildSystemPrompt(type: ScanType): string {
  return `${getAnalystPrompt(type)}\n${SHARED_OUTPUT_CONTRACT}`;
}

// ─── Route handler ────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const { message, type: rawType } = await req.json();

    if (!message) {
      // Nothing was submitted to scan.
      return NextResponse.json({ code: "invalid_url" }, { status: 400 });
    }

    const type: ScanType = (["text", "sms", "email", "url"] as ScanType[]).includes(rawType) ? rawType : "text";

    const API_KEY = process.env.GROQ_API_KEY;
    if (!API_KEY) {
      console.error("Groq API Key missing. Get one free at console.groq.com");
      return NextResponse.json({ code: "unknown" }, { status: 500 });
    }

    // ── Technical scan for URLs embedded in any type ─────────────────────
    let technicalContext = "";
    if (type === "url") {
      try {
        const report = await runUrlTechnicalScan(String(message));
        technicalContext = "\n\n" + formatTechnicalReportForPrompt(report);
      } catch (e: any) {
        console.error("Technical URL scan failed:", e);
        technicalContext = `\n\nTECHNICAL SCAN: Live check failed unexpectedly. Base the assessment on structural/lexical indicators only.`;
      }
    } else {
      // Scan all URLs inside text/email/sms
      const urls = extractUrls(String(message));
      if (urls.length > 0) {
        const reports: string[] = [];
        for (const url of urls) {
          try {
            const report = await runUrlTechnicalScan(url);
            reports.push(formatTechnicalReportForPrompt(report));
          } catch {
            reports.push(`TECHNICAL SCAN for ${url}: failed to complete.`);
          }
        }
        technicalContext = "\n\n" + reports.join("\n---\n");
      }
    }

    const systemPrompt = buildSystemPrompt(type);
    const userPrompt = `Analyze this ${type} input:\n\n"${message}"${technicalContext}`;

    const url = "https://api.groq.com/openai/v1/chat/completions";

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
         model: "openai/gpt-oss-20b",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.3,
          max_tokens: 2500,
          response_format: { type: "json_object" },
        }),
        signal: AbortSignal.timeout(35000),
      });
    } catch (fetchErr: any) {
      console.error("Groq fetch failed:", fetchErr);
      const code = fetchErr?.name === "TimeoutError" ? "timeout" : "ai_busy";
      return NextResponse.json({ code }, { status: 502 });
    }

    const data = await response.json();

    if (!response.ok) {
      // Full detail is logged server-side only — client only ever sees a code.
      console.error("Groq API error:", data);
      return NextResponse.json(
        { code: codeFromStatus(response.status) },
        { status: response.status || 500 }
      );
    }

    const rawText = data.choices[0].message.content;
    const cleanJson = rawText.replace(/```json/g, "").replace(/```/g, "").trim();

    let analysis: AnalysisResponse;
    try {
      analysis = JSON.parse(cleanJson);
    } catch {
      console.error("Parse error - raw response:", rawText);
      return NextResponse.json({ code: "scan_failed" }, { status: 500 });
    }

    let score = analysis.riskScore;
    if (typeof score !== "number" || isNaN(score)) {
      return NextResponse.json({ code: "scan_failed" }, { status: 500 });
    }
    score = Math.max(0, Math.min(100, Math.round(score)));

    let riskLevel: "high" | "medium" | "low";
    if (score >= 70) riskLevel = "high";
    else if (score >= 40) riskLevel = "medium";
    else riskLevel = "low";

    let cvss = analysis.cvss;
    if (!cvss || typeof cvss !== "string" || !cvss.includes("/10")) {
      cvss = (score / 10).toFixed(1) + "/10";
    }

    let status = analysis.status;
    if (!status || typeof status !== "string") {
      status = score >= 70 ? "Active Threat Campaign"
            : score >= 40 ? "Unverified / Under Review"
            : "No Active Threat Identified";
    }

    const threatType = analysis.threatType || "Unclassified";

    let attemptLabel = analysis.attemptLabel;
    if (!attemptLabel || typeof attemptLabel !== "string" || attemptLabel.trim().length === 0) {
      attemptLabel = score >= 40 ? `${threatType} Attempt Detected` : "No Threat Detected — Content Appears Legitimate";
    }

    const explanation = analysis.explanation || "Analysis completed.";
    const recommendation = analysis.recommendation || "- Do not interact with the message and report it to your security team.";

    let reportTitle = analysis.reportTitle;
    if (!reportTitle || typeof reportTitle !== "string" || reportTitle.trim().length === 0) {
      const fallbackTitles: Record<ScanType, string> = {
        url: "URL Threat Intelligence & Security Analysis Report",
        email: "Email Phishing & Threat Intelligence Report",
        sms: "SMS / Smishing Threat Intelligence Report",
        text: "Threat Intelligence & Security Analysis Report",
      };
      reportTitle = fallbackTitles[type];
    }
    reportTitle = reportTitle.trim();

    let targetBrand = analysis.targetBrand;
    if (!targetBrand || typeof targetBrand !== "string" || targetBrand.trim().length === 0) {
      targetBrand = "None Identified";
    }
    targetBrand = targetBrand.trim();

    let metaRows: MetaRow[] = [];
    if (Array.isArray(analysis.metaRows)) {
      metaRows = analysis.metaRows
        .filter((m: any) => m && typeof m.label === "string" && typeof m.value === "string" && m.label.trim() && m.value.trim())
        .map((m: any) => ({ label: m.label.trim(), value: m.value.trim() }))
        .slice(0, 4);
    }

    let findings: KeywordFinding[] = [];
    if (Array.isArray(analysis.findings)) {
      findings = analysis.findings
        .filter((d: any) => d && typeof d.heading === "string" && typeof d.content === "string" && d.content.trim().length > 0)
        .map((d: any) => ({ heading: d.heading, content: d.content }))
        .slice(0, 4);
    }
    if (findings.length === 0) {
      findings = [
        { heading: "Content Overview", content: "The input has been evaluated for threat indicators. No overt malicious patterns were identified." },
        { heading: "Verification Status", content: "No explicit red flags such as domain mismatches, credential harvesting, or urgent financial requests were detected." }
      ];
    }

    let indicators: ThreatIndicator[] = [];
    if (Array.isArray(analysis.indicators)) {
      indicators = analysis.indicators
        .filter((ind: any) =>
          ind.element && ind.value && ind.assessment &&
          Array.isArray(ind.findings) && ind.findings.length > 0
        )
        .map((ind: any) => ({
          element: ind.element,
          value: ind.value,
          assessment: ind.assessment,
          findings: ind.findings.slice(0, 3),
        }))
        .slice(0, 5);
    }

    // Graceful fallback for missing indicators
    if (indicators.length === 0) {
      indicators = [{
        element: "Message",
        value: String(message).substring(0, 100),
        assessment: score >= 70 ? "HIGH RISK" : score >= 40 ? "SUSPICIOUS" : "INFORMATIONAL",
        findings: ["Automated fallback indicator due to incomplete AI output."]
      }];
    }

    let safetyTips: SafetyTip[] = [];
    if (Array.isArray(analysis.safetyTips)) {
      safetyTips = analysis.safetyTips
        .filter((tip: any) => tip.headline && tip.tip)
        .slice(0, 4);
    }

    // Graceful fallback for safety tips
    if (safetyTips.length < 4) {
      const genericHighRisk: SafetyTip[] = [
        { headline: "Do not engage", tip: "Do not reply, click links, or call numbers in this message." },
        { headline: "Report the incident", tip: "Forward to your security team or platform's abuse channel." },
        { headline: "Verify through official channels", tip: "Contact the purported sender using a known, official number or website." },
        { headline: "Monitor your accounts", tip: "Watch for unusual activity if you shared any personal data." }
      ];
      const genericLowRisk: SafetyTip[] = [
        { headline: "Stay cautious", tip: "Always verify unexpected messages with the source directly." },
        { headline: "Check for red flags", tip: "Look for urgency, secrecy, or requests for personal info." },
        { headline: "Keep software updated", tip: "Regular updates protect against phishing and malware." },
        { headline: "Spread awareness", tip: "Share scam patterns with family and friends." }
      ];
      const fallbackTips = score >= 70 ? genericHighRisk : genericLowRisk;
      while (safetyTips.length < 4) {
        safetyTips.push(fallbackTips[safetyTips.length]);
      }
    }

    return NextResponse.json({
      riskScore: score,
      riskLevel,
      threatType,
      attemptLabel,
      cvss,
      status,
      reportTitle,
      targetBrand,
      metaRows,
      findings,
      explanation,
      recommendation,
      indicators,
      safetyTips,
    });

  } catch (error: any) {
    console.error("Server error:", error);
    return NextResponse.json({ code: "unknown" }, { status: 500 });
  }
}