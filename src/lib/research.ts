import { ACADEMIC_RANK_GROUPS, normalizeAcademicRank, type AcademicRankGroup } from "@/lib/import/normalize";
import { sharesThatSumTo100 } from "@/lib/percent-share";

type AuthorContribution = {
  name?: string;
  academicRank?: string | null;
  contribution?: number | null;
};

export type AuthoredResearchRecord = {
  fiscalYear: number;
  authorsJson: string;
};

export function parseAuthorsJson(json: string | null | undefined): AuthorContribution[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json) as AuthorContribution[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function formatAuthorNames(json: string | null | undefined) {
  return parseAuthorsJson(json)
    .map((item) => item.name)
    .filter(Boolean)
    .join("; ");
}

function contributionWeight(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value) || value < 0) return 0;
  if (value > 1.5 && value <= 100) return value / 100;
  return value;
}

export function contributionByRankAndYear(records: AuthoredResearchRecord[]) {
  const byYear = new Map<number, Map<AcademicRankGroup, number>>();
  for (const record of records) {
    const yearMap = byYear.get(record.fiscalYear) ?? new Map<AcademicRankGroup, number>();
    for (const author of parseAuthorsJson(record.authorsJson)) {
      const weight = contributionWeight(author.contribution);
      if (!weight) continue;
      const rank = normalizeAcademicRank(author.academicRank);
      yearMap.set(rank, (yearMap.get(rank) ?? 0) + weight);
    }
    byYear.set(record.fiscalYear, yearMap);
  }
  const years = [...byYear.keys()].sort((a, b) => a - b);
  const stacked = years.map((year) => {
    const yearMap = byYear.get(year);
    const weights = ACADEMIC_RANK_GROUPS.map((rank) => yearMapValue(yearMap, rank));
    const shares = sharesThatSumTo100(weights);
    const row: Record<string, string | number> = { year: `FY ${year}` };
    ACADEMIC_RANK_GROUPS.forEach((rank, index) => {
      row[rank] = shares[index];
    });
    return row;
  });
  const latestYear = years.at(-1) ?? null;
  const latestSlices =
    latestYear == null
      ? []
      : ACADEMIC_RANK_GROUPS.map((rank) => ({
          name: rank,
          value: yearMapValue(byYear.get(latestYear), rank),
        })).filter((item) => item.value > 0);
  const table = years.flatMap((year) => {
    const yearMap = byYear.get(year);
    const weights = ACADEMIC_RANK_GROUPS.map((rank) => yearMapValue(yearMap, rank));
    const shares = sharesThatSumTo100(weights);
    return ACADEMIC_RANK_GROUPS.map((rank, index) => ({
      year,
      rank,
      contribution: weights[index],
      percent: shares[index],
    })).filter((row) => row.contribution > 0);
  });
  return { years, stacked, latestYear, latestSlices, table, hasData: table.length > 0 };
}

function yearMapValue(map: Map<AcademicRankGroup, number> | undefined, rank: AcademicRankGroup) {
  return map?.get(rank) ?? 0;
}
