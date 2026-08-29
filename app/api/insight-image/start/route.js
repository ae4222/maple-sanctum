import Replicate from "replicate";
export async function POST(req) {
  try {
    const { summary, dominant_symbols } = await req.json();

    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
    const symbolList = dominant_symbols?.map(s => typeof s === "string" ? s : s.name).join(", ") || "";

    const prompt = `risograph print style, limited color palette,
grainy texture, retro illustration, dreamy and surreal,
muted pinks and teals, mystical atmosphere, soft dreamy atmosphere, lush detailed background,
warm golden light, whimsical and magical,
representing a monthly dream journal: ${summary}, recurring symbols: ${symbolList}.
No text, no words, no letters.`;

    const prediction = await replicate.predictions.create({
      model: "black-forest-labs/flux-schnell",
      input: {
        prompt,
        num_outputs: 1,
        aspect_ratio: "4:3",
        output_format: "webp",
        output_quality: 80,
      },
    });

    return Response.json({ predictionId: prediction.id });

  } catch (error) {
    console.error("Start insight image error:", error?.message, error);
    return Response.json(
      { predictionId: null, error: "start_failed", detail: error?.message },
      { status: 500 }
    );
  }
}