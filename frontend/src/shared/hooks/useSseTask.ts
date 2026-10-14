import { useState, useEffect, useRef, useCallback } from 'react';

export interface SseTaskState<T> {
  data: T | null;
  progress: number;
  status: 'idle' | 'connecting' | 'processing' | 'completed' | 'failed';
  error: string | null;
}

export function useSseTask<T = any>(endpoint: string | null) {
  const [state, setState] = useState<SseTaskState<T>>({
    data: null,
    progress: 0,
    status: 'idle',
    error: null,
  });

  const eventSourceRef = useRef<EventSource | null>(null);

  const startTask = useCallback((targetUrl: string) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setState({
      data: null,
      progress: 0,
      status: 'connecting',
      error: null,
    });

    const es = new EventSource(targetUrl);
    eventSourceRef.current = es;

    es.onopen = () => {
      setState((prev) => ({ ...prev, status: 'processing' }));
    };

    es.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        const progress = typeof parsed.progress === 'number' ? parsed.progress : 0;
        setState((prev) => ({
          ...prev,
          data: parsed.data ?? parsed,
          progress,
          status: progress >= 100 ? 'completed' : 'processing',
        }));

        if (progress >= 100) {
          es.close();
        }
      } catch {
        // Fallback text event
        setState((prev) => ({ ...prev, data: event.data as any }));
      }
    };

    es.onerror = () => {
      setState((prev) => ({
        ...prev,
        status: 'failed',
        error: 'Mất kết nối Server-Sent Events với máy chủ',
      }));
      es.close();
    };
  }, []);

  const stopTask = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setState((prev) => ({ ...prev, status: 'idle' }));
  }, []);

  useEffect(() => {
    if (endpoint) {
      startTask(endpoint);
    }
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [endpoint, startTask]);

  return { ...state, startTask, stopTask };
}
