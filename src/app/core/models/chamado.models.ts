export type StatusChamado = 'aberto' | 'em_andamento' | 'em_validacao' | 'concluido' | 'cancelado';
export type StatusTransacao = 'pendente' | 'retido' | 'liberado' | 'estornado';
export type StatusEntrega = 'pendente' | 'aprovada' | 'rejeitada';

export interface Categoria {
  id: number;
  nome: string;
  slug: string;
}

export interface ChamadoResumo {
  id: string;
  codigo: string;
  titulo: string;
  descricao: string;
  status: StatusChamado;
  valorFixo: number;
  prazoEntrega: string | null;
  criadoEm: string;
  categoriaId: number;
  categoria: string;
  contratante: string;
  contratanteNota: number;
  executor: string | null;
  statusTransacao: StatusTransacao | null;
  /** Só vem em "meus chamados": se eu já avaliei a outra parte (chamados concluídos). */
  jaAvaliei?: boolean;
}

export interface Pagina<T> {
  itens: T[];
  total: number;
  pagina: number;
  limite: number;
}

export interface Parte {
  id: string;
  nome: string;
  nota: number;
}

export interface ChamadoCompleto {
  id: string;
  codigo: string;
  titulo: string;
  descricao: string;
  status: StatusChamado;
  valorFixo: number;
  categoriaId: number;
  categoria: string;
  prazoEntrega: string | null;
  criadoEm: string;
  aceitoEm: string | null;
  entregueEm: string | null;
  concluidoEm: string | null;
  canceladoEm: string | null;
  contratante: Parte;
  executor: Parte | null;
}

export interface Transacao {
  status: StatusTransacao;
  valor: number;
  retidoEm: string | null;
  liberadoEm: string | null;
  estornadoEm: string | null;
}

export interface Entrega {
  id: string;
  descricao: string;
  linkUrl: string | null;
  status: StatusEntrega;
  motivoRejeicao: string | null;
  enviadaEm: string;
  avaliadaEm: string | null;
}

export interface EventoHistorico {
  de: StatusChamado | null;
  para: StatusChamado;
  em: string;
  porNome: string | null;
}

export interface Acoes {
  podeAceitar: boolean;
  podeEntregar: boolean;
  podeValidar: boolean;
  podeRejeitar: boolean;
  podeCancelar: boolean;
  podeAvaliar: boolean;
}

export interface ChamadoDetalhe {
  chamado: ChamadoCompleto;
  transacao: Transacao | null;
  entregas: Entrega[];
  historico: EventoHistorico[];
  avaliacoes: Avaliacao[];
  acoes: Acoes;
}

export interface NovoChamado {
  titulo: string;
  descricao: string;
  categoriaId: number;
  valorFixo: number;
  prazoEntrega?: string;
}

export interface FiltroMural {
  q?: string;
  categoriaId?: number;
  valorMin?: number;
  valorMax?: number;
  pagina?: number;
  limite?: number;
}

export interface Avaliacao {
  id: string;
  avaliadorId: string;
  avaliadorNome: string;
  avaliadoId: string;
  nota: number;
  comentario: string | null;
  criadoEm: string;
}

export interface AvaliacaoRecebida {
  id: string;
  nota: number;
  comentario: string | null;
  criadoEm: string;
  avaliadorNome: string;
}

export interface PerfilPublico {
  id: string;
  tipo: 'contratante' | 'executor';
  nome: string;
  cidade: string | null;
  uf: string | null;
  notaMedia: number;
  totalAvaliacoes: number;
  membroDesde: string;
  chamadosConcluidos: number;
  bio: string | null;
  empresa: string | null;
  categorias: string[];
}
