import Replicate from "replicate";

export async function POST(req) {
  try {
    const { dream, symbols } = await req.json();

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    const symbolList = symbols?.map(s => s.symbol).join(", ") || "";

const prompt = `dark mystical dream scene, oil painting style, 
deep midnight blues and purples, moonlit atmosphere, 
surreal and ethereal, pre-raphaelite art style,
representing: ${dream}, symbols: ${symbolList}. 
No text, no words, no letters.`;

    const output = await replicate.run(
      "black-forest-labs/flux-schnell",
      {
        input: {
          prompt,
          num_outputs: 1,
          aspect_ratio: "4:3",
          output_format: "webp",
          output_quality: 80,
        }
      }
    );

    // output ใหม่เป็น FileOutput object ต้อง convert เป็น URL string ก่อน
    let imageUrl = null;

    if (Array.isArray(output)) {
      // output[0] อาจเป็น FileOutput object
      const item = output[0];
      imageUrl = typeof item === "string" ? item : item?.url?.() ?? String(item);
    } else if (output?.url) {
      imageUrl = output.url();
    }

    console.log("imageUrl:", imageUrl); // เช็ค log ใน terminal
    return Response.json({ imageUrl });

  } catch (error) {
    console.error("Image generation error:", error);
    return Response.json({ imageUrl: null });
  }
}