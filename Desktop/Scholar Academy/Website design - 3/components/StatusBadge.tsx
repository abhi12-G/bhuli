const styles: Record<string, string> = {
  active: "bg-green-50 text-green-700 border-green-200",
  verified: "bg-green-50 text-green-700 border-green-200",
  matched: "bg-green-50 text-green-700 border-green-200",
  pending_review: "bg-amber-50 text-amber-700 border-amber-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  open: "bg-amber-50 text-amber-700 border-amber-200",
  pending_payment: "bg-navy-50 text-navy-600 border-navy-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  closed: "bg-navy-50 text-navy-500 border-navy-200",
};

const labels: Record<string, string> = {
  active: "Active",
  verified: "Verified",
  matched: "Matched",
  pending_review: "Pending review",
  pending: "Pending",
  open: "Open",
  pending_payment: "Payment pending",
  rejected: "Rejected",
  closed: "Closed",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? "border-navy-200 text-navy-600"}`}>
      {labels[status] ?? status}
    </span>
  );
}
