export const SHARE_COLORS = [
  "#071f46",
  "#f7b918",
  "#304e70",
  "#166534",
  "#a47b00",
  "#5c6b82",
  "#10294d",
  "#c45c26",
  "#3d6b99",
  "#8b6914",
  "#1d4a3a",
  "#6b3a4a",
];

/** Distinct from academic-rank SHARE_COLORS so appointment donuts do not reuse navy/gold/slate. */
export const FACULTY_APPOINTMENT_COLORS: Record<string, string> = {
  Permanent: "#0f766e",
  Temporary: "#be185d",
  COS: "#6d28d9",
};

/** Distinct from rank (navy/gold) and appointment (teal/pink/purple). */
export const FACULTY_EDUCATION_COLORS: Record<string, string> = {
  "Bachelor's Degree": "#b45309",
  "Master's Degree": "#0369a1",
  "Doctorate Degree": "#3f6212",
};
