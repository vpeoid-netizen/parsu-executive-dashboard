import type { PeriodType } from "@prisma/client";

export type PeriodInput = {
  type: PeriodType;
  fiscalYear?: number | null;
  calendarYear?: number | null;
  academicYearStart?: number | null;
  academicYearEnd?: number | null;
  semester?: number | null;
  quarter?: number | null;
  month?: number | null;
  asOfDate?: Date | null;
  startDate?: Date | null;
  endDate?: Date | null;
  isPartial?: boolean;
  notes?: string | null;
};

export function academicYearLabel(start: number, end = start + 1): string {
  return `AY ${start}–${end}`;
}

export function semesterLabel(semester: number): string {
  if (semester === 1) return "First Semester";
  if (semester === 2) return "Second Semester";
  if (semester === 3) return "Midyear";
  return `Semester ${semester}`;
}

export function shortChartPeriodLabel(label: string) {
  const ay = label.match(/AY\s*(\d{4})\s*[-–]\s*(\d{2,4})/i);
  const semester = /second/i.test(label) ? "2nd" : /first/i.test(label) ? "1st" : /midyear/i.test(label) ? "Mid" : null;
  if (ay) {
    const start = ay[1].slice(-2);
    const end = ay[2].length >= 4 ? ay[2].slice(-2) : ay[2];
    return semester ? `${start}–${end} ${semester}` : `${start}–${end}`;
  }
  return label.replace(/First Semester/i, "1st").replace(/Second Semester/i, "2nd");
}

export function fiscalYearLabel(year: number, isPartial = false, asOf?: Date | null): string {
  if (isPartial && asOf) {
    return `FY ${year} / as of ${asOf.toLocaleDateString("en-PH", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })}`;
  }
  return `FY ${year}`;
}

export function formatPeriod(input: PeriodInput): string {
  switch (input.type) {
    case "ACADEMIC_YEAR":
      if (input.academicYearStart) {
        return academicYearLabel(
          input.academicYearStart,
          input.academicYearEnd ?? input.academicYearStart + 1,
        );
      }
      break;
    case "SEMESTER":
      if (input.academicYearStart && input.semester) {
        return `${academicYearLabel(
          input.academicYearStart,
          input.academicYearEnd ?? input.academicYearStart + 1,
        )} / ${semesterLabel(input.semester)}`;
      }
      break;
    case "FISCAL_YEAR":
      if (input.fiscalYear) {
        return fiscalYearLabel(input.fiscalYear, Boolean(input.isPartial), input.asOfDate);
      }
      break;
    case "QUARTER":
      if (input.fiscalYear && input.quarter) {
        return `FY ${input.fiscalYear} / Quarter ${input.quarter}`;
      }
      break;
    case "AS_OF_DATE":
      if (input.asOfDate) {
        return `As of ${input.asOfDate.toLocaleDateString("en-PH", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })}`;
      }
      break;
    case "DATE_RANGE":
      if (input.startDate && input.endDate) {
        return `Validity: ${input.startDate.toLocaleDateString("en-PH", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })} – ${input.endDate.toLocaleDateString("en-PH", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })}`;
      }
      break;
    default:
      break;
  }
  return input.notes?.trim() || "Reporting period not specified";
}

export function parseAcademicYearHeader(value: string): {
  start: number;
  end: number;
  semester: number;
} | null {
  const match = value.match(/(\d{4})\s*[-–]\s*(\d{4}).*(1st|2nd|first|second|midyear)/i);
  if (!match) return null;
  const start = Number(match[1]);
  const end = Number(match[2]);
  const token = match[3].toLowerCase();
  const semester = token.startsWith("1") || token === "first" ? 1 : token.includes("mid") ? 3 : 2;
  return { start, end, semester };
}

export function parseFiscalYear(value: string): number | null {
  const match = value.match(/FY\s*(\d{4})/i);
  return match ? Number(match[1]) : null;
}
