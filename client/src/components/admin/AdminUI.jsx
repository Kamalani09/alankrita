import { cloneElement, createContext, useContext, useEffect, useId, useState } from 'react';

const ToastContext = createContext(null);

export function AdminFeedback({ children }) {
  const [toast, setToast] = useState(null);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 6500);
    return () => window.clearTimeout(timer);
  }, [toast]);
  return (
    <ToastContext.Provider value={(text, error = false) => setToast({ text, error })}>
      {children}
      <div className="admin-toast-area" role="status" aria-live="polite">
        {toast && <div className={toast.error ? 'admin-toast is-error' : 'admin-toast'}>{toast.text}</div>}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

export function errorText(error) {
  return error.response?.data?.message || (error.response ? 'The request failed.' : 'Could not reach the API. Try again.');
}

export function Field({ label, children }) {
  const id = useId();
  return <div className="admin-field"><label htmlFor={id}>{label}</label>{cloneElement(children, { id })}</div>;
}

export function SaveActions({ busy, onCancel, label = 'Save changes' }) {
  return (
    <div className="admin-actions">
      <button className="button button--primary" disabled={busy}>{busy ? 'Saving…' : label}</button>
      {onCancel && <button className="button button--secondary" type="button" onClick={onCancel} disabled={busy}>Cancel</button>}
    </div>
  );
}

export function RequestState({ loading, error, retry }) {
  if (loading) return <p role="status">Loading…</p>;
  if (!error) return null;
  return (
    <div className="admin-error" role="alert">
      <p>{error}</p>
      {retry && <button type="button" onClick={retry}>Try again</button>}
    </div>
  );
}
