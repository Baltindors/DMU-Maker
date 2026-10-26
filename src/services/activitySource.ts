export function usesMockActivityData(): boolean {
  if (import.meta.env.VITE_USE_MOCK_DATA === "true") {
    return true;
  }
  return !import.meta.env.VITE_API_BASE_URL?.trim();
}
