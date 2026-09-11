# AI Support Desk

An AI-powered customer support application built with **Next.js 14 (App Router)**, **Tailwind CSS**, **Supabase (Postgres + RLS)**, and **OpenAI** via `openai` SDK (`gpt-4o-mini`).

Designed for single-call customer triage and draft reply generation with structured JSON outputs, bulletproof resilience, and a full agent management dashboard.

---

## 🌟 Key Features

1. **Instant Support Form (`/`)**:
   - Customers submit name, email, subject, and message.
   - Ticket is saved to Supabase immediately in `pending` state.
   - OpenAI drafts a polite customer reply and triages the issue in **one single API call** using `{ response_format: { type: "json_object" } }`.
   - Reply displays inline immediately after submission.

2. **Support Agent Dashboard (`/dashboard`)**:
   - Metrics summary (Total, Pending, AI Responded, Resolved, High Urgency).
   - Status filters (**Pending**, **AI Responded**, **Resolved**) & live search.
   - Expandable rows displaying:
     - Original customer message
     - Internal AI triage summary
     - OpenAI draft reply
     - Urgency badge (Low / Medium / High) & Category tag
   - **Mark Resolved** toggle button.

3. **Advanced AI Automation Triad**:
   - Single OpenAI call returns structured JSON: `{ reply, category, urgency, summary }`.

4. **Resilience & Fallback Protection**:
   - If the OpenAI API call fails (rate limit, invalid API key, network timeout), the ticket remains safely persisted in Supabase as `pending`.
   - The user receives an instant confirmation that support will follow up.

---

## 🚀 Getting Started

### 1. Database Setup in Supabase
1. Log into your [Supabase Dashboard](https://supabase.com).
2. Create a new project or select an existing one.
3. Open the **SQL Editor** from the left menu.
4. Copy and paste the full contents of `supabase/schema.sql` into the editor and click **Run**.
   - This creates the `tickets` table, indexes, updated_at trigger, and Row Level Security (RLS) policies.

---

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your actual API keys in `.env.local`:

```ini
# Supabase Project Settings -> API
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# OpenAI API Key (from https://platform.openai.com)
OPENAI_API_KEY=your-openai-api-key

# Optional: Model override (defaults to 'gpt-4o-mini', or 'gpt-4o' for higher quality)
OPENAI_MODEL=gpt-4o-mini
```

---

### 3. Install & Run Locally

```bash
# Install dependencies
npm install

# Run Next.js local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser:
- `/` — Support Form
- `/dashboard` — Agent Dashboard

---

## ⚙️ Model Customization (`lib/openai.ts`)

By default, `lib/openai.ts` uses `gpt-4o-mini` for fast and cost-effective triage.

If you want higher-quality replies over cost, swap the default model to `gpt-4o` in `lib/openai.ts`:

```typescript
export const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';
```

Or set the `OPENAI_MODEL=gpt-4o` environment variable in `.env.local` / Vercel.

---

## 🌐 Deployment to Vercel

This application is ready to deploy directly to Vercel.

### Option 1: Deploy via Vercel Dashboard
1. Push your repository to GitHub.
2. Import the repository in [Vercel](https://vercel.com/new).
3. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY`
   - `OPENAI_MODEL` (Optional, e.g. `gpt-4o-mini` or `gpt-4o`)
4. Click **Deploy**.

---

## 📁 Project Structure

```
ai-support-desk/
├── app/
│   ├── api/
│   │   ├── tickets/
│   │   │   ├── route.ts          # POST (create + OpenAI triage) & GET (list)
│   │   │   └── [id]/
│   │   │       └── route.ts      # PATCH (update ticket status)
│   ├── dashboard/
│   │   └── page.tsx              # Agent Dashboard (Filters, Stats, Expandable Rows)
│   ├── globals.css               # Tailwind CSS styles
│   ├── layout.tsx                # App layout & navbar header
│   └── page.tsx                  # Customer Support Form & Inline AI Reply
├── lib/
│   ├── openai.ts                 # OpenAI API integration (gpt-4o-mini JSON mode)
│   ├── supabase.ts               # Supabase client setup
│   └── types.ts                  # TypeScript types for tickets & AI triage
├── supabase/
│   └── schema.sql                # Complete Supabase SQL script with RLS
├── .env.example                  # Template for environment variables
├── .env.local                    # Local environment variables
├── package.json                  # Dependencies & scripts
└── README.md                     # Documentation
```
