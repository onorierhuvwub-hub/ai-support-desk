import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Brownny Questions/Enquires Support Desk',
  description: 'Brownny support for questions and enquiries.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-100 text-slate-950 antialiased">
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe_0,_#f8fafc_45%,_#fee2e2_100%)]">
          <header className="border-b-4 border-[#b42335] bg-[#071a3a] text-white">
            <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-5">
              <span aria-hidden="true" className="text-xl text-red-300">★</span>
              <span className="font-bold tracking-tight">Brownny Questions/Enquires Support Desk</span>
              <span aria-hidden="true" className="text-lg text-blue-200">▲</span>
            </div>
          </header>
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">{children}</div>
        </div>
      </body>
    </html>
  );
}
