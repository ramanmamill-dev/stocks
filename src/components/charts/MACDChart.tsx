'use client';

import { useEffect, useRef } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import type { UTCTimestamp } from 'lightweight-charts';

interface Props {
  macdData: { time: number; value: number }[];
  signalData: { time: number; value: number }[];
  histogramData: { time: number; value: number; color: string }[];
}

export function MACDChart({ macdData, signalData, histogramData }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);

  useEffect(() => {
    if (!containerRef.current || macdData.length === 0) return;

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

    const macdSeries = chart.addLineSeries({
      color: '#00B386',
      lineWidth: 2,
      title: 'MACD',
    });

    macdSeries.setData(macdData.map((d) => ({ time: d.time as UTCTimestamp, value: d.value })));

    const signalSeries = chart.addLineSeries({
      color: '#F23645',
      lineWidth: 2,
      title: 'Signal',
    });

    signalSeries.setData(signalData.map((d) => ({ time: d.time as UTCTimestamp, value: d.value })));

    const histogramSeries = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
    });

    histogramSeries.setData(
      histogramData.map((d) => ({
        time: d.time as UTCTimestamp,
        value: d.value,
        color: d.color,
      }))
    );

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
  }, [macdData, signalData, histogramData]);

  if (macdData.length === 0) {
    return (
      <div className="h-[120px] bg-gray-50 rounded flex items-center justify-center text-[#787B86] text-sm">
        No MACD data
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute top-2 left-2 text-xs font-medium text-[#787B86] z-10">
        MACD
      </div>
      <div ref={containerRef} className="w-full" />
    </div>
  );
}
