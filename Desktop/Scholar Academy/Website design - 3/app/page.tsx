import Link from "next/link";
import {
  Calculator,
  FlaskConical,
  Languages,
  Landmark,
  Laptop2,
  BookOpenText,
  ShieldCheck,
  Users,
  ClipboardCheck,
  CalendarClock,
  Home as HomeIcon,
  ArrowRight,
  MessageCircle,
  Mail,
  MapPin,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import TeacherCard from "@/components/TeacherCard";

const subjects = [
  { name: "Mathematics", icon: Calculator },
  { name: "Science", icon: FlaskConical },
  { name: "English", icon: Languages },
  { name: "Social Studies", icon: Landmark },
  { name: "Hindi & Sanskrit", icon: BookOpenText },
  { name: "Computer Science", icon: Laptop2 },
];

const whyUs = [
  {
    icon: Users,
    title: "One-on-one attention",
    text: "Every session is built around your child, not a classroom of thirty.",
  },
  {
    icon: ShieldCheck,
    title: "Verified, experienced tutors",
    text: "Every tutor is screened before they're allowed to teach in your home.",
  },
  {
    icon: ClipboardCheck,
    title: "Weekly tests & progress reports",
    text: "You'll always know exactly where your child stands.",
  },
  {
    icon: CalendarClock,
    title: "2 days free demo",
    text: "Try before you commit — no pressure, no risk.",
  },
  {
    icon: HomeIcon,
    title: "Safe home environment",
    text: "Learning happens where your child is most comfortable.",
  },
];

const steps = [
  {
    n: "1",
    title: "Tell us what you need",
    text: "Class, subjects, and your area in Patna — takes under a minute.",
  },
  {
    n: "2",
    title: "We match you with verified tutors",
    text: "Browse tutor profiles or let our team suggest the right fit.",
  },
  {
    n: "3",
    title: "Start home tuition",
    text: "Begin with a free demo class, then continue if it's a good fit.",
  },
];

export default function HomePage() {
  return (
    <div>
      <Navbar />

      {/* Hero */}
      <section className="container-page grid gap-12 py-16 sm:py-20 lg:grid-cols-2 lg:items-center lg:py-28">
        <div>
          <h1 className="font-display text-4xl font-semibold leading-[1.1] text-navy-950 sm:text-5xl">
            Home tutors your child actually looks forward to.
          </h1>
          <p className="mt-5 max-w-md text-lg text-navy-600">
            Verified 1-on-1 tutors for Nursery to Class 10 — CBSE, ICSE and Olympiad prep —
            teaching at your home, anywhere in Patna.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/teachers" className="btn-primary">
              Find a tutor <ArrowRight size={16} />
            </Link>
            <Link href="/register?role=teacher" className="btn-outline">
              Teach with us
            </Link>
          </div>
          <p className="mt-6 text-sm text-navy-500">
            Serving families across Saguna More, Khagaul, Danapur, Bailey Road, Boring Road, Kankarbagh & more.
          </p>
        </div>

        <div className="mx-auto w-full max-w-sm lg:ml-auto">
          <p className="mb-2 text-xs font-medium text-navy-400">A tutor profile on Scholar Academy</p>
          <TeacherCard
            teacher={{
              subjects: ["Mathematics", "Science"],
              classes: "Class 6–10",
              boards: "CBSE",
              experience_years: 4,
              bio: "Focused on building strong fundamentals with weekly practice tests.",
              photo_url: null,
              profiles: { full_name: "Sample Tutor", area: "Boring Road" },
            }}
          />
        </div>
      </section>

      {/* Subjects */}
      <section id="subjects" className="border-y border-navy-100 bg-white py-16">
        <div className="container-page">
          <h2 className="font-display text-2xl font-semibold text-navy-950 sm:text-3xl">
            Nursery to Class 10, every core subject
          </h2>
          <p className="mt-2 max-w-lg text-navy-600">
            CBSE, ICSE and Olympiad preparation, taught by tutors who specialise in your child's exact board and class.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {subjects.map(({ name, icon: Icon }) => (
              <div key={name} className="flex items-center gap-3 rounded-md border border-navy-100 px-4 py-3.5">
                <Icon size={18} className="shrink-0 text-gold-600" />
                <span className="text-sm font-medium text-navy-800">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why us */}
      <section id="why-us" className="container-page py-16">
        <h2 className="font-display text-2xl font-semibold text-navy-950 sm:text-3xl">
          Why parents choose Scholar Academy
        </h2>
        <div className="mt-8 divide-y divide-navy-100 border-y border-navy-100">
          {whyUs.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-start gap-4 py-5">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-navy-900 text-gold-400">
                <Icon size={17} />
              </span>
              <div>
                <p className="font-medium text-navy-900">{title}</p>
                <p className="text-sm text-navy-600">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-navy-900 py-16 text-parchment">
        <div className="container-page">
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">How it works</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n}>
                <span className="font-display text-3xl font-semibold text-gold-400">{s.n}</span>
                <p className="mt-3 font-medium">{s.title}</p>
                <p className="mt-1 text-sm text-navy-200">{s.text}</p>
              </div>
            ))}
          </div>
          <Link href="/teachers" className="btn-primary mt-10">
            Browse verified tutors <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Teach with us */}
      <section id="teach" className="container-page py-16">
        <div className="card flex flex-col gap-6 border-gold-200 bg-gold-50 p-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold text-navy-950">
              Turn your knowledge into a steady income.
            </h2>
            <p className="mt-2 max-w-lg text-navy-700">
              We're hiring home tutors across Patna — pre-primary specialists, middle-school
              generalists and board-exam mentors. We handle the parent queries; you focus on teaching.
            </p>
          </div>
          <Link href="/register?role=teacher" className="btn-dark whitespace-nowrap">
            Apply to teach <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-navy-100 bg-navy-950 py-12 text-navy-300">
        <div className="container-page flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-display text-lg font-semibold text-parchment">Scholar Academy</p>
            <p className="mt-1 text-sm">Director: Rahul Kr.</p>
          </div>
          <div className="space-y-2 text-sm">
            <p className="flex items-center gap-2"><MessageCircle size={15} /> WhatsApp: +91 70618 08876</p>
            <p className="flex items-center gap-2"><Mail size={15} /> kumar956775@gmail.com</p>
            <p className="flex items-center gap-2"><MapPin size={15} /> Main Branch: Saguna More, Khagaul, Patna</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
