import { randomUUID } from 'node:crypto';

/** Contrato do gateway de pagamento externo. Troque a implementação sem tocar nas regras de negócio. */
export interface GatewayPagamento {
  reter(dados: { referenciaInterna: string; valor: number; pagadorId: string }): Promise<{ referencia: string }>;
  liberar(referencia: string): Promise<void>;
  estornar(referencia: string): Promise<void>;
}

/** Gateway simulado para desenvolvimento e testes: aprova tudo e devolve uma referência fictícia. */
export class GatewaySimulado implements GatewayPagamento {
  async reter(dados: { referenciaInterna: string; valor: number }) {
    console.log(`[gateway simulado] retendo R$ ${dados.valor.toFixed(2)} (${dados.referenciaInterna})`);
    return { referencia: `SIM-${randomUUID()}` };
  }
  async liberar(referencia: string) {
    console.log(`[gateway simulado] liberando ${referencia}`);
  }
  async estornar(referencia: string) {
    console.log(`[gateway simulado] estornando ${referencia}`);
  }
}
