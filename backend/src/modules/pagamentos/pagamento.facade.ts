import { AppError } from '../../lib/errors';
import { GatewayPagamento, GatewaySimulado } from './gateway';

/**
 * Facade (padrão da tabela de arquitetura): interface simples reter/liberar/estornar
 * que esconde a integração com o gateway externo e padroniza os erros.
 */
export class PagamentoFacade {
  constructor(private readonly gateway: GatewayPagamento) {}

  async reter(dados: { transacaoId: string; valor: number; contratanteId: string }): Promise<string> {
    if (!(dados.valor > 0)) throw new AppError(400, 'Valor inválido para retenção', 'VALOR_INVALIDO');
    return this.executar(async () => {
      const { referencia } = await this.gateway.reter({
        referenciaInterna: dados.transacaoId,
        valor: dados.valor,
        pagadorId: dados.contratanteId,
      });
      return referencia;
    });
  }

  liberar(referencia: string | null): Promise<void> {
    return this.executar(() => this.gateway.liberar(this.exigir(referencia)));
  }

  estornar(referencia: string | null): Promise<void> {
    return this.executar(() => this.gateway.estornar(this.exigir(referencia)));
  }

  private exigir(referencia: string | null): string {
    if (!referencia) throw new AppError(409, 'Transação sem referência no gateway', 'SEM_REFERENCIA');
    return referencia;
  }

  private async executar<T>(operacao: () => Promise<T>): Promise<T> {
    try {
      return await operacao();
    } catch (e) {
      if (e instanceof AppError) throw e;
      console.error('Falha no gateway de pagamento', e);
      throw new AppError(502, 'Não foi possível processar o pagamento agora. Tente novamente.', 'PAGAMENTO_FALHOU');
    }
  }
}

export const pagamentoFacade = new PagamentoFacade(new GatewaySimulado());
