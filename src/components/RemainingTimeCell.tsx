import { useServerCountdown } from '@/hooks/useServerCountdown';

export function RemainingTimeCell({ deadline }: { deadline: string }) {
  const { label, isExpired } = useServerCountdown(deadline, () => {});
  return (
    <span className={isExpired ? 'text-red-600' : 'text-slate-600'}>
      {isExpired ? 'Time up' : label}
    </span>
  );
}
