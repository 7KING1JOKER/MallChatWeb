/// <reference types="vite/client" />

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any
  }
}

interface ImportMetaEnv {
  /** API 前缀 */
  readonly VITE_API_PREFIX: string
  /** WS 地址 */
  readonly VITE_WS_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
