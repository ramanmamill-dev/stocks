'use client';

import { useEffect, useRef } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import type { UTCTimestamp } from 'lightweight-charts';
import type { Candle } from '@/types/stock';

interface Props {
  candles: Candle[];
}

export function CandlestickChart({ candles }: Props) {
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
      height: 400,
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#00B386',
      downColor: '#F23645',
      borderUpColor: '#00B386',
      borderDownColor: '#F23645',
      wickUpColor: '#00B386',
      wickDownColor: '#F23645',
    });

    const data = candles.map((c) => ({
      time: c.time as UTCTimestamp,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    candlestickSeries.setData(data);

    const volumeSeries = chart.addHistogramSeries({
      color: '#00B386',
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });

    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    const volumeData = candles.map((c) => ({
      time: c.time as UTCTimestamp,
      value: c.volume,
      color: c.close >= c.open ? '#00B38680' : '#F2364580',
    }));

    volumeSeries.setData(volumeData);

    chart.timeScale().fitContent();

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
      <div className="h-[400px] bg-gray-50 rounded flex items-center justify-center text-[#787B86]">
        No chart data available
      </div>
    );
  }

  return <div ref={containerRef} className="w-full" />;
}
