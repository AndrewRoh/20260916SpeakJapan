/**
 * API 요청 경로를 완성한다. VITE_API_BASE_URL이 설정되어 있으면(예: Cloud Run 절대 URL)
 * 그걸 앞에 붙이고, 없으면 상대경로 그대로 반환한다(같은 오리진에서 /api가 서빙되는 경우).
 */
export function apiUrl(path: string): string {
  const base = import.meta.env.VITE_API_BASE_URL?.trim();
  if (!base) return path;
  return `${base.replace(/\/+$/, '')}${path}`;
}
