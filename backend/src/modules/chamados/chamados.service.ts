import { Prisma } from '@prisma/client';
import { AppError } from '../../lib/errors';
import { prisma } from '../../lib/prisma';
import { avaliacoesRepository } from '../avaliacoes/avaliacoes.repository';
import { pagamentoFacade } from '../pagamentos/pagamento.facade';
import { EntregaDto, ListagemDto, MeusDto, PublicarDto } from './chamados.dto';
import { chamadosRepository } from './chamados.repository';
import { estornar, garantirTransicaoChamado, liberar, reter, StatusChamado } from './dominio';

type Tx = Prisma.TransactionClient;
type Usuario = { id: string; tipo: 'contratante' | 'executor' };

const OPCOES_TX = { timeout: 15_000 } as const;

/** Informa ao banco quem está agindo, para o trigger de histórico (chamado_historico.usuario_id). */
const definirUsuarioAtual = (tx: Tx, usuarioId: string) =>
  tx.$queryRaw`SELECT set_config('app.usuario_id', ${usuarioId}, true)`;

/** Trava a linha do chamado até o fim da transação: evita dois aceites/cancelamentos simultâneos. */
async function travarChamado(tx: Tx, id: string) {
  const linhas = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM chamados WHERE id = ${id}::uuid FOR UPDATE`;
  if (linhas.length === 0) throw new AppError(404, 'Chamado não encontrado', 'CHAMADO_NAO_ENCONTRADO');
  return tx.chamados.findUniqueOrThrow({ where: { id } });
}

async function transacaoDoChamado(tx: Tx, chamadoId: string) {
  const t = await tx.transacoes.findUnique({ where: { chamado_id: chamadoId } });
  if (!t) throw new AppError(409, 'Chamado sem transação de escrow', 'SEM_TRANSACAO');
  return t;
}

const exigirContratanteDono = (c: { contratante_id: string }, u: Usuario) => {
  if (c.contratante_id !== u.id) throw new AppError(403, 'Apenas o contratante do chamado pode fazer isso', 'ACESSO_NEGADO');
};

const exigirStatus = (c: { status: StatusChamado }, esperado: StatusChamado, mensagem: string) => {
  if (c.status !== esperado) throw new AppError(409, mensagem, 'STATUS_INVALIDO');
};

async function entregaPendente(tx: Tx, chamadoId: string) {
  const e = await tx.entregas.findFirst({ where: { chamado_id: chamadoId, status: 'pendente' }, orderBy: { enviada_em: 'desc' } });
  if (!e) throw new AppError(409, 'Não há entrega pendente de validação', 'SEM_ENTREGA_PENDENTE');
  return e;
}

export const chamadosService = {
  listarAbertos: (f: ListagemDto) => chamadosRepository.listarAbertos(f),
  listarMeus: (u: Usuario, f: MeusDto) => chamadosRepository.listarMeus(u.id, u.tipo, f),

  /** RF-02 + RF-04: cria o chamado e retém o valor em escrow na MESMA transação (TI-01, TI-02). Devolve o id. */
  async publicar(contratanteId: string, dto: PublicarDto) {
    return prisma.$transaction(async (tx) => {
      await definirUsuarioAtual(tx, contratanteId);

      const categoria = await tx.categorias.findFirst({ where: { id: dto.categoriaId, ativa: true } });
      if (!categoria) throw new AppError(400, 'Categoria inválida', 'CATEGORIA_INVALIDA');

      const chamado = await tx.chamados.create({
        data: {
          titulo: dto.titulo,
          descricao: dto.descricao,
          categoria_id: dto.categoriaId,
          valor_fixo: dto.valorFixo,
          contratante_id: contratanteId,
          prazo_entrega: dto.prazoEntrega ? new Date(dto.prazoEntrega) : undefined,
        },
      });
      const transacao = await tx.transacoes.create({
        data: { chamado_id: chamado.id, contratante_id: contratanteId, valor: dto.valorFixo, status: 'pendente' },
      });

      // Se o gateway recusar, a transação SQL inteira é desfeita: não existe chamado sem valor retido.
      const referencia = await pagamentoFacade.reter({ transacaoId: transacao.id, valor: dto.valorFixo, contratanteId });
      await tx.transacoes.update({
        where: { id: transacao.id },
        data: { status: reter(transacao.status), gateway_referencia: referencia },
      });
      return chamado.id;
    }, OPCOES_TX);
  },

  /** Executor aceita um chamado aberto (TI-03). */
  async aceitar(executor: Usuario, id: string) {
    await prisma.$transaction(async (tx) => {
      await definirUsuarioAtual(tx, executor.id);
      const c = await travarChamado(tx, id);
      exigirStatus(c, 'aberto', 'Este chamado não está mais disponível');

      const perfil = await tx.executores.findUnique({ where: { usuario_id: executor.id } });
      if (!perfil?.disponivel) throw new AppError(409, 'Seu perfil está marcado como indisponível', 'EXECUTOR_INDISPONIVEL');

      const t = await transacaoDoChamado(tx, id);
      if (t.status !== 'retido') throw new AppError(409, 'O valor ainda não está retido em escrow', 'ESCROW_ESTADO_INVALIDO');

      garantirTransicaoChamado(c.status, 'em_andamento');
      await tx.chamados.update({ where: { id }, data: { status: 'em_andamento', executor_id: executor.id } });
    }, OPCOES_TX);
  },

  /** Executor entrega o trabalho: chamado vai para validação. */
  async entregar(executor: Usuario, id: string, dto: EntregaDto) {
    await prisma.$transaction(async (tx) => {
      await definirUsuarioAtual(tx, executor.id);
      const c = await travarChamado(tx, id);
      if (c.executor_id !== executor.id) throw new AppError(403, 'Apenas o executor do chamado pode entregar', 'ACESSO_NEGADO');
      exigirStatus(c, 'em_andamento', 'O chamado não está em andamento');

      garantirTransicaoChamado(c.status, 'em_validacao');
      await tx.entregas.create({ data: { chamado_id: id, descricao: dto.descricao, link_url: dto.linkUrl } });
      await tx.chamados.update({ where: { id }, data: { status: 'em_validacao' } });
    }, OPCOES_TX);
  },

  /** Contratante valida: libera o pagamento ao executor e conclui o chamado (TI-04). */
  async validar(contratante: Usuario, id: string) {
    await prisma.$transaction(async (tx) => {
      await definirUsuarioAtual(tx, contratante.id);
      const c = await travarChamado(tx, id);
      exigirContratanteDono(c, contratante);
      exigirStatus(c, 'em_validacao', 'Não há entrega aguardando validação');

      const entrega = await entregaPendente(tx, id);
      const t = await transacaoDoChamado(tx, id);
      const novoStatus = liberar(t.status);

      await pagamentoFacade.liberar(t.gateway_referencia);
      await tx.transacoes.update({ where: { id: t.id }, data: { status: novoStatus } });
      garantirTransicaoChamado(c.status, 'concluido');
      await tx.chamados.update({ where: { id }, data: { status: 'concluido' } });
      await tx.entregas.update({ where: { id: entrega.id }, data: { status: 'aprovada', avaliada_em: new Date() } });
    }, OPCOES_TX);
  },

  /** Contratante recusa a entrega: o chamado volta para "em andamento" e o valor continua retido. */
  async rejeitar(contratante: Usuario, id: string, motivo: string) {
    await prisma.$transaction(async (tx) => {
      await definirUsuarioAtual(tx, contratante.id);
      const c = await travarChamado(tx, id);
      exigirContratanteDono(c, contratante);
      exigirStatus(c, 'em_validacao', 'Não há entrega aguardando validação');

      const entrega = await entregaPendente(tx, id);
      garantirTransicaoChamado(c.status, 'em_andamento');
      await tx.entregas.update({
        where: { id: entrega.id },
        data: { status: 'rejeitada', motivo_rejeicao: motivo, avaliada_em: new Date() },
      });
      await tx.chamados.update({ where: { id }, data: { status: 'em_andamento' } });
    }, OPCOES_TX);
  },

  /** Cancelamento antes do aceite: estorna o valor retido e arquiva o chamado (TS-02). */
  async cancelar(contratante: Usuario, id: string) {
    await prisma.$transaction(async (tx) => {
      await definirUsuarioAtual(tx, contratante.id);
      const c = await travarChamado(tx, id);
      exigirContratanteDono(c, contratante);
      exigirStatus(c, 'aberto', 'Só é possível cancelar chamados que ainda não foram aceitos');

      const t = await transacaoDoChamado(tx, id);
      if (t.status === 'retido') {
        const novoStatus = estornar(t.status);
        await pagamentoFacade.estornar(t.gateway_referencia);
        await tx.transacoes.update({ where: { id: t.id }, data: { status: novoStatus } });
      }
      garantirTransicaoChamado(c.status, 'cancelado');
      await tx.chamados.update({ where: { id }, data: { status: 'cancelado' } });
    }, OPCOES_TX);
  },

  /**
   * Detalhe com visibilidade: chamado aberto é público para usuários logados; transação, entregas e
   * histórico só aparecem para as partes. `acoes` diz ao frontend quais botões mostrar.
   */
  async detalhe(usuario: Usuario, id: string) {
    const c = await chamadosRepository.detalhe(id);
    if (!c) throw new AppError(404, 'Chamado não encontrado', 'CHAMADO_NAO_ENCONTRADO');

    const ehDono = c.contratanteId === usuario.id;
    const ehExecutor = c.executorId === usuario.id;
    const ehParte = ehDono || ehExecutor;
    if (c.status !== 'aberto' && !ehParte) throw new AppError(404, 'Chamado não encontrado', 'CHAMADO_NAO_ENCONTRADO');

    const [transacao, entregas, historico, avaliacoes] = ehParte
      ? await Promise.all([
          chamadosRepository.transacao(id),
          chamadosRepository.entregas(id),
          chamadosRepository.historico(id),
          avaliacoesRepository.doChamado(id),
        ])
      : [null, [], [], []];
    const jaAvaliei = avaliacoes.some((a) => a.avaliadorId === usuario.id);

    const { contratanteId, contratanteNome, contratanteNota, executorId, executorNome, executorNota, ...basico } = c;
    return {
      chamado: {
        ...basico,
        contratante: { id: contratanteId, nome: contratanteNome, nota: contratanteNota },
        executor: executorId ? { id: executorId, nome: executorNome, nota: executorNota } : null,
      },
      transacao,
      entregas,
      historico,
      avaliacoes,
      acoes: {
        podeAceitar: usuario.tipo === 'executor' && c.status === 'aberto',
        podeEntregar: ehExecutor && c.status === 'em_andamento',
        podeValidar: ehDono && c.status === 'em_validacao',
        podeRejeitar: ehDono && c.status === 'em_validacao',
        podeCancelar: ehDono && c.status === 'aberto',
        podeAvaliar: ehParte && c.status === 'concluido' && !jaAvaliei,
      },
    };
  },
};
