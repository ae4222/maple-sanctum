import Replicate from "replicate";
import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  try {
    const { witchType, familiar, hair, aesthetic, witchName } = await req.json();

   const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

const prompt = `storybook illustration, witch portrait, ${witchType} witch with ${familiar} familiar,
hand-painted with watercolor and ink, antique botanical print influence,
subtle art nouveau frame, aged parchment texture, ink stains, gold leaf accents worn and imperfect,
deep forest teal palette with muted green and brass, soft candlelit mood,
expressive face, natural asymmetry, handcrafted details, cozy mystical atmosphere,
${hair} hair, ${aesthetic} aesthetic,
upper body portrait, centered composition,
no text, no words, no letters`;

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

    const output = await replicate.run("black-forest-labs/flux-dev", {
      input: {
        prompt,
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