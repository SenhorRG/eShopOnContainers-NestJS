/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ESHOP_CATALOG_ORIGIN: string;
  readonly VITE_ESHOP_ORDERING_ORIGIN: string;
  readonly VITE_ESHOP_AUTHORITY?: string;
  readonly VITE_ESHOP_CLIENT_ID?: string;
  readonly VITE_ESHOP_STOREFRONT_BASE?: string;
  readonly VITE_ESHOP_IDENTITY_ORIGIN?: string;
  readonly VITE_ESHOP_BFF_ORIGIN?: string;
  readonly VITE_ESHOP_CART_GUEST_MODE?: string;
  readonly VITE_ESHOP_HIDE_CHATBOT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
