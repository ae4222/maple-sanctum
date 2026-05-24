"use client";
import { useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

const KOFI_URL = "https://ko-fi.com/witchgarden";
const KOFI_TIERS = "https://ko-fi.com/witchgarden/tiers";
const LIMIT = 3;
const font = "'EB Garamond', Garamond, Georgia, serif";

const TAROT = [
  { id:0,  name:"The Fool",         image:"/cards/fool.png",        keywords:"beginnings, freedom, innocence" },
  { id:1,  name:"The Magician",     image:"/cards/magician.png",    keywords:"willpower, skill, manifestation" },
  { id:2,  name:"High Priestess",   image:"/cards/priestess.png",   keywords:"intuition, mystery, inner voice" },
  { id:3,  name:"The Empress",      image:"/cards/empress.png",     keywords:"fertility, nature, abundance" },
  { id:4,  name:"The Emperor",      image:"/cards/emperor.png",     keywords:"authority, structure, stability" },
  { id:5,  name:"The Hierophant",   image:"/cards/hierophant.png",  keywords:"tradition, guidance, belief" },
  { id:6,  name:"The Lovers",       image:"/cards/lovers.png",      keywords:"love, harmony, choices" },
  { id:7,  name:"The Chariot",      image:"/cards/chariot.png",     keywords:"determination, victory, control" },
  { id:8,  name:"Strength",         image:"/cards/strength.png",    keywords:"courage, patience, inner power" },
  { id:9,  name:"The Hermit",       image:"/cards/hermit.png",      keywords:"solitude, introspection, wisdom" },
  { id:10, name:"Wheel of Fortune", image:"/cards/wheel.png",       keywords:"cycles, fate, turning point" },
  { id:11, name:"Justice",          image:"/cards/justice.png",     keywords:"truth, fairness, cause & effect" },
  { id:12, name:"The Hanged Man",   image:"/cards/hanged.png",      keywords:"pause, surrender, perspective" },
  { id:13, name:"Death",            image:"/cards/death.png",       keywords:"transformation, endings, change" },
  { id:14, name:"Temperance",       image:"/cards/temperance.png",  keywords:"balance, moderation, flow" },
  { id:15, name:"The Devil",        image:"/cards/devil.png",       keywords:"shadow self, addiction, chains" },
  { id:16, name:"The Tower",        image:"/cards/tower.png",       keywords:"upheaval, revelation, chaos" },
  { id:17, name:"The Star",         image:"/cards/star.png",        keywords:"hope, inspiration, serenity" },
  { id:18, name:"The Moon",         image:"/cards/moon.png",        keywords:"illusion, fear, subconscious" },
  { id:19, name:"The Sun",          image:"/cards/sun.png",         keywords:"joy, vitality, success" },
  { id:20, name:"Judgement",        image:"/cards/judgement.png",   keywords:"reflection, reckoning, renewal" },
  { id:21, name:"The World",        image:"/cards/world.png",       keywords:"completion, integration, wholeness" },
];

const TODAY = new Date().toDateString();

function getUsed(key) {
  try {
    const date = localStorage.getItem(`${key}_date`);
    if (date !== TODAY) {
      localStorage.setItem(`${key}_date`, TODAY);
      localStorage.setItem(`${key}_count`, "0");
      return 0;
    }
    return parseInt(localStorage.getItem(`${key}_count`) || "0");
  } catch { return 0; }
}

function addUsed(key) {
  try {
    const current = getUsed(key);
    const next = current + 1;
    localStorage.setItem(`${key}_date`, TODAY);
    localStorage.setItem(`${key}_count`, String(next));
    return next;
  } catch { return 0; }
}

async function askMaple(type, payload) {
  const res = await fetch("/api/maple", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ type, payload }),
  });
  const data = await res.json();
  return data.text;
}

