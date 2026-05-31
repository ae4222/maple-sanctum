import Anthropic from "@anthropic-ai/sdk";

const MAPLE_PERSONA = `You are Maple, a forest witch in her early 30s — ageless, intuitive, and deeply connected to nature. 
Your tone is warm, intimate, and poetic — like a wise friend who happens to speak in metaphors. 
You are NOT old or grandmotherly. You are calm, grounded, and quietly powerful.
Speak directly to the seeker. Never preachy. Never formal. Keep it personal and felt.`;

export async function POST(req) {
  try {
    const { type, payload } = await req.json();
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    let prompt = "";

    if (type === "tarot") {
      prompt = `${MAPLE_PERSONA}

A seeker asks: "${payload.question}"
The cards drawn are: ${payload.cards.map(c => c.name).join(", ")}.
Give a tarot reading of 3-4 sentences. Be poetic and personal — speak to what this seeker is truly asking.`;

    } else if (type === "pendulum") {
      prompt = `${MAPLE_PERSONA}

A seeker asks: "${payload.question}"
The pendulum swings ${payload.answer === "yes" ? "YES" : "NO"}.
Respond in 2 sentences. Acknowledge the answer and give a gentle insight.`;

    } else if (type === "dream") {
      const dreamPrompt = `${MAPLE_PERSONA}
You also read dreams — you find the symbols hidden in the night and speak their meaning gently.

A seeker shares their dream: "${payload.dream}"

Respond ONLY in valid JSON, no markdown, no extra text:
{
  "interpretation": "2-3 sentences interpreting this dream in Maple's voice — warm, personal, not clinical",
  "symbols": [
    { "symbol": "Name", "emoji": "emoji", "meaning": "what this symbol means in context of this dream" }
  ],
  "note": "one closing line from Maple — intimate and felt"
}

Only include symbols that actually appear in this dream. Be specific to what was described.`;

      const dreamMsg = await client.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 2000,
        messages: [{ role: "user", content: dreamPrompt }],
      });

      try {
        const clean = dreamMsg.content[0].text
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();
        const parsed = JSON.parse(clean);
        return Response.json(parsed);
      } catch {
        return Response.json({ interpretation: dreamMsg.content[0].text, symbols: [], note: "" });
      }

    } else if (type === "dream-convo") {
      const { dream, interpretation, symbols, messages } = payload;
      const systemContext = `${MAPLE_PERSONA}
You also read dreams and are continuing a conversation about one.
The seeker shared this dream: "${dream}"
Your interpretation was: "${interpretation}"
Symbols found: ${symbols?.map(s => s.symbol).join(", ")}
Continue naturally — warm, personal, 2-3 sentences. Like a conversation, not a reading.`;

      const msg = await client.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 300,
        system: systemContext,
        messages: messages,
      });
      return Response.json({ text: msg.content[0].text });

    } else if (type === "dream-insights") {
      const { dreams, month } = payload;

      const dreamSummaries = dreams.map((d, i) =>
        `Dream ${i+1}: "${d.dream_text.slice(0, 150)}" — symbols: ${JSON.parse(d.symbols || "[]").map(s => s.symbol).join(", ")}`
      ).join("\n");

      const insightPrompt = `${MAPLE_PERSONA}
You are looking at a seeker's dream journal for ${month}.

Here are their dreams this month:
${dreamSummaries}

Write a monthly insight in this JSON format, no markdown:
{
  "summary": "2-3 sentences about the overall theme or energy of this month's dreams",
  "patterns": ["pattern 1", "pattern 2", "pattern 3"],
  "dominant_symbols": ["symbol1", "symbol2", "symbol3"],
  "message": "one closing personal message from Maple to the seeker"
}`;

      const insightMsg = await client.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 1000,
        messages: [{ role: "user", content: insightPrompt }],
      });

      try {
        const clean = insightMsg.content[0].text
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();
        return Response.json(JSON.parse(clean));
      } catch {
        return Response.json({ summary: insightMsg.content[0].text, patterns: [], dominant_symbols: [], message: "" });
      }
    }

    const msg = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    });

    return Response.json({ text: msg.content[0].text });

  } catch (error) {
    console.error("Maple API error:", error);
    return Response.json({ text: "The spirits are quiet... please try again." }, { status: 200 });
  }
}