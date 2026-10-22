import { Categoria } from '../../../shared/models/chamado.model';

export type CategoriaFiltro = Categoria | 'todas';
export type Ordem = 'recentes' | 'maior_recompensa' | 'menor_recompensa';

export const ORDENS: { valor: Ordem; rotulo: string }[] = [
  { valor: 'recentes', rotulo: 'Mais recentes' },
  { valor: 'maior_recompensa', rotulo: 'Maior recompensa' },
  { valor: 'menor_recompensa', rotulo: 'Menor recompensa' },
];
