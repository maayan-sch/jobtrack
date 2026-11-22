import { Link, useSearchParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { listApplications } from "../api/applications";
import { APPLICATION_STATUSES, STATUS_LABELS } from "../api/types";
import { StatusBadge } from "../components/StatusBadge";

export function ApplicationsPage() {
  const [params, setParams] = useSearchParams();
  const status = params.get("status") ?? "";
  const search = params.get("search") ?? "";
  const page = Number(params.get("page") ?? "1");
  const limit = 20;

  const query = useQuery({
    queryKey: ["applications", { status, search, page, limit }],
    queryFn: () => listApplications({ status, search, page, limit }),
    placeholderData: (prev) => prev,
  });

  function update(next: Record<string, string>) {
    const merged = new URLSearchParams(params);
    for (const [key, value] of Object.entries(next)) {
      if (value) merged.set(key, value);
      else merged.delete(key);
    }
    if (!("page" in next)) merged.delete("page");
    setParams(merged);
  }

  const totalPages = query.data
    ? Math.max(1, Math.ceil(query.data.total / limit))
    : 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Applications</h1>
        <Link
          to="/applications/new"
          className="rounded bg-black px-4 py-2 text-sm text-white"
        >
          New application
        </Link>
      </div>

      <div className="flex gap-3">
        <input
          placeholder="Search company or role"
          defaultValue={search}
          onKeyDown={(e) =>
            e.key === "Enter" && update({ search: e.currentTarget.value })
          }
          className="w-64 rounded border px-3 py-2 text-sm"
        />
        <select
          value={status}
          onChange={(e) => update({ status: e.target.value })}
          className="rounded border px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {APPLICATION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {query.isPending && <p className="text-gray-500">Loading...</p>}
      {query.isError && (
        <p role="alert" className="text-red-600">
          Failed to load: {query.error.message}
        </p>
      )}

      {query.data && (
        <>
          <table className="w-full rounded-lg bg-white text-sm shadow">
            <thead className="text-left text-gray-500">
              <tr>
                <th className="p-3">Company</th>
                <th className="p-3">Role</th>
                <th className="p-3">Status</th>
                <th className="p-3">Applied</th>
              </tr>
            </thead>
            <tbody>
              {query.data.items.map((a) => (
                <tr key={a.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">
                    <Link
                      to={`/applications/${a.id}`}
                      className="font-medium hover:underline"
                    >
                      {a.company}
                    </Link>
                  </td>
                  <td className="p-3">{a.roleTitle}</td>
                  <td className="p-3">
                    <StatusBadge status={a.status} />
                  </td>
                  <td className="p-3 text-gray-500">{a.appliedAt ?? "-"}</td>
                </tr>
              ))}
              {query.data.items.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-gray-500">
                    No applications yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{query.data.total} total</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => update({ page: String(page - 1) })}
                className="rounded border px-3 py-1 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="px-2 py-1">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => update({ page: String(page + 1) })}
                className="rounded border px-3 py-1 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
