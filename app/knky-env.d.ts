/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly KNKY_BACKEND_URL: string;
  readonly KNKY_X_API_KEY: string;
  readonly KNKY_CONVERSE_PROJECT_ID: string;
  readonly KNKY_CONVERSE_HOST: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
