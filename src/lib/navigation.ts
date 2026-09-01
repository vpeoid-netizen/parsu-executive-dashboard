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
];

export const adminNavigation: NavItem[] = [
  { href: "/admin", label: "Overview" },
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
