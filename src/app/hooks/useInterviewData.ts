import { useCallback, useEffect, useState } from 'react';
import type { InterviewRecord } from '../types';
import { loadInterviewRecords } from '../lib/records';

interface InterviewDataState {
  records: InterviewRecord[];
  loading: boolean;
  error: string | null;
  retry: () => Promise<void>;
}

export function useInterviewData(): InterviewDataState {
  const [records, setRecords] = useState<InterviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const nextRecords = await loadInterviewRecords();
      setRecords(nextRecords);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    records,
    loading,
    error,
    retry: load,
  };
}
