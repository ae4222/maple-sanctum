"use client";
import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { createClient } from "@supabase/supabase-js";

const font = "'EB Garamond', Garamond, Georgia, serif";

const OPTIONS = {
  witchType: ["Forest", "Sea", "Swamp", "River", "Moon", "Storm", "Shadow"],
  familiar: ["Cat", "Frog", "Raven", "Fox", "Moth", "Heron", "Owl"],
  hair: ["Silver", "Auburn", "Midnight", "Rose", "Wild"],
  aesthetic: ["Cottagecore", "Dark Academic", "Celestial", "Botanical"],
};

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ""
  );
}

export default function GardenEditPage() {
  const { data: session } = useSession();

  const [profile, setProfile] = useState(null);
  const [witchName, setWitchName] = useState("");
  const [witchType, setWitchType] = useState("");
  const [familiar, setFamiliar] = useState("");
  const [hair, setHair] = useState("");
  const [aesthetic, setAesthetic] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [genThisMonth, setGenThisMonth] = useState(0);

  useEffect(() => {
    if (session) loadProfile();
  }, [session]);

  async function loadProfile() {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("garden_members")
      .select("*")
      .eq("email", session.user.email)
      .single();
    if (data) {
      setProfile(data);
      setWitchName(data.witch_name);
      setWitchType(data.witch_type);
      setFamiliar(data.familiar);
      setHair(data.hair);
      setAesthetic(data.aesthetic);
      setPreviewUrl(data.avatar_url);

      // check gen count this month
      const lastGen = data.last_avatar_gen ? new Date(data.last_avatar_gen) : null;
      const now = new Date();
      const sameMonth = lastGen && 
        lastGen.getMonth() === now.getMonth() && 
        lastGen.getFullYear() === now.getFullYear();
      setGenThisMonth(sameMonth ? (data.avatar_gen_count || 0) : 0);
    }
  }

  const canGen = genThisMonth < 3;

  async function handleGenerate() {
    if (!canGen) return;
    setGenerating(true);
    const res = await fetch("/api/garden-avatar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ witchName, witchType, familiar, hair, aesthetic }),
    });
    const data = await res.json();
    if (data.avatarUrl) {
      setPreviewUrl(data.avatarUrl);
      setGenThisMonth(prev => prev + 1);
    }
    setGenerating(false);
  }

  async function handleSave() {
  if (!session || !profile) return;
  setSaving(true);

  const now = new Date();
  const lastGen = profile.last_avatar_gen ? new Date(profile.last_avatar_gen) : null;
  const sameMonth = lastGen &&
    lastGen.getMonth() === now.getMonth() &&
    lastGen.getFullYear() === now.getFullYear();
  const newCount = previewUrl !== profile.avatar_url
    ? (sameMonth ? (profile.avatar_gen_count || 0) + 1 : 1)
    : profile.avatar_gen_count || 0;

  const res = await fetch("/api/garden-edit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      witchName, witchType, familiar, hair, aesthetic,
      avatarUrl: previewUrl,
      lastAvatarGen: previewUrl !== profile.avatar_url ? now.toISOString() : profile.last_avatar_gen,
      avatarGenCount: newCount,
    }),
  });

  const data = await res.json();
  setSaving(false);

  if (!data.error) {
    setDone(true);
    setTimeout(() => window.location.href = "/garden", 1500);
  }
}

  if (!session) {
    return (
      <div style={{ minHeight:"100vh", background:"#0a0514", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:font }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:32, marginBottom:16 }}>🌿</div>
          <div style={{ color:"#8b7355", fontSize:18, marginBottom:20 }}>Login to edit your profile</div>
          <button onClick={() => signIn("google")} style={{
            background:"#c9a84c", color:"#1a0800", border:"none",
            borderRadius:10, padding:"12px 28px", cursor:"pointer", fontFamily:font, fontSize:16,
          }}>Continue with Google</button>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div style={{ minHeight:"100vh", background:"#0a0514", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:font }}>
        <div style={{ textAlign:"center", color:"#c9a84c", fontSize:24 }}>
          🌿 Profile updated
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:"#0a0514", color:"#e8d5c4", padding:"40px 24px", fontFamily:font }}>
      <link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap" rel="stylesheet"/>
      <div style={{ maxWidth:600, margin:"0 auto" }}>

        <button onClick={() => window.location.href = "/garden"} style={{
          background:"none", border:"none", color:"#8b7355",
          cursor:"pointer", marginBottom:28, fontSize:17, fontFamily:font,
        }}>← Back to Garden</button>

        <div style={{ textAlign:"center", marginBottom:40 }}>
          <div style={{ fontSize:40, color:"#c9a84c", letterSpacing:4, marginBottom:10 }}>🌿 EDIT PROFILE</div>
          <div style={{ color:"#8b7355", fontSize:15, fontStyle:"italic" }}>
            {canGen ? `${3 - genThisMonth} image regeneration${3 - genThisMonth !== 1 ? "s" : ""} remaining this month` : "No regenerations remaining this month"}
          </div>
        </div>

        {/* Witch Name */}
        <div style={{ marginBottom:28 }}>
          <div style={{ fontSize:12, color:"#c9a84c", letterSpacing:3, marginBottom:10 }}>YOUR WITCH NAME</div>
          <input
            value={witchName}
            onChange={e => setWitchName(e.target.value)}
            style={{
              width:"100%", padding:"14px 18px",
              background:"#ffffff08", border:"1px solid #c9a84c44",
              borderRadius:12, color:"#e8d5c4", fontSize:17, fontFamily:font,
              outline:"none", boxSizing:"border-box",
            }}
          />
        </div>

        {/* Selectors */}
        {[
          { key:"witchType", label:"WITCH TYPE", state: witchType, set: setWitchType },
          { key:"familiar", label:"FAMILIAR", state: familiar, set: setFamiliar },
          { key:"hair", label:"HAIR", state: hair, set: setHair },
          { key:"aesthetic", label:"AESTHETIC", state: aesthetic, set: setAesthetic },
        ].map(({ key, label, state, set }) => (
          <div key={key} style={{ marginBottom:24 }}>
            <div style={{ fontSize:12, color:"#c9a84c", letterSpacing:3, marginBottom:10 }}>{label}</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {OPTIONS[key].map(opt => (
                <button key={opt} onClick={() => set(opt)} style={{
                  padding:"8px 16px", borderRadius:20, border:"1px solid",
                  borderColor: state === opt ? "#c9a84c" : "#c9a84c33",
                  background: state === opt ? "#c9a84c18" : "transparent",
                  color: state === opt ? "#c9a84c" : "#8b7355",
                  fontFamily:font, fontSize:15, cursor:"pointer", transition:"all .2s",
                }}>{opt}</button>
              ))}
            </div>
          </div>
        ))}

        {/* Preview */}
        {previewUrl && (
          <div style={{ marginBottom:24, borderRadius:16, overflow:"hidden", border:"1px solid #c9a84c33", maxWidth:300, margin:"0 auto 24px" }}>
            <img src={previewUrl} style={{ width:"100%", display:"block" }} alt="witch avatar"/>
            <div style={{ padding:"16px", textAlign:"center", background:"#ffffff06" }}>
              <div style={{ color:"#c9a84c", fontSize:18, letterSpacing:2 }}>{witchName}</div>
              <div style={{ color:"#8b7355", fontSize:13, marginTop:4 }}>{witchType} Witch · {familiar} Familiar</div>
            </div>
          </div>
        )}

        {/* Generate button */}
        {canGen && (
          <button onClick={handleGenerate} disabled={generating} style={{
            width:"100%", padding:"16px",
            background: !generating ? "linear-gradient(135deg,#2d1b4e,#4a2080)" : "#ffffff10",
            border:"none", borderRadius:12,
            color: !generating ? "#e8d5c4" : "#ffffff33",
            fontFamily:font, fontSize:17, letterSpacing:3, cursor: !generating ? "pointer" : "not-allowed",
            marginBottom:12,
          }}>
            {generating ? "Maple weaves your portrait..." : "✦ REGENERATE AVATAR"}
          </button>
        )}

        {!canGen && (
          <div style={{ textAlign:"center", color:"#8b7355", fontSize:14, fontFamily:font, marginBottom:12 }}>
            Avatar regeneration limit reached for this month
          </div>
        )}

        {/* Save button */}
        <button onClick={handleSave} disabled={saving} style={{
          width:"100%", padding:"16px",
          background:"none", border:"1px solid #c9a84c55",
          borderRadius:12, color:"#c9a84c",
          fontFamily:font, fontSize:17, letterSpacing:3, cursor:"pointer",
          marginBottom:12,
        }}>
          {saving ? "Saving..." : "✦ SAVE CHANGES"}
        </button>

      </div>
    </div>
  );
}