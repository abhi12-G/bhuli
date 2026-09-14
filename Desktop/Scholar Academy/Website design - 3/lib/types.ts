export type Role = "teacher" | "parent" | "admin";

export type Profile = {
  id: string;
  role: Role;
  full_name: string;
  phone: string | null;
  email: string | null;
  area: string | null;
  created_at: string;
};

export type Plan = {
  id: string;
  name: string;
  price: number;
  commission_percent: number;
  billing_cycle: "one_time" | "monthly" | "yearly";
  description: string | null;
  features: string[];
  is_active: boolean;
  sort_order: number;
};

export type TeacherStatus = "pending_payment" | "pending_review" | "active" | "rejected";

export type TeacherProfile = {
  id: string;
  subjects: string[];
  classes: string;
  boards: string;
  experience_years: number;
  bio: string | null;
  photo_url: string | null;
  plan_id: string | null;
  status: TeacherStatus;
  admin_note: string | null;
  profiles?: Profile;
  plans?: Plan;
};

export type PaymentStatus = "pending" | "verified" | "rejected";

export type Payment = {
  id: string;
  user_id: string;
  plan_id: string | null;
  amount: number;
  utr_reference: string;
  screenshot_url: string | null;
  status: PaymentStatus;
  admin_note: string | null;
  created_at: string;
  verified_at: string | null;
  profiles?: Profile;
  plans?: Plan;
};

export type RequestStatus = "open" | "matched" | "closed";

export type TuitionRequest = {
  id: string;
  parent_id: string;
  teacher_id: string | null;
  student_class: string;
  subjects: string;
  area: string;
  notes: string | null;
  status: RequestStatus;
  created_at: string;
  profiles?: Profile;
  teacher_profiles?: TeacherProfile;
};
