export type GroupId = "A" | "B" | "C" | "D";
export type DayId = "mon" | "tue" | "wed" | "ko";
export type Discipline = "Chess" | "Soccer" | "Volleyball" | "Netball" | "Snooker" | "Darts" | "Athletics";

export const DISCIPLINES: Discipline[] = [
  "Chess",
  "Soccer",
  "Volleyball",
  "Netball",
  "Snooker",
  "Darts",
  "Athletics",
];

export const DAYS: { id: DayId; label: string; short: string }[] = [
  { id: "mon", label: "Monday 06 July", short: "Mon 06" },
  { id: "tue", label: "Tuesday 07 July", short: "Tue 07" },
  { id: "wed", label: "Wednesday 08 July", short: "Wed 08" },
  { id: "ko", label: "Knockout Stage (Thu/Fri)", short: "Knockout" },
];

export const GROUPS: Record<GroupId, { name: string; venue: string; soccerVenue?: string; teams: string[] }> = {
  A: {
    name: "Group A",
    venue: "Gweru Provincial Hospital",
    teams: ["Midlands", "Mpilo Hospital", "Matabeleland North", "Mashonaland Central"],
  },
  B: {
    name: "Group B",
    venue: "Midlands State University",
    soccerVenue: "Chaplin High School",
    teams: ["Mashonaland West", "Matabeleland South", "Sally Mugabe Hospital", "Bulawayo Metropolitan"],
  },
  C: {
    name: "Group C",
    venue: "Midlands State University",
    teams: ["Masvingo", "Manicaland", "Harare Metropolitan", "Chitungwiza Hospital", "Health Services Commission"],
  },
  D: {
    name: "Group D",
    venue: "Midlands State University",
    soccerVenue: "Chaplin High School",
    teams: [
      "Parirenyatwa Hospital",
      "Mashonaland East",
      "MoHCC Headquarters",
      "United Bulawayo Hospitals",
      "Ingutsheni Hospital",
    ],
  },
};

export type Match = {
  id: string;
  group: GroupId;
  day: DayId;
  time: string;
  teamA: string;
  teamB: string;
};

export const MATCHES: Match[] = [
  // Group A
  { id: "A-mon-1", group: "A", day: "mon", time: "11:00-12:45", teamA: "Midlands", teamB: "Mpilo Hospital" },
  { id: "A-mon-2", group: "A", day: "mon", time: "14:00-15:45", teamA: "Matabeleland North", teamB: "Mashonaland Central" },
  { id: "A-tue-1", group: "A", day: "tue", time: "11:00-12:45", teamA: "Midlands", teamB: "Mashonaland Central" },
  { id: "A-tue-2", group: "A", day: "tue", time: "14:00-15:45", teamA: "Matabeleland North", teamB: "Mpilo Hospital" },
  { id: "A-wed-1", group: "A", day: "wed", time: "11:00-12:45", teamA: "Midlands", teamB: "Matabeleland North" },
  { id: "A-wed-2", group: "A", day: "wed", time: "14:00-15:45", teamA: "Mpilo Hospital", teamB: "Mashonaland Central" },
  // Group B
  { id: "B-mon-1", group: "B", day: "mon", time: "11:00-12:45", teamA: "Mashonaland West", teamB: "Matabeleland South" },
  { id: "B-mon-2", group: "B", day: "mon", time: "14:00-15:45", teamA: "Sally Mugabe Hospital", teamB: "Bulawayo Metropolitan" },
  { id: "B-tue-1", group: "B", day: "tue", time: "11:00-12:45", teamA: "Mashonaland West", teamB: "Bulawayo Metropolitan" },
  { id: "B-tue-2", group: "B", day: "tue", time: "14:00-15:45", teamA: "Sally Mugabe Hospital", teamB: "Matabeleland South" },
  { id: "B-wed-1", group: "B", day: "wed", time: "11:00-12:45", teamA: "Mashonaland West", teamB: "Sally Mugabe Hospital" },
  { id: "B-wed-2", group: "B", day: "wed", time: "14:00-15:45", teamA: "Bulawayo Metropolitan", teamB: "Matabeleland South" },
  // Group C
  { id: "C-mon-1", group: "C", day: "mon", time: "11:00-12:45", teamA: "Masvingo", teamB: "Manicaland" },
  { id: "C-mon-2", group: "C", day: "mon", time: "14:00-15:10", teamA: "Harare Metropolitan", teamB: "Chitungwiza Hospital" },
  { id: "C-mon-3", group: "C", day: "mon", time: "15:20-16:30", teamA: "Health Services Commission", teamB: "Masvingo" },
  { id: "C-tue-1", group: "C", day: "tue", time: "11:00-12:45", teamA: "Harare Metropolitan", teamB: "Manicaland" },
  { id: "C-tue-2", group: "C", day: "tue", time: "14:00-15:10", teamA: "Chitungwiza Hospital", teamB: "Health Services Commission" },
  { id: "C-tue-3", group: "C", day: "tue", time: "15:20-16:30", teamA: "Harare Metropolitan", teamB: "Masvingo" },
  { id: "C-wed-1", group: "C", day: "wed", time: "11:00-12:10", teamA: "Manicaland", teamB: "Chitungwiza Hospital" },
  { id: "C-wed-2", group: "C", day: "wed", time: "12:20-13:30", teamA: "Health Services Commission", teamB: "Harare Metropolitan" },
  { id: "C-wed-3", group: "C", day: "wed", time: "14:00-15:10", teamA: "Masvingo", teamB: "Chitungwiza Hospital" },
  { id: "C-wed-4", group: "C", day: "wed", time: "15:20-16:30", teamA: "Manicaland", teamB: "Health Services Commission" },
  // Group D
  { id: "D-mon-1", group: "D", day: "mon", time: "11:00-12:45", teamA: "Parirenyatwa Hospital", teamB: "Mashonaland East" },
  { id: "D-mon-2", group: "D", day: "mon", time: "14:00-15:10", teamA: "MoHCC Headquarters", teamB: "United Bulawayo Hospitals" },
  { id: "D-mon-3", group: "D", day: "mon", time: "15:20-16:30", teamA: "Ingutsheni Hospital", teamB: "Parirenyatwa Hospital" },
  { id: "D-tue-1", group: "D", day: "tue", time: "11:00-12:45", teamA: "Mashonaland East", teamB: "MoHCC Headquarters" },
  { id: "D-tue-2", group: "D", day: "tue", time: "14:00-15:10", teamA: "United Bulawayo Hospitals", teamB: "Ingutsheni Hospital" },
  { id: "D-tue-3", group: "D", day: "tue", time: "15:20-16:30", teamA: "Parirenyatwa Hospital", teamB: "MoHCC Headquarters" },
  { id: "D-wed-1", group: "D", day: "wed", time: "11:00-12:10", teamA: "United Bulawayo Hospitals", teamB: "Mashonaland East" },
  { id: "D-wed-2", group: "D", day: "wed", time: "12:20-13:30", teamA: "Ingutsheni Hospital", teamB: "MoHCC Headquarters" },
  { id: "D-wed-3", group: "D", day: "wed", time: "14:00-15:10", teamA: "Parirenyatwa Hospital", teamB: "United Bulawayo Hospitals" },
  { id: "D-wed-4", group: "D", day: "wed", time: "15:20-16:30", teamA: "Mashonaland East", teamB: "Ingutsheni Hospital" },
];

