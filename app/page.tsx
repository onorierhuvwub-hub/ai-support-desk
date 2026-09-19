'use client';

import { useState } from 'react';

type TicketResult = {
  id: string;
  ai_reply?: string | null;
  category?: string | null;
  urgency?: 'low' | 'medium' | 'high' | null;
};

const standardReply =
  "Hello, thank you for contacting Brownny Support regarding your request. We have logged your request. Our support team is prioritizing your inquiry under category 'General Inquiry' with urgency level 'high'. A support representative will follow up if further action is required.";

export default function SupportFormPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<TicketResult | null>(null);

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setTicket(null);

    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Unable to send your request.');
      }

      setTicket(data.ticket);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'Unable to send your request.');
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setFormData({ name: '', email: '', subject: '', message: '' });
    setTicket(null);
    setError(null);
  }

  const inputClass =
    'mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#b42335] focus:ring-2 focus:ring-[#b42335]';

  return (
    <main className="mx-auto max-w-3xl space-y-8">
      <section className="rounded-3xl bg-gradient-to-br from-[#071a3a] via-[#0b2d63] to-[#9d1c2e] p-8 text-center text-white shadow-2xl sm:p-12">
        <div className="mb-4 flex items-center justify-center gap-3 text-2xl" aria-label="Brownny symbols">
          <span aria-hidden="true">★</span>
          <span aria-hidden="true">▲</span>
          <span aria-hidden="true">★</span>
        </div>
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-red-200">Brownny</p>
        <h1 className="mt-2 text-3xl font-extrabold sm:text-5xl">
          Brownny Questions/Enquires Support Desk
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-blue-100">
          Submit your question/enquires request below. Our Brownny support desk saves your ticket immediately and provides an instant draft solution.
        </p>
      </section>

      {!ticket ? (
        <section className="rounded-3xl border border-blue-950/15 bg-white p-6 shadow-xl sm:p-9">
          {error && (
            <div role="alert" className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              ▲ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <label className="text-sm font-semibold text-[#071a3a]">
                Your name
                <input
                  className={inputClass}
                  required
                  value={formData.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  placeholder="Your name"
                />
              </label>
              <label className="text-sm font-semibold text-[#071a3a]">
                Email address
                <input
                  className={inputClass}
                  required
                  type="email"
                  value={formData.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  placeholder="you@example.com"
                />
              </label>
            </div>

            <label className="block text-sm font-semibold text-[#071a3a]">
              Question / enquiry subject
              <input
                className={inputClass}
                required
                value={formData.subject}
                onChange={(event) => updateField('subject', event.target.value)}
                placeholder="What would you like help with?"
              />
            </label>

            <label className="block text-sm font-semibold text-[#071a3a]">
              Your question or request
              <textarea
                className={inputClass}
                required
                rows={6}
                value={formData.message}
                onChange={(event) => updateField('message', event.target.value)}
                placeholder="Tell us what you would like to know or request."
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#b42335] px-5 py-4 font-bold text-white transition hover:bg-[#8d172b] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Sending your request...' : '★ Send question / enquiry'}
            </button>
          </form>
        </section>
      ) : (
        <section className="overflow-hidden rounded-3xl border border-blue-950/15 bg-white shadow-xl">
          <div className="bg-[#071a3a] p-6 text-white sm:p-8">
            <div className="flex items-center gap-2 text-xl font-bold">
              <span aria-hidden="true">★</span>
              Request received
            </div>
            <p className="mt-2 text-blue-100">Your Brownny response is ready.</p>
          </div>
          <div className="space-y-5 p-6 sm:p-8">
            <div className="flex flex-wrap gap-3 text-sm font-semibold">
              <span className="rounded-full bg-red-100 px-3 py-1 text-red-800">▲ {ticket.category || 'General Inquiry'}</span>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-900">
                ★ {ticket.urgency || 'high'} urgency
              </span>
            </div>
            <article className="whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-50 p-5 leading-7 text-slate-800">
              {ticket.ai_reply || standardReply}
            </article>
            <button
              onClick={reset}
              type="button"
              className="rounded-xl border-2 border-[#071a3a] px-5 py-3 font-bold text-[#071a3a] transition hover:bg-[#071a3a] hover:text-white"
            >
              ★ Submit another request
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
