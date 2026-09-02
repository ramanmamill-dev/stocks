import type { Metadata } from 'next';
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
      <body
        style={{
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        }}
      >
        {children}
      </body>
    </html>
  );
}
