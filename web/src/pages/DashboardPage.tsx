import { useQuery } from "@tanstack/react-query";

import { getStats } from "../api/applications";
import {
  APPLICATION_STATUSES,
  STATUS_LABELS,
  type ApplicationStatus,
} from "../api/types";
import { StatusBadge } from "../components/StatusBadge";

export function DashboardPage() {
  const query = useQuery({
    queryKey: ["stats"],
    queryFn: getStats,
  });

  if (query.isPending) {
    return <p className="text-gray-500">Loading...</p>;
  }

  if (query.isError) {
    return (
      <p role="alert" className="text-red-600">
        Failed to load statistics: {query.error.message}
      </p>
    );
  }

  const { byStatus, perWeek, conversionRate } = query.data;

  const getCount = (status: ApplicationStatus) =>
    byStatus.find((item) => item.status === status)?.count ?? 0;

  const total = byStatus.reduce((sum, item) => sum + item.count, 0);

  const active = byStatus.reduce((sum, item) => {
    if (item.status === "rejected" || item.status === "withdrawn") {
      return sum;
    }

    return sum + item.count;
  }, 0);

  const interviews = getCount("interview") + getCount("offer");

  const maxWeeklyCount = Math.max(...perWeek.map((item) => item.count), 1);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-5 shadow">
          <p className="text-sm text-gray-500">Total</p>
          <p className="mt-2 text-3xl font-semibold">{total}</p>
        </div>

        <div className="rounded-lg bg-white p-5 shadow">
          <p className="text-sm text-gray-500">Active</p>
          <p className="mt-2 text-3xl font-semibold">{active}</p>
        </div>

        <div className="rounded-lg bg-white p-5 shadow">
          <p className="text-sm text-gray-500">Interviews</p>
          <p className="mt-2 text-3xl font-semibold">{interviews}</p>
        </div>

        <div className="rounded-lg bg-white p-5 shadow">
          <p className="text-sm text-gray-500">Conversion Rate</p>
          <p className="mt-2 text-3xl font-semibold">{conversionRate}%</p>
        </div>
      </div>

      {/* Applications per Week */}
      <section className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-6 font-semibold">Applications per Week</h2>

        {perWeek.length === 0 ? (
          <p className="text-sm text-gray-500">No weekly data available.</p>
        ) : (
          <div className="flex h-56 items-end gap-3 border-b border-gray-200 px-2">
            {perWeek.map((item) => (
              <div
                key={item.week}
                className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
              >
                <span className="text-xs text-gray-500">{item.count}</span>

                <div
                  className="w-full max-w-12 rounded-t bg-blue-500"
                  style={{
                    height: `${(item.count / maxWeeklyCount) * 100}%`,
                    minHeight: item.count > 0 ? "4px" : "0",
                  }}
                  title={`${item.count} applications`}
                />

                <span className="max-w-full truncate text-xs text-gray-500">
                  {item.week}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Applications by Status */}
      <section className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 font-semibold">Applications by Status</h2>

        <div className="divide-y">
          {APPLICATION_STATUSES.map((status) => (
            <div
              key={status}
              className="flex items-center justify-between py-3"
            >
              <div className="flex items-center gap-3">
                <StatusBadge status={status} />
                <span className="text-sm text-gray-600">
                  {STATUS_LABELS[status]}
                </span>
              </div>

              <span className="font-medium">{getCount(status)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
