import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // เช็คว่ามี user ใน members table มั้ย ถ้าไม่มีสร้างใหม่
      const { data } = await supabase
        .from("members")
        .select("email")
        .eq("email", user.email)
        .single();

      if (!data) {
        await supabase.from("members").insert({
          email: user.email,
          is_member: false,
        });
      }
      return true;
    },
    async session({ session }) {
      // เพิ่ม is_member เข้า session
      const { data } = await supabase
        .from("members")
        .select("is_member")
        .eq("email", session.user.email)
        .single();

      session.user.is_member = data?.is_member || false;
      return session;
    },
  },
});

export { handler as GET, handler as POST };