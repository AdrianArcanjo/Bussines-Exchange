import { AppError } from '../../lib/errors';

type ChamadoParaAvaliar = {
  status: string;
  contratante_id: string;
  executor_id: string | null;
};

/**
 * Descobre quem está sendo avaliado: contratante avalia o executor e vice-versa.
 * Espelha o trigger fn_avaliacao_valida, mas falha antes com mensagem clara.
 */
export function resolverAvaliado(chamado: ChamadoParaAvaliar, avaliadorId: string): string {
  if (chamado.status !== 'concluido') {
    throw new AppError(409, 'Só é possível avaliar chamados concluídos', 'AVALIACAO_FORA_DE_HORA');
  }
  if (avaliadorId === chamado.contratante_id && chamado.executor_id) return chamado.executor_id;
  if (avaliadorId === chamado.executor_id) return chamado.contratante_id;
  throw new AppError(403, 'Apenas o contratante e o executor do chamado podem avaliar', 'ACESSO_NEGADO');
}
