# AI Support Desk

An AI-powered customer support application built with **Next.js 14 (App Router)**, **Tailwind CSS**, **Supabase (Postgres + RLS)**, and **Claude AI** via `@anthropic-ai/sdk`.

Designed for single-call customer triage and draft reply generation with bulletproof resilience and a full agent management dashboard.

---

## 🌟 Key Features

1. **Instant Support Form (`/`)**:
   - Customers submit name, email, subject, and message.
   - Ticket is saved to Supabase immediately in `pending` state.
   - Claude drafts a polite customer reply and triages the issue in **one single API call**.
   - Reply displays inline immediately after submission.

2. **Support Agent Dashboard (`/dashboard`)**:
   - Metrics summary (Total, Pending, AI Responded, Resolved, High Urgency).
   - Status filters (**Pending**, **AI Responded**, **Resolved**) & live search.
   - Expandable rows displaying:
     - Original customer message
     - Internal AI triage summary
     - AI draft reply
     - Urgency badge (Low / Medium / High) & Category tag
   - **Mark Resolved** toggle button.

3. **Advanced AI Automation Triad**:
   - Single Claude call returns structured JSON: `{ reply, category, urgency, summary }`.

4. **Resilience & Fallback Protection**:
   - If the Anthropic API call fails (rate limit, invalid API key, network timeout), the ticket remains safely persisted in Supabase as `pending`.
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

# Anthropic API Key (from https://console.anthropic.com)
ANTHROPIC_API_KEY=your-anthropic-api-key

# Optional: Model override (defaults to 'claude-sonnet-5' if unspecified)
# ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

---

### 3. Install & Run Locally

Using PowerShell / Command Prompt on Windows or standard terminal:

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

## ⚠️ Important: Anthropic Model Adaptation

By default, `lib/anthropic.ts` is configured with the model string `claude-sonnet-5`.

If your Anthropic account has access to a different model identifier (such as `claude-3-5-sonnet-20241022`, `claude-3-5-sonnet-20240620`, or `claude-3-haiku-20240307`), you can:

1. Update the default constant in `lib/anthropic.ts`:
   ```typescript
   export const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';
   ```
2. Or set the `ANTHROPIC_MODEL` environment variable in `.env.local` / Vercel.

---

## 🌐 Deployment to Vercel

This application is ready to deploy directly to Vercel.

### Option 1: Deploy via Vercel Dashboard
1. Push your repository to GitHub / GitLab / Bitbucket.
2. Import the repository in [Vercel](https://vercel.com/new).
3. Under **Environment Variables**, add the following keys:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ANTHROPIC_API_KEY`
   - `ANTHROPIC_MODEL` (Optional, e.g. `claude-3-5-sonnet-20241022`)
4. Click **Deploy**.

### Option 2: Deploy via Vercel CLI
```bash
npm install -g vercel
vercel
```
Follow the interactive prompts and configure environment variables when prompted or in project settings.

---

## 📁 Project Structure

```
ai-support-desk/
├── app/
│   ├── api/
│   │   ├── tickets/
│   │   │   ├── route.ts          # POST (create + Claude triage) & GET (list)
│   │   │   └── [id]/
│   │   │       └── route.ts      # PATCH (update ticket status)
│   ├── dashboard/
│   │   └── page.tsx              # Agent Dashboard (Filters, Stats, Expandable Rows)
│   ├── globals.css               # Tailwind CSS styles
│   ├── layout.tsx                # App layout & navbar header
│   └── page.tsx                  # Customer Support Form & Inline AI Reply
├── lib/
│   ├── anthropic.ts              # Claude API integration (@anthropic-ai/sdk)
│   ├── supabase.ts               # Supabase client setup
│   └── types.ts                  # TypeScript types for tickets & AI triage
├── supabase/
│   └── schema.sql                # Complete Supabase SQL script with RLS
├── .env.example                  # Template for environment variables
├── .env.local                    # Local environment variables
├── package.json                  # Dependencies & scripts
└── README.md                     # Documentation
```