// ── Pendulum ──────────────────────────────────────────────────
function Pendulum({ swinging, answer }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", height:240 }}>
      <div style={{
        width:3, height:160,
        background:"linear-gradient(to bottom, #c9a84c, #8b7355)",
        transformOrigin:"top center",
        animation: swinging
          ? answer === "yes" ? "swingFwd 1.2s ease-in-out infinite"
          : "swingSide 1.2s ease-in-out infinite"
          : "none",
        position:"relative",
      }}>
        <div style={{
          position:"absolute", bottom:-24, left:"50%", transform:"translateX(-50%)",
          width:48, height:48, borderRadius:"50%",
          background:"radial-gradient(circle at 35% 35%, #e8d5a3, #8b6914)",
          boxShadow:"0 0 28px #c9a84c88",
        }}/>
      </div>
      <style>{`
        @keyframes swingFwd { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(25deg)} }
        @keyframes swingSide { 0%,100%{transform:rotate(-25deg)} 50%{transform:rotate(25deg)} }
      `}</style>
    </div>
  );
}

function LimitReached({ type }) {
  return (
    <div style={{ textAlign:"center", padding:"48px 24px", border:"1px solid #c9a84c33", borderRadius:16, background:"#ffffff05" }}>
      <div style={{ fontSize:40, marginBottom:16 }}>🌙</div>
      <div style={{ fontSize:24, color:"#c9a84c", marginBottom:12, letterSpacing:2, fontFamily:font }}>Daily limit reached</div>
      <div style={{ fontSize:18, color:"#8b7355", lineHeight:1.9, marginBottom:28, fontFamily:font }}>
        You have used your {LIMIT} free {type} readings for today.<br/>
        Join the Coven for unlimited access — or return tomorrow.
      </div>
      <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
        <a href={KOFI_TIERS} target="_blank" rel="noreferrer" style={{
          display:"inline-block", background:"#c9a84c", color:"#1a0800",
          borderRadius:10, padding:"14px 28px",
          fontSize:16, fontWeight:500, textDecoration:"none", letterSpacing:1, fontFamily:font,
        }}>
          ✦ Join the Coven
        </a>
        <button onClick={() => signIn("google")} style={{
          background:"none", border:"1px solid #c9a84c55", color:"#c9a84c",
          borderRadius:10, padding:"14px 28px",
          fontSize:16, cursor:"pointer", fontFamily:font, letterSpacing:1,
        }}>
          Login if you're a member
        </button>
      </div>
    </div>
  );
}

function HeroBanner({ tarotUsed, pendulumUsed, isMember, session }) {
  return (
    <div style={{
      position:"relative", borderRadius:20, overflow:"hidden",
      marginBottom:32, minHeight:300, border:"1px solid #c9a84c22",
    }}>
      <img src="/oracle-hero.jpg" alt=""
        style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }}
        onError={e => e.target.style.display="none"}
      />
      <div style={{ position:"absolute", inset:0, background:"linear-gradient(to right, rgba(10,5,20,0.88) 45%, rgba(10,5,20,0.35))" }}/>
      <div style={{ position:"relative", zIndex:2, padding:"52px 48px", maxWidth:540, display:"flex", flexDirection:"column", gap:16 }}>
        <div style={{ fontSize:12, color:"#c9a84c", letterSpacing:5, textTransform:"uppercase" }}>Maple's Sanctum</div>
        <div style={{ fontSize:40, color:"#e8d5c4", lineHeight:1.2, fontFamily:font }}>Ask.<br/>The Garden<br/>will answer.</div>
        {session ? (
          <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
            <div style={{
              fontSize:13, color: isMember ? "#a8e88a" : "#8b7355",
              background:"#ffffff08", border:`1px solid ${isMember ? "#a8e88a44" : "#c9a84c22"}`,
              borderRadius:8, padding:"8px 14px",
            }}>
              {isMember ? "✦ Coven Member — unlimited readings" : `👤 ${session.user.name} — ${tarotUsed}/${LIMIT} tarot · ${pendulumUsed}/${LIMIT} pendulum`}
            </div>
            <button onClick={() => signOut()} style={{
              background:"none", border:"none", color:"#8b735566",
              cursor:"pointer", fontSize:12, fontFamily:font,
            }}>sign out</button>
          </div>
        ) : (
          <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
            <div style={{ fontSize:13, color:"#8b7355", background:"#ffffff08", border:"1px solid #c9a84c22", borderRadius:8, padding:"8px 14px" }}>
              👤 Guest — {tarotUsed}/{LIMIT} tarot · {pendulumUsed}/{LIMIT} pendulum today
            </div>
            <button onClick={() => signIn("google")} style={{
              background:"none", border:"1px solid #c9a84c44", color:"#c9a84c",
              borderRadius:8, padding:"8px 14px", cursor:"pointer",
              fontSize:13, fontFamily:font,
            }}>Login →</button>
          </div>
        )}
      </div>
    </div>
  );
}

