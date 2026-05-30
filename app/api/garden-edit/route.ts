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

  // เช็ค is_member
  const { data: member } = await supabase
    .from("members")
    .select("is_member")
    .eq("email", session.user.email)
    .single();

  if (!member?.is_member) {
    return Response.json({ error: "members only" }, { status: 403 });
  }

  const body = await req.json();

  const { error } = await supabase.from("garden_members").update({
    witch_name: body.witchName,
    witch_type: body.witchType,
    familiar: body.familiar,
    hair: body.hair,
    aesthetic: body.aesthetic,
    avatar_url: body.avatarUrl,
    last_avatar_gen: body.lastAvatarGen,
    avatar_gen_count: body.avatarGenCount,
  }).eq("email", session.user.email);

  return Response.json({ error });
}