import Replicate from "replicate";
import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  try {
    const { witchType, familiar, hair, aesthetic, witchName } = await req.json();

    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

const prompt = `vintage risograph folk illustration of a mystical ${witchType} witch, 
inspired by eastern european storybook art and antique botanical field guides, 
${hair} hair, ${familiar} familiar,
limited muted color palette, faded teal and moss green tones, dusty terracotta accents, 
aged cream paper texture, layered soy ink printing, imperfect ink registration, 
grainy recycled paper, hand-drawn linework, flat graphic shading, 
simplified facial structure, small realistic eyes, understated facial features, non-glamorous character design, 
surreal botanical symbolism, poetic and mysterious atmosphere, analog printmaking aesthetic, witchcore, goblincore,
weathered vintage imperfections, cozy occult zine feeling, artisan handmade print quality, 
centered composition`;

const output = await replicate.run("black-forest-labs/flux-1.1-pro", {
  input: {
    prompt,
    negative_prompt: "anime, disney, pixar, manga, cute face, glossy skin, giant eyes, fantasy waifu, mobile game art, polished digital painting, hyper detailed face, cinematic portrait, perfect symmetry, shiny rendering, vibrant colors, photorealism, 3d render, ai generated girl, glamorous fantasy character, sharp vector illustration",
    num_outputs: 1,
    aspect_ratio: "3:4",
    output_format: "webp",
    output_quality: 85,
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