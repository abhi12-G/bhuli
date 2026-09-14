# Scholar Academy — Home Tuition Platform

A web platform for a home-tuition business: teachers register and pick a paid
plan, parents browse and request tutors, and you (the admin) approve teachers,
verify UPI payments, and manage tuition requests — all from one dashboard.

**Stack:** Next.js 14 (App Router) + Tailwind CSS + Supabase (Postgres, Auth,
Storage). Deploys free on Vercel, database free on Supabase's free tier.

---

## 1. What's included

| Who | Can do |
|---|---|
| **Parent** | Sign up, browse verified tutors (search by subject/class/area), send a request to a specific tutor, or post an open request and let you match one. Track request status. |
| **Teacher** | Sign up, fill profile (subjects, classes, boards, experience, bio), choose a plan, pay by UPI, submit the transaction reference (UTR) + screenshot for verification. See profile status and incoming parent requests. |
| **Admin (you)** | Approve/reject teacher profiles, verify/reject UPI payments (verifying a payment auto-activates that teacher's listing), assign a tutor to an open parent request, and add/edit/deactivate plans and your UPI ID/QR — no code changes needed. |

Payment is **manual UPI verification**, exactly as you asked: a teacher pays
your UPI ID, types in the transaction reference number (and can attach a
screenshot), and it sits as "Pending" in your Admin → Payments tab until you
tap **Verify**.

## 2. One-time setup

### a) Create a free Supabase project
1. Go to [supabase.com](https://supabase.com) → New project. Pick any name/region, save your database password somewhere safe.
2. Once it's ready, open **SQL Editor** → New query, paste the entire contents of `supabase/schema.sql` from this project, and click **Run**. This creates all tables, security rules, starter plans, and a storage bucket for screenshots/QR codes in one go.
3. Go to **Project Settings → API**. You'll need the **Project URL** and the **anon public key** in the next step.
4. Go to **Authentication → Providers → Email** and, for faster testing, turn **off** "Confirm email" (you can turn it back on later for production — it just means teachers/parents won't need to click an email link before logging in).

### b) Configure the project locally
```bash
npm install
cp .env.local.example .env.local
```
Open `.env.local` and paste in your Project URL and anon key from step (a3).

```bash
npm run dev
```
Visit `http://localhost:3000`.

### c) Make yourself the admin
Sign up normally on the site (as a parent or teacher, doesn't matter). Then
in Supabase → **SQL Editor**, run:
```sql
update public.profiles set role = 'admin' where email = 'your@email.com';
```
Log out and back in — you'll now land on `/admin/dashboard`. Do this for
Rahul's account too if he needs admin access.

### d) Add your real UPI ID
Log in as admin → **Plans & UPI** tab → fill in your real UPI ID (and
optionally upload a QR code image) → Save. This is what teachers will see on
the payment screen — right now it shows a placeholder.

## 3. Deploy (GitHub + Vercel, same as your library project)
1. Push this folder to a new GitHub repo.
2. On [vercel.com](https://vercel.com) → **Add New Project** → import that repo.
3. Under **Environment Variables**, add the same two keys from your `.env.local`
   (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
4. Deploy. Vercel gives you a live `https://...vercel.app` URL — put that in
   your marketing flyer / WhatsApp instead of "coming soon".

## 4. How the core flows work

**Teacher onboarding → payment → going live:**
`/register` (role: teacher) → `/teacher/onboarding` (profile + pick a plan) →
`/teacher/payment` (pay your UPI ID, submit UTR) → status is `pending_review`
→ you verify the payment in Admin → teacher flips to `active` and now shows
up in the public `/teachers` directory.

**Parent → request → match:**
`/register` (role: parent) → browse `/teachers` and request a specific tutor,
**or** post an open request from their dashboard → you (or the tutor
directly) can act on it. Admin → Requests lets you manually assign any active
tutor to an open request.

## 5. Before you take real money and real user data live

This is a solid working v1, but a few things are worth doing before you rely
on it for actual business:
- **Re-enable "Confirm email"** in Supabase Auth so people can't sign up with
  someone else's email address.
- **Keep dependencies updated** — run `npm audit` occasionally and update
  Next.js when patches come out; I've already bumped it to the latest patched
  14.x release to close a known vulnerability.
- **Backups**: Supabase's free tier doesn't include automatic backups —
  consider their paid tier or exporting your database periodically once you
  have real users.
- **Fraud check**: I've added a database rule that blocks the same UPI
  transaction ID (UTR) from being submitted twice, but do glance at the
  screenshot before hitting Verify.
- Right now any parent request can be assigned to *any* active teacher from
  the admin panel — there's no automatic area/subject matching yet. Fine to
  do by hand at your current scale; worth automating later if volume grows.

## 6. Project structure
```
app/                  → pages (App Router)
  admin/               → your dashboard (teachers, payments, requests, plans)
  teacher/             → onboarding, payment, dashboard
  parent/              → dashboard
  teachers/             → public tutor directory
components/            → shared UI (Navbar, TeacherCard, PlanCard, ...)
lib/supabase/          → Supabase client setup (browser + server)
supabase/schema.sql    → run this once in Supabase SQL Editor
```

Want help adding anything next — WhatsApp notifications when a payment comes
in, an area-based auto-match for requests, a referral system — just ask.
