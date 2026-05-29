import Replicate from "replicate";
import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  try {
    const { witchType, familiar, hair, aesthetic, witchName } = await req.json();

    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

    const prompt = `watercolor and ink portrait, ${witchType} witch, 
${hair} hair, ${familiar} familiar beside her,
risograph print style mystical character card, vintage occult zine illustration, 
retro folk-art inspired fantasy portrait, limited muted color palette, 
layered soy ink textures, grainy recycled paper texture, subtle ink bleed and misaligned print registration, 
faded teal and dusty rose tones, moss green and warm cream accents, aged printed paper surface, 
surreal botanical symbolism, dreamlike and poetic atmosphere, whimsical magical realism, hand-drawn imperfect linework, 
flat graphic shading, soft watercolor stains, analog printmaking aesthetic, expressive yet simplified facial features, 
natural proportions, understated emotion, cozy mystical mood, antique storybook influence, indie art print feel, 
centered portrait composition, tactile handmade quality, softly worn vintage imperfections,
upper body centered composition, no text, no words, no frame, no border`;

    const output = await replicate.run("black-forest-labs/flux-dev", {
      input: {
        prompt,
        negative_prompt: "anime eyes, disney style, glossy rendering, polished digital painting, hyper realistic skin, fantasy pinup, mobile game art, sharp vector lineart, neon colors, overly saturated colors, cinematic realism, perfect symmetry, giant eyes, plastic texture, 3d render, ai face, photorealistic portrait, ornate tarot frame, decorative text, watermark, logo, clean modern illustration, high detail rendering, cute chibi style",
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