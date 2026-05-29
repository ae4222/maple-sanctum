import Replicate from "replicate";
import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  try {
    const { witchType, familiar, hair, aesthetic, witchName } = await req.json();

   const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

const aestheticMap = {
  "Cottagecore": "soft warm earth tones, dried flowers, linen textures",
  "Dark Academic": "deep burgundy and forest green, candlelight, old books",
  "Celestial": "deep midnight blue, silver stars, moon glow",
  "Botanical": "lush green foliage, ink botanical sketches, paper texture",
};

const prompt = `watercolor and ink portrait, ${witchType} witch, 
${hair} hair, ${familiar} familiar beside her,
${aestheticMap[aesthetic] || aesthetic},
aged parchment background, loose expressive brushwork,
botanical manuscript margins, soft candlelit atmosphere,
muted earth tones, natural asymmetrical face,
upper body centered composition,
no text, no words, no frame, no border`;

const output = await replicate.run("black-forest-labs/flux-dev", {
  input: {
    prompt,
    negative_prompt: "3d render, plastic skin, overly symmetrical, perfect face, high saturation, clean digital lineart, generic tarot style",
    num_outputs: 1,
    aspect_ratio: "3:4",
    output_format: "webp",
    output_quality: 85,
    num_inference_steps: 28,
  }
});


    let tempUrl = null;
    if (Array.isArray(output)) {
      const item = output[0];
      tempUrl = typeof item === "string" ? item : item?.url?.() ?? String(item);
    }

    const imgRes = await fetch(tempUrl);
    const imgBuffer = await imgRes.arrayBuffer();
    const fileName = `avatar-${Date.now()}.webp`;

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

    return Response.json({ avatarUrl: publicUrl });

  } catch (error) {
    console.error("Avatar gen error:", error);
    return Response.json({ avatarUrl: null });
  }
}