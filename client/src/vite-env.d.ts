/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * API 서버(예: Cloud Run) 절대 URL. 비어 있으면 상대경로(/api/...)를 그대로 쓴다
   * — 로컬 개발(Vite 프록시)이나 서버가 화면까지 같이 서빙하는 배포(Docker)에서는
   * 비워 둔다. GitHub Pages처럼 화면만 정적으로 배포할 때만 채운다.
   */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
