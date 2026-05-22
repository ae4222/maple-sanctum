import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.SUPABASE_SECRET_KEY ?? ""
);

export async function POST(req) {
  try {
    const body = await req.formData();
    const data = JSON.parse(body.get("data"));

    // เช็ค token
    if (data.verification_token !== process.env.KOFI_TOKEN) {
      return Response.json({ error: "Invalid token" }, { status: 401 });
    }

    // รับแค่ Subscription (membership)
    if (data.type !== "Subscription") {
      return Response.json({ ok: true });
    }

    const email = data.email;
    if (!email) return Response.json({ ok: true });

    // บันทึก member ใน Supabase
    const { error } = await supabase
      .from("members")
      .upsert({
        email: email,
        is_member: true,
        kofi_email: email,
      }, { onConflict: "email" });

    if (error) console.error("Supabase error:", error);
    
    return Response.json({ ok: true });

  } catch (error) {
    console.error("Webhook error:", error);
    return Response.json({ ok: true });
  }
}