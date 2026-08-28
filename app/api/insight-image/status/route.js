import Replicate from "replicate";
import { createClient } from "@supabase/supabase-js";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const predictionId = searchParams.get("id");

    if (!predictionId) {
      return Response.json({ error: "missing_id" }, { status: 400 });
    }

    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
    const prediction = await replicate.predictions.get(predictionId);

    if (prediction.status === "starting" || prediction.status === "processing") {
      return Response.json({ status: prediction.status, imageUrl: null });
    }

    if (prediction.status === "failed" || prediction.status === "canceled") {
      console.error("Insight prediction failed:", prediction.error);
      return Response.json({ status: prediction.status, imageUrl: null, error: prediction.error });
    }

    let tempUrl = null;
    const output = prediction.output;
    if (Array.isArray(output)) tempUrl = output[0];
    else if (typeof output === "string") tempUrl = output;

    if (!tempUrl) {
      console.error("No tempUrl in succeeded insight prediction:", output);
      return Response.json({ status: "succeeded", imageUrl: null, error: "no_temp_url" });
    }

    const imgRes = await fetch(tempUrl);
    if (!imgRes.ok) {
      console.error("Failed to fetch temp insight image:", imgRes.status, tempUrl);
      return Response.json({ status: "succeeded", imageUrl: null, error: "fetch_temp_failed" });
    }
    const imgBuffer = await imgRes.arrayBuffer();
    const fileName = `insight-${Date.now()}.webp`;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SECRET_KEY
    );

    const { error: uploadError } = await supabase.storage
      .from("dream-images")
      .upload(fileName, imgBuffer, { contentType: "image/webp" });

    if (uploadError) {
      console.error("Supabase upload error (insight):", uploadError.message, uploadError);
      return Response.json({ status: "succeeded", imageUrl: null, error: "upload_failed", detail: uploadError.message });
    }

    const { data: { publicUrl } } = supabase.storage
      .from("dream-images")
      .getPublicUrl(fileName);

    return Response.json({ status: "succeeded", imageUrl: publicUrl });

  } catch (error) {
    console.error("Insight status check error:", error?.message, error);
    return Response.json({ status: "error", imageUrl: null, error: error?.message }, { status: 500 });
  }
}