function ServiceCard({ image, title, cta, onClick, disabled }) {
  const [hover, setHover] = useState(false);
  return (
    <div onClick={!disabled ? onClick : undefined}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position:"relative", borderRadius:18, overflow:"hidden",
        minHeight:300, cursor: disabled ? "not-allowed" : "pointer",
        flex:1, minWidth:260,
        border: hover && !disabled ? "1px solid #c9a84c88" : "1px solid #c9a84c22",
        transform: hover && !disabled ? "translateY(-4px)" : "none",
        opacity: disabled ? 0.6 : 1,
        transition:"all .3s",
      }}
    >
      <img src={image} alt={title}
        style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", zIndex:1 }}
        onError={e => e.target.style.display="none"}
      />
      <div style={{ position:"absolute", inset:0, zIndex:0, background:"radial-gradient(circle at 50% 30%, #2d1b4e, #0a0514)" }}/>
      <div style={{ position:"absolute", inset:0, zIndex:2, background:"linear-gradient(to top, rgba(10,5,20,0.4) 10%, rgba(10,5,20,0.0))" }}/>
      <div style={{ position:"relative", zIndex:3, padding:"28px", height:"100%", display:"flex", flexDirection:"column", justifyContent:"flex-end" }}>
        {disabled && <div style={{ fontSize:13, color:"#e88a8a", marginBottom:8, fontFamily:font }}>Daily limit reached</div>}
        <div style={{
          display:"inline-flex", alignItems:"center", gap:8,
          background: disabled ? "#ffffff22" : "#c9a84c",
          color: disabled ? "#ffffff66" : "#1a0800",
          padding:"12px 22px", borderRadius:10,
          fontSize:16, fontFamily:font, letterSpacing:1, width:"fit-content",
        }}>
          {disabled ? "Limit reached" : `${cta} →`}
        </div>
      </div>
    </div>
  );
}

function MemberBanner() {
  return (
    <div style={{
      position:"relative", borderRadius:20, overflow:"hidden",
      marginTop:32, minHeight:260, border:"1px solid #c9a84c33",
    }}>
      <img src="/oracle-member.jpg" alt=""
        style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }}
        onError={e => e.target.style.display="none"}
      />
      <div style={{ position:"absolute", inset:0, background:"linear-gradient(to right, rgba(10,5,20,0.92) 55%, rgba(10,5,20,0.45))" }}/>
      <div style={{ position:"relative", zIndex:2, padding:"48px 52px", maxWidth:580, display:"flex", flexDirection:"column", gap:14 }}>
        <div style={{ fontSize:12, color:"#c9a84c", letterSpacing:5, textTransform:"uppercase" }}>✦ Coven Membership</div>
        <div style={{ fontSize:34, color:"#e8d5c4", fontFamily:font, lineHeight:1.2 }}>
          Unlimited readings.<br/>Any hour of the night.
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:8, margin:"4px 0" }}>
          {["Tarot reading — unlimited","Pendulum oracle — unlimited" ,"Dream Interpretation & Journal — unlimited" ,"Private Archive" , "The Garden Weekly Digest" ,"Exclusive Content" ].map((t,i) => (
            <div key={i} style={{ display:"flex", gap:10, fontSize:17, color:"#e8d5c4", fontFamily:font }}>
              <span style={{ color:"#a8e88a" }}>✓</span> {t}
            </div>
          ))}
        </div>
        <a href={KOFI_TIERS} target="_blank" rel="noreferrer" style={{
          display:"inline-flex", alignItems:"center", gap:8,
          background:"#c9a84c", color:"#1a0800",
          padding:"14px 28px", borderRadius:12,
          fontSize:17, fontFamily:font, fontWeight:500,
          textDecoration:"none", letterSpacing:1, width:"fit-content", marginTop:8,
        }}>
          ✦ Join the Coven — $3/month
        </a>
      </div>
    </div>
  );
}

