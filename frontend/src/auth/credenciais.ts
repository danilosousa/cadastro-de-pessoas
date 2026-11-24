/**
 * Credenciais que o frontend usa para obter o token sozinho (ADR 0012).
 *
 * Atenção: variáveis `VITE_*` são embutidas no JavaScript entregue ao navegador, então
 * qualquer pessoa que abra a interface consegue lê-las. Serve para demonstração, não
 * para produção. Os padrões são os mesmos do backend (`ADMIN_USUARIO` / `ADMIN_SENHA`).
 */
export const CREDENCIAIS = {
  usuario: import.meta.env.VITE_API_USUARIO || 'admin',
  senha: import.meta.env.VITE_API_SENHA || 'admin123',
}
