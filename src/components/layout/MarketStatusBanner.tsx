'use client';

export default function MarketStatusBanner({
  isOpen,
  message,
  lastUpdated,
}: {
  isOpen: boolean;
  message: string;
  lastUpdated: string;
}) {
  if (isOpen) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-[#F23645]/10 border-b border-[#F23645] text-center py-2 px-4 text-sm text-[#F23645]"
    >
      <span className="font-medium">🔒 {message}</span>
      <span className="mx-2">·</span>
      <span>Showing Last Traded Price (EOD)</span>
      <span className="mx-2">·</span>
      <span className="text-[#787B86]">
        Updated:{' '}
        {new Date(lastUpdated).toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
        })}
      </span>
    </div>
  );
}
