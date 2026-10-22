import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import { env, JWT_ISSUER } from '../../config/env';
import { AppError } from '../../lib/errors';
import { CadastroDto, LoginDto } from './auth.dto';
import { authRepository } from './auth.repository';

const BCRYPT_ROUNDS = 12;
// Hash "de mentira" para gastar o mesmo tempo quando o e-mail não existe (evita enumeração por timing)
const DUMMY_HASH = bcrypt.hashSync('senha-inexistente', BCRYPT_ROUNDS);

const sha256 = (valor: string) => createHash('sha256').update(valor).digest('hex');

type UsuarioDb = NonNullable<Awaited<ReturnType<typeof authRepository.buscarPorId>>>;

const paraPublico = (u: UsuarioDb) => ({
  id: u.id,
  tipo: u.tipo,
  nome: u.nome,
  email: u.email,
  cidade: u.cidade,
  uf: u.uf,
  notaMedia: Number(u.nota_media),
});

async function emitirTokens(u: UsuarioDb) {
  const accessToken = jwt.sign({ tipo: u.tipo }, env.JWT_SECRET, {
    subject: u.id,
    issuer: JWT_ISSUER,
    algorithm: 'HS256',
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });
  const { exp, iat } = jwt.decode(accessToken) as JwtPayload;

  // Refresh token opaco: só o hash SHA-256 é guardado no banco
  const refreshToken = randomBytes(48).toString('base64url');
  const expiraEm = new Date(Date.now() + env.REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);
  await authRepository.salvarRefreshToken(u.id, sha256(refreshToken), expiraEm);

  return { accessToken, refreshToken, expiresIn: (exp ?? 0) - (iat ?? 0) };
}

export const authService = {
  async cadastrar(dto: CadastroDto) {
    if (await authRepository.buscarPorEmail(dto.email)) {
      throw new AppError(409, 'Este e-mail já está cadastrado', 'EMAIL_DUPLICADO');
    }
    const base = {
      nome: dto.nome,
      email: dto.email,
      senha_hash: await bcrypt.hash(dto.senha, BCRYPT_ROUNDS),
      telefone: dto.telefone,
      cidade: dto.cidade,
      uf: dto.uf,
    };
    const usuario =
      dto.tipo === 'contratante'
        ? await authRepository.criarContratante(base, {
            empresa_nome: dto.empresaNome,
            cpf_cnpj: dto.cpfCnpj,
          })
        : await authRepository.criarExecutor(base, { bio: dto.bio, categoriaIds: dto.categoriaIds });

    return { usuario: paraPublico(usuario), ...(await emitirTokens(usuario)) };
  },

  async login(dto: LoginDto) {
    const usuario = await authRepository.buscarPorEmail(dto.email);
    const senhaOk = await bcrypt.compare(dto.senha, usuario?.senha_hash ?? DUMMY_HASH);
    if (!usuario || !senhaOk || !usuario.ativo) {
      throw new AppError(401, 'E-mail ou senha inválidos', 'CREDENCIAIS_INVALIDAS');
    }
    return { usuario: paraPublico(usuario), ...(await emitirTokens(usuario)) };
  },

  /** Rotação: cada refresh token só vale uma vez. Reuso de token revogado derruba todas as sessões. */
  async renovar(refreshToken: string) {
    const registro = await authRepository.buscarRefreshToken(sha256(refreshToken));
    if (!registro) throw new AppError(401, 'Sessão inválida', 'REFRESH_INVALIDO');

    if (registro.revogado_em || (await authRepository.revogarRefreshToken(registro.id)) === 0) {
      await authRepository.revogarTodosDoUsuario(registro.usuario_id);
      throw new AppError(401, 'Sessão inválida', 'REFRESH_REUTILIZADO');
    }
    if (registro.expira_em < new Date()) {
      throw new AppError(401, 'Sessão expirada, entre novamente', 'REFRESH_EXPIRADO');
    }

    const usuario = await authRepository.buscarPorId(registro.usuario_id);
    if (!usuario || !usuario.ativo) throw new AppError(401, 'Sessão inválida', 'REFRESH_INVALIDO');
    return { usuario: paraPublico(usuario), ...(await emitirTokens(usuario)) };
  },

  /** Idempotente: sair com token desconhecido ou já revogado não gera erro. */
  async sair(refreshToken: string) {
    const registro = await authRepository.buscarRefreshToken(sha256(refreshToken));
    if (registro) await authRepository.revogarRefreshToken(registro.id);
  },

  async perfil(id: string) {
    const usuario = await authRepository.buscarPorId(id);
    if (!usuario || !usuario.ativo) throw new AppError(404, 'Usuário não encontrado', 'USUARIO_NAO_ENCONTRADO');
    return paraPublico(usuario);
  },
};
