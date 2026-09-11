'use client';

import { useState } from 'react';
import { Send, CheckCircle2, AlertCircle, Sparkles, Clock, Tag, ShieldAlert, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface TicketResult {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  ai_reply?: string | null;
  category?: string | null;
  urgency?: 'low' | 'medium' | 'high' | null;
  summary?: string | null;
}

export default function SupportFormPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedTicket, setSubmittedTicket] = useState<TicketResult | null>(null);
  const [aiStatus, setAiStatus] = useState<'success' | 'fallback' | null>(null);
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSubmittedTicket(null);
    setAiStatus(null);
    setFallbackMessage(null);

    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to submit ticket');
      }

      setSubmittedTicket(data.ticket);
      setAiStatus(data.aiStatus);
      if (data.message) {
        setFallbackMessage(data.message);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({ name: '', email: '', subject: '', message: '' });
    setSubmittedTicket(null);
    setAiStatus(null);
    setError(null);
    setFallbackMessage(null);
  };

  const getUrgencyColor = (urgency?: string | null) => {
    switch (urgency?.toLowerCase()) {
      case 'high':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'low':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100 shadow-sm">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span>Powered by OpenAI & Supabase</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          How can we help you today?
        </h1>
        <p className="text-slate-600 text-base max-w-xl mx-auto">
          Submit your support request below. Our AI support desk saves your ticket immediately and provides an instant draft solution.
        </p>
      </div>

      {/* Main Support Form Card */}
      {!submittedTicket ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 sm:p-8">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-800 text-sm">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Submission Failed</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Your Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  placeholder="Jane Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-slate-900 text-sm outline-none"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="jane@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-slate-900 text-sm outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Subject / Topic <span className="text-red-500">*</span>
              </label>
              <input
                id="subject"
                type="text"
                required
                placeholder="e.g. Cannot reset password / Billing inquiry"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-slate-900 text-sm outline-none"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Detailed Message <span className="text-red-500">*</span>
              </label>
              <textarea
                id="message"
                rows={5}
                required
                placeholder="Please describe your issue or question in detail..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-slate-900 text-sm outline-none resize-y"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base shadow-lg shadow-blue-600/25 transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Saving Ticket & AI Triaging...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Submit Ticket</span>
                </>
              )}
            </button>
          </form>
        </div>
      ) : (
        /* Submission Result & Inline AI Reply Display */
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Status Header Banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500 text-white p-2.5 rounded-xl">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-emerald-950">Ticket Successfully Submitted</h2>
                <p className="text-xs text-emerald-700 font-mono">ID: {submittedTicket.id}</p>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="text-xs font-semibold px-4 py-2 rounded-lg bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition"
            >
              Submit Another Ticket
            </button>
          </div>

          {/* AI Response Card or Fallback Resilience Message */}
          {aiStatus === 'success' && submittedTicket.ai_reply ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white p-6 sm:p-8 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 bg-blue-500/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-blue-200 border border-blue-400/30">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    <span>Instant AI Response Draft</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {submittedTicket.category && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md bg-white/10 text-white border border-white/20">
                        <Tag className="w-3 h-3" />
                        {submittedTicket.category}
                      </span>
                    )}
                    {submittedTicket.urgency && (
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md border ${getUrgencyColor(submittedTicket.urgency)}`}>
                        <ShieldAlert className="w-3 h-3" />
                        Urgency: {submittedTicket.urgency.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Subject</p>
                  <h3 className="text-xl font-bold text-white">{submittedTicket.subject}</h3>
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-6">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    AI Support Reply
                  </h4>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-slate-800 text-sm leading-relaxed whitespace-pre-line shadow-inner">
                    {submittedTicket.ai_reply}
                  </div>
                </div>

                {submittedTicket.summary && (
                  <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4 text-xs text-blue-900 flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Internal Triage Summary: </span>
                      <span>{submittedTicket.summary}</span>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
                  <p>A copy of this ticket has been routed to our human support team for reference.</p>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800 transition"
                  >
                    <span>View in Agent Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            /* RESILIENCE FALLBACK NOTICE */
            <div className="bg-white rounded-2xl border border-amber-200 shadow-xl p-6 sm:p-8 space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-100 text-amber-800 rounded-xl shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-slate-900">Support Request Received</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {fallbackMessage || 'Your ticket has been securely saved in our database. Our human support agents will review your request and follow up shortly.'}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Status: <strong className="text-amber-700 uppercase">Pending Agent Review</strong></span>
                <Link href="/dashboard" className="text-blue-600 font-semibold hover:underline">
                  Check Agent Dashboard →
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
