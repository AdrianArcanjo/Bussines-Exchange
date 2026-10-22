export type TipoUsuario = 'contratante' | 'executor';

export interface Usuario {
  id: string;
  tipo: TipoUsuario;
  nome: string;
  email: string;
  cidade?: string | null;
  uf?: string | null;
  notaMedia: number;
}

export interface AuthResponse {
  usuario: Usuario;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  senha: string;
}

interface CadastroBase {
  nome: string;
  email: string;
  senha: string;
  telefone?: string;
  cidade?: string;
  uf?: string;
}

export type CadastroRequest =
  | (CadastroBase & { tipo: 'contratante'; empresaNome?: string; cpfCnpj?: string })
  | (CadastroBase & { tipo: 'executor'; bio?: string; categoriaIds?: number[] });

export interface Sessao {
  usuario: Usuario;
  accessToken: string;
  refreshToken: string;
}
