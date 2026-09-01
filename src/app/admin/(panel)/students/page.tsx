import { prisma } from "@/lib/db";

export default async function StudentsAdminPage() {
  const [enrollment, licensure, awards] = await Promise.all([
    prisma.enrollmentObservation.count({ where: { status: "PUBLISHED" } }),
    prisma.licensureObservation.count({ where: { status: "PUBLISHED" } }),
    prisma.studentAward.count({ where: { status: "PUBLISHED" } }),
  ]);
  return (
    <div className="card max-w-2xl p-6">
      <h1 className="text-2xl font-semibold tracking-tight text-navy-900">Student datasets</h1>
      <ul className="mt-4 space-y-2 text-sm">
        <li>Enrollment observations: {enrollment}</li>
        <li>Licensure observations: {licensure}</li>
        <li>Awards: {awards}</li>
      </ul>
    </div>
  );
}
