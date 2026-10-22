import { AppError } from '../../lib/errors';

export type StatusChamado = 'aberto' | 'em_andamento' | 'em_validacao' | 'concluido' | 'cancelado';
export type StatusTransacao = 'pendente' | 'retido' | 'liberado' | 'estornado';

export const STATUS_INICIAL_CHAMADO: StatusChamado = 'aberto';

// Espelha fn_chamado_antes_update do banco: o banco é a última barreira; aqui falhamos antes, com mensagem clara.
const TRANSICOES_CHAMADO: Record<StatusChamado, StatusChamado[]> = {
  aberto: ['em_andamento', 'cancelado'],
  em_andamento: ['em_validacao'],
  em_validacao: ['concluido', 'em_andamento'],
  concluido: [],
  cancelado: [],
};

export function garantirTransicaoChamado(de: StatusChamado, para: StatusChamado): void {
  if (!TRANSICOES_CHAMADO[de].includes(para)) {
    throw new AppError(409, `Não é possível mudar o chamado de "${de}" para "${para}"`, 'TRANSICAO_INVALIDA');
  }
}

/** Transacao.reter(): pendente -> retido (TU-03) */
export function reter(status: StatusTransacao): StatusTransacao {
  if (status !== 'pendente') {
    throw new AppError(409, 'Só é possível reter uma transação pendente', 'ESCROW_ESTADO_INVALIDO');
  }
  return 'retido';
}

/** Transacao.liberar(): só a partir de retido (TU-04) */
export function liberar(status: StatusTransacao): StatusTransacao {
  if (status !== 'retido') {
    throw new AppError(409, 'O pagamento só pode ser liberado se o valor estiver retido', 'ESCROW_ESTADO_INVALIDO');
  }
  return 'liberado';
}

/** Transacao.estornar(): só a partir de retido */
export function estornar(status: StatusTransacao): StatusTransacao {
  if (status !== 'retido') {
    throw new AppError(409, 'Só é possível estornar um valor que esteja retido', 'ESCROW_ESTADO_INVALIDO');
  }
  return 'estornado';
}
