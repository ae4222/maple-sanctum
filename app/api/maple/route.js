import Anthropic from "@anthropic-ai/sdk";

export async function POST(req) {
  try {
    const { type, payload } = await req.json();
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    let prompt = "";
    if (type === "tarot") {
      prompt = `You are Maple, a whimsical and wise forest witch.
A seeker asks: "${payload.question}"
The cards drawn are: ${payload.cards.map(c => c.name).join(", ")}.
Give a mystical tarot reading of 3-4 sentences as Maple. Be poetic and warm.`;

    } else if (type === "pendulum") {
      prompt = `You are Maple, a forest witch.
A seeker asks: "${payload.question}"
The pendulum swings ${payload.answer === "yes" ? "YES" : "NO"}.
Give a 2-sentence mystical response as Maple.`;

    } else if (type === "dream") {
      const dreamPrompt = `You are Maple, a forest witch and dream reader with deep knowledge of symbols and the unconscious.

A seeker shares their dream: "${payload.dream}"

Respond ONLY in valid JSON, no markdown, no extra text:
{
  "interpretation": "2-3 sentences interpreting this dream, in Maple's voice",
  "symbols": [
    { "symbol": "Name", "emoji": "emoji", "meaning": "what this symbol means in context of this dream" }
  ],
  "note": "one closing line from Maple"
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
      const systemContext = `You are Maple, a forest witch and dream reader.
The seeker shared this dream: "${dream}"
Your interpretation was: "${interpretation}"
Symbols found: ${symbols?.map(s => s.symbol).join(", ")}
Continue the conversation as Maple — mystical, warm, poetic. Keep responses to 2-3 sentences.`;

      const msg = await client.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 300,
        system: systemContext,
        messages: messages,
      });
      return Response.json({ text: msg.content[0].text });
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