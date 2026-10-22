export type ChamadoStatus = 'aberto' | 'em_andamento' | 'concluido' | 'cancelado';

export type Categoria =
  | 'bug'
  | 'frontend'
  | 'banco_de_dados'
  | 'integracao'
  | 'infraestrutura'
  | 'outros';

export const CATEGORIA_ROTULO: Record<Categoria, string> = {
  bug: 'Correção de bug',
  frontend: 'Frontend',
  banco_de_dados: 'Banco de dados',
  integracao: 'Integração',
  infraestrutura: 'Infraestrutura',
  outros: 'Outros',
};

/** Espelha a entidade Chamado do diagrama de classes (Figura 2). */
export interface Chamado {
  id: string;
  codigo: string; // ex.: #BX-0001
  titulo: string;
  descricao: string;
  categoria: Categoria;
  recompensa: number; // valor fixo em reais (RF-02)
  status: ChamadoStatus;
  criadoEm: string; // ISO 8601
  contratanteNome: string;
}
