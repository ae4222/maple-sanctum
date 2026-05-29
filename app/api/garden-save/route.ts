import { createClient } from "@supabase/supabase-js";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const isKeeper = session.user.email === "witchgardenasmr@gmail.com";

  let founderNumber = null;
  let isFounder = false;

  if (!isKeeper) {
    const { count } = await supabase
      .from("garden_members")
      .select("*", { count: "exact", head: true })
      .eq("is_keeper", false);

    founderNumber = (count ?? 0) < 50 ? (count ?? 0) + 1 : null;
    isFounder = founderNumber !== null;
  }

  const { error } = await supabase.from("garden_members").upsert({
    email: session.user.email,
    witch_name: body.witchName,
    witch_type: body.witchType,
    familiar: body.familiar,
    hair: body.hair,
    aesthetic: body.aesthetic,
    avatar_url: body.avatarUrl,
    is_keeper: isKeeper,
    is_founder: isFounder,
    founder_number: founderNumber,
    is_active: true,
  }, { onConflict: "email" });

  return Response.json({ error });
}