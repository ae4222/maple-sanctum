"use client";
import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { createClient } from "@supabase/supabase-js";

const font = "'EB Garamond', Garamond, Georgia, serif";
const WEEK_KEY = "dream_week";
const WEEK_LIMIT = 3;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}

// ── Check weekly limit ────────────────────────────────────────
function getWeekString() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const week = Math.floor((now - startOfYear) / (7 * 24 * 60 * 60 * 1000));
  return `${now.getFullYear()}-W${week}`;
}

function getDreamUsed() {
  try {
    const saved = localStorage.getItem(WEEK_KEY);
    const thisWeek = getWeekString();
    if (!saved) return 0;
    const { week, count } = JSON.parse(saved);
    if (week !== thisWeek) return 0;
    return count;
  } catch { return 0; }
}

function addDreamUsed() {
  try {
    const thisWeek = getWeekString();
    const current = getDreamUsed();
    const next = current + 1;
    localStorage.setItem(WEEK_KEY, JSON.stringify({ week: thisWeek, count: next }));
    return next;
  } catch { return 0; }
}

// ── Ask Maple ─────────────────────────────────────────────────
async function interpretDream(dreamText) {
  const res = await fetch("/api/maple", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "dream",
      payload: { dream: dreamText }
    }),
  });
  const data = await res.json();
  return data;
}

// ── Components ────────────────────────────────────────────────
function SymbolCard({ symbol }) {
  return (
    <div style={{
      background:"#ffffff06", border:"1px solid #c9a84c22",
      borderRadius:12, padding:"14px 18px",
      display:"flex", flexDirection:"column", gap:6,
      minWidth:140, flex:1,
    }}>
      <div style={{ fontSize:28 }}>{symbol.emoji}</div>
      <div style={{ fontSize:15, color:"#c9a84c", fontFamily:font, letterSpacing:1 }}>{symbol.symbol}</div>
      <div style={{ fontSize:14, color:"#c9b994aa", fontFamily:font, lineHeight:1.7 }}>{symbol.meaning}</div>
    </div>
  );
}

