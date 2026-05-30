"use client";
import { useState } from "react";
import { useSession, signIn } from "next-auth/react";

const font = "'EB Garamond', Garamond, Georgia, serif";

const OPTIONS = {
  witchType: ["Forest", "Sea", "Swamp", "River", "Moon", "Storm", "Shadow"],
  familiar: ["Cat", "Frog", "Raven", "Fox", "Moth", "Heron", "Owl"],
  hair: ["Silver", "Auburn", "Midnight", "Rose", "Wild"],
  aesthetic: ["Cottagecore", "Dark Academic", "Celestial", "Botanical"],
};

export default function GardenSetupPage() {
  const { data: session } = useSession();
  const isMember = session?.user?.is_member || false;
  const [witchName, setWitchName] = useState("");
  const [witchType, setWitchType] = useState("");
  const [familiar, setFamiliar] = useState("");
  const [hair, setHair] = useState("");
  const [aesthetic, setAesthetic] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const allSelected = witchName.trim() && witchType && familiar && hair && aesthetic;

  async function handleGenerate() {
    if (!allSelected) return;
    setGenerating(true);
    setPreviewUrl(null);
    const res = await fetch("/api/garden-avatar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ witchName, witchType, familiar, hair, aesthetic }),
    });
    const data = await res.json();
    setPreviewUrl(data.avatarUrl);
    setGenerating(false);
  }

  async function handleSave() {
    if (!session || !previewUrl) return;
    setSaving(true);

    const res = await fetch("/api/garden-save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        witchName, witchType, familiar, hair, aesthetic,
        avatarUrl: previewUrl,
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
          <div style={{ color:"#8b7355", fontSize:18, marginBottom:20 }}>Login to enter the Garden</div>
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
          🌿 Welcome to the Garden, {witchName}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:"#0a0514", color:"#e8d5c4", padding:"40px 24px", fontFamily:font }}>
      <link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap" rel="stylesheet"/>
      <div style={{ maxWidth:600, margin:"0 auto" }}>

        <div style={{ textAlign:"center", marginBottom:40 }}>
          <div style={{ fontSize:40, color:"#c9a84c", letterSpacing:4, marginBottom:10 }}>🌿 THE GARDEN</div>
          <div style={{ color:"#8b7355", fontSize:18, fontStyle:"italic" }}>create your witch card</div>
        </div>

        <div style={{ marginBottom:28 }}>
          <div style={{ fontSize:12, color:"#c9a84c", letterSpacing:3, marginBottom:10 }}>YOUR WITCH NAME</div>
          <input
            value={witchName}
            onChange={e => setWitchName(e.target.value)}
            placeholder="e.g. Willow Fern, Seraphine Moon..."
            style={{
              width:"100%", padding:"14px 18px",
              background:"#ffffff08", border:"1px solid #c9a84c44",
              borderRadius:12, color:"#e8d5c4", fontSize:17, fontFamily:font,
              outline:"none", boxSizing:"border-box",
            }}
          />
        </div>

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
                  fontFamily:font, fontSize:15, cursor:"pointer",
                  transition:"all .2s",
                }}>{opt}</button>
              ))}
            </div>
          </div>
        ))}

        {previewUrl && (
          <div style={{ marginBottom:24, borderRadius:16, overflow:"hidden", border:"1px solid #c9a84c33", maxWidth:300, margin:"0 auto 24px" }}>
            <img src={previewUrl} style={{ width:"100%", display:"block" }} alt="witch avatar"/>
            <div style={{ padding:"16px", textAlign:"center", background:"#ffffff06" }}>
              <div style={{ color:"#c9a84c", fontSize:18, letterSpacing:2 }}>{witchName}</div>
              <div style={{ color:"#8b7355", fontSize:13, marginTop:4 }}>{witchType} Witch · {familiar} Familiar</div>
            </div>
          </div>
        )}

        <button onClick={handleGenerate} disabled={!allSelected || generating} style={{
          width:"100%", padding:"16px",
          background: allSelected && !generating ? "linear-gradient(135deg,#2d1b4e,#4a2080)" : "#ffffff10",
          border:"none", borderRadius:12,
          color: allSelected ? "#e8d5c4" : "#ffffff33",
          fontFamily:font, fontSize:17, letterSpacing:3, cursor: allSelected ? "pointer" : "not-allowed",
          marginBottom:12,
        }}>
          {generating ? "Maple weaves your portrait..." : "✦ GENERATE MY WITCH CARD"}
        </button>

        {previewUrl && (
          <button onClick={handleSave} disabled={saving} style={{
            width:"100%", padding:"16px",
            background:"none", border:"1px solid #c9a84c55",
            borderRadius:12, color:"#c9a84c",
            fontFamily:font, fontSize:17, letterSpacing:3, cursor:"pointer",
            marginBottom:12,
          }}>
            {saving ? "Entering the Garden..." : "🌿 ENTER THE GARDEN"}
          </button>
        )}

        {previewUrl && (
          <div style={{ textAlign:"center" }}>
            <button onClick={handleGenerate} disabled={generating} style={{
              background:"none", border:"none", color:"#8b7355",
              fontFamily:font, fontSize:14, cursor:"pointer",
            }}>
              {generating ? "generating..." : "↺ Generate again"}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}