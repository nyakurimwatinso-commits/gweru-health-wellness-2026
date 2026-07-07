
```react
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  DAYS,
  DISCIPLINES,
  GROUPS,
  KNOCKOUTS,
  MATCHES,
  computeStandings,
  venueFor,
  type DayId,
  type Discipline,
  type GroupId,
  type Score,
} from "@/lib/tournament";
import { MapPin, Clock, Trophy, Lock, Unlock, Sparkles, Medal, Vote, Search, X, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

const ADMIN_PIN = "2026";
const POLL_VOTE_KEY = "hsc-mohcc-poll-vote-v1";

// API endpoints pointing to your Cloudflare Worker server.ts
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
] as const;
type Province = (typeof PROVINCES)[number];

const UI_DISCIPLINES = [
  "Soccer",
  "Volleyball (Men)",
  "Volleyball (Women)",
  "Netball",
  "Darts",
  "Chess",
  "Athletics",
  "Tug of War",
] as const;
type UiDiscipline = (typeof UI_DISCIPLINES)[number];

function Index() {
  const [uiDiscipline, setUiDiscipline] = useState<UiDiscipline>("Soccer");
  const [day, setDay] = useState<DayId>("mon");
  
  // Real-time state synchronized with your Cloudflare KV database
  const [scores, setScores] = useState<Record<string, Score>>({});
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [myVote, setMyVote] = useState<Province | null>(null);
  
  const [admin, setAdmin] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [pinErr, setPinErr] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // 1. Fetch live scores and votes from the database
  const fetchCloudData = async () => {
    setLoading(true);
    try {
      // Get latest scores
      const scoresRes = await fetch(SCORES_API_URL);
      if (scoresRes.ok) {
        const data = await scoresRes.json();
        if (data && typeof data === "object") {
          setScores(data);
        }
      }

      // Get latest poll votes
      const votesRes = await fetch(VOTE_API_URL);
      if (votesRes.ok) {
        const data = await votesRes.json();
        if (data && typeof data === "object") {
          setVotes(data);
        }
      }
    } catch (err) {
      console.error("Database connection issue:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCloudData();
    
    // Read local storage to see what team this viewer previously supported
    try {
      const savedPick = localStorage.getItem(POLL_VOTE_KEY) as Province | null;
      if (savedPick && (PROVINCES as readonly string[]).includes(savedPick)) {
        setMyVote(savedPick);
      }
    } catch {}

    // Polling interval: Auto-fetch updates every 20 seconds
    const syncInterval = setInterval(fetchCloudData, 20000);
    return () => clearInterval(syncInterval);
  }, []);

  const underlyingDiscipline = useMemo<Discipline>(() => {
    if (uiDiscipline === "Volleyball (Men)" || uiDiscipline === "Volleyball (Women)") {
      return "Volleyball";
    }
    return uiDiscipline as Discipline;
  }, [uiDiscipline]);

  // 2. Save edited scores to the Cloudflare KV database
  const setScore = async (matchId: string, s: Score) => {
    const key = `${uiDiscipline}::${matchId}`;
    const updatedScores = { ...scores };
    
    if (s === null) {
      delete updatedScores[key];
    } else {
      updatedScores[key] = s;
    }
    
    setScores(updatedScores);

    try {
      await fetch(SCORES_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedScores),
      });
    } catch (err) {
      console.error("Failed saving score update:", err);
    }
  };

  // 3. Register a fan vote on the server
  const handleCastVote = async (p: Province) => {
    if (myVote === p) return;

    setMyVote(p);
    try {
      localStorage.setItem(POLL_VOTE_KEY, p);
    } catch {}

    try {
      const res = await fetch(VOTE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamName: p }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.votes) {
          setVotes(data.votes);
        }
      }
    } catch (err) {
      console.error("Failed placing fan vote:", err);
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
      {/* HERO HEADER */}
      <header
        className="relative overflow-hidden text-white"
        style={{ backgroundImage: "var(--gradient-hero)" }}
      >
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.35), transparent 40%), radial-gradient(circle at 80% 60%, rgba(255,215,120,0.35), transparent 45%)",
        }} />
        <div className="relative mx-auto max-w-6xl px-4 pt-8 pb-10 sm:pt-12 sm:pb-14">
          <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" /> Wellness Festival 2026
              </div>
              <h1 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
                HSC/MoHCC Wellness Festival
                <span className="block bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-gold)" }}>
                  Results Hub
                </span>
              </h1>
              <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-white/90 sm:text-base">
                <MapPin className="h-4 w-4" /> Gweru · 06 – 10 July 2026
              </p>
            </div>
            
            <button
              onClick={fetchCloudData}
              className="shrink-0 rounded-2xl bg-white/15 p-3 backdrop-blur transition hover:bg-white/25 active:scale-95"
              aria-label="Manually refresh feed"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
            </button>

            <button
              onClick={() => (admin ? setAdmin(false) : setPinOpen(true))}
              className="shrink-0 rounded-2xl bg-white/15 p-3 backdrop-blur transition hover:bg-white/25 active:scale-95"
              aria-label="Toggle admin panel"
            >
              {admin ? <Unlock className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
            </button>
          </div>

          {admin && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[color:var(--gold)] px-4 py-1.5 text-xs font-bold text-[color:var(--accent-foreground)] shadow-lg">
              <Unlock className="h-3.5 w-3.5" /> ADMIN WRITE-ACCESS ENABLED
            </div>
          )}
        </div>
      </header>

      {/* SPORT SELECTION BAR */}
      <div className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-6xl">
          <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-none">
            {UI_DISCIPLINES.map((d) => {
              const active = d === uiDiscipline;
              return (
                <button
                  key={d}
                  onClick={() => setUiDiscipline(d)}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${
                    active
                      ? "text-white shadow-md"
                      : "bg-secondary text-secondary-foreground hover:bg-muted"
                  }`}
                  style={active ? { backgroundImage: "var(--gradient-hero)" } : undefined}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* TOURNAMENT DAYS SELECTOR */}
      <div className="mx-auto max-w-6xl px-4 pt-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {DAYS.map((d) => {
            const active = d.id === day;
            return (
              <button
                key={d.id}
                onClick={() => setDay(d.id)}
                className={`rounded-xl border-2 px-3 py-2.5 text-sm font-bold transition ${
                  active
                    ? "border-transparent text-white shadow-lg"
                    : "border-border bg-card text-foreground hover:border-[color:var(--primary)]"
                }`}
                style={active ? { backgroundImage: "var(--gradient-hero)" } : undefined}
              >
                {d.label}
              </button>
            );
          })}
        </div>
        
        {/* POLL TOGGLE BUTTON */}
        <button
          onClick={() => setDay("poll")}
          className={`mt-2 flex w-full items-center justify-center gap-2 rounded-xl border-2 px-3 py-2.5 text-sm font-black uppercase tracking-wide transition ${
            day === "poll"
              ? "border-transparent text-[color:var(--accent-foreground)] shadow-lg"
              : "border-[color:var(--gold)] bg-card text-[color:var(--primary-deep)] hover:bg-[color:var(--gold)]/10"
          }`}
          style={day === "poll" ? { backgroundImage: "var(--gradient-gold)" } : undefined}
        >
          <Vote className="h-4 w-4" /> Live Fans' Poll · Back Your Province
        </button>
      </div>

      {/* FILTER SEARCH INPUT */}
      {day !== "poll" && day !== "ko" && (
        <div className="mx-auto max-w-6xl px-4 pt-4">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by province/hospital (e.g. Masvingo, Mpilo, HSC)..."
              className="w-full rounded-xl border border-border bg-card pl-10 pr-10 py-2.5 text-sm font-medium outline-none transition focus:border-[color:var(--primary)] focus:ring-1 focus:ring-[color:var(--primary)] shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 p-1 rounded-full text-muted-foreground hover:bg-secondary transition"
                aria-label="Clear filter"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* TOURNAMENT VIEWS */}
      <main className="mx-auto max-w-6xl px-4 py-6">
        {day === "poll" ? (
          <PollView votes={votes} myVote={myVote} onCast={handleCastVote} />
        ) : day === "ko" ? (
          <KnockoutView uiDiscipline={uiDiscipline} />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            {/* SCHEDULE MATCH LIST */}
            <section>
              <SectionTitle icon={<Clock className="h-4 w-4" />}>
                {uiDiscipline} · {DAYS.find((d) => d.id === day)!.label}
              </SectionTitle>
              <div className="mt-3 grid gap-3">
                {dayMatches.length > 0 ? (
                  dayMatches.map((m) => (
                    <MatchCard
                      key={m.id}
                      match={m}
                      uiDiscipline={uiDiscipline}
                      discipline={underlyingDiscipline}
                      venue={venueFor(m.group, underlyingDiscipline)}
                      score={scores[`${uiDiscipline}::${m.id}`] ?? null}
                      admin={admin}
                      onChange={(s) => setScore(m.id, s)}
                    />
                  ))
                ) : (
                  <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-border bg-card">
                    <p className="text-sm font-medium text-muted-foreground">
                      {searchQuery ? `No matches matched your query.` : "No matches scheduled for today."}
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* DYNAMIC LEAGUE STANDINGS TABLE */}
            <section>
              <SectionTitle icon={<Trophy className="h-4 w-4" />}>Dynamic Standings Table</SectionTitle>
              <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                {(Object.keys(GROUPS) as GroupId[]).map((g) => (
                  <StandingsCard key={g} group={g} uiDiscipline={uiDiscipline} discipline={underlyingDiscipline} scores={scores} />
                ))}
              </div>
            </section>
          </div>
        )}
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-10 pt-4 text-center text-xs text-muted-foreground">
        HSC/MoHCC Live Results Hub · Win = 3pts, Draw = 1pt, Loss = 0pts · Standings automatically adjust live.
      </footer>

      {/* SECURE POPUP DIALOG FOR ADMINS */}
      {pinOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setPinOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold">Admin Authorization</h2>
            <p className="mt-1 text-sm text-muted-foreground">Enter secure PIN to input scores.</p>
            <input
              autoFocus
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => { setPin(e.target.value); setPinErr(false); }}
              className="mt-4 w-full rounded-lg border-2 border-border bg-background px-3 py-2.5 text-lg font-bold tracking-widest outline-none focus:border-[color:var(--primary)]"
              placeholder="••••"
            />
            {pinErr && <p className="mt-2 text-xs font-semibold text-destructive">Incorrect authorization PIN</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setPinOpen(false)} className="rounded-lg px-4 py-2 text-sm font-semibold hover:bg-muted">Cancel</button>
              <button
                onClick={() => {
                  if (pin === ADMIN_PIN) { setAdmin(true); setPinOpen(false); setPin(""); }
                  else setPinErr(true);
                }}
                className="rounded-lg px-4 py-2 text-sm font-bold text-white shadow"
                style={{ backgroundImage: "var(--gradient-hero)" }}
              >
                Unlock
              </button>
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">Hint: 2026</p>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionTitle({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-7 w-7 place-items-center rounded-lg text-white" style={{ backgroundImage: "var(--gradient-hero)" }}>
        {icon}
      </span>
      <h2 className="text-base font-black uppercase tracking-wide text-foreground sm:text-lg">{children}</h2>
    </div>
  );
}

