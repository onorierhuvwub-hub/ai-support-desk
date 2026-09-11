'use client';

import { useEffect, useState } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Mail,
  User,
  ShieldAlert,
  Tag,
  MessageSquare,
  FileText,
  Check
} from 'lucide-react';
import { Ticket, TicketStatus } from '@/lib/types';

export default function DashboardPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/tickets');
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to load tickets');
      }
      setTickets(data.tickets || []);
    } catch (err: any) {
      setError(err.message || 'Error fetching support tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleMarkResolved = async (ticketId: string, currentStatus: TicketStatus) => {
    setUpdatingId(ticketId);
    const newStatus = currentStatus === 'resolved' ? 'pending' : 'resolved';
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to update ticket status');
      }
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t))
      );
    } catch (err: any) {
      alert(err.message || 'Could not update ticket status');
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Filter and Search calculations
  const filteredTickets = tickets.filter((t) => {
    const matchesStatus =
      activeFilter === 'all' ? true : t.status === activeFilter;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      t.subject.toLowerCase().includes(query) ||
      t.name.toLowerCase().includes(query) ||
      t.email.toLowerCase().includes(query) ||
      (t.category && t.category.toLowerCase().includes(query));
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: tickets.length,
    pending: tickets.filter((t) => t.status === 'pending').length,
    aiResponded: tickets.filter((t) => t.status === 'ai_responded').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
    highUrgency: tickets.filter((t) => t.urgency === 'high').length,
  };

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'ai_responded':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Sparkles className="w-3 h-3 text-blue-600" />
            AI Responded
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Resolved
          </span>
        );
    }
  };

  const getUrgencyBadge = (urgency?: string | null) => {
    if (!urgency) return null;
    switch (urgency.toLowerCase()) {
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
            <ShieldAlert className="w-3 h-3" />
            High
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            Medium
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Low
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Dashboard Title & Refresh Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Support Agent Dashboard
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Overview and automated triage triage results for customer support tickets.
          </p>
        </div>

        <button
          onClick={fetchTickets}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 shadow-sm transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">Total Tickets</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/30 shadow-sm">
          <p className="text-xs font-semibold uppercase text-amber-700">Pending</p>
          <p className="text-2xl font-bold text-amber-900 mt-1">{stats.pending}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-200 bg-blue-50/30 shadow-sm">
          <p className="text-xs font-semibold uppercase text-blue-700">AI Responded</p>
          <p className="text-2xl font-bold text-blue-900 mt-1">{stats.aiResponded}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 shadow-sm">
          <p className="text-xs font-semibold uppercase text-emerald-700">Resolved</p>
          <p className="text-2xl font-bold text-emerald-900 mt-1">{stats.resolved}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-red-200 bg-red-50/30 shadow-sm col-span-2 sm:col-span-1">
          <p className="text-xs font-semibold uppercase text-red-700">High Urgency</p>
          <p className="text-2xl font-bold text-red-900 mt-1">{stats.highUrgency}</p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { id: 'all', label: `All (${stats.total})` },
            { id: 'pending', label: `Pending (${stats.pending})` },
            { id: 'ai_responded', label: `AI Responded (${stats.aiResponded})` },
            { id: 'resolved', label: `Resolved (${stats.resolved})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search subject, name, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Tickets List */}
      {loading && tickets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-3" />
          <p className="font-semibold text-sm">Loading tickets from database...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-800 text-sm text-center">
          <p className="font-bold">Error loading tickets</p>
          <p>{error}</p>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 space-y-3">
          <Filter className="w-10 h-10 mx-auto text-slate-300" />
          <h3 className="font-bold text-slate-700">No tickets found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery || activeFilter !== 'all'
              ? 'Try adjusting your search query or filter settings.'
              : 'No support requests submitted yet. Use the homepage to create one!'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTickets.map((ticket) => {
            const isExpanded = expandedId === ticket.id;
            return (
              <div
                key={ticket.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm transition hover:border-slate-300 overflow-hidden"
              >
                {/* Expandable Row Header */}
                <div
                  onClick={() => toggleExpand(ticket.id)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer bg-white hover:bg-slate-50/80 transition"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {getStatusBadge(ticket.status)}
                      {getUrgencyBadge(ticket.urgency)}
                      {ticket.category && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                          <Tag className="w-3 h-3" />
                          {ticket.category}
                        </span>
                      )}
                      <span className="text-xs text-slate-400 font-mono">
                        {new Date(ticket.created_at).toLocaleString()}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 truncate">
                      {ticket.subject}
                    </h3>

                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {ticket.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {ticket.email}
                      </span>
                    </div>
                  </div>

                  {/* Actions Right */}
                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkResolved(ticket.id, ticket.status);
                      }}
                      disabled={updatingId === ticket.id}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                        ticket.status === 'resolved'
                          ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>
                        {ticket.status === 'resolved' ? 'Reopen' : 'Mark Resolved'}
                      </span>
                    </button>

                    <button
                      aria-label="Toggle ticket details"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Details Accordion */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/50 p-5 sm:p-6 space-y-6">
                    {/* Original Message */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-slate-400" />
                        Original Customer Message
                      </h4>
                      <div className="bg-white border border-slate-200 rounded-xl p-4 text-sm text-slate-800 whitespace-pre-line leading-relaxed shadow-sm">
                        {ticket.message}
                      </div>
                    </div>

                    {/* AI Triaging Triad: Summary, Category, Urgency */}
                    {ticket.summary && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-blue-500" />
                          Internal AI Triage Summary
                        </h4>
                        <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-4 text-sm text-blue-900 font-medium leading-relaxed">
                          {ticket.summary}
                        </div>
                      </div>
                    )}

                    {/* AI Draft Reply */}
                    {ticket.ai_reply ? (
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-blue-600" />
                          Claude AI Drafted Reply
                        </h4>
                        <div className="bg-white border border-blue-200 rounded-xl p-4 text-sm text-slate-800 whitespace-pre-line leading-relaxed shadow-sm">
                          {ticket.ai_reply}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800">
                        <p className="font-bold">No AI Reply Generated</p>
                        <p>This ticket was saved as pending without AI automation due to fallback policy.</p>
                      </div>
                    )}

                    <div className="pt-2 text-xs text-slate-400 flex items-center justify-between border-t border-slate-200/60">
                      <span>Ticket UUID: {ticket.id}</span>
                      <span>Last Updated: {ticket.updated_at ? new Date(ticket.updated_at).toLocaleString() : 'N/A'}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