export function venueFor(group: GroupId, discipline: Discipline): string {
  const g = GROUPS[group];
  if (discipline === "Soccer" && g.soccerVenue) return g.soccerVenue;
  return g.venue;
}

export type KnockoutMatch = {
  id: string;
  round: "QF" | "SF" | "3rd" | "Final";
  label: string;
  matchup: string;
  venue: string;
  time: string;
  date: string;
};

export const KNOCKOUTS: KnockoutMatch[] = [
  { id: "QF1", round: "QF", label: "Quarter-Final 1", matchup: "A1 vs B2", venue: "Gweru Provincial Hospital", time: "11:00", date: "Thu 09 July" },
  { id: "QF2", round: "QF", label: "Quarter-Final 2", matchup: "B1 vs A2", venue: "Chaplin High School", time: "11:00", date: "Thu 09 July" },
  { id: "QF3", round: "QF", label: "Quarter-Final 3", matchup: "C1 vs D2", venue: "Midlands State University", time: "11:00", date: "Thu 09 July" },
  { id: "QF4", round: "QF", label: "Quarter-Final 4", matchup: "D1 vs C2", venue: "Chaplin High School", time: "11:00", date: "Thu 09 July" },
  { id: "SF1", round: "SF", label: "Semi-Final 1", matchup: "Winner QF1 vs Winner QF3", venue: "Gweru Provincial Hospital", time: "15:00", date: "Thu 09 July" },
  { id: "SF2", round: "SF", label: "Semi-Final 2", matchup: "Winner QF2 vs Winner QF4", venue: "Midlands State University", time: "15:00", date: "Thu 09 July" },
  { id: "3rd", round: "3rd", label: "3rd Place Playoff", matchup: "Loser SF1 vs Loser SF2", venue: "Gweru Provincial Hospital", time: "09:00", date: "Fri 10 July" },
  { id: "Final", round: "Final", label: "Grand Final", matchup: "Winner SF1 vs Winner SF2", venue: "Gweru Provincial Hospital", time: "11:00", date: "Fri 10 July" },
];

export type Score = { a: number; b: number } | null;
export type ScoresByDiscipline = Record<string, Record<string, Score>>; // discipline -> matchId -> score

export function computeStandings(
  group: GroupId,
  discipline: Discipline,
  scores: Record<string, Score>,
) {
  const teams = GROUPS[group].teams;
  const table = teams.map((t) => ({ team: t, P: 0, W: 0, D: 0, L: 0, Pts: 0, GF: 0, GA: 0 }));
  const byName = new Map(table.map((r) => [r.team, r]));
  const groupMatches = MATCHES.filter((m) => m.group === group);
  for (const m of groupMatches) {
    const s = scores[`${discipline}::${m.id}`];
    if (!s) continue;
    const a = byName.get(m.teamA)!;
    const b = byName.get(m.teamB)!;
    a.P++; b.P++;
    a.GF += s.a; a.GA += s.b;
    b.GF += s.b; b.GA += s.a;
    if (s.a > s.b) { a.W++; a.Pts += 3; b.L++; }
    else if (s.a < s.b) { b.W++; b.Pts += 3; a.L++; }
    else { a.D++; b.D++; a.Pts += 1; b.Pts += 1; }
  }
  table.sort((x, y) => y.Pts - x.Pts || (y.GF - y.GA) - (x.GF - x.GA) || y.GF - x.GF);
  return table;
}