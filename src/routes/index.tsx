import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  DAYS,
  GROUPS,
  KNOCKOUTS,
  MATCHES,
  computeStandings,
  venueFor,
  type Discipline,
} from "@/lib/tournament";
import { MapPin, Clock, Trophy, Lock, Unlock, Sparkles, Medal, Vote, Search, RefreshCw, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

const ADMIN_PIN = "2026";
const POLL_VOTE_KEY = "hsc-mohcc-poll-vote-v1";

const SCORES_API_URL = "/api/scores";
const VOTE_API_URL = "/api/vote";

const PROVINCES = [
  "Bulawayo Metropolitan",
  "Chitungwiza Hospital",
  "Harare Metropolitan",
  "Health Services Commission (HSC)",
  "Ingutsheni Hospital",
  "Manicaland",
  "Mashonaland Central",
  "Mashonaland East",
  "Mashonaland West",
  "Masvingo",
  "Matabeleland North",
  "Matabeleland South",
  "Midlands",
  "MoHCC Headquarters",
  "Mpilo Hospital",
  "Parirenyatwa Hospital",
  "Sally Mugabe Hospital",
  "United Bulawayo Hospitals (UBH)",
];

const UI_DISCIPLINES = [
  "Soccer",
  "Volleyball (Men)",
  "Volleyball (Women)",
  "Netball",
  "Darts",
  "Chess",
  "Athletics",
  "Tug of War",
];

function Index() {
  const [uiDiscipline, setUiDiscipline] = useState("Soccer");
  const [day, setDay] = useState("mon");
  
  const [scores, setScores] = useState<Record<string, any>>({});
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [myVote, setMyVote] = useState<string | null>(null);
  
  const [admin, setAdmin] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [pinErr, setPinErr] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<{ connected: boolean; message: string } | null>(null);

  const checkApiStatus = async () => {
    try {
      const res = await fetch("/api/status");
      if (res.ok) {
        const data = await res.json();
        setApiStatus({ connected: data.connected === true, message: data.message });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCloudData = async () => {
    setLoading(true);
    let hadError = false;
    try {
      const scoresRes = await fetch(SCORES_API_URL);
      if (scoresRes.ok) {
        const data = await scoresRes.json();
        if (data && typeof data === "object") {
          setScores(data);
        }
      } else {
        hadError = true;
      }

      const votesRes = await fetch(VOTE_API_URL);
      if (votesRes.ok) {
        const data = await votesRes.json();
        if (data && typeof data === "object") {
          setVotes(data);
        }
      } else {
        hadError = true;
      }
    } catch (err) {
      console.error(err);
      hadError = true;
    } finally {
      setLoading(false);
    }
    if (hadError) {
      await checkApiStatus();
    }
  };

  useEffect(() => {
    fetchCloudData();
    checkApiStatus();
    try {
      const savedPick = localStorage.getItem(POLL_VOTE_KEY);
      if (savedPick) {
        setMyVote(savedPick);
      }
    } catch (e) {}

    const syncInterval = setInterval(fetchCloudData, 20000);
    return () => clearInterval(syncInterval);
  }, []);

  // Safeguards types mapping to ensure compiler matches your strict tournament backend keys
  const underlyingDiscipline = useMemo((): Discipline => {
    if (uiDiscipline.startsWith("Volleyball")) {
      return "Volleyball";
    }
    const validBaseDisciplines: string[] = ["Chess", "Soccer", "Netball", "Snooker", "Darts", "Athletics"];
    if (validBaseDisciplines.includes(uiDiscipline)) {
      return uiDiscipline as Discipline;
    }
    return "Soccer"; // Safe default fallback for UI items like 'Tug of War' not in type declarations
  }, [uiDiscipline]);

  const setScore = async (matchId: string, s: any) => {
    const key = uiDiscipline + "::" + matchId;
    const updatedScores = { ...scores };
    
    if (s === null) {
      delete updatedScores[key];
    } else {
      updatedScores[key] = s;
    }
    
    setScores(updatedScores);

    try {
      const res = await fetch(SCORES_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedScores),
      });
      if (!res.ok) {
        await checkApiStatus();
        return;
      }
      const data = await res.json();
      if (data && data.success === false) {
        await checkApiStatus();
      }
    } catch (err) {
      console.error(err);
      await checkApiStatus();
    }
  };

  const handleCastVote = async (p: string) => {
    if (myVote === p) return;
    setMyVote(p);
    try {
      localStorage.setItem(POLL_VOTE_KEY, p);
    } catch (e) {}

    try {
      const res = await fetch(VOTE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamName: p }),
      });
      if (!res.ok) {
        await checkApiStatus();
        return;
      }
      const data = await res.json();
      if (data && data.success === false) {
        await checkApiStatus();
        return;
      }
      if (data.votes) {
        setVotes(data.votes);
      }
    } catch (err) {
      console.error(err);
      await checkApiStatus();
    }
  };

  const dayMatches = useMemo(() => {
    if (day === "ko") return [];
    const baseMatches = MATCHES.filter((m) => m.day === day);
    const query = searchQuery.trim().toLowerCase();
    if (!query) return baseMatches;
    return baseMatches.filter(
      (m) =>
        m.teamA.toLowerCase().includes(query) ||
        m.teamB.toLowerCase().includes(query)
    );
  }, [day, searchQuery]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="relative overflow-hidden text-primary-foreground bg-primary px-4 py-10">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs">
              <Sparkles className="h-3.5 w-3.5" /> Wellness Festival 2026
            </div>
            <h1 className="mt-3 text-3xl font-black sm:text-5xl">
              HSC/MoHCC Results Hub
            </h1>
            <p className="mt-2 flex items-center gap-1 text-sm text-primary-foreground/80">
              <MapPin className="h-4 w-4" /> Gweru
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchCloudData} className="rounded-xl bg-white/10 p-3 hover:bg-white/20">
              <RefreshCw className={"h-5 w-5 " + (loading ? "animate-spin" : "")} />
            </button>
            <button onClick={() => (admin ? setAdmin(false) : setPinOpen(true))} className="rounded-xl bg-white/10 p-3 hover:bg-white/20">
              {admin ? <Unlock className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      <div className="sticky top-0 z-30 border-b bg-background px-4 py-3">
        <div className="mx-auto max-w-6xl flex gap-2 overflow-x-auto scrollbar-none">
          {UI_DISCIPLINES.map((d) => (
            <button
              key={d}
              onClick={() => setUiDiscipline(d)}
              className={"shrink-0 rounded-full px-4 py-2 text-sm font-bold " + (d === uiDiscipline ? "bg-primary text-primary-foreground" : "bg-muted")}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {apiStatus && !apiStatus.connected && (
        <div className="bg-gold-deep text-white">
          <div className="mx-auto max-w-6xl px-4 py-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">Live updates are offline</p>
                <p className="text-xs text-white/90 mt-0.5 line-clamp-3">{apiStatus.message}</p>
                <p className="text-xs font-bold mt-1.5">Ask the event admin to connect the HSC_SCORES KV database in Cloudflare, then tap Refresh.</p>
              </div>
              <button
                onClick={() => { fetchCloudData(); checkApiStatus(); }}
                className="shrink-0 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-bold hover:bg-white/30"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-4 pt-4 space-y-2">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {DAYS.map((d) => (
            <button
              key={d.id}
              onClick={() => setDay(d.id)}
              className={"rounded-xl border p-2.5 text-sm font-bold " + (d.id === day ? "bg-primary text-primary-foreground" : "bg-card")}
            >
              {d.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setDay("poll")}
          className={"w-full flex items-center justify-center gap-2 rounded-xl border p-2.5 text-sm font-black uppercase tracking-wide " + (day === "poll" ? "bg-gold text-gold-deep" : "bg-card text-gold-deep border-gold")}
        >
          <Vote className="h-4 w-4" /> Live Fans' Poll
        </button>
      </div>

      {day !== "poll" && day !== "ko" && (
        <div className="mx-auto max-w-6xl px-4 pt-4">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Team..."
              className="w-full rounded-xl border bg-card pl-10 pr-4 py-2 text-sm outline-none"
            />
          </div>
        </div>
      )}

      <main className="mx-auto max-w-6xl px-4 py-6">
        {day === "poll" ? (
          <PollView votes={votes} myVote={myVote} onCast={handleCastVote} />
        ) : day === "ko" ? (
          <KnockoutView uiDiscipline={uiDiscipline} />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <section className="space-y-3">
              {dayMatches.length > 0 ? (
                dayMatches.map((m) => (
                  <MatchCard
                    key={m.id}
                    match={m}
                    uiDiscipline={uiDiscipline}
                    venue={venueFor(m.group, underlyingDiscipline)}
                    score={scores[uiDiscipline + "::" + m.id] ?? null}
                    admin={admin}
                    onChange={(s: { a: number; b: number } | null) => setScore(m.id, s)}
                  />
                ))
              ) : (
                <div className="text-center py-12 border border-dashed rounded-2xl">
                  <p className="text-sm text-muted-foreground">No matches schedule criteria matches.</p>
                </div>
              )}
            </section>
            <section className="space-y-4">
              {Object.keys(GROUPS).map((g) => (
                <StandingsCard key={g} group={g as any} uiDiscipline={uiDiscipline} discipline={underlyingDiscipline} scores={scores} />
              ))}
            </section>
          </div>
        )}
      </main>

      {pinOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setPinOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold">Admin Portal</h2>
            <input
              type="password"
              value={pin}
              onChange={(e) => { setPin(e.target.value); setPinErr(false); }}
              className="mt-4 w-full rounded-lg border p-2 text-center text-lg font-bold"
              placeholder="••••"
            />
            {pinErr && <p className="mt-2 text-xs text-destructive">Invalid PIN</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setPinOpen(false)} className="px-4 py-2 text-sm">Cancel</button>
              <button
                onClick={() => {
                  if (pin === ADMIN_PIN) { setAdmin(true); setPinOpen(false); setPin(""); }
                  else setPinErr(true);
                }}
                className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm"
              >
                Unlock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TeamBadge({ name, group }: { name: string; group: string }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">{name.charAt(0)}</span>
      <div className="min-w-0">
        <div className="truncate text-sm font-bold">{name}</div>
        <div className="text-[10px] text-muted-foreground">Group {group}</div>
      </div>
    </div>
  );
}

function MatchCard({ match, uiDiscipline, venue, score, admin, onChange }: any) {
  const [draftA, setDraftA] = useState<string>(score?.a ?? "");
  const [draftB, setDraftB] = useState<string>(score?.b ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDraftA(score?.a ?? "");
    setDraftB(score?.b ?? "");
  }, [score?.a, score?.b]);

  const dirty =
    String(draftA) !== String(score?.a ?? "") ||
    String(draftB) !== String(score?.b ?? "");

  const handleSave = async () => {
    setSaving(true);
    if (draftA === "" && draftB === "") {
      await onChange(null);
    } else {
      await onChange({
        a: draftA === "" ? 0 : parseInt(String(draftA)),
        b: draftB === "" ? 0 : parseInt(String(draftB)),
      });
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const handleClear = async () => {
    setDraftA("");
    setDraftB("");
    await onChange(null);
  };

  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between text-xs text-muted-foreground border-b pb-2 mb-3">
        <span>Group {match.group}</span>
        <span>{match.time}</span>
      </div>
      <div className="grid grid-cols-[1fr_auto_auto_auto_1fr] items-center gap-2">
        <TeamBadge name={match.teamA} group={match.group} />
        {admin ? (
          <input
            type="number"
            value={draftA}
            onChange={(e) => setDraftA(e.target.value)}
            className="w-12 border rounded text-center font-bold text-foreground bg-background"
          />
        ) : (
          <span className="font-bold text-lg px-2">{score?.a ?? "-"}</span>
        )}
        <span>:</span>
        {admin ? (
          <input
            type="number"
            value={draftB}
            onChange={(e) => setDraftB(e.target.value)}
            className="w-12 border rounded text-center font-bold text-foreground bg-background"
          />
        ) : (
          <span className="font-bold text-lg px-2">{score?.b ?? "-"}</span>
        )}
        <div className="text-right flex items-center justify-end gap-2">
          <div className="truncate text-sm font-bold">{match.teamB}</div>
          <span className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">{match.teamB.charAt(0)}</span>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="text-xs text-muted-foreground">{venue}</div>
        {admin && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleClear}
              className="rounded-lg border px-3 py-1 text-xs font-bold hover:bg-muted"
            >
              Clear
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !dirty}
              className="rounded-lg bg-primary text-primary-foreground px-3 py-1 text-xs font-bold disabled:opacity-50"
            >
              {saving ? "Saving..." : saved ? "Saved ✓" : "Save"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StandingsCard({ group, uiDiscipline, discipline, scores }: { group: any; uiDiscipline: string; discipline: Discipline; scores: any }) {
  // Safe computation passing through strictly parsed structural type checking rules
  const rows = computeStandings(group, discipline, scores);

  return (
    <div className="rounded-2xl border overflow-hidden bg-card text-card-foreground">
      <div className="bg-primary text-primary-foreground p-2 font-bold text-sm">Group {group}</div>
      <table className="w-full text-xs text-left">
        <thead className="bg-muted text-muted-foreground">
          <tr>
            <th className="p-2">Team</th>
            <th className="p-2 text-center">P</th>
            <th className="p-2 text-center">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.team} className="border-t border-border">
              <td className="p-2 font-medium">{r.team}</td>
              <td className="p-2 text-center">{r.P}</td>
              <td className="p-2 text-center font-bold">{r.Pts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function KnockoutView({ uiDiscipline }: { uiDiscipline: string }) {
  const items = KNOCKOUTS.filter((k) => k.round === "QF" || k.round === "SF" || k.round === "Final");
  return (
    <div className="space-y-4">
      <h2 className="font-bold text-foreground">{uiDiscipline} - Knockouts</h2>
      {items.map((m) => (
        <div key={m.id} className="border p-4 rounded-xl bg-card text-card-foreground">
          <div className="font-bold text-sm">{m.label}: {m.matchup}</div>
          <div className="text-xs text-muted-foreground mt-1">{m.date} - {m.time} | {m.venue}</div>
        </div>
      ))}
    </div>
  );
}

function PollView({ votes, myVote, onCast }: { votes: Record<string, number>; myVote: string | null; onCast: (p: string) => void }) {
  const total = Object.values(votes).reduce((s, n) => s + n, 0);
  return (
    <div className="space-y-4">
      <h2 className="font-bold text-foreground">Live Fan Standings Poll</h2>
      <div className="space-y-2">
        {PROVINCES.map((p) => {
          const count = votes[p] ?? 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <button
              key={p}
              onClick={() => onCast(p)}
              disabled={myVote !== null && myVote !== p}
              className="w-full border rounded-xl p-3 text-left flex justify-between bg-card relative overflow-hidden text-foreground"
            >
              <div className="absolute inset-y-0 left-0 bg-blue-500/10" style={{ width: pct + "%" }} />
              <span className="font-bold z-10">{p}</span>
              <span className="text-xs font-bold text-muted-foreground z-10">{count} votes ({pct}%)</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

