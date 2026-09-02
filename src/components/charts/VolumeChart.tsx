'use client';

import { useEffect, useRef } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import type { UTCTimestamp } from 'lightweight-charts';
import type { Candle } from '@/types/stock';

interface Props {
  candles: Candle[];
}

export function VolumeChart({ candles }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);

  useEffect(() => {
    if (!containerRef.current || candles.length === 0) return;

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
      height: 100,
    });

    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
    });

    const data = candles.map((c) => ({
      time: c.time as UTCTimestamp,
      value: c.volume,
      color: c.close >= c.open ? '#00B38680' : '#F2364580',
    }));

    volumeSeries.setData(data);

    chart.timeScale().fitContent();
    chart.priceScale('right').applyOptions({
      scaleMargins: { top: 0, bottom: 0 },
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
  }, [candles]);

  if (candles.length === 0) {
    return (
      <div className="h-[100px] bg-gray-50 rounded flex items-center justify-center text-[#787B86] text-sm">
        No volume data
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute top-2 left-2 text-xs font-medium text-[#787B86] z-10">
        Volume
      </div>
      <div ref={containerRef} className="w-full" />
    </div>
  );
}
