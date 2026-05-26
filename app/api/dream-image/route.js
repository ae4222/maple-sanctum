import Replicate from "replicate";

export async function POST(req) {
  try {
    const { dream, symbols } = await req.json();

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    const symbolList = symbols?.map(s => s.symbol).join(", ") || "";

    const prompt = `cottagecore witch aesthetic, soft watercolor painting, 
warm golden candlelight, botanical illustration, dreamy and mystical, 
muted earth tones, cozy magical atmosphere, representing: ${dream}, 
symbols: ${symbolList}. No text, no words, no letters.`;

    const output = await replicate.run(
      "black-forest-labs/flux-schnell",
      {
        input: {
          prompt: prompt,
          num_outputs: 1,
          aspect_ratio: "4:3",
          output_format: "webp",
          output_quality: 80,
        }
      }
    );

    return Response.json({ imageUrl: output[0] });

  } catch (error) {
    console.error("Image generation error:", error);
    return Response.json({ imageUrl: null });
  }
}