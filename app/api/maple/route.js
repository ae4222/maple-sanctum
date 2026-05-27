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
 "note": "one closing line from Maple",
  "svg": "a complete SVG illustration (400x300) in dark cottagecore witch style - deep navy midnight blue dark forest green warm amber gold colors, botanical elements flowers mushrooms stars moon, mysterious yet cozy, dark background #0a0514, whimsical magical. Must start with <svg and end with </svg>"


}

Only include symbols that actually appear in this dream. Be specific to what was described.
For SVG: draw something representing the dream symbolically. Warm cozy cottagecore witch aesthetic.`;

      const dreamMsg = await client.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 600,
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