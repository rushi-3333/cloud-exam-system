import { useEffect, useState } from 'react';

export function useServerCountdown(deadlineIso: string, onExpire: () => void) {
  const [remainingMs, setRemainingMs] = useState(() =>
    Math.max(0, new Date(deadlineIso).getTime() - Date.now())
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const next = Math.max(0, new Date(deadlineIso).getTime() - Date.now());
      setRemainingMs(next);
      if (next <= 0) {
        clearInterval(interval);
        onExpire();
      }
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadlineIso]);

  const totalSeconds = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const label =
    hours > 0
      ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      : `${minutes}:${String(seconds).padStart(2, '0')}`;

  return { remainingMs, label, isExpired: remainingMs <= 0 };
}
