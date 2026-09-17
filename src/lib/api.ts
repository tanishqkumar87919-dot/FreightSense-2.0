const FASTAPI_BASE_URL =
  process.env.NEXT_PUBLIC_FASTAPI_BASE_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://freightsense-2-0.onrender.com'
    : 'http://localhost:8000');

export async function fetchFromApi<T>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
  try {
    const url = `${FASTAPI_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!res.ok) {
      console.warn(`API request to ${endpoint} failed with status ${res.status}`);
      return null;
    }

    return await res.json();
  } catch (error) {
    // Graceful fallback if FastAPI service is offline during static prerendering or local testing
    return null;
  }
}
