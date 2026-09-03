import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockCheckCircuit } = vi.hoisted(() => ({
  mockCheckCircuit: vi.fn(),
}));

vi.mock('@/lib/utils', () => ({
  checkCircuit: mockCheckCircuit,
  formatPrice: vi.fn(),
  formatPercent: vi.fn(),
  formatNumber: vi.fn(),
  formatVolume: vi.fn(),
  toISTParts: vi.fn(),
  toISTDateString: vi.fn(),
  formatIST: vi.fn(),
  sleep: vi.fn(),
  shortId: vi.fn(),
  STALENESS_POLICY: {},
  classifyFreshness: vi.fn(),
}));

import * as circuitModule from '../circuit';

describe('circuit.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkCircuit (re-export)', () => {
    it('re-exports checkCircuit from utils', () => {
      mockCheckCircuit.mockReturnValue({ hit: false, direction: null, changePercent: 0, limit: 20 });

      const result = circuitModule.checkCircuit(100, 110, 20);
      expect(mockCheckCircuit).toHaveBeenCalledWith(100, 110, 20);
      expect(result).toEqual({ hit: false, direction: null, changePercent: 0, limit: 20 });
    });
  });

  describe('getCircuitAlert', () => {
    it('returns none severity when circuit not hit', () => {
      mockCheckCircuit.mockReturnValue({ hit: false, direction: null, changePercent: 5, limit: 20 });

      const result = circuitModule.getCircuitAlert(100, 105, 20);

      expect(result).toEqual({ hit: false, direction: null, severity: 'none' });
    });

    it('returns alert severity when changePercent >= limit - 2', () => {
      mockCheckCircuit.mockReturnValue({ hit: true, direction: 'upper', changePercent: 18.5, limit: 20 });

      const result = circuitModule.getCircuitAlert(100, 118.5, 20);

      expect(result).toEqual({ hit: true, direction: 'upper', severity: 'alert' });
    });

    it('returns warning severity when changePercent >= limit - 5 but < limit - 2', () => {
      mockCheckCircuit.mockReturnValue({ hit: true, direction: 'upper', changePercent: 16, limit: 20 });

      const result = circuitModule.getCircuitAlert(100, 116, 20);

      expect(result).toEqual({ hit: true, direction: 'upper', severity: 'warning' });
    });

    it('returns none severity when changePercent < limit - 5', () => {
      mockCheckCircuit.mockReturnValue({ hit: true, direction: 'upper', changePercent: 10, limit: 20 });

      const result = circuitModule.getCircuitAlert(100, 110, 20);

      expect(result.severity).toBe('none');
      expect(result.hit).toBe(true);
    });

    it('handles lower circuit alerts', () => {
      mockCheckCircuit.mockReturnValue({ hit: true, direction: 'lower', changePercent: -18.5, limit: 20 });

      const result = circuitModule.getCircuitAlert(100, 81.5, 20);

      expect(result).toEqual({ hit: true, direction: 'lower', severity: 'alert' });
    });

    it('uses default limit of 20 when not specified', () => {
      mockCheckCircuit.mockReturnValue({ hit: false, direction: null, changePercent: 5, limit: 20 });

      circuitModule.getCircuitAlert(100, 105);

      expect(mockCheckCircuit).toHaveBeenCalledWith(100, 105, 20);
    });

    it('uses custom limit', () => {
      mockCheckCircuit.mockReturnValue({ hit: true, direction: 'upper', changePercent: 12, limit: 10 });

      const result = circuitModule.getCircuitAlert(100, 112, 10);

      expect(mockCheckCircuit).toHaveBeenCalledWith(100, 112, 10);
      expect(result.hit).toBe(true);
    });
  });
});
