/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ESHOP_IDENTITY_ORIGIN?: string;
  readonly VITE_ESHOP_WEBHOOKS_ORIGIN?: string;
  readonly VITE_WEBHOOK_RECEIVER_ORIGIN?: string;
  readonly VITE_WEBHOOK_DEFAULT_TOKEN?: string;
  readonly VITE_ESHOP_DEV_LOGIN_EMAIL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
