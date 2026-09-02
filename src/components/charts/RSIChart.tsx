'use client';

import { useEffect, useRef } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import type { UTCTimestamp } from 'lightweight-charts';

interface Props {
  data: { time: number; value: number }[];
  color?: string;
  title?: string;
  overbought?: number;
  oversold?: number;
}

export function RSIChart({ data, color = '#F0B90B', title = 'RSI', overbought = 70, oversold = 30 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#ffffff' },
        textColor: '#787B86',
      },
      grid: {
        vertLines: { color: '#F0F3FA' },
        horzLines: { color: '#F0F3FA' },
      },
      width: containerRef.current.clientWidth,
      height: 120,
    });

    const lineSeries = chart.addLineSeries({
      color,
      lineWidth: 2,
    });

    lineSeries.setData(data.map((d) => ({ time: d.time as UTCTimestamp, value: d.value })));

    chart.timeScale().fitContent();
    chart.priceScale('right').applyOptions({
      scaleMargins: { top: 0.1, bottom: 0.1 },
    });

    chartRef.current = chart;

    const handleResize = () => {
      if (chartRef.current && containerRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data, color]);

  if (data.length === 0) {
    return (
      <div className="h-[120px] bg-gray-50 rounded flex items-center justify-center text-[#787B86] text-sm">
        No {title} data
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute top-2 left-2 text-xs font-medium text-[#787B86] z-10">
        {title} ({overbought}/{oversold})
      </div>
      <div ref={containerRef} className="w-full" />
    </div>
  );
}