export default function OraclePage() {
  const { data: session } = useSession();
  const isMember = session?.user?.is_member || false;

  const [mode, setMode] = useState("home");
  const [question, setQuestion] = useState("");
  const [drawnCards, setDrawnCards] = useState([]);
  const [revealed, setRevealed] = useState([]);
  const [reading, setReading] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendulumAns, setPendulumAns] = useState(null);
  const [pendulumSwing, setPendulumSwing] = useState(false);
  const [pendulumMsg, setPendulumMsg] = useState("");
  const [tarotUsed, setTarotUsed] = useState(0);
  const [pendulumUsed, setPendulumUsed] = useState(0);

  useEffect(() => {
    setTarotUsed(getUsed("tarot"));
    setPendulumUsed(getUsed("pendulum"));
  }, []);

const canTarot = isMember || tarotUsed < LIMIT;
const canPendulum = isMember || pendulumUsed < LIMIT;

function drawCards() {
  if (!question.trim()) return;
  if (!isMember && tarotUsed >= LIMIT) return;
  const shuffled = [...TAROT].sort(() => Math.random() - 0.5);
  setDrawnCards(shuffled.slice(0, 3));
  setRevealed([]); setReading("");
  if (!isMember) {
    const next = addUsed("tarot");
    setTarotUsed(next);
  }
}
  

  async function revealCard(i) {
    if (revealed.includes(i)) return;
    const newRevealed = [...revealed, i];
    setRevealed(newRevealed);
    if (newRevealed.length === drawnCards.length) {
      setLoading(true);
      const msg = await askMaple("tarot", { question, cards: drawnCards });
      setReading(msg); setLoading(false);
    }
  }
