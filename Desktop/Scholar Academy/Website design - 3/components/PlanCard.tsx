import { Check } from "lucide-react";
import type { Plan } from "@/lib/types";

const cycleLabel: Record<Plan["billing_cycle"], string> = {
  one_time: "one-time",
  monthly: "/month",
  yearly: "/year",
};

export default function PlanCard({
  plan,
  selected,
  onSelect,
}: {
  plan: Plan;
  selected?: boolean;
  onSelect?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-lg border p-5 text-left transition-colors ${
        selected ? "border-gold-500 bg-gold-50 ring-1 ring-gold-500" : "border-navy-100 bg-white hover:border-navy-300"
      }`}
    >
      <p className="font-display text-lg font-semibold text-navy-950">{plan.name}</p>
      <p className="mt-1">
        <span className="text-2xl font-semibold text-navy-900">₹{plan.price}</span>{" "}
        <span className="text-sm text-navy-500">{cycleLabel[plan.billing_cycle]}</span>
      </p>
      {plan.description && <p className="mt-2 text-sm text-navy-600">{plan.description}</p>}
      <ul className="mt-3 space-y-1.5">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-navy-700">
            <Check size={15} className="mt-0.5 shrink-0 text-gold-600" /> {f}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-navy-400">{plan.commission_percent}% commission on tuitions from this plan</p>
    </button>
  );
}
