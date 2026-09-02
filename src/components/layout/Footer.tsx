'use client';

export default function Footer() {
  return (
    <footer className="mt-auto pt-8 pb-4 border-t border-gray-200 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>Build with love for Indian retail investors.</p>
          <div className="flex items-center gap-4">
            <span>Data: NSE, BSE</span>
            <span>·</span>
            <span>Signals: AI-powered</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
