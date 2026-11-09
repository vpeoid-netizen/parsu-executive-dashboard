export type NavItem = {
  href: string;
  label: string;
  children?: { href: string; label: string }[];
};

export const publicNavigation: NavItem[] = [
  { href: "/", label: "Dashboard" },
  {
    href: "/about",
    label: "About ParSU",
    children: [
      { href: "/about", label: "Overview" },
      { href: "/about/history", label: "History" },
      { href: "/about/vision-mission-core-values", label: "Vision, Mission & Core Values" },
      { href: "/about/campuses", label: "Campuses" },
      { href: "/about/colleges", label: "Colleges" },
      { href: "/about/officials", label: "University Officials" },
    ],
  },
  { href: "/academics/programs", label: "Academics" },
  {
    href: "/personnel",
    label: "Personnel",
    children: [
      { href: "/personnel/faculty", label: "Faculty Members" },
      { href: "/personnel/non-teaching", label: "Non-Teaching Personnel" },
    ],
  },
  {
    href: "/students",
    label: "Students",
    children: [
      { href: "/students/enrollment", label: "Enrollment" },
      { href: "/students/licensure", label: "Licensure Examinations" },
      { href: "/students/awards", label: "Awards" },
    ],
  },
  { href: "/performance", label: "Performance" },
  {
    href: "/research",
    label: "Research",
    children: [
      { href: "/research/completed", label: "Completed Research" },
      { href: "/research/publications", label: "Publications" },
      { href: "/research/utilization", label: "Utilization" },
      { href: "/research/grants", label: "Approved Grants" },
    ],
  },
  { href: "/extension", label: "Extension" },
  {
    href: "/documents",
    label: "Documents",
    children: [
      { href: "/documents/administrative-orders", label: "Administrative Orders" },
      { href: "/documents", label: "Institutional Documents" },
    ],
  },
];

export const adminDataModules = [
  { href: "/admin/programs", title: "Academic programs", description: "Program names, campus, COPC, and accreditation" },
  { href: "/admin/faculty", title: "Faculty", description: "Headcount by college, rank, and appointment" },
  { href: "/admin/staff", title: "Non-teaching personnel", description: "Office, unit, and appointment counts" },
  { href: "/admin/students", title: "Students", description: "Enrollment, licensure, awards, and employability" },
  { href: "/admin/performance", title: "Performance", description: "MFO indicators and accomplishments" },
  { href: "/admin/research", title: "Research", description: "Completed work, publications, utilization, and grants" },
  { href: "/admin/extension", title: "Extension", description: "BOR-approved programs and partners" },
  { href: "/admin/assets", title: "Physical assets", description: "Land, buildings, laboratories, accommodations, and vehicles" },
  { href: "/admin/infrastructure", title: "Infrastructure", description: "Projects, status, and accomplishment" },
  { href: "/admin/budget", title: "Budget", description: "Fiscal year allotments and obligations" },
  { href: "/admin/internationalization", title: "Internationalization", description: "Partners and memberships" },
  { href: "/admin/content", title: "Content", description: "About pages and flagship programs" },
  { href: "/admin/documents", title: "Documents", description: "Public documents and orders" },
  { href: "/admin/officials", title: "Officials", description: "University officials directory" },
  { href: "/admin/import", title: "Import workbook", description: "Upload a full Excel or CSV dataset" },
  { href: "/admin/audit", title: "Audit log", description: "Who changed what, and when" },
] as const;

export const adminNavigation: NavItem[] = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/account", label: "Account" },
  { href: "/admin/import", label: "Import datasets" },
  { href: "/admin/programs", label: "Academic programs" },
  { href: "/admin/faculty", label: "Faculty" },
  { href: "/admin/staff", label: "Non-teaching" },
  { href: "/admin/students", label: "Students" },
  { href: "/admin/performance", label: "Performance" },
  { href: "/admin/research", label: "Research" },
  { href: "/admin/extension", label: "Extension" },
  { href: "/admin/assets", label: "Assets" },
  { href: "/admin/infrastructure", label: "Infrastructure" },
  { href: "/admin/budget", label: "Budget" },
  { href: "/admin/internationalization", label: "Internationalization" },
  { href: "/admin/content", label: "Content" },
  { href: "/admin/documents", label: "Documents" },
  { href: "/admin/officials", label: "Officials" },
  { href: "/admin/audit", label: "Audit log" },
];
