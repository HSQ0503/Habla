import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { CriterionBars } from "@/components/dashboard/DashboardCharts";

function themeLabel(theme: string) {
  return theme
    .split("_")
    .map((w) => w[0] + w.slice(1).toLowerCase())
    .join(" ");
}

function themeBadgeColor(theme: string) {
  const colors: Record<string, string> = {
    IDENTITIES: "bg-blue-50 text-blue-700",
    EXPERIENCES: "bg-purple-50 text-purple-700",
    HUMAN_INGENUITY: "bg-amber-50 text-amber-700",
    SOCIAL_ORGANIZATION: "bg-green-50 text-green-700",
    SHARING_THE_PLANET: "bg-teal-50 text-teal-700",
  };
  return colors[theme] || "bg-gray-50 text-gray-700";
}

export default async function TeacherDashboard() {
  const session = await getServerSession(authOptions);
  const teacherId = session!.user.id;

  const teacherClass = await db.class.findFirst({
    where: { teacherId },
    select: { id: true },
  });

  const classFilter = teacherClass
    ? { user: { classId: teacherClass.id } }
    : { userId: "__none__" };

  const [imageCount, studentCount, sessionCount, scoreAgg, recentSessions] = await Promise.all([
    db.image.count(),
    teacherClass
      ? db.user.count({ where: { role: "STUDENT", classId: teacherClass.id } })
      : 0,
    db.session.count({ where: classFilter }),
    teacherClass
      ? db.session.aggregate({
          where: { ...classFilter, status: "COMPLETED", scoreA: { not: null } },
          _avg: { scoreA: true, scoreB1: true, scoreB2: true, scoreC: true },
        })
      : null,
    teacherClass
      ? db.session.findMany({
          where: { ...classFilter, status: "COMPLETED", scoreA: { not: null } },
          include: {
            user: { select: { id: true, name: true } },
            image: { select: { theme: true } },
          },
          orderBy: { completedAt: "desc" },
          take: 10,
        })
      : [],
  ]);

  const classAvg =
    scoreAgg?._avg?.scoreA != null
      ? Math.round(
          ((scoreAgg._avg.scoreA || 0) +
            (scoreAgg._avg.scoreB1 || 0) +
            (scoreAgg._avg.scoreB2 || 0) +
            (scoreAgg._avg.scoreC || 0)) *
            10
        ) / 10
      : null;

  const criterionAvgs = scoreAgg?._avg?.scoreA != null
    ? {
        A: Math.round((scoreAgg._avg.scoreA || 0) * 10) / 10,
        B1: Math.round((scoreAgg._avg.scoreB1 || 0) * 10) / 10,
        B2: Math.round((scoreAgg._avg.scoreB2 || 0) * 10) / 10,
        C: Math.round((scoreAgg._avg.scoreC || 0) * 10) / 10,
      }
    : null;

  const stats = [
    {
      label: "Images in Library",
      value: imageCount,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
        </svg>
      ),
      color: "text-indigo-600 bg-indigo-50",
    },
    {
      label: "Students Enrolled",
      value: studentCount,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
        </svg>
      ),
      color: "text-green-600 bg-green-50",
    },
    {
      label: "Practice Sessions",
      value: sessionCount,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
        </svg>
      ),
      color: "text-purple-600 bg-purple-50",
    },
    {
      label: "Class Average Score",
      value: classAvg !== null ? `${classAvg}/30` : "—",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
        </svg>
      ),
      color: "text-amber-600 bg-amber-50",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          Welcome back, {session?.user?.name?.split(" ").pop()}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Here&apos;s an overview of your classroom activity.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-gray-200 p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg ${stat.color}`}>
                {stat.icon}
              </div>
            </div>
            <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/teacher/images"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
            </svg>
            Manage Images
          </Link>
          <Link
            href="/teacher/class"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
            </svg>
            View Class
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
          Recent Activity
        </h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {recentSessions.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-gray-500">No practice sessions yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentSessions.map((s) => {
                const total = (s.scoreA || 0) + (s.scoreB1 || 0) + (s.scoreB2 || 0) + (s.scoreC || 0);
                return (
                  <Link
                    key={s.id}
                    href={`/teacher/students/${s.user.id}/sessions/${s.id}`}
                    className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-900">{s.user.name}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${themeBadgeColor(s.image.theme)}`}>
                        {themeLabel(s.image.theme)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-semibold text-gray-900">{total}/30</span>
                      <span className="text-xs text-gray-400">
                        {s.completedAt ? new Date(s.completedAt).toLocaleDateString() : ""}
                      </span>
                      <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                      </svg>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Class Performance */}
      {criterionAvgs && <CriterionBars avgs={criterionAvgs} />}
    </div>
  );
}
