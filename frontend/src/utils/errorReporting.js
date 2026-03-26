export function initErrorReporting() {
  window.addEventListener('unhandledrejection', (event) => {
    fetch('/api/v1/client-errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: event.reason?.message ?? String(event.reason),
        stack:   event.reason?.stack,
        url:     window.location.href,
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {}) // never let error reporting itself throw
  })
}
