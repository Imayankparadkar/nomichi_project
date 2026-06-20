export type TripStatus = "open" | "closed";

export type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "QUALIFIED"
  | "VIBE_CHECK_SENT"
  | "CONFIRMED"
  | "NOT_A_FIT";

export type GroupType = "solo" | "friends" | "couple" | "family";

export interface Trip {
  id: string;
  name: string;
  destination: string;
  start_date: string;
  end_date: string;
  price_gst: number;
  total_seats: number;
  seats_available: number;
  status: TripStatus;
  description: string;
  created_at: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  trip_id: string;
  trip?: Trip;
  group_type: GroupType;
  preferred_month: string;
  vibe_text: string;
  status: LeadStatus;
  owner_id: string | null;
  owner?: Profile;
  created_at: string;
  updated_at: string;
}

export interface CallLog {
  id: string;
  lead_id: string;
  note: string;
  next_action: string | null;
  created_by: string;
  created_by_profile?: Profile;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: "admin" | "associate";
  created_at: string;
}

export const LEAD_STATUSES: LeadStatus[] = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "VIBE_CHECK_SENT",
  "CONFIRMED",
  "NOT_A_FIT",
];

export const GROUP_TYPES: { value: GroupType; label: string }[] = [
  { value: "solo", label: "Solo" },
  { value: "friends", label: "Friends" },
  { value: "couple", label: "Couple" },
  { value: "family", label: "Family" },
];

export const STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  VIBE_CHECK_SENT: "Vibe Check Sent",
  CONFIRMED: "Confirmed",
  NOT_A_FIT: "Not a Fit",
};

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
