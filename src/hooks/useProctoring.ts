import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useProctoring(attemptId: string | null) {
  const [warningCount, setWarningCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!attemptId) return;
    const currentAttemptId = attemptId;

    async function logEvent(eventType: 'tab_hidden' | 'window_blur') {
      setWarningCount((c) => c + 1);
      setShowWarning(true);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = setTimeout(() => setShowWarning(false), 4000);

      try {
        await supabase.from('proctoring_events').insert({
          attempt_id: currentAttemptId,
          event_type: eventType,
        });
      } catch {
        // Non-critical
      }
    }

    function handleVisibilityChange() {
      if (document.hidden) void logEvent('tab_hidden');
    }
    function handleBlur() {
      void logEvent('window_blur');
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    };
  }, [attemptId]);

  return { warningCount, showWarning };
}
