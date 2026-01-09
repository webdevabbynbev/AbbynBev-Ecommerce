export const getImageUrl = (path?: string | null) => {
  if (!path) return "/placeholder.png";
  const baseURL =
    import.meta.env.VITE_API_URL?.replace("/api/v1", "") ||
    "http://localhost:3333";
  return `${baseURL}${path.startsWith("/") ? path : `/${path}`}`;
};
