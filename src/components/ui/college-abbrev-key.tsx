import { collegeAbbrev, collegeFullName, collegeSortIndex } from "@/lib/import/normalize";

export function CollegeAbbrevKey({ codes }: { codes: Array<string | null | undefined> }) {
  const items = [...new Set(codes.filter((code): code is string => Boolean(code && code !== "UNSPECIFIED")))]
    .map((code) => ({
      code,
      abbrev: collegeAbbrev(code),
      name: collegeFullName(code),
    }))
    .sort((a, b) => collegeSortIndex(a.code) - collegeSortIndex(b.code));
  if (!items.length) return null;
  return (
    <ul className="mt-3 columns-1 gap-x-8 text-xs leading-5 text-muted-foreground sm:columns-2 lg:columns-3">
      {items.map((item) => (
        <li key={item.code} className="break-inside-avoid">
          <span className="font-semibold text-navy-800">{item.abbrev}</span>
          {" — "}
          {item.name}
        </li>
      ))}
    </ul>
  );
}
