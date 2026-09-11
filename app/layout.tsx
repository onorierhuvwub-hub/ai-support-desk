import './globals.css';
import Link from 'next/link';
import { Bot, LayoutDashboard, LifeBuoy } from 'lucide-react';

export const metadata = {
  title: 'AI Support Desk | Instant AI Triaging & Support',
  description: 'AI-powered customer support desk powered by Next.js 14, Supabase, and OpenAI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen bg-slate-50 text-slate-900 antialiased">
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center gap-2 font-bold text-xl text-slate-900 hover:text-blue-600 transition">
                <div className="bg-blue-600 text-white p-2 rounded-xl shadow-md">
                  <Bot className="w-5 h-5" />
                </div>
                <span>AI Support Desk</span>
              </Link>
              <nav className="flex items-center gap-2">
                <Link
                  href="/"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-blue-600 transition"
                >
                  <LifeBuoy className="w-4 h-4" />
                  <span>Submit Ticket</span>
                </Link>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-slate-900 text-white hover:bg-blue-600 transition shadow-sm"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Agent Dashboard</span>
                </Link>
              </nav>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-500">
          <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p>© {new Date().getFullYear()} AI Support Desk. Powered by Next.js 14, Supabase & OpenAI.</p>
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                System Operational
              </span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
