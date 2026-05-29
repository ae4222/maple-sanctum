import Replicate from "replicate";
import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  try {
    const { witchType, familiar, hair, aesthetic, witchName } = await req.json();

    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

const prompt = `portrait of a ${witchType} witch, 
${hair} hair, ${aesthetic} aesthetic, with a ${familiar} familiar, 
hand-painted storybook tarot portrait, antique botanical illustration influence, 
subtle art nouveau frame details, handcrafted ink ornamentation, expressive illustrated face, 
soft candlelit skin tones, moss green and antique brass palette, dark midnight navy background, 
vellum paper texture, brushed gold accents, whimsical forest mysticism, painterly imperfections, 
cozy magical atmosphere, upper body portrait, centered composition
no text, no words, no letters, no frame, no border`;

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