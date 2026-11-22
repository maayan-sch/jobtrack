import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createApplication,
  getApplication,
  updateApplication,
} from "../api/applications";
import {
  APPLICATION_STATUSES,
  STATUS_LABELS,
  type ApplicationInput,
} from "../api/types";
import { ApiError } from "../api/client";

const EMPTY: ApplicationInput = {
  company: "",
  roleTitle: "",
  status: "applied",
  source: null,
  jobUrl: null,
  location: null,
  notes: null,
  appliedAt: null,
};

export function ApplicationFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ApplicationInput>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Edit mode: load the existing application into the form once.
  const existing = useQuery({
    queryKey: ["application", id],
    queryFn: () => getApplication(id!),
    enabled: isEdit,
  });
  if (isEdit && existing.data && form === EMPTY) {
    const { application } = existing.data;
    setForm({ ...application });
  }

  const save = useMutation({
    mutationFn: (input: ApplicationInput) =>
      isEdit ? updateApplication(id!, input) : createApplication(input),
    onSuccess: ({ application }) => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.setQueryData(
        ["application", application.id],
        (old: unknown) =>
          old && typeof old === "object" ? { ...old, application } : old,
      );
      navigate(`/applications/${application.id}`);
    },
    onError: (err) => {
      if (err instanceof ApiError && err.details) {
        setFieldErrors(
          Object.fromEntries(err.details.map((d) => [d.path, d.message])),
        );
      }
    },
  });

  function set<K extends keyof ApplicationInput>(
    key: K,
    value: ApplicationInput[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    // Empty strings become null so the API stores NULL, not "".
    const cleaned = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, v === "" ? null : v]),
    ) as ApplicationInput;
    save.mutate(cleaned);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {isEdit ? "Edit Application" : "New Application"}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {isEdit
            ? "Update your application details."
            : "Add a new job application to track."}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-5 rounded-lg bg-white p-6 shadow sm:grid-cols-2"
      >
        <label className="block text-sm font-medium">
          Company <span className="text-black">*</span>
          <input
            id="company"
            value={form.company}
            onChange={(e) => set("company", e.target.value)}
            required
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 font-normal outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-300"
          />
          {fieldErrors["company"] && (
            <span className="mt-1 block text-sm text-red-600">
              {fieldErrors["company"]}
            </span>
          )}
        </label>

        <label className="block text-sm font-medium">
          Role Title <span className="text-black">*</span>
          <input
            id="roleTitle"
            value={form.roleTitle}
            onChange={(e) => set("roleTitle", e.target.value)}
            required
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 font-normal outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-300"
          />
          {fieldErrors["roleTitle"] && (
            <span className="mt-1 block text-sm text-red-600">
              {fieldErrors["roleTitle"]}
            </span>
          )}
        </label>

        <label className="block text-sm font-medium">
          Status
          <select
            id="status"
            value={form.status}
            onChange={(e) =>
              set("status", e.target.value as ApplicationInput["status"])
            }
            className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-normal outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-300"
          >
            {APPLICATION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
          {fieldErrors["status"] && (
            <span className="mt-1 block text-sm text-red-600">
              {fieldErrors["status"]}
            </span>
          )}
        </label>

        <label className="block text-sm font-medium">
          Source
          <input
            id="source"
            value={form.source ?? ""}
            onChange={(e) => set("source", e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 font-normal outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-300"
          />
          {fieldErrors["source"] && (
            <span className="mt-1 block text-sm text-red-600">
              {fieldErrors["source"]}
            </span>
          )}
        </label>

        <label className="block text-sm font-medium">
          Job URL
          <input
            id="jobUrl"
            type="url"
            value={form.jobUrl ?? ""}
            onChange={(e) => set("jobUrl", e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 font-normal outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-300"
          />
          {fieldErrors["jobUrl"] && (
            <span className="mt-1 block text-sm text-red-600">
              {fieldErrors["jobUrl"]}
            </span>
          )}
        </label>

        <label className="block text-sm font-medium">
          Location
          <input
            id="location"
            value={form.location ?? ""}
            onChange={(e) => set("location", e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 font-normal outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-300"
          />
          {fieldErrors["location"] && (
            <span className="mt-1 block text-sm text-red-600">
              {fieldErrors["location"]}
            </span>
          )}
        </label>

        <label className="block text-sm font-medium">
          Applied At
          <input
            id="appliedAt"
            type="date"
            value={form.appliedAt ?? ""}
            onChange={(e) => set("appliedAt", e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 font-normal outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-300"
          />
          {fieldErrors["appliedAt"] && (
            <span className="mt-1 block text-sm text-red-600">
              {fieldErrors["appliedAt"]}
            </span>
          )}
        </label>

        <label className="block text-sm font-medium sm:col-span-2">
          Notes
          <textarea
            id="notes"
            value={form.notes ?? ""}
            onChange={(e) => set("notes", e.target.value)}
            rows={4}
            className="mt-1 w-full resize-y rounded-md border border-gray-300 px-3 py-2 font-normal outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-300"
          />
          {fieldErrors["notes"] && (
            <span className="mt-1 block text-sm text-red-600">
              {fieldErrors["notes"]}
            </span>
          )}
        </label>

        {save.isError && (
          <p role="alert" className="text-sm text-red-600 sm:col-span-2">
            {save.error.message}
          </p>
        )}

        <div className="flex justify-end gap-3 sm:col-span-2">
          <button
            type="button"
            onClick={() => navigate("/applications")}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={save.isPending}
            className="rounded-md bg-black px-5 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {save.isPending
              ? "Saving..."
              : isEdit
                ? "Update Application"
                : "Create Application"}
          </button>
        </div>
      </form>
    </div>
  );
}
