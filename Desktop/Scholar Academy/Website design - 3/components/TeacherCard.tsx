import { BookOpen, MapPin, Star } from "lucide-react";
import type { TeacherProfile } from "@/lib/types";

export default function TeacherCard({
  teacher,
  action,
}: {
  teacher: Pick<TeacherProfile, "subjects" | "classes" | "boards" | "experience_years" | "bio" | "photo_url"> & {
    profiles?: { full_name: string; area: string | null };
  };
  action?: React.ReactNode;
}) {
  const initials = (teacher.profiles?.full_name ?? "S A")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="card flex flex-col gap-4 p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-navy-900 font-display text-base font-semibold text-gold-400">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-semibold text-navy-900">
            {teacher.profiles?.full_name ?? "Scholar Academy Tutor"}
          </p>
          <p className="flex items-center gap-1 text-sm text-navy-500">
            <MapPin size={14} /> {teacher.profiles?.area || teacher.classes || "Patna"}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(teacher.subjects ?? []).slice(0, 4).map((s) => (
          <span key={s} className="rounded border border-gold-300 bg-gold-50 px-2 py-0.5 text-xs font-medium text-gold-800">
            {s}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-4 text-sm text-navy-600">
        <span className="flex items-center gap-1"><BookOpen size={14} /> {teacher.classes || "Nursery–10th"}</span>
        <span className="flex items-center gap-1"><Star size={14} /> {teacher.experience_years} yrs exp.</span>
      </div>

      {teacher.bio && <p className="line-clamp-2 text-sm text-navy-600">{teacher.bio}</p>}

      {action}
    </div>
  );
}
