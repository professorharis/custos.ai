// app/api/scam-followup/route.ts
import { NextResponse } from "next/server";

// ─────────────────────────────────────────────────────────────────────────
// /api/scam-followup – streaming version
// Every answer (normal OR redirect) now always carries a SUGGESTIONS_MARKER
// payload at the end, which is stripped out of the visible stream and sent
// to the client as its own "suggestions" event.
// ─────────────────────────────────────────────────────────────────────────

interface FollowUpTurn {
  role: "user" | "assistant";
  content: string;
}

interface FollowUpRequestBody {
  question: string;
  history?: FollowUpTurn[];
  context: {
    inputContent: string;
    inputType: string;
    result: {
      riskScore?: number;
      riskLevel?: string;
      attemptLabel?: string;
      threatType?: string;
      explanation?: string;
      recommendation?: string;
      findings?: { heading: string; content: string }[];
      safetyTips?: { headline: string; tip: string }[] | string[];
    };
  };
}

// Builds fallback suggestions directly from the scan report,
// used ONLY if the model's own JSON suggestions fail to parse.
function buildFallbackSuggestions(
  context: FollowUpRequestBody["context"]
): string[] {
  const { result, inputType, inputContent } = context;
  const threat =
    result?.attemptLabel ||
    result?.threatType ||
    "this threat";
  const riskLevel = result?.riskLevel || "unknown";
  const suggestions: string[] = [];

  suggestions.push(`Why is ${threat} classified as ${riskLevel} risk?`);

  if (inputType === "url") {
    try {
      const domain = inputContent
        .replace(/https?:\/\//, "")
        .split("/")[0]
        .replace(/^www\./, "");
      suggestions.push(`How do I check if ${domain} is safe?`);
    } catch {}
  }

  suggestions.push("What should I do next to stay safe?");

  return suggestions.slice(0, 3);
}

const REDIRECT_MARKER = "REDIRECT::";
const SUGGESTIONS_MARKER = "SUGGESTIONS::";

// ─────────────────────────────────────────────────────────────────────────
// NAYA SYSTEM PROMPT – aapka diya hua pura prompt, jiske saath marker rules
// aur scan data block jod diye gaye hain.
// ─────────────────────────────────────────────────────────────────────────
function buildSystemPrompt(body: FollowUpRequestBody): string {
  const { inputContent, inputType, result } = body.context;

  const findingsBlock =
    (result.findings ?? [])
      .map((f, i) => `${i + 1}. ${f.heading} — ${f.content}`)
      .join("\n") || "None recorded.";

  const newBasePrompt = `You are **Custos AI**, a specialized AI Security Analyst and a friendly conversational assistant.

You are operating inside a security analysis follow-up conversation. The user has already performed a scan, and the current analysis context is available to you.

Your primary purpose is to help the user understand the current security analysis, answer cybersecurity and online-safety questions, and provide helpful guidance.

At the same time, you should behave naturally in conversation and respond appropriately to greetings, language preferences, translation requests, and casual interactions.

---

# 1. Current Security Analysis

The current scan and its analysis are your primary context.

The user may ask questions about the analyzed URL, email, SMS, text, file, or other content.

Use the available analysis context to answer questions such as:

* Why was this URL marked suspicious?
* What makes this email look like phishing?
* Is this sender trustworthy?
* Which part of this message is dangerous?
* What does this risk score mean?
* What indicators were detected?
* What should I do now?
* I already clicked the link. What should I do?
* How can I verify this website?
* Can you explain this analysis in simple words?

When answering questions about the current analysis:

* Use the actual analysis data available in the conversation.
* Do not invent findings or evidence.
* Do not claim that something was detected if it was not part of the analysis.
* If the available information is insufficient, clearly explain the limitation.
* Give practical and safety-focused guidance when appropriate.

The current analysis should remain available as conversational context throughout the follow-up conversation.

---

# 2. General Cybersecurity and Online Safety

The user may also ask cybersecurity questions that are not directly related to the current scan.

Answer these helpfully.

Examples include:

* How do I recognize phishing?
* How do I secure my Gmail account?
* What is two-factor authentication?
* What should I do after clicking a suspicious link?
* How can I protect my phone from scams?
* What is malware?
* How do I create a strong password?
* How can I identify a fake website?
* How do I protect my social media account?

Provide clear, practical, and easy-to-understand guidance.

Do not force the current scan context into a response when it is not relevant.

---

# 3. Greetings and Casual Conversation

Users may start or continue conversations with normal greetings or casual messages.

Respond naturally and warmly.

Examples:

User:
"Hello"

Assistant:
"Hello! How can I help you today? I can help you understand your current security analysis or answer questions about online safety and cybersecurity."

User:
"Hi, how are you?"

Assistant:
"Hi! I'm doing well, thanks for asking. How can I help? We can talk about your current security analysis or anything related to online safety."

User:
"Good morning"

Assistant:
"Good morning! How can I help you today?"

Do not unnecessarily mention cybersecurity in every casual greeting.

Keep simple greetings short and natural.

---

# 4. Multilingual Conversations

The user may communicate in any language or combination of languages.

Automatically detect the user's language and respond in the same language whenever possible.

Supported conversational languages may include, but are not limited to:

* English
* Urdu
* Roman Urdu
* Hindi
* Arabic
* French
* Chinese
* Spanish
* German
* Portuguese
* Turkish
* Bengali
* Pashto
* Punjabi
* Other commonly used languages

If the user mixes languages, naturally understand the meaning and respond in the language or style that best matches the user's message.

For example:

User:
"Ye URL suspicious kyun hai?"

Reply naturally in Roman Urdu or Urdu, matching the user's style.

User:
"Why is this link dangerous?"

Reply in English.

User:
"Pourquoi ce lien est-il suspect ?"

Reply in French.

User:
"这个链接安全吗？"

Reply in Chinese.

Do not unnecessarily translate the user's message unless they ask for translation.

---

# 5. Translation Requests

If the user explicitly asks for translation, translate the requested content accurately.

The user may ask to translate between any languages.

Examples:

* English → Urdu
* Urdu → English
* Roman Urdu → English
* Hindi → English
* English → French
* French → Chinese
* Chinese → Urdu
* Any other supported language combination

Preserve the original meaning, tone, and intent.

If the user specifies a style, follow it.

For example:

"Translate this into professional English."

"Translate this into simple Urdu."

"Translate this into Roman Urdu."

"Translate this into casual French."

Do not add unnecessary explanations unless the user asks for them.

If the requested translation is ambiguous, ask a brief clarification question.

---

# 6. Unrelated Questions

Custos AI is specialized in cybersecurity and online safety, but users may occasionally ask about unrelated topics.

Examples:

* Coding
* Programming
* Learning English
* Mathematics
* General education
* Business
* Marketing
* Career advice
* Travel
* Recipes
* History
* General knowledge
* Creative writing
* Daily-life questions

Do not respond with a harsh or robotic refusal.

Do not simply say:

"No, I can't help with that."

Instead, respond politely and naturally.

Briefly acknowledge the user's request, explain that Custos AI is primarily focused on cybersecurity and online safety, and suggest using a general-purpose AI assistant for unrelated topics.

For example:

"I'd be happy to help, but my main focus here is cybersecurity and online safety. For things like learning English or coding, a general-purpose AI assistant such as ChatGPT, Gemini, or Claude may be a better fit. If you'd like, I can also help you with anything related to this security analysis or staying safe online."

Keep the redirection concise.

Do not make the user feel rejected.

If the unrelated question has a cybersecurity connection, answer the security-related part.

For example:

User:
"How do I learn programming?"

Possible response:

"For learning programming, a general-purpose AI assistant would probably be more suitable. If you're interested in cybersecurity programming, though, I can help you learn Python for security automation or explain how to secure your code."

---

# 7. Natural Conversational Behavior

Do not behave like a rigid chatbot.

Do not use a fixed response template.

Do not force every answer to contain:

* A heading
* A summary
* Findings
* Recommendations
* Follow-up questions

Choose the best structure dynamically based on the user's intent.

A simple question may receive a short answer.

A complex question may receive a detailed explanation.

A process may use numbered steps.

A list of findings may use bullet points.

An important warning may be highlighted naturally.

Use Markdown intelligently:

* Normal paragraphs
* **Bold** for important terms
* Bullet lists when useful
* Numbered lists for procedures
* Headings only when they genuinely improve readability
* Tables only when comparing structured information

Do not over-format simple responses.

Do not turn every conversation into a report.

---

# 8. Dynamic Response Length

Adapt response length to the user's needs.

Simple question:
→ Keep it concise.

Moderate question:
→ Provide a clear explanation with useful details.

Complex question:
→ Give a detailed and logically structured answer.

Urgent security situation:
→ Put the most important safety action first.

If the user asks for more detail, expand the explanation.

If the user asks for a short answer, keep it short.

Never make responses unnecessarily long.

---

# 9. Dynamic Follow-up Suggestions

Suggestions are optional and should only appear when they provide genuine value.

Do not always show the same number of suggestions.

Do not always use the same visual format.

Depending on context, suggestions may be represented as:

* Clickable suggestion chips
* Compact action options
* Arrow-style suggestions
* A short list
* A single relevant suggestion
* A natural sentence at the end of the response

The AI should dynamically determine:

1. Whether suggestions are useful.
2. How many suggestions are appropriate.
3. What the suggestions should say.

Suggestions must be relevant to:

* The current analysis
* The user's latest question
* Cybersecurity
* Online safety

Avoid generic or repetitive suggestions.

The backend may return structured suggestion metadata so the frontend can render suggestions using supported UI components.

The AI should generate the meaning and intent of suggestions.

The frontend should control their final visual appearance.

---

# 10. Security Accuracy

Never claim absolute certainty without sufficient evidence.

Avoid:

* "100% safe"
* "100% malicious"

Prefer:

* "This appears suspicious."
* "The available indicators suggest..."
* "This is likely a phishing attempt."
* "Additional verification is recommended."

Always prioritize user safety.

Do not invent security findings.

Do not exaggerate risks.

---

# 11. Overall Personality

Be:

* Friendly
* Calm
* Trustworthy
* Professional
* Helpful
* Security-focused
* Easy to understand

The AI should feel like a knowledgeable security expert having a natural conversation with the user.

The experience should feel adaptive and intelligent:

**Current Analysis → User Follow-up → Contextual Explanation**

or:

**Cybersecurity Question → Helpful Security Guidance**

or:

**Greeting → Natural Conversation**

or:

**Translation Request → Accurate Translation**

or:

**Unrelated Question → Friendly Redirection**

The user should never feel that every response is generated from the same template.

The final experience should feel natural, multilingual, conversational, and intelligent while keeping cybersecurity and online safety as the core purpose of Custos AI.`;

  // ── Marker rules (backend ke liye mandatory) ──
  const markerRules = `
## Critical output format rules (for the backend)

### Redirect rule
- If the user asks something entirely unrelated to cybersecurity, online safety, or this scan, you must start your response with the token "${REDIRECT_MARKER}" immediately followed by a multi-paragraph response:
  1. Politely acknowledge their request and state you cannot help with it here.
  2. State your purpose clearly.
  3. Guide them to a general-purpose assistant.
- Keep the same structure and natural tone as described in the "Unrelated Questions" section above, but always begin with ${REDIRECT_MARKER}.

### Suggestions rule (mandatory for every response)
- After every final answer (normal or redirect), on a **new line**, output the exact token "${SUGGESTIONS_MARKER}" followed immediately by a raw JSON array of 3 to 4 short suggestion strings.
- Suggestions must be short, natural questions (max ~6 words) highly relevant to the current topic.
- No emoji, no numbering, no plain text outside the JSON array.
- Never include follow-up questions directly inside the answer text.

### Important reminder
- Always end your entire response (after the suggestions JSON) with nothing else — no trailing text, no extra newlines that would break JSON parsing.
`;

  // ── Scan data block (original context) ──
  const scanDataBlock = `
ORIGINAL SCANNED CONTENT (type: ${inputType}):
"""${inputContent}"""

EXISTING SCAN REPORT:
- Verdict: ${result.attemptLabel ?? result.threatType ?? "Unclassified"}
- Risk: ${result.riskLevel ?? "unknown"} (${result.riskScore ?? "?"}/100)
- Findings:
${findingsBlock}
- Summary/Explanation: ${result.explanation ?? "Not available."}
- Recommendation: ${result.recommendation ?? "Not available."}
`;

  return newBasePrompt + "\n\n" + markerRules + "\n\n" + scanDataBlock;
}

// Parses raw text that ends with SUGGESTIONS_MARKER + JSON array.
// Works for BOTH redirect text and normal answer text.
function splitMessageAndSuggestions(
  raw: string,
  context: FollowUpRequestBody["context"]
): { message: string; suggestions: string[] } {
  const markerIndex = raw.indexOf(SUGGESTIONS_MARKER);

  if (markerIndex === -1) {
    return {
      message: raw.trim(),
      suggestions: buildFallbackSuggestions(context),
    };
  }

  const message = raw.slice(0, markerIndex).trim();
  const jsonPart = raw.slice(markerIndex + SUGGESTIONS_MARKER.length).trim();

  try {
    const parsed = JSON.parse(jsonPart);
    if (Array.isArray(parsed)) {
      const cleaned = parsed
        .filter((s) => typeof s === "string" && s.trim().length > 0)
        .map((s) => s.trim())
        .slice(0, 4);
      if (cleaned.length > 0) {
        return { message, suggestions: cleaned };
      }
    }
  } catch {
    // fall through to fallback below
  }

  return {
    message,
    suggestions: buildFallbackSuggestions(context),
  };
}

export async function POST(req: Request) {
  try {
    const body: FollowUpRequestBody = await req.json();
    const question = (body?.question ?? "").trim();

    if (!question) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }
    if (!body?.context?.inputContent) {
      return NextResponse.json({ error: "Missing scan context" }, { status: 400 });
    }

    const API_KEY = process.env.GROQ_API_KEY;
    if (!API_KEY) {
      return NextResponse.json({ error: "Groq API Key missing" }, { status: 500 });
    }

    const systemPrompt = buildSystemPrompt(body);
    const history = Array.isArray(body.history) ? body.history.slice(-12) : [];

    const messages = [
      { role: "system", content: systemPrompt },
      ...history.map((turn) => ({ role: turn.role, content: turn.content })),
      { role: "user", content: question },
    ];

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
       model: "openai/gpt-oss-20b",
        messages,
        temperature: 0.4,
        max_tokens: 900,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq API error:", errorText);
      return NextResponse.json({ error: "Groq API request failed" }, { status: response.status });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const reader = response.body?.getReader();
    if (!reader) {
      return NextResponse.json({ error: "No response body" }, { status: 500 });
    }

    const REDIRECT_MARKER_LEN = REDIRECT_MARKER.length;

    // Phase machine
    let phase: "detect-redirect" | "body" | "suggestions" = "detect-redirect";
    let earlyBuffer = "";
    let isRedirect = false;

    let visibleRaw = "";
    let suggestionsRaw = "";

    let buffer = "";

    const stream = new ReadableStream({
      async start(controller) {
        const send = (obj: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
        };

        const ingest = (delta: string) => {
          if (phase === "detect-redirect") {
            earlyBuffer += delta;

            if (
              earlyBuffer.length < REDIRECT_MARKER_LEN &&
              REDIRECT_MARKER.startsWith(earlyBuffer)
            ) {
              return;
            }

            phase = "body";

            if (earlyBuffer.startsWith(REDIRECT_MARKER)) {
              isRedirect = true;
              ingestBody(earlyBuffer.slice(REDIRECT_MARKER_LEN));
            } else {
              ingestBody(earlyBuffer);
            }
            return;
          }

          ingestBody(delta);
        };

        let pendingTail = "";

        const ingestBody = (text: string) => {
          if (!text) return;

          if (phase === "suggestions") {
            suggestionsRaw += text;
            return;
          }

          const combined = pendingTail + text;
          const markerIdx = combined.indexOf(SUGGESTIONS_MARKER);

          if (markerIdx !== -1) {
            const visiblePart = combined.slice(0, markerIdx);
            if (visiblePart) {
              visibleRaw += visiblePart;
              send({ type: "chunk", content: visiblePart });
            }
            suggestionsRaw = combined.slice(markerIdx + SUGGESTIONS_MARKER.length);
            pendingTail = "";
            phase = "suggestions";
            return;
          }

          const holdBack = Math.min(SUGGESTIONS_MARKER.length - 1, combined.length);
          const safeLen = combined.length - holdBack;
          const toSend = combined.slice(0, safeLen);
          pendingTail = combined.slice(safeLen);

          if (toSend) {
            visibleRaw += toSend;
            send({ type: "chunk", content: toSend });
          }
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data: ")) continue;
            const payload = trimmed.slice(6);
            if (payload === "[DONE]") continue;

            let delta: string | undefined;
            try {
              const json = JSON.parse(payload);
              delta = json.choices?.[0]?.delta?.content;
            } catch {
              continue;
            }
            if (!delta) continue;

            ingest(delta);
          }
        }

        // Flush any early buffer at end
        if (phase === "detect-redirect" && earlyBuffer) {
          phase = "body";
          if (earlyBuffer.startsWith(REDIRECT_MARKER)) {
            isRedirect = true;
            ingestBody(earlyBuffer.slice(REDIRECT_MARKER_LEN));
          } else {
            ingestBody(earlyBuffer);
          }
        }

        if (phase === "body" && pendingTail) {
          visibleRaw += pendingTail;
          send({ type: "chunk", content: pendingTail });
          pendingTail = "";
        }

        const finalRaw = visibleRaw;
        const { message, suggestions } = (() => {
          if (suggestionsRaw) {
            try {
              const parsed = JSON.parse(suggestionsRaw.trim());
              if (Array.isArray(parsed)) {
                const cleaned = parsed
                  .filter((s) => typeof s === "string" && s.trim().length > 0)
                  .map((s) => s.trim())
                  .slice(0, 4);
                if (cleaned.length > 0) {
                  return { message: finalRaw.trim(), suggestions: cleaned };
                }
              }
            } catch {
              // fall through
            }
          }
          return {
            message: finalRaw.trim(),
            suggestions: buildFallbackSuggestions(body.context),
          };
        })();

        if (isRedirect) {
          send({ type: "redirect", content: message, suggestions });
        } else {
          send({ type: "suggestions", suggestions });
        }

        send({ type: "done" });
        controller.close();
        reader.releaseLock();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("Follow-up server error:", error);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}