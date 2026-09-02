import { describe, expect, it } from "vitest";
import {
  collegeAbbrev,
  collegeFullName,
  matchCampus,
  matchCollege,
  normalizeAcademicRank,
} from "../src/lib/import/normalize";

describe("name normalization", () => {
  it("maps campus and college aliases without inventing new units", () => {
    expect(matchCampus("Sagñay Campus")).toBe("SAGNAY");
    expect(matchCollege("College of Business & Management")).toBe("CBM");
    expect(matchCollege("College of Management and Tourism")).toBe("CHTM");
    expect(matchCollege("Unknown Faculty of Magic")).toBeNull();
  });

  it("maps official college abbreviations to internal codes", () => {
    expect(matchCollege("CEC")).toBe("CECS");
    expect(matchCollege("SAL")).toBe("CACD");
    expect(matchCollege("TIN")).toBe("CESD");
    expect(matchCollege("SAG")).toBe("CFMS");
    expect(matchCollege("SAN")).toBe("CHTM");
    expect(matchCollege("LAG")).toBe("CPSCH");
    expect(matchCollege("CAR")).toBe("CSCE");
    expect(matchCollege("College of Science")).toBe("COS");
    expect(matchCollege("College of Engineering and Computational Science")).toBe("CECS");
    expect(matchCollege("College of Sustainable Communities and Ecosystem")).toBe("CSCE");
  });

  it("does not treat CEC as the Caramoan college", () => {
    expect(matchCollege("Caramoan")).toBeNull();
    expect(collegeAbbrev("CECS")).toBe("CEC");
    expect(collegeAbbrev("CSCE")).toBe("CAR");
    expect(collegeAbbrev("CPSCH")).toBe("LAG");
    expect(collegeAbbrev("CFMS")).toBe("SAG");
    expect(collegeAbbrev("CACD")).toBe("SAL");
    expect(collegeAbbrev("CHTM")).toBe("SAN");
    expect(collegeAbbrev("CESD")).toBe("TIN");
    expect(collegeFullName("COS")).toBe("College of Science");
    expect(collegeFullName("CECS")).toBe("College of Engineering and Computational Science");
    expect(collegeFullName("CSCE")).toBe("College of Sustainable Communities and Ecosystem");
  });

  it("collapses faculty rank variants into academic rank groups", () => {
    expect(normalizeAcademicRank("Assistant Professor IV")).toBe("Assistant Professor");
    expect(normalizeAcademicRank("Associate Professor II")).toBe("Associate Professor");
    expect(normalizeAcademicRank("Instructor I (T)")).toBe("Instructor");
    expect(normalizeAcademicRank("Professor VI")).toBe("Professor");
    expect(normalizeAcademicRank("University Professor")).toBe("University Professor");
    expect(normalizeAcademicRank("Retired")).toBe("Others");
  });
});
