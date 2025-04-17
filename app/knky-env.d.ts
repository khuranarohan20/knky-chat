/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly KNKY_BACKEND_URL: string;
  readonly KNKY_X_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
