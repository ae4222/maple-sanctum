import Replicate from "replicate";
import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  try {
    const { dream, symbols } = await req.json();

    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
    const symbolList = symbols?.map(s => s.symbol).join(", ") || "";

   const prompt = `oil painting, rich impasto texture, 
dramatic chiaroscuro lighting, old masters style,
dark moody atmosphere, candlelight, mystical and ethereal,  soft dreamy atmosphere, lush detailed background,
warm golden light, whimsical and magical,

representing: ${dream}, symbols: ${symbolList}. 
No text, no words, no letters.`;

    const output = await replicate.run("black-forest-labs/flux-schnell", {
      input: { prompt, num_outputs:1, aspect_ratio:"4:3", output_format:"webp", output_quality:80 }
    });

    let tempUrl = null;
    if (Array.isArray(output)) {
      const item = output[0];
      tempUrl = typeof item === "string" ? item : item?.url?.() ?? String(item);
    }

   
    const imgRes = await fetch(tempUrl);
    const imgBuffer = await imgRes.arrayBuffer();
    const fileName = `dream-${Date.now()}.webp`;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SECRET_KEY
    );

    await supabase.storage
      .from("dream-images")
      .upload(fileName, imgBuffer, { contentType: "image/webp" });

    const { data: { publicUrl } } = supabase.storage
      .from("dream-images")
      .getPublicUrl(fileName);

    return Response.json({ imageUrl: publicUrl });

  } catch (error) {
    console.error("Image generation error:", error);
    return Response.json({ imageUrl: null });
  }
}