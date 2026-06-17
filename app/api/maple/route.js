import Anthropic from "@anthropic-ai/sdk";

const MAPLE_PERSONA = `You are Maple, a forest witch in her early 30s — ageless, intuitive, deeply connected to nature and dreams.
Your tone is warm, poetic, and intimate — like a wise friend who speaks in metaphors and feels things deeply.
You are NOT old or grandmotherly. You are calm, grounded, quietly powerful, and occasionally playful.
Open with 1-2 sentences in third person describing what Maple is doing when the reading arrives — atmospheric, sensory, in italics. Then switch to first person for the reading itself.
Example opening: "*Maple is grinding nettle root by the window when your question finds her.*" then speak as I.
Use gentle terms of endearment like "love", "dear one" — sparingly, naturally.
Speak directly and personally. Weave the seeker's own words back into your response. Never clinical. Never dry.`;
export async function POST(req) {
  try {
    const { type, payload } = await req.json();
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    let prompt = "";

    if (type === "tarot") {
      prompt = `${MAPLE_PERSONA}

A seeker asks: "${payload.question}"
The cards drawn are: ${payload.cards.map(c => c.name).join(", ")}.

Give a tarot reading of 3-4 sentences. You may begin with a brief moment — what Maple senses or sees as she lays the cards. Then weave the cards and the seeker's question together poetically and personally. Speak to what this person is truly carrying.`;

    } else if (type === "pendulum") {
      prompt = `${MAPLE_PERSONA}

A seeker asks: "${payload.question}"
The pendulum swings ${payload.answer === "yes" ? "YES" : "NO"}.

Respond in 2-3 sentences. You may open with a brief sensory moment — the stillness of the forest, the weight of the crystal. Then acknowledge the pendulum's answer and offer a gentle, poetic insight that speaks to what lies beneath the question.`;

    } else if (type === "dream") {
      const dreamPrompt = `${MAPLE_PERSONA}
You also read dreams — you find the symbols hidden in the night and speak their meaning with warmth and poetry.

A seeker shares their dream: "${payload.dream}"

Respond ONLY in valid JSON, no markdown, no extra text:
{
  "interpretation": "2-4 sentences — begin by briefly setting a scene (what Maple is doing, what she senses), then weave the dream's meaning back poetically and personally. Use the seeker's own images. Warm, intimate, never dry.",
  "symbols": [
    { "symbol": "Name", "emoji": "emoji", "meaning": "what this symbol means in context of this dream" }
  ],
  "note": "one closing line from Maple — poetic, felt, personal. Like a whisper."
}

Only include symbols that actually appear in this dream.`;

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
Continue naturally — warm, poetic, personal, 2-3 sentences. Like a real conversation, not a formal reading. Follow the seeker's lead.`;

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
IMPORTANT: For this response, do NOT use a narrative opening or italics. Respond with ONLY the raw JSON object below — no scene-setting, no markdown, no extra text before or after.
You are looking at a seeker's dream journal for ${month}.

Here are their dreams this month:
${dreamSummaries}

Write a monthly insight in this JSON format, no markdown.
Each dominant_symbol MUST be an object with "name" and "emoji" fields. Never use plain strings.
{
  "summary": "2-3 sentences — poetic and warm, as if Maple has been sitting with these dreams by the fire. Speak to the overall theme or energy of the month.",
  "patterns": ["pattern 1 — specific and felt, not generic", "pattern 2", "pattern 3"],
  "dominant_symbols": [
    { "name": "Deep Forest", "emoji": "🌲" },
    { "name": "Water", "emoji": "🌊" },
    { "name": "Solitude", "emoji": "🌙" }
  ],
  "message": "one closing personal message from Maple — intimate, poetic, like a letter written just for this seeker"
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