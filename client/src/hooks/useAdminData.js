import { useEffect, useState } from 'react';
import { errorText } from '../components/admin/AdminUI.jsx';
import { useAdmin } from '../context/AdminSession.jsx';

export function useAdminData(url) {
  const { request } = useAdmin();
  const [result, setResult] = useState({});
  const [revision, setRevision] = useState(0);
  const reload = () => setRevision((value) => value + 1);

  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    request('GET', url, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) setResult({ url, revision, data });
      })
      .catch((error) => {
        if (!controller.signal.aborted) setResult({ url, revision, error: errorText(error) });
      });
    return () => controller.abort();
  }, [request, url, revision]);

  const current = result.url === url && result.revision === revision;
  return { data: current ? result.data : undefined, error: current ? result.error : undefined, loading: !!url && !current, reload };
}
