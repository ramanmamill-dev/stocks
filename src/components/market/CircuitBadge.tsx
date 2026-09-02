'use client';

import type { CircuitInfo } from '@/types/signal';

interface Props {
  circuit: CircuitInfo;
}

export function CircuitBadge({ circuit }: Props) {
  if (!circuit.hit) return null;

  const isUpper = circuit.direction === 'upper';
  const label = isUpper ? 'Upper Circuit' : 'Lower Circuit';
  const bgColor = isUpper ? 'bg-[#F23645]' : 'bg-[#00B386]';
  const textColor = 'text-white';

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${bgColor} ${textColor}`}
      role="status"
      aria-label={label}
      title={`${label}: ${circuit.changePercent.toFixed(2)}% (limit: ${circuit.limit}%)`}
    >
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d={isUpper
            ? "M5 10a.75.75 0 01.75-.75h8.5a.75.75 0 010 1.5h-8.5A.75.75 0 015 10z"
            : "M10 5a.75.75 0 01.75.75v8.5a.75.75 0 01-1.5 0v-8.5A.75.75 0 0110 5z"
          }
          clipRule="evenodd"
        />
      </svg>
      {label}
    </span>
  );
}
