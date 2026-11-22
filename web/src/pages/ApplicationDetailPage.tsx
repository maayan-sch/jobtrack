import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getApplication,
  deleteApplication,
  updateApplication,
  addEvent,
  deleteEvent,
} from "../api/applications";

import {
  APPLICATION_STATUSES,
  STATUS_LABELS,
  type ApplicationStatus,
  type EventType,
} from "../api/types";

import { StatusBadge } from "../components/StatusBadge";

export function ApplicationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [eventType, setEventType] = useState<EventType>("note");
  const [eventContent, setEventContent] = useState("");

  // Fetch application details
  const query = useQuery({
    queryKey: ["application", id],
    queryFn: () => getApplication(id!),
    enabled: Boolean(id),
  });

  // Delete application
  const deleteMutation = useMutation({
    mutationFn: () => deleteApplication(id!),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["applications"],
      });
      queryClient.invalidateQueries({
        queryKey: ["stats"],
      });

      navigate("/applications");
    },
  });

  function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this application?",
    );

    if (confirmed) {
      deleteMutation.mutate();
    }
  }

  // Change status and create timeline event
  const statusMutation = useMutation({
    mutationFn: async (newStatus: ApplicationStatus) => {
      await updateApplication(id!, {
        status: newStatus,
      });

      await addEvent(id!, {
        type: "status_change",
        content: `Moved to ${STATUS_LABELS[newStatus]}`,
      });
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["application", id],
      });
      queryClient.invalidateQueries({
        queryKey: ["applications"],
      });
      queryClient.invalidateQueries({
        queryKey: ["stats"],
      });
    },
  });

  // Delete timeline event
  const deleteEventMutation = useMutation({
    mutationFn: (eventId: string) => deleteEvent(id!, eventId),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["application", id],
      });
    },
  });

  // Add timeline event
  const addEventMutation = useMutation({
    mutationFn: () =>
      addEvent(id!, {
        type: eventType,
        content: eventContent,
      }),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["application", id],
      });

      setEventContent("");
      setEventType("note");
    },
  });

  function handleAddEvent(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!eventContent.trim()) {
      return;
    }

    addEventMutation.mutate();
  }

  // Sort events from newest to oldest
  const sortedEvents = [...(query.data?.events ?? [])].sort(
    (a, b) =>
      new Date(b.happenedAt).getTime() - new Date(a.happenedAt).getTime(),
  );

  if (!id) {
    return <p>Invalid application ID.</p>;
  }

  if (query.isPending) {
    return <p className="text-gray-500">Loading...</p>;
  }

  if (query.isError) {
    return (
      <p role="alert" className="text-red-600">
        Failed to load application: {query.error.message}
      </p>
    );
  }

  const { application } = query.data;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{application.company}</h1>
          <p className="mt-1 text-gray-500">{application.roleTitle}</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/applications/${id}/edit`)}
            className="rounded border px-4 py-2 text-sm hover:bg-gray-50"
          >
            Edit
          </button>

          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="rounded bg-red-600 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>

      {deleteMutation.isError && (
        <p role="alert" className="text-sm text-red-600">
          {deleteMutation.error.message}
        </p>
      )}

      {/* Application Details */}
      <section className="space-y-4 rounded-lg bg-white p-6 shadow">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Application Details</h2>
          <StatusBadge status={application.status} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-gray-500">Company</p>
            <p className="font-medium">{application.company}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Role</p>
            <p className="font-medium">{application.roleTitle}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Location</p>
            <p>{application.location ?? "-"}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Applied At</p>
            <p>{application.appliedAt ?? "-"}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Source</p>
            <p>{application.source ?? "-"}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Job Posting</p>
            {application.jobUrl ? (
              <a
                href={application.jobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                View Job Posting
              </a>
            ) : (
              <p>-</p>
            )}
          </div>
        </div>

        {application.notes && (
          <div className="border-t pt-4">
            <p className="mb-1 text-sm text-gray-500">Notes</p>
            <p>{application.notes}</p>
          </div>
        )}
      </section>

      {/* Quick Status Change */}
      <section className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-3 font-semibold">Change Status</h2>

        <select
          value={application.status}
          onChange={(e) =>
            statusMutation.mutate(e.target.value as ApplicationStatus)
          }
          disabled={statusMutation.isPending}
          className="w-full rounded border px-3 py-2 text-sm sm:w-64"
        >
          {APPLICATION_STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>

        {statusMutation.isPending && (
          <p className="mt-2 text-sm text-gray-500">Updating status...</p>
        )}

        {statusMutation.isError && (
          <p role="alert" className="mt-2 text-sm text-red-600">
            {statusMutation.error.message}
          </p>
        )}
      </section>

      {/* Timeline */}
      <section className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 font-semibold">Timeline</h2>

        {sortedEvents.length === 0 ? (
          <p className="text-sm text-gray-500">No events yet.</p>
        ) : (
          <div className="divide-y">
            {sortedEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"
              >
                <div className="space-y-1">
                  <p className="font-medium">{event.type}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(event.happenedAt).toLocaleString()}
                  </p>
                  <p className="text-sm">{event.content}</p>
                </div>

                <button
                  onClick={() => deleteEventMutation.mutate(event.id)}
                  disabled={deleteEventMutation.isPending}
                  className="shrink-0 text-sm text-red-600 hover:underline disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}

        {deleteEventMutation.isError && (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {deleteEventMutation.error.message}
          </p>
        )}
      </section>

      {/* Add Event */}
      <section className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 font-semibold">Add Event</h2>

        <form onSubmit={handleAddEvent} className="space-y-3">
          <label className="block text-sm">
            Event Type
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value as EventType)}
              className="mt-1 w-full rounded border px-3 py-2"
            >
              <option value="note">Note</option>
              <option value="status_change">Status Change</option>
              <option value="interview">Interview</option>
              <option value="follow_up">Follow Up</option>
            </select>
          </label>

          <label className="block text-sm">
            Content
            <textarea
              value={eventContent}
              onChange={(e) => setEventContent(e.target.value)}
              required
              placeholder="Write an event..."
              rows={3}
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </label>

          <button
            type="submit"
            disabled={addEventMutation.isPending}
            className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {addEventMutation.isPending ? "Adding..." : "Add Event"}
          </button>
        </form>

        {addEventMutation.isError && (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {addEventMutation.error.message}
          </p>
        )}
      </section>
    </div>
  );
}
