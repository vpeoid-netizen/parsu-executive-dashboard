export const UNIVERSITY_NAME = "Partido State University";
export const DASHBOARD_NAME = "Executive Dashboard";
export const DATA_SOURCE_LABEL =
  "Source: Partido State University institutional records";

export const CAMPUSES = [
  { code: "GOA", name: "Goa Campus", aliases: ["goa", "goa campus"] },
  {
    code: "CARAMOAN",
    name: "Caramoan Campus",
    aliases: ["caramoan", "caramoan campus"],
  },
  {
    code: "LAGONOY",
    name: "Lagonoy Campus",
    aliases: ["lagonoy", "lagonoy campus"],
  },
  {
    code: "SAGNAY",
    name: "Sagnay Campus",
    aliases: ["sagnay", "sagñay", "sagnay campus", "sagñay campus"],
  },
  {
    code: "SALOGON",
    name: "Salogon Campus",
    aliases: ["salogon", "salogon campus"],
  },
  {
    code: "SAN_JOSE",
    name: "San Jose Campus",
    aliases: ["san jose", "san jose campus"],
  },
  {
    code: "TINAMBAC",
    name: "Tinambac Campus",
    aliases: ["tinambac", "tinambac campus"],
  },
] as const;

export const COLLEGES = [
  {
    code: "CAH",
    abbrev: "CAH",
    name: "College of Arts and Humanities",
    aliases: ["college of arts and humanities"],
  },
  {
    code: "CBM",
    abbrev: "CBM",
    name: "College of Business and Management",
    aliases: [
      "college of business and management",
      "college of business & management",
    ],
  },
  {
    code: "COS",
    abbrev: "COS",
    name: "College of Science",
    aliases: ["college of science", "college of sciences", "cae"],
  },
  {
    code: "CED",
    abbrev: "CED",
    name: "College of Education",
    aliases: ["college of education"],
  },
  {
    code: "CECS",
    abbrev: "CEC",
    name: "College of Engineering and Computational Science",
    aliases: [
      "cec",
      "college of engineering and computational science",
      "college of engineering and computational sciences",
      "college of engineering & computational science",
      "college of engineering & computational sciences",
    ],
  },
  {
    code: "CACD",
    abbrev: "SAL",
    name: "College of Agribusiness and Community Development",
    aliases: ["sal", "college of agribusiness and community development"],
  },
  {
    code: "CESD",
    abbrev: "TIN",
    name: "College of Environmental Science and Design",
    aliases: ["tin", "college of environmental science and design"],
  },
  {
    code: "CFMS",
    abbrev: "SAG",
    name: "College of Fisheries and Marine Science",
    aliases: [
      "sag",
      "college of fisheries and marine science",
      "college of fisheries and marine sciences",
    ],
  },
  {
    code: "CHTM",
    abbrev: "SAN",
    name: "College of Hospitality and Tourism Management",
    aliases: [
      "san",
      "college of hospitality and tourism management",
      "college of management and tourism",
    ],
  },
  {
    code: "CPSCH",
    abbrev: "LAG",
    name: "College of Public Safety and Community Health",
    aliases: ["lag", "college of public safety and community health"],
  },
  {
    code: "CSCE",
    abbrev: "CAR",
    name: "College of Sustainable Communities and Ecosystem",
    aliases: [
      "car",
      "college of sustainable communities and ecosystem",
      "college of sustainable communities and ecosystems",
    ],
  },
] as const;

export const ACADEMIC_RANKS = [
  { code: "INSTRUCTOR", name: "Instructor" },
  { code: "ASSISTANT_PROFESSOR", name: "Assistant Professor" },
  { code: "ASSOCIATE_PROFESSOR", name: "Associate Professor" },
  { code: "PROFESSOR", name: "Professor" },
  { code: "UNIVERSITY_PROFESSOR", name: "University Professor" },
] as const;

export const FACULTY_APPOINTMENTS = [
  { code: "PERMANENT", name: "Permanent" },
  { code: "TEMPORARY", name: "Temporary" },
  { code: "COS", name: "COS" },
] as const;

export const EDUCATION_LEVELS = [
  { code: "BACHELORS", name: "Bachelor's Degree" },
  { code: "MASTERS", name: "Master's Degree" },
  { code: "DOCTORATE", name: "Doctorate Degree" },
] as const;

export const STAFF_APPOINTMENTS = [
  { code: "PERMANENT", name: "Permanent" },
  { code: "CASUAL", name: "Casual" },
  { code: "JOB_ORDER", name: "Job Order" },
] as const;

export const STAFF_RANKS = [
  { code: "AIDE", name: "Aide" },
  { code: "ASSISTANT", name: "Assistant" },
  { code: "OFFICER", name: "Officer" },
  { code: "SUPERVISING", name: "Supervising" },
  { code: "CHIEF", name: "Chief" },
] as const;

export const KPI_STATUS_THRESHOLDS = {
  aboveTarget: 1.02,
  achieved: 1,
  nearTarget: 0.9,
};

export const SESSION_COOKIE = "parsu_admin_session";
export const SESSION_HOURS = 8;
export const LOGIN_WINDOW_MINUTES = 15;
export const LOGIN_MAX_ATTEMPTS = 5;
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export const DOCUMENT_CATEGORIES = [
  "Administrative Orders",
  "Strategic Plan",
  "Organizational Structure",
  "Board Resolutions",
  "Policies",
  "Reports",
  "Other",
] as const;

export const PUBLIC_DOCUMENTS = [
  {
    title: "BOR Approved Strategic Plan",
    category: "Strategic Plan",
    externalUrl: "https://drive.google.com/file/d/1QLdyuHs-iN0Wy3kbWUWVhUusuoxQ-cLP/view",
  },
  {
    title: "FY 2025 Annual Report",
    category: "Reports",
    externalUrl: "https://drive.google.com/file/d/1qU6mWYgq_xozveuZLABcELYPQQ6KLqAo/view",
  },
] as const;
