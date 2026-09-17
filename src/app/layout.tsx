import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'FreightSense 2.0 | AI-Powered Maritime Freight Intelligence',
  description: 'Observe. Understand. Predict. Decide. Commercial maritime intelligence platform for spot freight forecasting, vessel tracking, port congestion, and risk simulation.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 selection:bg-sky-500 selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
