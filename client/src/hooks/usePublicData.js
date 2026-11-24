import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

export function usePublicData(url) {
  const [result, setResult] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    api.get(url, { signal: controller.signal }).then(({ data }) => {
      if (!controller.signal.aborted) setResult({ url, attempt, data: data.data });
    }).catch((error) => {
      if (!controller.signal.aborted) setResult({ url, attempt, error: true, status: error.response?.status });
    });
    return () => controller.abort();
  }, [url, attempt]);

  const current = result?.url === url && result.attempt === attempt ? result : null;
  return {
    data: current?.data,
    error: Boolean(current?.error),
    status: current?.status,
    loading: Boolean(url && !current),
    retry: () => setAttempt((value) => value + 1),
  };
}
