import { useCallback, useEffect, useRef, useState } from "react"

/** Fired after "Poll inbox now" so every page refreshes its data. */
export const REFRESH_EVENT = "dashboard:refresh"

export function refreshAll() {
  window.dispatchEvent(new Event(REFRESH_EVENT))
}

type State<T> = {
  data: T | undefined
  error: Error | null
  loading: boolean
  refreshing: boolean
}

/**
 * Loads data and keeps it fresh: refetches on REFRESH_EVENT, when the tab regains
 * focus, and every `intervalMs` if given. Earlier data stays on screen while reloading.
 */
export function useApi<T>(load: () => Promise<T>, deps: unknown[] = [], intervalMs?: number) {
  const [state, setState] = useState<State<T>>({
    data: undefined,
    error: null,
    loading: true,
    refreshing: false,
  })
  const loadRef = useRef(load)
  loadRef.current = load
  const requestId = useRef(0)

  const reload = useCallback(async () => {
    const id = ++requestId.current
    setState((s) => ({ ...s, refreshing: s.data !== undefined, loading: s.data === undefined }))
    try {
      const data = await loadRef.current()
      if (id === requestId.current) setState({ data, error: null, loading: false, refreshing: false })
    } catch (error) {
      if (id === requestId.current)
        setState((s) => ({ ...s, error: error as Error, loading: false, refreshing: false }))
    }
  }, [])

  const setData = useCallback((update: (data: T | undefined) => T) => {
    setState((s) => ({ ...s, data: update(s.data) }))
  }, [])

  useEffect(() => {
    setState({ data: undefined, error: null, loading: true, refreshing: false })
    void reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    const onFocus = () => document.visibilityState === "visible" && void reload()
    window.addEventListener(REFRESH_EVENT, reload)
    document.addEventListener("visibilitychange", onFocus)
    const timer = intervalMs ? window.setInterval(reload, intervalMs) : undefined
    return () => {
      window.removeEventListener(REFRESH_EVENT, reload)
      document.removeEventListener("visibilitychange", onFocus)
      if (timer) window.clearInterval(timer)
    }
  }, [reload, intervalMs])

  return { ...state, reload, setData }
}
