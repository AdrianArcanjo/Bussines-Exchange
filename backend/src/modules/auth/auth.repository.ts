import { prisma } from '../../lib/prisma';

type DadosBase = {
  nome: string;
  email: string;
  senha_hash: string;
  telefone?: string;
  cidade?: string;
  uf?: string;
};

/**
 * Repository: isola o Prisma das regras de negócio.
 * Os nomes dos modelos seguem o resultado de `prisma db pull` sobre o 01_schema.sql.
 */
export const authRepository = {
  buscarPorEmail: (email: string) => prisma.usuarios.findUnique({ where: { email } }),
  buscarPorId: (id: string) => prisma.usuarios.findUnique({ where: { id } }),

  // usuarios + contratantes na MESMA transação
  criarContratante(base: DadosBase, extra: { empresa_nome?: string; cpf_cnpj?: string }) {
    return prisma.$transaction(async (tx) => {
      const usuario = await tx.usuarios.create({ data: { ...base, tipo: 'contratante' } });
      await tx.contratantes.create({
        data: { usuario_id: usuario.id, tipo: 'contratante', ...extra },
      });
      return usuario;
    });
  },

  // usuarios + executores (+ especialidades) na MESMA transação
  criarExecutor(base: DadosBase, extra: { bio?: string; categoriaIds?: number[] }) {
    return prisma.$transaction(async (tx) => {
      const usuario = await tx.usuarios.create({ data: { ...base, tipo: 'executor' } });
      await tx.executores.create({
        data: { usuario_id: usuario.id, tipo: 'executor', bio: extra.bio },
      });
      if (extra.categoriaIds?.length) {
        await tx.executor_categorias.createMany({
          data: [...new Set(extra.categoriaIds)].map((categoria_id) => ({
            executor_id: usuario.id,
            categoria_id,
          })),
        });
      }
      return usuario;
    });
  },

  salvarRefreshToken: (usuario_id: string, token_hash: string, expira_em: Date) =>
    prisma.refresh_tokens.create({ data: { usuario_id, token_hash, expira_em } }),

  buscarRefreshToken: (token_hash: string) =>
    prisma.refresh_tokens.findUnique({ where: { token_hash } }),

  /** Revoga de forma atômica; retorna quantos registros foram revogados (0 = já estava revogado). */
  async revogarRefreshToken(id: string) {
    const r = await prisma.refresh_tokens.updateMany({
      where: { id, revogado_em: null },
      data: { revogado_em: new Date() },
    });
    return r.count;
  },

  revogarTodosDoUsuario: (usuario_id: string) =>
    prisma.refresh_tokens.updateMany({
      where: { usuario_id, revogado_em: null },
      data: { revogado_em: new Date() },
    }),
};