async function doPendulum() {
  if (!question.trim()) return;
  if (!isMember && pendulumUsed >= LIMIT) return;
  const ans = Math.random() > 0.5 ? "yes" : "no";
  setPendulumAns(ans); setPendulumSwing(true); setPendulumMsg("");
  setLoading(true);
  if (!isMember) {
    const next = addUsed("pendulum");
    setPendulumUsed(next);
  }
  const msg = await askMaple("pendulum", { question, answer: ans });
  setPendulumMsg(msg); setLoading(false);
  setTimeout(() => setPendulumSwing(false), 4000);
}
  function reset() {
    setQuestion(""); setDrawnCards([]); setRevealed([]);
    setReading(""); setPendulumAns(null); setPendulumMsg("");
  }

  const backBtn = { background:"none", border:"none", color:"#8b7355", cursor:"pointer", marginBottom:28, fontSize:17, fontFamily:font };
  const textarea = { width:"100%", background:"#ffffff08", border:"1px solid #c9a84c44", borderRadius:12, padding:18, color:"#e8d5c4", fontSize:19, fontFamily:font, resize:"vertical", outline:"none", boxSizing:"border-box" };
  const drawBtn = (color) => ({ width:"100%", marginTop:16, padding:"18px", background: color || "linear-gradient(135deg,#4a2080,#7a3ab0)", border:"none", borderRadius:12, color:"#e8d5c4", fontFamily:font, fontSize:19, letterSpacing:3, cursor:"pointer" });

  return (
    <div style={{ minHeight:"100vh", background:"#0a0514", color:"#e8d5c4", padding:"40px 24px", fontFamily:font }}>
      <link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap" rel="stylesheet"/>
      <div style={{ maxWidth:860, margin:"0 auto" }}>

        <div style={{ textAlign:"center", marginBottom:40 }}>
          <div style={{ fontSize:44, color:"#c9a84c", letterSpacing:4, marginBottom:10 }}>🧙‍♀️ MAPLE'S SANCTUM</div>
          <div style={{ color:"#8b7355", fontSize:20, fontStyle:"italic" }}>where the veil grows thin</div>
        </div>

        {mode === "home" && (
          <>
            <HeroBanner tarotUsed={tarotUsed} pendulumUsed={pendulumUsed} isMember={isMember} session={session}/>
            <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
              <ServiceCard image="/oracle-tarot.jpg" title="Tarot Reading" cta="Begin Reading" disabled={!canTarot} onClick={() => setMode("tarot")}/>
              <ServiceCard image="/oracle-pendulum.jpg" title="Pendulum Oracle" cta="Consult" disabled={!canPendulum} onClick={() => setMode("pendulum")}/>
            </div>
            {/* Dream Journal Banner */}
<div
  onClick={() => window.location.href = "/dream"}
  style={{
    position:"relative", borderRadius:20, overflow:"hidden",
    marginTop:20, minHeight:200, border:"1px solid #c9a84c22",
    cursor:"pointer",
  }}
  onMouseEnter={e => e.currentTarget.style.border="1px solid #c9a84c88"}
  onMouseLeave={e => e.currentTarget.style.border="1px solid #c9a84c22"}
>
  <img src="/dream-banner.jpg" alt="Dream Journal"
    style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }}
    onError={e => e.target.style.display="none"}
  />
  <div style={{ position:"absolute", inset:0, background:"linear-gradient(to right, rgba(10,5,20,0.5) 30%, rgba(10,5,20,0.1))" }}/>
  <div style={{ position:"relative", zIndex:2, padding:"40px 48px" }}>
    <a href="/dream" style={{
      display:"inline-flex", alignItems:"center", gap:8,
      background:"#c9a84c", color:"#1a0800",
      padding:"12px 24px", borderRadius:10,
      fontSize:16, fontFamily:font, fontWeight:500,
      textDecoration:"none", letterSpacing:1,
    }}>
      🌙 Enter Dream Journal →
    </a>
  </div>
</div>

            {!isMember && <MemberBanner/>}
          </>
        )}

        {mode === "tarot" && (
          <div>
            <button style={backBtn} onClick={() => { setMode("home"); reset(); }}>← Back</button>
            {!canTarot ? (
              <LimitReached type="tarot"/>
            ) : !drawnCards.length ? (
              <div style={{ maxWidth:560, margin:"0 auto" }}>
                <div style={{ color:"#c9a84c", fontSize:14, letterSpacing:3, marginBottom:12 }}>YOUR QUESTION</div>
                <textarea style={{ ...textarea, minHeight:110 }} value={question} onChange={e => setQuestion(e.target.value)} placeholder="What weighs upon your spirit, dear seeker..."/>
                <button onClick={drawCards} style={drawBtn()}>DRAW 3 CARDS</button>
              </div>
            ) : (
              <div>
                <div style={{ color:"#8b7355", fontSize:18, textAlign:"center", marginBottom:28 }}>"{question}"</div>
                <div style={{ display:"flex", gap:20, justifyContent:"center", flexWrap:"wrap", marginBottom:32 }}>
                  {drawnCards.map((card, i) => (
                    <div key={i} style={{ textAlign:"center" }}>
                      <div onClick={() => revealCard(i)} style={{
                        width:220, height:370, borderRadius:14,
                        cursor: revealed.includes(i) ? "default" : "pointer",
                        border: revealed.includes(i) ? "2px solid #c9a84c" : "2px solid #c9a84c33",
                        background:"#1a0a2e", overflow:"hidden", position:"relative",
                        boxShadow: revealed.includes(i) ? "0 12px 48px #c9a84c44" : "0 4px 24px #00000099",
                        transition:"all .4s",
                      }}>
                        {revealed.includes(i) ? (
                          <>
                            <img src={card.image} alt={card.name} style={{ width:"100%", height:"100%", objectFit:"cover", position:"absolute", inset:0 }}/>
                            <div style={{ position:"absolute", bottom:0, left:0, right:0, background:"linear-gradient(transparent, rgba(0,0,0,0.88))", padding:"24px 10px 14px" }}>
                              <div style={{ color:"#c9a84c", fontSize:14, textAlign:"center", letterSpacing:2 }}>{card.name}</div>
                            </div>
                          </>
                        ) : (
                          <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:60, background:"radial-gradient(circle at 50% 40%, #2d1b4e, #0a0514)" }}>🌿</div>
                        )}
                      </div>
                      {!revealed.includes(i) && <div style={{ fontSize:14, color:"#8b735566", marginTop:10 }}>tap to reveal</div>}
                    </div>
                  ))}
                </div>
                {loading && <div style={{ textAlign:"center", color:"#c9a84c88", fontSize:19, marginBottom:16 }}>Maple peers into the mist...</div>}
                {reading && (
                  <div style={{ background:"#ffffff06", border:"1px solid #c9a84c33", borderRadius:16, padding:32, marginBottom:24 }}>
                    <div style={{ fontSize:13, color:"#c9a84c", letterSpacing:3, marginBottom:16 }}>MAPLE SPEAKS</div>
                    <p style={{ lineHeight:2, fontSize:20, margin:0, color:"#e8d5c4" }}>{reading}</p>
                  </div>
                )}
                <button onClick={reset} style={{ width:"100%", padding:"18px", background:"none", border:"1px solid #c9a84c44", borderRadius:12, color:"#c9a84c", fontFamily:font, fontSize:19, letterSpacing:3, cursor:"pointer" }}>ASK AGAIN</button>
              </div>
            )}
          </div>
        )}

        {mode === "pendulum" && (
          <div>
            <button style={backBtn} onClick={() => { setMode("home"); reset(); }}>← Back</button>
            {!canPendulum ? (
              <LimitReached type="pendulum"/>
            ) : (
              <div style={{ textAlign:"center" }}>
                <Pendulum swinging={pendulumSwing} answer={pendulumAns}/>
                {pendulumAns && <div style={{ fontSize:44, letterSpacing:8, marginTop:16, marginBottom:28, color: pendulumAns === "yes" ? "#a8e88a" : "#e88a8a" }}>{pendulumAns.toUpperCase()}</div>}
                {!pendulumAns && (
                  <div style={{ maxWidth:500, margin:"20px auto 0" }}>
                    <div style={{ color:"#c9a84c", fontSize:14, letterSpacing:3, marginBottom:12 }}>YOUR YES/NO QUESTION</div>
                    <textarea style={{ ...textarea, minHeight:100, marginBottom:16 }} value={question} onChange={e => setQuestion(e.target.value)} placeholder="Ask a question with a clear yes or no answer..."/>
                    <button onClick={doPendulum} style={drawBtn("linear-gradient(135deg,#1e4080,#3a60b0)")}>CONSULT THE PENDULUM</button>
                  </div>
                )}
                {loading && <div style={{ color:"#c9a84c88", fontSize:19, margin:"20px 0" }}>Maple interprets the swing...</div>}
                {pendulumMsg && (
                  <div style={{ background:"#ffffff06", border:"1px solid #c9a84c33", borderRadius:16, padding:32, margin:"20px auto", maxWidth:560, textAlign:"left" }}>
                    <div style={{ fontSize:13, color:"#c9a84c", letterSpacing:3, marginBottom:16 }}>MAPLE SPEAKS</div>
                    <p style={{ lineHeight:2, fontSize:20, margin:0, color:"#e8d5c4" }}>{pendulumMsg}</p>
                  </div>
                )}
                {pendulumAns && <button onClick={reset} style={{ padding:"18px 40px", background:"none", border:"1px solid #c9a84c44", borderRadius:12, color:"#c9a84c", fontFamily:font, fontSize:19, letterSpacing:3, cursor:"pointer", marginTop:12 }}>ASK AGAIN</button>}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
