import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY
  );

  // query เบาๆ แค่พอให้ Supabase เห็นว่ามี activity
  const { error } = await supabase.from("dreams").select("id").limit(1);

  if (error) {
    console.error("Keep-alive error:", error.message);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true, timestamp: new Date().toISOString() });
}