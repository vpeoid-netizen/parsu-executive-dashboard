export type PersonnelCountGroups = {
  appointment?: Record<string, number>;
  rank?: Record<string, number>;
  education?: Record<string, number>;
};

function addMap(target: Record<string, number>, source?: Record<string, number>) {
  for (const [key, value] of Object.entries(source ?? {})) {
    target[key] = (target[key] ?? 0) + value;
  }
}

function parseCounts(countsJson: string): PersonnelCountGroups {
  return JSON.parse(countsJson) as PersonnelCountGroups;
}

/** Official faculty headcount is the worksheet total column, not appointment subtotals. */
export function sumFacultyCounts(rows: { total: number | null; countsJson: string }[]) {
  const appointment: Record<string, number> = {};
  const rank: Record<string, number> = {};
  const education: Record<string, number> = {};
  let total = 0;
  for (const row of rows) {
    const counts = parseCounts(row.countsJson);
    total += row.total ?? 0;
    addMap(appointment, counts.appointment);
    addMap(rank, counts.rank);
    addMap(education, counts.education);
  }
  return { total, appointment, rank, education };
}

export function sumStaffCounts(rows: { total: number | null; countsJson: string }[]) {
  const appointment: Record<string, number> = {};
  const rank: Record<string, number> = {};
  let total = 0;
  for (const row of rows) {
    const counts = parseCounts(row.countsJson);
    const appointmentSum = Object.values(counts.appointment ?? {}).reduce((sum, value) => sum + value, 0);
    total += appointmentSum || (row.total ?? 0);
    addMap(appointment, counts.appointment);
    addMap(rank, counts.rank);
  }
  return { total, appointment, rank };
}