function DreamCard({ dream, onClick }) {
  const date = new Date(dream.created_at).toLocaleDateString("en-GB", {
    day:"numeric", month:"long", year:"numeric"
  });
  const symbols = JSON.parse(dream.symbols || "[]");
  return (
    <div onClick={onClick} style={{
      background:"#ffffff05", border:"1px solid #c9a84c22",
      borderRadius:14, padding:"18px 22px", cursor:"pointer",
      transition:"all .3s",
    }}
    onMouseEnter={e => e.currentTarget.style.border="1px solid #c9a84c55"}
    onMouseLeave={e => e.currentTarget.style.border="1px solid #c9a84c22"}
    >
      <div style={{ fontSize:12, color:"#8b7355", letterSpacing:2, marginBottom:8, fontFamily:font }}>{date}</div>
      <div style={{ fontSize:16, color:"#e8d5c4", fontFamily:font, lineHeight:1.7, marginBottom:10 }}>
        {dream.dream_text.slice(0, 120)}{dream.dream_text.length > 120 ? "..." : ""}
      </div>
      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
        {symbols.slice(0, 4).map((s, i) => (
          <span key={i} style={{ fontSize:18 }}>{s.emoji}</span>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function DreamPage() {
  const { data: session } = useSession();
  const isMember = session?.user?.is_member || false;

  const [tab, setTab] = useState("journal"); // journal | archive
  const [dreamText, setDreamText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dreamUsed, setDreamUsed] = useState(0);
  const [dreams, setDreams] = useState([]);
  const [selectedDream, setSelectedDream] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDreamUsed(getDreamUsed());
  }, []);

  useEffect(() => {
    if (tab === "archive" && session) loadDreams();
  }, [tab, session]);

  async function loadDreams() {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("dreams")
      .select("*")
      .eq("email", session.user.email)
      .order("created_at", { ascending: false });
    if (data) setDreams(data);
  }

  async function handleInterpret() {
    if (!dreamText.trim()) return;
    if (!isMember && getDreamUsed() >= WEEK_LIMIT) return;

    setLoading(true);
    setResult(null);
    setSaved(false);

    if (!isMember) addDreamUsed();
    setDreamUsed(getDreamUsed());

    const data = await interpretDream(dreamText);
    setResult(data);
    setLoading(false);
  }

  async function handleSave() {
    if (!session || !result) return;
    setSaving(true);
    const supabase = getSupabase();
    await supabase.from("dreams").insert({
      email: session.user.email,
      dream_text: dreamText,
      interpretation: result.interpretation,
      symbols: JSON.stringify(result.symbols),
      note: result.note,
    });
    setSaving(false);
    setSaved(true);
  }

  const canInterpret = isMember || dreamUsed < WEEK_LIMIT;

  return (
    <div style={{ minHeight:"100vh", background:"#0a0514", color:"#e8d5c4", padding:"40px 24px", fontFamily:font }}>
      <link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap" rel="stylesheet"/>

      <div style={{ maxWidth:760, margin:"0 auto" }}>

        {/* Header */}
        <button onClick={() => window.location.href = "/oracle"} style={{
  background:"none", border:"none", color:"#8b7355",
  cursor:"pointer", marginBottom:28, fontSize:17, fontFamily:font,
}}>← Back</button>
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <div style={{ fontSize:44, color:"#c9a84c", letterSpacing:4, marginBottom:10 }}>🌙 DREAM JOURNAL</div>
          <div style={{ color:"#8b7355", fontSize:18, fontStyle:"italic" }}>tell Maple what the night showed you</div>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", gap:0, marginBottom:32, border:"1px solid #c9a84c22", borderRadius:12, overflow:"hidden" }}>
          {[
            { key:"journal", label:"✦ Interpret" },
            { key:"archive", label:"📖 Archive" },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              flex:1, padding:"14px", border:"none", cursor:"pointer",
              background: tab === t.key ? "#c9a84c18" : "transparent",
              color: tab === t.key ? "#c9a84c" : "#8b7355",
              fontFamily:font, fontSize:16, letterSpacing:2,
              borderBottom: tab === t.key ? "2px solid #c9a84c" : "2px solid transparent",
              transition:"all .2s",
            }}>{t.label}</button>
          ))}
        </div>

        {/* ── JOURNAL TAB ── */}
        {tab === "journal" && (
          <div>
            {/* Status */}
            <div style={{
              display:"flex", justifyContent:"space-between", alignItems:"center",
              marginBottom:20, fontSize:13, color:"#8b7355",
            }}>
              <span>
                {isMember ? "✦ Coven Member — unlimited" : `${dreamUsed}/${WEEK_LIMIT} interpretation this week`}
              </span>
              {!session && (
                <button onClick={() => signIn("google")} style={{
                  background:"none", border:"1px solid #c9a84c44", color:"#c9a84c",
                  borderRadius:8, padding:"6px 14px", cursor:"pointer",
                  fontSize:13, fontFamily:font,
                }}>Login to save →</button>
              )}
            </div>

            {/* Input */}
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:12, color:"#c9a84c", letterSpacing:3, marginBottom:10 }}>YOUR DREAM</div>
              <textarea
                value={dreamText}
                onChange={e => setDreamText(e.target.value)}
                placeholder="Describe what you saw, felt, heard in your dream. The more detail, the deeper Maple can read..."
                style={{
                  width:"100%", minHeight:160,
                  background:"#ffffff08", border:"1px solid #c9a84c44",
                  borderRadius:12, padding:18, color:"#e8d5c4",
                  fontSize:17, fontFamily:font,
                  resize:"vertical", outline:"none", boxSizing:"border-box",
                  lineHeight:1.8,
                }}
              />
            </div>

            {!canInterpret && (
              <div style={{ textAlign:"center", padding:"16px", border:"1px solid #c9a84c33", borderRadius:12, marginBottom:16, color:"#8b7355", fontSize:15, fontFamily:font }}>
                Weekly limit reached. Members interpret without limit.
                <a href="https://ko-fi.com/witchgarden/tiers" target="_blank" rel="noreferrer"
                  style={{ color:"#c9a84c", marginLeft:8, textDecoration:"none" }}>
                  Join the Coven →
                </a>
              </div>
            )}

            <button
              onClick={handleInterpret}
              disabled={!dreamText.trim() || !canInterpret || loading}
              style={{
                width:"100%", padding:"18px",
                background: dreamText.trim() && canInterpret && !loading
                  ? "linear-gradient(135deg,#2d1b4e,#4a2080)"
                  : "#ffffff10",
                border:"none", borderRadius:12,
                color: dreamText.trim() && canInterpret ? "#e8d5c4" : "#ffffff33",
                fontFamily:font, fontSize:18, letterSpacing:3, cursor: canInterpret ? "pointer" : "not-allowed",
                marginBottom:32,
              }}
            >
              {loading ? "Maple reads the mist..." : "INTERPRET THIS DREAM"}
            </button>

            {/* Result */}
            {result && (
              <div style={{ animation:"fadeUp .6s both" }}>
{/* SVG Illustration */}
{result.svg && (
  <div style={{
    marginBottom:20, borderRadius:16, overflow:"hidden",
    border:"1px solid #c9a84c22",
    display:"flex", justifyContent:"center",
    background:"#ffffff06",
  }}
    dangerouslySetInnerHTML={{ __html: result.svg }}
  />
)}
                {/* Interpretation */}
                <div style={{ background:"#ffffff06", border:"1px solid #c9a84c33", borderRadius:16, padding:28, marginBottom:20 }}>
                  <div style={{ fontSize:12, color:"#c9a84c", letterSpacing:3, marginBottom:14 }}>MAPLE READS</div>
                  <p style={{ lineHeight:2, fontSize:18, margin:0, color:"#e8d5c4" }}>{result.interpretation}</p>
                </div>

                {/* Symbols */}
                {result.symbols?.length > 0 && (
                  <div style={{ marginBottom:20 }}>
                    <div style={{ fontSize:12, color:"#c9a84c", letterSpacing:3, marginBottom:14 }}>SYMBOLS IN YOUR DREAM</div>
                    <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                      {result.symbols.map((s, i) => <SymbolCard key={i} symbol={s}/>)}
                    </div>
                  </div>
                )}

                {/* Maple's note */}
                {result.note && (
                  <div style={{
                    borderTop:"1px solid #c9a84c22", paddingTop:20, marginBottom:24,
                    textAlign:"center", fontStyle:"italic", fontSize:17, color:"#c9b994aa",
                    fontFamily:font,
                  }}>
                    "{result.note}"
                  </div>
                )}

                {/* Save button */}
                {session && !saved && (
                  <button onClick={handleSave} disabled={saving} style={{
                    width:"100%", padding:"14px",
                    background:"none", border:"1px solid #c9a84c55",
                    borderRadius:12, color:"#c9a84c",
                    fontFamily:font, fontSize:16, letterSpacing:2, cursor:"pointer",
                  }}>
                    {saving ? "Saving..." : "✦ Save to Archive"}
                  </button>
                )}
                {saved && (
                  <div style={{ textAlign:"center", color:"#a8e88a", fontSize:15, fontFamily:font }}>
                    ✓ Saved to your archive
                  </div>
                )}
                {!session && (
                  <div style={{ textAlign:"center", color:"#8b7355", fontSize:14, fontFamily:font }}>
                    <button onClick={() => signIn("google")} style={{
                      background:"none", border:"1px solid #c9a84c44", color:"#c9a84c",
                      borderRadius:8, padding:"8px 16px", cursor:"pointer", fontFamily:font, fontSize:14,
                    }}>Login to save this dream →</button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── ARCHIVE TAB ── */}
        {tab === "archive" && (
          <div>
            {!session ? (
              <div style={{ textAlign:"center", padding:"48px 24px" }}>
                <div style={{ fontSize:32, marginBottom:16 }}>🌙</div>
                <div style={{ fontSize:18, color:"#8b7355", fontFamily:font, marginBottom:20 }}>
                  Login to view your dream archive
                </div>
                <button onClick={() => signIn("google")} style={{
                  background:"#c9a84c", color:"#1a0800", border:"none",
                  borderRadius:10, padding:"12px 28px", cursor:"pointer",
                  fontFamily:font, fontSize:16, letterSpacing:1,
                }}>
                  Continue with Google
                </button>
              </div>
            ) : selectedDream ? (
              <div>
                <button onClick={() => setSelectedDream(null)} style={{
                  background:"none", border:"none", color:"#8b7355",
                  cursor:"pointer", marginBottom:24, fontSize:16, fontFamily:font,
                }}>← Back to archive</button>

                <div style={{ fontSize:12, color:"#8b7355", letterSpacing:2, marginBottom:16 }}>
                  {new Date(selectedDream.created_at).toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" })}
                </div>

                <div style={{ background:"#ffffff06", border:"1px solid #c9a84c22", borderRadius:14, padding:22, marginBottom:20 }}>
                  <div style={{ fontSize:12, color:"#8b7355", letterSpacing:2, marginBottom:10 }}>THE DREAM</div>
                  <p style={{ fontSize:16, color:"#c9b994aa", lineHeight:1.8, margin:0, fontFamily:font }}>{selectedDream.dream_text}</p>
                </div>

                <div style={{ background:"#ffffff06", border:"1px solid #c9a84c33", borderRadius:14, padding:22, marginBottom:20 }}>
                  <div style={{ fontSize:12, color:"#c9a84c", letterSpacing:3, marginBottom:14 }}>MAPLE READS</div>
                  <p style={{ fontSize:17, color:"#e8d5c4", lineHeight:2, margin:0, fontFamily:font }}>{selectedDream.interpretation}</p>
                </div>

                {(() => {
                  const symbols = JSON.parse(selectedDream.symbols || "[]");
                  return symbols.length > 0 && (
                    <div style={{ marginBottom:20 }}>
                      <div style={{ fontSize:12, color:"#c9a84c", letterSpacing:3, marginBottom:14 }}>SYMBOLS</div>
                      <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                        {symbols.map((s, i) => <SymbolCard key={i} symbol={s}/>)}
                      </div>
                    </div>
                  );
                })()}

                {selectedDream.note && (
                  <div style={{ textAlign:"center", fontStyle:"italic", fontSize:16, color:"#c9b994aa", fontFamily:font, paddingTop:16, borderTop:"1px solid #c9a84c22" }}>
                    "{selectedDream.note}"
                  </div>
                )}
              </div>
            ) : dreams.length === 0 ? (
              <div style={{ textAlign:"center", padding:"48px 24px", color:"#8b7355", fontSize:17, fontFamily:font }}>
                No dreams saved yet.<br/>Interpret your first dream and save it.
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <div style={{ fontSize:12, color:"#8b7355", letterSpacing:2, marginBottom:4 }}>
                  {dreams.length} dream{dreams.length > 1 ? "s" : ""} in your archive
                </div>
                {dreams.map((d, i) => (
                  <DreamCard key={i} dream={d} onClick={() => setSelectedDream(d)}/>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        * { box-sizing:border-box; }
        textarea::placeholder { color:#8b735566; }
        textarea:focus { border-color:#c9a84c88 !important; }
      `}</style>
    </div>
  );
}