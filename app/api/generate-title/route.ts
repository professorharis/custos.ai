import { NextResponse } from "next/server";

// ─────────────────────────────────────────────────────────────────────────
// /api/generate-title
//
// This route did not exist yet — that's why calls to it were returning a
// 404 in the logs. It must live at exactly:
//   app/api/generate-title/route.ts   (App Router)
// with a named `POST` export, which is what this file provides.
//
// Purpose: given the scanned content + the completed scan result, ask the
// model for a short, specific, human-readable title for the sidebar/header
// (e.g. "PayPal Credential Phishing Attempt" instead of a generic
// "URL Scan Analysis"). The caller (MainArea.runScan) already treats this
// endpoint as best-effort — on any failure it falls back to
// `deriveFallbackTitle(...)`, so this route can fail safely without
// breaking the scan flow.
// ─────────────────────────────────────────────────────────────────────────

interface GenerateTitleRequestBody {
  content: string;
  type: "text" | "sms" | "email" | "url";
  result?: {
    riskLevel?: string;
    riskScore?: number;
    threatType?: string;
    attemptLabel?: string;
    explanation?: string;
  };
}

const MAX_TITLE_WORDS = 8;

function buildPrompt(body: GenerateTitleRequestBody): string {
  const { content, type, result } = body;
  const trimmedContent = (content || "").slice(0, 800); // keep the prompt small/cheap

  return `You title security scan reports for Custos AI, a scam/phishing detection product.

Given the scanned ${type} content and its analysis result below, write ONE short, specific, human-readable title for this report — the kind that would appear in a chat sidebar so the user instantly recognizes what this scan was about.

Rules:
- Maximum ${MAX_TITLE_WORDS} words.
- Be concrete: name the brand/organization being impersonated, the domain, or the specific scam type if identifiable (e.g. "PayPal Credential Phishing Attempt", "Fake Courier Delivery SMS Scam", "g00gle.com Lookalike Link Analysis").
- If the content is safe/legitimate, reflect that plainly (e.g. "Routine Appointment Reminder — No Threat").
- Do NOT use generic titles like "Text Analysis" or "Scan Report" alone.
- Output ONLY the title text — no quotes, no punctuation at the end, no explanation, no markdown.

SCANNED CONTENT (${type}):
"""${trimmedContent}"""

ANALYSIS RESULT:
- Risk level: ${result?.riskLevel ?? "unknown"} (${result?.riskScore ?? "?"}/100)
- Threat type: ${result?.threatType ?? "unclassified"}
- Attempt label: ${result?.attemptLabel ?? "n/a"}
- Summary: ${(result?.explanation ?? "").slice(0, 300)}
`;
}

export async function POST(req: Request) {
  try {
    const body: GenerateTitleRequestBody = await req.json();

    if (!body?.content || !body?.type) {
      return NextResponse.json({ error: "content and type are required" }, { status: 400 });
    }

    const API_KEY = process.env.GROQ_API_KEY;
    if (!API_KEY) {
      // Fail soft — the caller already falls back to a derived title.
      return NextResponse.json({ title: null, error: "Groq API key missing" }, { status: 500 });
    }

    const prompt = buildPrompt(body);

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
       model: "openai/gpt-oss-20b",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
        max_tokens: 40,
      }),
      // Keep this fast — title generation should never meaningfully delay
      // the scan result the user is already looking at.
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error("generate-title: Groq API error:", errText);
      return NextResponse.json({ title: null, error: "Title generation failed" }, { status: 200 });
    }

    const data = await response.json();
    let title: string | null = data?.choices?.[0]?.message?.content?.trim() ?? null;

    if (title) {
      // Strip stray quotes/markdown the model sometimes adds despite instructions.
      title = title.replace(/^["'*_#\s]+|["'*_#\s]+$/g, "");
      // Hard safety cap in case the model ignores the word-count instruction.
      const words = title.split(/\s+/);
      if (words.length > MAX_TITLE_WORDS + 4) {
        title = words.slice(0, MAX_TITLE_WORDS + 4).join(" ");
      }
      if (title.length === 0) title = null;
    }

    return NextResponse.json({ title });
  } catch (error: any) {
    console.error("generate-title: server error:", error);
    // Fail soft with 200 + null title so the client's best-effort fetch
    // just falls back to deriveFallbackTitle without surfacing an error.
    return NextResponse.json({ title: null, error: "Server error" }, { status: 200 });
  }
}