import { Chamado } from '../../../shared/models/chamado.model';

const minutosAtras = (min: number) => new Date(Date.now() - min * 60000).toISOString();

export const CHAMADOS_MOCK: Chamado[] = [
  {
    id: '1', codigo: '#BX-0001', categoria: 'bug', recompensa: 220, status: 'aberto',
    titulo: 'Bug no checkout do meu site',
    descricao: 'O botão "Finalizar compra" não responde no Safari. Preciso que o fluxo funcione até o fim, com o pedido chegando no painel.',
    criadoEm: minutosAtras(25), contratanteNome: 'Loja Vitória',
  },
  {
    id: '2', codigo: '#BX-0002', categoria: 'banco_de_dados', recompensa: 150, status: 'aberto',
    titulo: 'Consulta lenta em relatório mensal',
    descricao: 'Um relatório em PostgreSQL leva mais de 40 segundos. Preciso de índices ou reescrita da query para chegar abaixo de 3 segundos.',
    criadoEm: minutosAtras(180), contratanteNome: 'Contábil Norte',
  },
  {
    id: '3', codigo: '#BX-0003', categoria: 'integracao', recompensa: 300, status: 'aberto',
    titulo: 'Integrar webhook de pagamento',
    descricao: 'Receber a confirmação do gateway e atualizar o status do pedido no sistema. A documentação do gateway já está em mãos.',
    criadoEm: minutosAtras(60 * 26), contratanteNome: 'Casa do Açaí',
  },
  {
    id: '4', codigo: '#BX-0004', categoria: 'frontend', recompensa: 90, status: 'aberto',
    titulo: 'Tornar a página de preços responsiva',
    descricao: 'A tabela de planos estoura a largura em telas de celular. Ajustar o layout sem mudar o conteúdo.',
    criadoEm: minutosAtras(60 * 5), contratanteNome: 'Studio Bia',
  },
  {
    id: '5', codigo: '#BX-0005', categoria: 'infraestrutura', recompensa: 180, status: 'aberto',
    titulo: 'Certificado SSL expirando no servidor',
    descricao: 'Renovar o certificado e configurar a renovação automática no Nginx. O servidor roda Ubuntu 22.04.',
    criadoEm: minutosAtras(60 * 49), contratanteNome: 'Oficina Rio Negro',
  },
  {
    id: '6', codigo: '#BX-0006', categoria: 'outros', recompensa: 60, status: 'aberto',
    titulo: 'Planilha de estoque exportando errado',
    descricao: 'O script que gera o CSV quebra acentos. Corrigir a codificação para abrir certo no Excel.',
    criadoEm: minutosAtras(60 * 8), contratanteNome: 'Mercadinho Central',
  },
];
