/**
 * Groq API helper for DevConnect AI features
 * Model: llama-3.3-70b-versatile (free tier — 14,400 req/day, 30 req/min)
 * Get your free key at: https://console.groq.com → API Keys → Create API Key
 */

const GROQ_API_KEY = process.env.REACT_APP_GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

async function callGroq(prompt) {
  if (!GROQ_API_KEY) {
    throw new Error('REACT_APP_GROQ_API_KEY is not set in your .env file');
  }

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1024,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.error?.message || 'Groq API error');
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

// ── Feature 1: Generate an AI answer for a question ───────────────────────

export async function getAIAnswer(questionTitle, questionBody) {
  const prompt = `You are a helpful senior developer on a Q&A platform called DevConnect.

A developer has asked the following question:

Title: ${questionTitle}

Details:
${questionBody}

Give a clear, accurate, and concise answer. Use code examples where helpful. Format your response in Markdown. Keep it practical and to the point. Do not add unnecessary disclaimers.`;

  return callGroq(prompt);
}

// ── Feature 2: Suggest tags based on question title and body ──────────────

export async function suggestTags(title, body) {
  const prompt = `You are a tagging system for a developer Q&A platform called DevConnect.

Based on the following question, suggest between 1 and 5 relevant tags.
Tags should be lowercase, short, and common programming terms (like: python, react, fastapi, postgresql, jwt, docker, etc.)

Title: ${title}
Body: ${body}

Respond with ONLY a JSON array of tag strings. No explanation, no markdown, no extra text. Example: ["python", "fastapi", "jwt"]`;

  const raw = await callGroq(prompt);

  try {
    // Strip any accidental markdown code fences
    const clean = raw.replace(/```json|```/g, '').trim();
    const tags = JSON.parse(clean);
    if (Array.isArray(tags)) return tags.slice(0, 5);
    return [];
  } catch {
    // Fallback: extract anything that looks like a tag string
    const matches = raw.match(/"([^"]+)"/g);
    if (matches) return matches.map((m) => m.replace(/"/g, '')).slice(0, 5);
    return [];
  }
}