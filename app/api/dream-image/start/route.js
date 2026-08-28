import Replicate from "replicate";

export async function POST(req) {
  try {
    const { dream, symbols } = await req.json();

    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
    const symbolList = symbols?.map(s => s.symbol).join(", ") || "";

    const prompt = `risograph print style, limited color palette,
grainy texture, retro illustration, dreamy and surreal,
muted pinks and teals, mystical atmosphere, soft dreamy atmosphere, lush detailed background,
warm golden light, whimsical and magical,
representing: ${dream}, symbols: ${symbolList}. 
No text, no words, no letters.`;

    // สร้าง prediction แล้ว return ทันที ไม่รอให้เสร็จ
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
    console.error("Start image gen error:", error?.message, error);
    return Response.json(
      { predictionId: null, error: "start_failed", detail: error?.message },
      { status: 500 }
    );
  }
}