/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Usuário que o frontend usa no login automático. Padrão: `admin`. */
  readonly VITE_API_USUARIO?: string
  /** Senha do login automático. Padrão: `admin123`. */
  readonly VITE_API_SENHA?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
