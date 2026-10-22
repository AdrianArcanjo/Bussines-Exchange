import jwt from 'jsonwebtoken';
import { authenticate, requireRole } from '../src/middlewares/authenticate';

const SECRET = process.env.JWT_SECRET!;
const assinar = (opts: jwt.SignOptions = {}, segredo = SECRET) =>
  jwt.sign({ tipo: 'executor' }, segredo, {
    subject: 'user-1',
    issuer: 'business-exchange',
    expiresIn: 60,
    ...opts,
  });

const executar = (authorization?: string) => {
  const req: any = { headers: { authorization } };
  const next = jest.fn();
  authenticate(req, {} as any, next);
  return { req, erro: next.mock.calls[0]?.[0] };
};

describe('Middleware JWT', () => {
  it('TU-05: rejeita token expirado com 401', () => {
    const { erro } = executar(`Bearer ${assinar({ expiresIn: -10 })}`);
    expect(erro.status).toBe(401);
    expect(erro.code).toBe('TOKEN_EXPIRED');
  });

  it('TS-03: bloqueia requisição sem token', () => {
    const { erro } = executar(undefined);
    expect(erro.status).toBe(401);
    expect(erro.code).toBe('TOKEN_AUSENTE');
  });

  it('rejeita assinatura inválida', () => {
    const { erro } = executar(`Bearer ${assinar({}, 'outro-segredo-qualquer-com-32-caracteres!!')}`);
    expect(erro.code).toBe('TOKEN_INVALID');
  });

  it('aceita token válido e preenche req.user', () => {
    const { req, erro } = executar(`Bearer ${assinar()}`);
    expect(erro).toBeUndefined();
    expect(req.user).toEqual({ id: 'user-1', tipo: 'executor' });
  });

  it('requireRole bloqueia perfil diferente com 403', () => {
    const next = jest.fn();
    requireRole('contratante')({ user: { id: 'u', tipo: 'executor' } } as any, {} as any, next);
    expect(next.mock.calls[0][0].status).toBe(403);
  });
});
