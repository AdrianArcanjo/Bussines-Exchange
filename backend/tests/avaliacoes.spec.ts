import { AppError } from '../src/lib/errors';
import { avaliarSchema } from '../src/modules/avaliacoes/avaliacoes.dto';
import { resolverAvaliado } from '../src/modules/avaliacoes/dominio';

const concluido = { status: 'concluido', contratante_id: 'maria', executor_id: 'davi' };

describe('Avaliação mútua', () => {
  it('contratante avalia o executor e o executor avalia o contratante', () => {
    expect(resolverAvaliado(concluido, 'maria')).toBe('davi');
    expect(resolverAvaliado(concluido, 'davi')).toBe('maria');
  });

  it('bloqueia quem não participou do chamado (403)', () => {
    try {
      resolverAvaliado(concluido, 'intruso');
      fail('deveria lançar');
    } catch (e) {
      expect((e as AppError).status).toBe(403);
    }
  });

  it.each(['aberto', 'em_andamento', 'em_validacao', 'cancelado'])('bloqueia avaliação com chamado "%s" (409)', (status) => {
    try {
      resolverAvaliado({ ...concluido, status }, 'maria');
      fail('deveria lançar');
    } catch (e) {
      expect((e as AppError).status).toBe(409);
    }
  });

  it.each([1, 3, 5])('aceita nota %p', (nota) => {
    expect(avaliarSchema.safeParse({ nota }).success).toBe(true);
  });

  it.each([0, 6, 3.5, -1])('rejeita nota %p', (nota) => {
    expect(avaliarSchema.safeParse({ nota }).success).toBe(false);
  });

  it('rejeita nota ausente e comentário longo demais', () => {
    expect(avaliarSchema.safeParse({}).success).toBe(false);
    expect(avaliarSchema.safeParse({ nota: 5, comentario: 'x'.repeat(1001) }).success).toBe(false);
  });
});
