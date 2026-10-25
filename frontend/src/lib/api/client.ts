const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  const response = await fetch(url, { ...options, headers })

  if (!response.ok) {
    let errorMessage = `API Error: ${response.status} ${response.statusText}`
    try {
      const errorData = await response.json()
      if (errorData.detail) errorMessage = errorData.detail
    } catch {
      // Fallback to generic message
    }
    throw new Error(errorMessage)
  }

  return response.json() as Promise<T>
}