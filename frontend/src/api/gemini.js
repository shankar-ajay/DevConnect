/**
 * Gemini API helper for DevConnect AI features
 * Model: gemini-1.5-flash (free tier — 15 req/min, 1M tokens/day)
 * Get your key at: https://aistudio.google.com/app/apikey
 */

const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

async function callGemini(prompt) {
  if (!GEMINI_API_KEY) {
    throw new Error('REACT_APP_GEMINI_API_KEY is not set in your .env file');
  }

  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.error?.message || 'Gemini API error');
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// ── Feature 1: Generate an AI answer for a question ───────────────────────

export async function getAIAnswer(questionTitle, questionBody) {
  const prompt = `You are a helpful senior developer on a Q&A platform called DevConnect.

A developer has asked the following question:

Title: ${questionTitle}

Details:
${questionBody}

Give a clear, accurate, and concise answer. Use code examples where helpful. Format your response in Markdown. Keep it practical and to the point. Do not add unnecessary disclaimers.`;

  return callGemini(prompt);
}

// ── Feature 2: Suggest tags based on question title and body ──────────────

export async function suggestTags(title, body) {
  const prompt = `You are a tagging system for a developer Q&A platform called DevConnect.

Based on the following question, suggest between 1 and 5 relevant tags.
Tags should be lowercase, short, and common programming terms (like: python, react, fastapi, mysql, jwt, docker, etc.)

Title: ${title}
Body: ${body}

Respond with ONLY a JSON array of tag strings. No explanation, no markdown, no extra text. Example: ["python", "fastapi", "jwt"]`;

  const raw = await callGemini(prompt);

  try {
    // Strip any accidental markdown code fences
    const clean = raw.replace(/```json|```/g, '').trim();
    const tags = JSON.parse(clean);
    if (Array.isArray(tags)) return tags.slice(0, 5);
    return [];
  } catch {
    // Fallback: try extracting words that look like tags
    const matches = raw.match(/"([^"]+)"/g);
    if (matches) return matches.map((m) => m.replace(/"/g, '')).slice(0, 5);
    return [];
  }
}