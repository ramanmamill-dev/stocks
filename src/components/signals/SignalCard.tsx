import { SignalBadge } from './SignalBadge';

export function SignalCard() {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <SignalBadge signal="BUY" />
      <p>Signal card content</p>
    </div>
  );
}
