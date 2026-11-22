export interface User {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
}

export const APPLICATION_STATUSES = [
  "wishlist",
  "applied",
  "phone_screen",
  "interview",
  "offer",
  "rejected",
  "withdrawn",
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  wishlist: "Wishlist",
  applied: "Applied",
  phone_screen: "Phone screen",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export interface Application {
  id: string;
  company: string;
  roleTitle: string;
  status: ApplicationStatus;
  source: string | null;
  jobUrl: string | null;
  location: string | null;
  notes: string | null;
  appliedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ApplicationInput = Omit<
  Application,
  "id" | "createdAt" | "updatedAt"
>;

export type EventType = "note" | "status_change" | "interview" | "follow_up";

export interface ApplicationEvent {
  id: string;
  applicationId: string;
  type: EventType;
  content: string;
  happenedAt: string;
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface Stats {
  byStatus: { status: ApplicationStatus; count: number }[];
  perWeek: { week: string; count: number }[];
  conversionRate: number;
}