function TeamBadge({ name, group }: { name: string; group: GroupId }) {
  const letter = name.charAt(0);
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-black text-white shadow-md" style={{ backgroundImage: "var(--gradient-hero)" }}>
        {letter}
      </span>
      <div className="min-w-0">
        <div className="truncate text-sm font-bold leading-tight text-foreground sm:text-base">{name}</div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Group {group}</div>
      </div>
    </div>
  );
}

function ScoreBox({
  value, admin, onChange, side,
}: { value: number | null; admin: boolean; onChange: (v: number | null) => void; side: "a" | "b" }) {
  if (admin) {
    return (
      <input
        type="number"
        min={0}
        inputMode="numeric"
        value={value ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === "" ? null : Math.max(0, parseInt(v, 10) || 0));
        }}
        aria-label={`Score ${side}`}
        className="h-14 w-14 rounded-xl border-2 border-[color:var(--gold)] bg-white text-center text-2xl font-black text-[color:var(--primary-deep)] outline-none focus:ring-2 focus:ring-[color:var(--gold-glow)]"
        placeholder="–"
      />
    );
  }
  return (
    <div className="grid h-14 w-14 place-items-center rounded-xl text-2xl font-black text-white shadow-md" style={{ backgroundImage: value === null ? "linear-gradient(135deg,#94a3b8,#64748b)" : "var(--gradient-hero)" }}>
      {value ?? "–"}
    </div>
  );
}

