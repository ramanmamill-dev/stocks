export function isMarketOpen(): { open: boolean; message: string } {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  const hours = istTime.getUTCHours();
  const minutes = istTime.getUTCMinutes();
  const day = istTime.getUTCDay();

  if (day === 0 || day === 6) {
    return { open: false, message: 'Market Closed (Weekend)' };
  }

  const marketOpenTime = 9 * 60 + 15;
  const marketCloseTime = 15 * 60 + 30;
  const currentMinutes = hours * 60 + minutes;

  if (currentMinutes >= marketOpenTime && currentMinutes < marketCloseTime) {
    return { open: true, message: 'Market Open' };
  } else {
    return { open: false, message: 'Market Closed (After Hours)' };
  }
}
