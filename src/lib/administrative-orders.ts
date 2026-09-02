export const ADMINISTRATIVE_ORDER_FOLDER_URL =
  "https://drive.google.com/drive/folders/1SD1W45k7045f9hjiVEgvoRN3eyXNlVMH";

export const ADMINISTRATIVE_ORDER_YEARS = [2026, 2025] as const;

export type AdministrativeOrder = {
  year: number;
  number: string;
  title: string;
  fileId: string;
};

export function administrativeOrderUrl(fileId: string) {
  return `https://drive.google.com/file/d/${fileId}/view`;
}

export function administrativeOrderLabel(order: Pick<AdministrativeOrder, "number">) {
  return `Administrative Order No. ${order.number}`;
}

export const ADMINISTRATIVE_ORDERS: AdministrativeOrder[] = [
  {
    year: 2026,
    number: "2026-001",
    title: "Composition, Roles, and Conduct of Executive and Management Committee Meetings",
    fileId: "1HvqS1paPL5nD3ezjdRC8YE3jqp2ecVNQ",
  },
  {
    year: 2026,
    number: "2026-002",
    title:
      "Implementation of the Deloading Scheme through Equivalent Workload Units (EWU), Effective Second Semester, Academic Year 2025-2026",
    fileId: "1WDrOcCkVmm8Zdy6ewIjw95QDlhpZQP6T",
  },
  {
    year: 2026,
    number: "2026-003",
    title:
      "Internal Guidelines for the Adoption of Memorandum Circular No. 114 Directing all Government Agencies and Instrumentalities to Strictly Adopt Energy Conservation Protocols",
    fileId: "1ct3SmJuWT58R2hTeszxdj_ZYBCcQv_lb",
  },
  {
    year: 2026,
    number: "2026-004",
    title: "Internal Operational Procedures for the Utilization of University Vehicles",
    fileId: "1bEaAsDOHrUf9S9GztRF-Fwg7knKsTyw2",
  },
  {
    year: 2026,
    number: "2026-005",
    title: "Reconstitution of the Administrative Council",
    fileId: "1DBNPNvDq2n6x5cktuxjoq2Qp31eoGYGD",
  },
  {
    year: 2026,
    number: "2026-006",
    title: "Authorizing Full and Unrestricted Access for Internal Audit Engagements",
    fileId: "1Ufk3uWFvAWVSHAJvHA2CCdmtraBo4mfy",
  },
  {
    year: 2026,
    number: "2026-007",
    title:
      "Institutional Guidelines on the Temporary Implementation of Flexible Learning Amid the Fuel and Power Crisis and in Support of the Government's Energy Conservation Measures",
    fileId: "1wkqiPsY3da-PvKh5VZCKLX79cfH2WU6U",
  },
  {
    year: 2026,
    number: "2026-008",
    title: "ParSU SAVE (Strategic Austerity and Value Efficiency) Program",
    fileId: "1RAjmAPwXXMMpdSMqCiMJKJNNeOtiC6J8",
  },
  {
    year: 2026,
    number: "2026-009",
    title: "Guidelines for Pilot Testing of Instructional Materials",
    fileId: "15tTmIvU4Y2gxXZtn9jFBksJta_a_AbQ8",
  },
  {
    year: 2026,
    number: "2026-010",
    title:
      "Operational Procedures: Delineation of Authority for Financial Transactions and Other Administrative Documents",
    fileId: "1kvsRMEZkmsqsd7AHqxi6X1SX_lMUWLss",
  },
  {
    year: 2026,
    number: "2026-011",
    title:
      "Guidelines on the Grant of Honoraria to Evaluators of Research and Extension Agency In-House Review and Regional, National, and International Conference, Symposia, and Fora",
    fileId: "1EG2H_H598x5PC0Iwm8ETK0AVi1SQ2gYD",
  },
  {
    year: 2026,
    number: "2026-013",
    title: "Institutional Guidelines on the Use of University-Owned Dormitory and Hostel Facilities for Official Visitors",
    fileId: "1ec9yimElXUoevTG_Ml-FVdZM1WeDgfNf",
  },
  {
    year: 2026,
    number: "2026-014",
    title: "Guidelines on Calibration of Laboratory Equipment and Medical Instruments",
    fileId: "1Ns4qah6eSYJ36r-75yWCX-yRdhMyvoG6",
  },
  {
    year: 2026,
    number: "2026-015",
    title: "Utilization of the Mabalodbalod Site as the Partido State University Lifelong Learning Hub",
    fileId: "1AVvHBs2uah2xUTYKKCx6Y_3HQi-cFao6",
  },
  {
    year: 2025,
    number: "2025-001",
    title:
      "Promotion of Responsible Communication and Prohibition of the Dissemination of False, Untrue, Unverified or Malicious Information",
    fileId: "1TLvp5S9BCTyFrijWFKGq4dE4JJninoN3",
  },
  {
    year: 2025,
    number: "2025-002",
    title: "Guidelines for the Release of the Medical Allowance",
    fileId: "1e_Ds8Zw2U2dZwgSHNsC0u_IsbOpVRd6z",
  },
  {
    year: 2025,
    number: "2025-003",
    title:
      "Implementing Guidelines for the Adoption of Memorandum Circular No. 16, s. 2024 (Revised Dress Code) and Grant of Uniform/Clothing Allowance",
    fileId: "1ermwDE2QK-5vYg9WVLEiCGLDOGzoL6Ry",
  },
  {
    year: 2025,
    number: "2025-004",
    title: "Internal Guidelines on the Payment of Communication Expenses to Certain University Officials and Employees",
    fileId: "1ZmGWorNuxdjTWSv2eEXcBEn5q1nkaYBI",
  },
  {
    year: 2025,
    number: "2025-005",
    title: "Implementation of the Official Working Hours for Teaching Personnel",
    fileId: "1DJUXX25aPP9lBLPX_pU0nHIevBL67agX",
  },
  {
    year: 2025,
    number: "2025-006",
    title: "Implementing Guidelines on Research Timelines and Institutional Support Mechanisms for Faculty Researchers",
    fileId: "1vS5QIJBkAhp9NvocNZtIWdMEwemX21ur",
  },
  {
    year: 2025,
    number: "2025-007",
    title:
      "Implementing Rules and Regulations (IRR) of Academic Guidelines for the Implementation of Flexible Learning as the Mode of Instruction Delivery of Undergraduate Programs at ParSU",
    fileId: "13E_e_XMcKRhay0gdtcvDuMN1TIDOcLjh",
  },
  {
    year: 2025,
    number: "2025-008",
    title: "Prohibition Against Gambling, Casinos and Related Activities",
    fileId: "1g08etCxPX2d7-Hgv8KBL-P63U2cAB69r",
  },
  {
    year: 2025,
    number: "2025-009",
    title: "Internal Guidelines Covering the Use of the Government Purchase Card (GPC)",
    fileId: "1aqb1V-mu3l_ztcEvc1Yp0ypOjVlx3bsG",
  },
  {
    year: 2025,
    number: "2025-010",
    title: "Upward and Downward Communication Protocol for Partido State University",
    fileId: "1rK_4J2vnjhoxw2zH5lnSnw4MVaIeARWJ",
  },
];

export function administrativeOrdersForYear(year: number) {
  return ADMINISTRATIVE_ORDERS.filter((order) => order.year === year);
}

export function searchAdministrativeOrders(query: string, limit = 8) {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return ADMINISTRATIVE_ORDERS.filter((order) => {
    const haystack = `${administrativeOrderLabel(order)} ${order.title}`.toLowerCase();
    return haystack.includes(needle);
  }).slice(0, limit);
}
