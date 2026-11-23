/**
 * Pins the Grafana reachability probe in `MonitoringEmbedPanel` so a story
 * does not depend on grafana.tahti.live answering the test browser.
 * Returns the restore function for a story's `beforeEach`.
 */
export function stubGrafanaHealth(reachable: boolean): () => void {
  const realFetch = window.fetch;
  window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : String(input);
    if (/grafana[^/]*\/api\/health$/.test(url)) {
      return reachable
        ? Promise.resolve(new Response(null, { status: 200 }))
        : Promise.reject(new TypeError('Failed to fetch'));
    }
    return realFetch(input, init);
  }) as typeof fetch;
  return () => {
    window.fetch = realFetch;
  };
}
