"use client";
import { signIn, useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const font = "'EB Garamond', Garamond, Georgia, serif";

export default function LoginPage() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) router.push("/oracle");
  }, [session]);

  return (
    <div style={{
      minHeight:"100vh", background:"#0a0514",
      display:"flex", alignItems:"center", justifyContent:"center",
      fontFamily: font, color:"#e8d5c4",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap" rel="stylesheet"/>

      <div style={{ textAlign:"center", padding:"48px 32px", maxWidth:400 }}>
        <div style={{ fontSize:48, marginBottom:16 }}>🧙‍♀️</div>
        <div style={{ fontSize:32, color:"#c9a84c", letterSpacing:3, marginBottom:8 }}>
          MAPLE'S SANCTUM
        </div>
        <div style={{ fontSize:17, color:"#8b7355", fontStyle:"italic", marginBottom:40 }}>
          where the veil grows thin
        </div>

        <button
          onClick={() => signIn("google", { callbackUrl: "/oracle" })}
          style={{
            width:"100%", padding:"16px 24px",
            background:"#ffffff", color:"#1a1a1a",
            border:"none", borderRadius:12, cursor:"pointer",
            fontSize:17, fontFamily:font,
            display:"flex", alignItems:"center", justifyContent:"center", gap:12,
            boxShadow:"0 4px 24px #00000044",
          }}
        >
          <img src="https://www.google.com/favicon.ico" width={20} height={20} alt="Google"/>
          Continue with Google
        </button>

        <div style={{ marginTop:24, fontSize:14, color:"#8b735566" }}>
          By signing in, you agree to our terms.<br/>
          Coven members get unlimited readings.
        </div>
      </div>
    </div>
  );
}