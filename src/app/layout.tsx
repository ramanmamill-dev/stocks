import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MarketStatusBanner from '@/components/layout/MarketStatusBanner';
import './globals.css';

export const metadata: Metadata = {
  title: 'StockSignal AI – NSE & BSE Stock Analysis',
  description:
    'Enterprise-Grade Web App for NSE & BSE Stock Analysis with real-time signals, charts, and watchlist.',
  manifest: '/manifest.json',
  themeColor: undefined,
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'StockSignal AI',
  },
};

export const viewport = {
  themeColor: '#00b386',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#00b386" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="min-h-screen flex flex-col bg-[#F8F9FC]">
        <MarketStatusBanner />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.warn('SW registration failed:', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
