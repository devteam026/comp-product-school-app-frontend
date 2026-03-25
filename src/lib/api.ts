const resolveDefaultBase = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "http://localhost:8081";
};

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? resolveDefaultBase();

export function apiUrl(path: string) {
  if (!path.startsWith("/")) return `${API_BASE_URL}/${path}`;
  return `${API_BASE_URL}${path}`;
}
