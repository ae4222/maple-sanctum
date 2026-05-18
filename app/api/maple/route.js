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
    } else {
      prompt = `You are Maple, a forest witch.
A seeker asks: "${payload.question}"
The pendulum swings ${payload.answer === "yes" ? "YES" : "NO"}.
Give a 2-sentence mystical response as Maple.`;
    }

    const msg = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });

    return Response.json({ text: msg.content[0].text });

  } catch (error) {
    console.error("Maple API error:", error);
    return Response.json({ text: "The spirits are quiet... please try again." }, { status: 200 });
  }
}