function MatchCard({
  match, uiDiscipline, discipline, venue, score, admin, onChange,
}: {
  match: (typeof MATCHES)[number];
  uiDiscipline: UiDiscipline;
  discipline: Discipline;
  venue: string;
  score: Score;
  admin: boolean;
  onChange: (s: Score) => void;
}) {
  const played = score !== null;
  const winner = score ? (score.a > score.b ? "a" : score.a < score.b ? "b" : "d") : null;

  return (
    <article className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:shadow-lg">
      <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-secondary/60 px-4 py-2 text-[11px] font-bold uppercase tracking-wider">
        <span className="rounded-full bg-[color:var(--primary)]/10 px-2.5 py-0.5 text-[color:var(--primary-deep)]">Group {match.group}</span>
        <span className="flex items-center gap-1 text-muted-foreground"><Clock className="h-3 w-3" />{match.time}</span>
        <span className="hidden truncate text-muted-foreground sm:inline">{uiDiscipline}</span>
      </div>
      <div className="px-4 py-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto_minmax(0,1fr)] items-center gap-2 sm:gap-3">
          <div className={winner === "a" ? "" : winner === "b" ? "opacity-60" : ""}>
            <TeamBadge name={match.teamA} group={match.group} />
          </div>
          <ScoreBox value={score?.a ?? null} admin={admin} side="a" onChange={(v) => onChange(v === null ? null : { a: v, b: score?.b ?? 0 })} />
          <span className="text-lg font-black text-muted-foreground">:</span>
          <ScoreBox value={score?.b ?? null} admin={admin} side="b" onChange={(v) => onChange(v === null ? null : { a: score?.a ?? 0, b: v })} />
          <div className={`text-right ${winner === "b" ? "" : winner === "a" ? "opacity-60" : ""}`}>
            <div className="flex min-w-0 items-center justify-end gap-2">
              <div className="min-w-0 text-right">
                <div className="truncate text-sm font-bold leading-tight sm:text-base">{match.teamB}</div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Group {match.group}</div>
              </div>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-black text-white shadow-md" style={{ backgroundImage: "var(--gradient-hero)" }}>
                {match.teamB.charAt(0)}
              </span>
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex min-w-0 items-center gap-1">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{venue}</span>
          </span>
          {played ? (
            <span className="rounded-full bg-[color:var(--primary)]/10 px-2 py-0.5 text-[10px] font-bold uppercase text-[color:var(--primary-deep)]">Final</span>
          ) : (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase">Upcoming</span>
          )}
        </div>
        {admin && played && (
          <button onClick={() => onChange(null)} className="mt-2 text-[11px] font-semibold text-destructive hover:underline">Clear match scores</button>
        )}
      </div>
    </article>
  );
}

