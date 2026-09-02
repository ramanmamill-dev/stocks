import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MarketStatusBanner from '@/components/layout/MarketStatusBanner';
import './globals.css';

export const metadata: Metadata = {
  title: 'StockSignal AI – NSE & BSE Stock Analysis',
  description:
    'Enterprise-Grade Web App for NSE & BSE Stock Analysis with real-time signals, charts, and watchlist.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#F8F9FC]">
        <MarketStatusBanner />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
