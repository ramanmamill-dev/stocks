import { checkCircuit } from '@/lib/utils';

export { checkCircuit };

export function getCircuitAlert(
  previousClose: number,
  currentPrice: number,
  limit: number = 20
): { hit: boolean; direction: 'upper' | 'lower' | null; severity: 'none' | 'warning' | 'alert' } {
  const circuit = checkCircuit(previousClose, currentPrice, limit);
  if (!circuit.hit) return { hit: false, direction: null, severity: 'none' };
  const severity = Math.abs(circuit.changePercent) >= limit - 2
    ? 'alert'
    : Math.abs(circuit.changePercent) >= limit - 5
      ? 'warning'
      : 'none';
  return { hit: true, direction: circuit.direction, severity };
}
