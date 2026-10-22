import { AppError } from '../src/lib/errors';
import { publicarSchema } from '../src/modules/chamados/chamados.dto';
import { estornar, garantirTransicaoChamado, liberar, reter, STATUS_INICIAL_CHAMADO } from '../src/modules/chamados/dominio';

const valido = {
  titulo: 'Bug no checkout do site',
  descricao: 'O botão de finalizar compra não responde no Safari.',
  categoriaId: 1,
  valorFixo: 220,
};

describe('Chamado.publicar()', () => {
  it('TU-01: aceita chamado com valor fixo e nasce com status "aberto"', () => {
    const r = publicarSchema.safeParse(valido);
    expect(r.success).toBe(true);
    expect(STATUS_INICIAL_CHAMADO).toBe('aberto');
  });

  it('TU-02: rejeita chamado sem valor fixo', () => {
    const { valorFixo, ...semValor } = valido;
    const r = publicarSchema.safeParse(semValor);
    expect(r.success).toBe(false);
  });

  it.each([0, -5, 10.123])('rejeita valor inválido (%p)', (v) => {
    expect(publicarSchema.safeParse({ ...valido, valorFixo: v }).success).toBe(false);
  });

  it('rejeita prazo no passado', () => {
    const r = publicarSchema.safeParse({ ...valido, prazoEntrega: '2020-01-01T00:00:00Z' });
    expect(r.success).toBe(false);
  });
});

describe('Transacao (escrow)', () => {
  it('TU-03: reter() leva pendente -> retido', () => {
    expect(reter('pendente')).toBe('retido');
  });

  it('TU-04: liberar() sem status "retido" lança exceção de regra de negócio', () => {
    for (const s of ['pendente', 'liberado', 'estornado'] as const) {
      expect(() => liberar(s)).toThrow(AppError);
    }
    expect(liberar('retido')).toBe('liberado');
  });

  it('estornar() só vale para valor retido', () => {
    expect(estornar('retido')).toBe('estornado');
    expect(() => estornar('liberado')).toThrow(AppError);
  });
});

describe('Máquina de estados do chamado', () => {
  it('permite o fluxo feliz e a recusa de entrega', () => {
    garantirTransicaoChamado('aberto', 'em_andamento');
    garantirTransicaoChamado('em_andamento', 'em_validacao');
    garantirTransicaoChamado('em_validacao', 'concluido');
    garantirTransicaoChamado('em_validacao', 'em_andamento');
  });

  it('bloqueia atalhos e chamados finalizados', () => {
    expect(() => garantirTransicaoChamado('aberto', 'concluido')).toThrow(AppError);
    expect(() => garantirTransicaoChamado('em_andamento', 'cancelado')).toThrow(AppError);
    expect(() => garantirTransicaoChamado('concluido', 'aberto')).toThrow(AppError);
  });
});
