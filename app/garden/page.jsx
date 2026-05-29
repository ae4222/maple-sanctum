"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { createClient } from "@supabase/supabase-js";

const font = "'EB Garamond', Garamond, Georgia, serif";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ""
  );
}

function WitchCard({ member }) {
  const isKeeper = member.is_keeper;
  const isFounder = member.is_founder;

  return (
    <div style={{
      borderRadius:16,
      overflow:"hidden",
      padding: isKeeper || isFounder ? 2 : 0,
      background: isKeeper
        ? "linear-gradient(135deg, #c9a84c, #f0d080, #c9a84c)"
        : isFounder
        ? "linear-gradient(135deg, #9b7fd4, #c9a84c, #9b7fd4)"
        : "transparent",
      border: !isKeeper && !isFounder ? "1px solid #c9a84c22" : "none",
    }}>
      <div style={{
        background:"#0f0720",
        borderRadius: isKeeper || isFounder ? 14 : 16,
        overflow:"hidden",
      }}>
        <div style={{ position:"relative" }}>
          <img
            src={member.avatar_url}
            alt={member.witch_name}
            style={{ width:"100%", aspectRatio:"3/4", objectFit:"cover", display:"block" }}
          />
          {isKeeper && (
            <div style={{
              position:"absolute", top:10, left:10,
              background:"linear-gradient(135deg,#c9a84c,#f0d080)",
              color:"#1a0800", fontSize:10, letterSpacing:2,
              padding:"4px 10px", borderRadius:20, fontFamily:font,
            }}>✦ KEEPER</div>
          )}
          {isFounder && !isKeeper && (
            <div style={{
              position:"absolute", top:10, left:10,
              background:"linear-gradient(135deg,#9b7fd4,#c9a84c)",
              color:"#fff", fontSize:10, letterSpacing:2,
              padding:"4px 10px", borderRadius:20, fontFamily:font,
            }}>✦ FOUNDER #{member.founder_number}</div>
          )}
        </div>

        <div style={{ padding:"16px", textAlign:"center" }}>
          <div style={{
            fontSize:18, letterSpacing:2, marginBottom:4,
            color: isKeeper ? "#c9a84c" : isFounder ? "#b89fd4" : "#e8d5c4",
            fontFamily:font,
          }}>{member.witch_name}</div>
          <div style={{ fontSize:12, color:"#8b7355", letterSpacing:1, fontFamily:font }}>
            {member.witch_type} Witch · {member.familiar} Familiar
          </div>
          {isKeeper && (
            <div style={{ fontSize:11, color:"#c9a84c88", letterSpacing:2, marginTop:6, fontStyle:"italic", fontFamily:font }}>
              Keeper of the Garden Gate
            </div>
          )}
          {isFounder && !isKeeper && (
            <div style={{ fontSize:11, color:"#9b7fd488", letterSpacing:2, marginTop:6, fontStyle:"italic", fontFamily:font }}>
              Garden Founder
            </div>
          )}
          {!isKeeper && !isFounder && (
            <div style={{ fontSize:11, color:"#8b735588", letterSpacing:2, marginTop:6, fontStyle:"italic", fontFamily:font }}>
              Garden Member
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GardenPage() {
  const { data: session } = useSession();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myProfile, setMyProfile] = useState(null);

  useEffect(() => { loadMembers(); }, []);
  useEffect(() => { if (session) checkMyProfile(); }, [session]);

  async function loadMembers() {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("garden_members")
      .select("*")
      .order("is_keeper", { ascending: false })
      .order("is_founder", { ascending: false })
      .order("founder_number", { ascending: true })
      .order("joined_at", { ascending: true });
    if (data) setMembers(data);
    setLoading(false);
  }

  async function checkMyProfile() {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("garden_members")
      .select("*")
      .eq("email", session.user.email)
      .single();
    setMyProfile(data || null);
  }

  const keeper = members.find(m => m.is_keeper);
  const founders = members.filter(m => m.is_founder && !m.is_keeper);
  const regular = members.filter(m => !m.is_founder && !m.is_keeper);

  return (
    <div style={{ minHeight:"100vh", background:"#0a0514", color:"#e8d5c4", padding:"40px 24px", fontFamily:font }}>
      <link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap" rel="stylesheet"/>
      <div style={{ maxWidth:1000, margin:"0 auto" }}>

        <button onClick={() => window.location.href = "/oracle"} style={{
          background:"none", border:"none", color:"#8b7355",
          cursor:"pointer", marginBottom:28, fontSize:17, fontFamily:font,
        }}>← Back</button>

        <div style={{ textAlign:"center", marginBottom:48 }}>
          <div style={{ fontSize:44, color:"#c9a84c", letterSpacing:4, marginBottom:10 }}>🌿 THE GARDEN</div>
          <div style={{ color:"#8b7355", fontSize:18, fontStyle:"italic" }}>a gathering of witches</div>
        </div>

        {session && (
          <div style={{ textAlign:"right", marginBottom:32 }}>
            {myProfile ? (
              <button onClick={() => window.location.href = "/garden/edit"} style={{
                background:"none", border:"1px solid #c9a84c44", color:"#c9a84c",
                borderRadius:10, padding:"8px 20px", cursor:"pointer", fontFamily:font, fontSize:15,
              }}>✦ Edit my card</button>
            ) : (
              <button onClick={() => window.location.href = "/garden/setup"} style={{
                background:"linear-gradient(135deg,#2d1b4e,#4a2080)", border:"none",
                color:"#e8d5c4", borderRadius:10, padding:"8px 20px",
                cursor:"pointer", fontFamily:font, fontSize:15,
              }}>🌿 Join the Garden</button>
            )}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign:"center", color:"#8b7355", fontSize:18, fontStyle:"italic" }}>
            The garden stirs...
          </div>
        ) : (
          <>
            {keeper && (
              <div style={{ marginBottom:48 }}>
                <div style={{ fontSize:12, color:"#c9a84c", letterSpacing:3, marginBottom:20, textAlign:"center" }}>
                  ✦ KEEPER OF THE GARDEN GATE ✦
                </div>
                <div style={{ maxWidth:240, margin:"0 auto" }}>
                  <WitchCard member={keeper}/>
                </div>
              </div>
            )}

            {founders.length > 0 && (
              <div style={{ marginBottom:48 }}>
                <div style={{ fontSize:12, color:"#9b7fd4", letterSpacing:3, marginBottom:20, textAlign:"center" }}>
                  ✦ GARDEN FOUNDERS ✦
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:20 }}>
                  {founders.map((m, i) => <WitchCard key={i} member={m}/>)}
                </div>
              </div>
            )}

            {regular.length > 0 && (
              <div>
                <div style={{ fontSize:12, color:"#8b7355", letterSpacing:3, marginBottom:20, textAlign:"center" }}>
                  ✦ GARDEN MEMBERS ✦
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:20 }}>
                  {regular.map((m, i) => <WitchCard key={i} member={m}/>)}
                </div>
              </div>
            )}

            {members.length === 0 && (
              <div style={{ textAlign:"center", color:"#8b7355", fontSize:17, fontStyle:"italic", padding:"48px 0" }}>
                The garden awaits its first witches...
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}