import Replicate from "replicate";
import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  try {
    const { witchType, familiar, hair, aesthetic, witchName } = await req.json();

    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

const prompt = `portrait of a ${witchType} witch, 
${hair} hair, ${aesthetic} aesthetic, with a ${familiar} familiar, 
hand-painted storybook tarot card illustration, mystical witch portrait with animal familiar, 
antique botanical illustration influence, watercolor and ink on aged parchment paper, 
subtle art nouveau frame details, worn gold leaf accents, weathered vintage texture, 
expressive illustrated face with natural asymmetry, delicate freckles, soft realistic eyes, 
painterly brush strokes, ink bleed, handcrafted ornamental border, cozy magical atmosphere, 
cinematic candlelight glow, moonlit fog ambience, botanical linework, 
layered vintage fabrics, organic imperfections, upper body portrait, centered composition


COLOR PALETTE:
deep forest teal, moss green, muted olive, antique brass gold, warm candle amber, aged parchment beige, dark navy shadows, desaturated botanical reds, soft ivory highlights

LIGHTING:
soft candlelit skin tones, subtle moonlight rim light, deep atmospheric shadows, warm amber highlights, muted low saturation cinematic lighting

MATERIAL & TEXTURE:
aged vellum texture, watercolor wash, brushed pigment, faded ink lines, worn paper grain, gold foil wear, antique book page texture, hand-painted imperfections

STYLE NOTES:
storybook illustration mixed with antique botanical print, vintage occult manuscript aesthetic, handcrafted mystical artifact feel, painterly and organic rather than polished digital art

negative prompt:
3d render, glossy skin, plastic texture, hyper realistic face, anime style, overly symmetrical face, 
sharp digital rendering, generic fantasy tarot, mobile game art, 
clean vector lineart, neon colors, high saturation, photorealistic skin, 
ai generated look, modern digital painting, perfect face, over detailed ornate frame, 
text watermark, signature, blurry image


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