function StandingsCard({ group, uiDiscipline, discipline, scores }: { group: GroupId; uiDiscipline: UiDiscipline; discipline: Discipline; scores: Record<string, Score> }) {
  const rows = computeStandings(group, uiDiscipline as unknown as Discipline, scores);
  const workingRows = rows.length > 0 ? rows : computeStandings(group, discipline, scores);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5" style={{ backgroundImage: "var(--gradient-hero)" }}>
        <div className="text-sm font-black uppercase tracking-wider text-white">Group {group}</div>
        <div className="truncate pl-3 text-[10px] font-semibold uppercase tracking-wider text-white/80">{GROUPS[group].venue.split(" ")[0]}</div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">#</th>
              <th className="px-2 py-2 text-left">Team</th>
              <th className="px-1.5 py-2 text-center">P</th>
              <th className="px-1.5 py-2 text-center">W</th>
              <th className="px-1.5 py-2 text-center">D</th>
              <th className="px-1.5 py-2 text-center">L</th>
              <th className="px-2 py-2 text-center">Pts</th>
            </tr>
          </thead>
          <tbody>
            {workingRows.map((r, i) => {
              const qualifies = i < 2;
              return (
                <tr
                  key={r.team}
                  className="border-t border-border/60"
                  style={qualifies ? { boxShadow: "inset 3px 0 0 var(--gold)", background: "color-mix(in oklab, var(--gold) 8%, transparent)" } : undefined}
                >
                  <td className="px-3 py-2 font-black text-muted-foreground">
                    {qualifies ? <Medal className="h-4 w-4 text-[color:var(--gold-deep)]" /> : i + 1}
                  </td>
                  <td className="px-2 py-2 font-bold">{r.team}</td>
                  <td className="px-1.5 py-2 text-center tabular-nums">{r.P}</td>
                  <td className="px-1.5 py-2 text-center tabular-nums">{r.W}</td>
                  <td className="px-1.5 py-2 text-center tabular-nums">{r.D}</td>
                  <td className="px-1.5 py-2 text-center tabular-nums">{r.L}</td>
                  <td className="px-2 py-2 text-center text-base font-black tabular-nums text-[color:var(--primary-deep)]">{r.Pts}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KnockoutView({ uiDiscipline }: { uiDiscipline: UiDiscipline }) {
  const rounds = [
    { title: "Quarter-Finals · Thu 09 July", items: KNOCKOUTS.filter((k) => k.round === "QF") },
    { title: "Semi-Finals · Thu 09 July", items: KNOCKOUTS.filter((k) => k.round === "SF") },
    { title: "Finals · Fri 10 July", items: KNOCKOUTS.filter((k) => k.round === "3rd" || k.round === "Final") },
  ];
  return (
    <div className="space-y-6">
      <SectionTitle icon={<Trophy className="h-4 w-4" />}>{uiDiscipline} · Knockout Stage</SectionTitle>
      {rounds.map((r) => (
        <div key={r.title}>
          <h3 className="mb-2 text-xs font-black uppercase tracking-widest text-muted-foreground">{r.title}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {r.items.map((m) => (
              <article
                key={m.id}
                className={`relative overflow-hidden rounded-2xl border-2 p-4 shadow-sm ${
                  m.round === "Final" ? "border-[color:var(--gold)]" : "border-border"
                } bg-card`}
                style={m.round === "Final" ? { boxShadow: "var(--shadow-gold)" } : undefined}
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-[color:var(--primary)]/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-[color:var(--primary-deep)]">
                    {m.label}
                  </span>
                  {m.round === "Final" && (
                    <span className="rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-[color:var(--accent-foreground)]" style={{ backgroundImage: "var(--gradient-gold)" }}>
                      🏆 Trophy Match
                    </span>
                  )}
                </div>
                <div className="mt-3 text-lg font-black leading-tight text-foreground sm:text-xl">
                  {m.matchup}
                </div>
                <div className="mt-3 flex items-center justify-between text-xs font-semibold text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {m.date} · {m.time}</span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{m.venue}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PollView({
  votes, myVote, onCast
}: {
  votes: Record<string, number>;
  myVote: Province | null;
  onCast: (p: Province) => void;
}) {
  const total = Object.values(votes).reduce((s, n) => s + n, 0);
  const leader = useMemo(() => {
    if (total === 0) return null;
    const sorted = Object.entries(votes).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? sorted[0][0] : null;
  }, [votes, total]);

  return (
    <div className="space-y-4">
      <SectionTitle icon={<Vote className="h-4 w-4" />}>Fans' Poll · Live Support</SectionTitle>
      <p className="text-sm text-muted-foreground">
        Rooting for your team? Place your vote to power your province up the leaderboard. One vote per device — updates in real-time across the tournament!
      </p>
      <div className="grid gap-2">
        {PROVINCES.map((p) => {
          const count = votes[p] ?? 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const mine = myVote === p;
          const isLeader = leader === p && total > 0;
          return (
            <button
              key={p}
              onClick={() => onCast(p)}
              disabled={myVote !== null && !mine}
              className={`group relative overflow-hidden rounded-2xl border-2 bg-card p-3 text-left shadow-sm transition active:scale-[0.99] ${
                mine ? "border-[color:var(--primary)]" : "border-border hover:border-[color:var(--primary)]/60"
              } ${myVote !== null && !mine ? "opacity-75 cursor-not-allowed" : ""}`}
            >
              <div
                aria-hidden
                className="absolute inset-y-0 left-0 transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  backgroundImage: isLeader ? "var(--gradient-gold)" : "var(--gradient-hero)",
                  opacity: isLeader ? 0.25 : 0.15,
                }}
              />
              <div className="relative flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-black text-white shadow-md"
                    style={{ backgroundImage: isLeader ? "var(--gradient-gold)" : "var(--gradient-hero)" }}
                  >
                    {p.charAt(0)}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-black text-foreground sm:text-base">{p}</div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {count} vote{count === 1 ? "" : "s"} · {pct}%
                      {mine && <span className="ml-2 text-[color:var(--primary-deep)]">· Your team</span>}
                      {isLeader && <span className="ml-2 text-[color:var(--gold-deep)]">· Leader</span>}
                    </div>
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${
                    mine
                      ? "text-[color:var(--accent-foreground)]"
                      : "bg-secondary text-secondary-foreground group-hover:bg-[color:var(--primary)]/10 group-hover:text-[color:var(--primary-deep)]"
                  }`}
                  style={mine ? { backgroundImage: "var(--gradient-gold)" } : undefined}
                >
                  {mine ? "Voted" : "Vote"}
                </span>
              </div>
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Total global verified votes: <b className="text-foreground">{total}</b></span>
      </div>
    </div>
  );
}

```

