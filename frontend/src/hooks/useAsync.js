import { useState, useEffect, useCallback } from 'react';

// ── useAsync – generic async data fetcher ─────────────────────────────────
export function useAsync(fn, deps = []) {
  const [data, setData]     = useState(null);
  const [error, setError]   = useState(null);
  const [loading, setLoading] = useState(true);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn(...args);
      setData(result);
      return result;
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { execute(); }, [execute]);

  return { data, error, loading, refetch: execute };
}

// ── useDebounce ───────────────────────────────────────────────────────────
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ── usePagination ─────────────────────────────────────────────────────────
export function usePagination(fetchFn, params = {}, deps = []) {
  const [page, setPage]       = useState(1);
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetch = useCallback(async (p = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFn({ ...params, page: p, per_page: 15 });
      setData(res.data);
      setPage(p);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Error loading data');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { fetch(1); }, [fetch]);

  return { data, loading, error, page, goTo: fetch };
}

// ── useLocalStorage ───────────────────────────────────────────────────────
export function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key)) ?? initial; }
    catch { return initial; }
  });
  const set = (v) => {
    setValue(v);
    localStorage.setItem(key, JSON.stringify(v));
  };
  return [value, set];
}
