import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

const VERIFICATION_TOKEN = process.env.KOFI_TOKEN;

export async function POST(req) {
  const formData = await req.formData();
  const raw = formData.get("data");
  
  if (!raw) return Response.json({ error: "no data" }, { status: 400 });

  const data = JSON.parse(raw);

  // verify token
  if (VERIFICATION_TOKEN && data.verification_token !== VERIFICATION_TOKEN) {
    return Response.json({ error: "invalid token" }, { status: 401 });
  }

  const email = data?.email;
  const type = data?.type;

  if (!email) return Response.json({ error: "no email" }, { status: 400 });

  if (type === "Subscription") {
    await supabase
      .from("members")
      .upsert({ email, is_member: true }, { onConflict: "email" });
  }

  if (type === "Subscription Cancelled" || type === "Subscription Expired") {
    await supabase
      .from("members")
      .update({ is_member: false })
      .eq("email", email);
  }

  return new Response("OK", { status: 200 });
}