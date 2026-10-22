import { ChangeDetectionStrategy, Component, model } from '@angular/core';

import { CATEGORIA_ROTULO, Categoria } from '../../../../shared/models/chamado.model';
import { CategoriaFiltro, ORDENS, Ordem } from '../../models/filtros.model';

/** Binding de duas vias com signals: <app-chamado-filtros [(busca)]="busca" ... /> */
@Component({
  selector: 'app-chamado-filtros',
  templateUrl: './chamado-filtros.component.html',
  styleUrl: './chamado-filtros.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChamadoFiltrosComponent {
  readonly busca = model('');
  readonly categoria = model<CategoriaFiltro>('todas');
  readonly ordem = model<Ordem>('recentes');

  protected readonly ordens = ORDENS;
  protected readonly categorias = (Object.keys(CATEGORIA_ROTULO) as Categoria[]).map((valor) => ({
    valor,
    rotulo: CATEGORIA_ROTULO[valor],
  }));

  protected onBusca(e: Event) { this.busca.set((e.target as HTMLInputElement).value); }
  protected onCategoria(e: Event) { this.categoria.set((e.target as HTMLSelectElement).value as CategoriaFiltro); }
  protected onOrdem(e: Event) { this.ordem.set((e.target as HTMLSelectElement).value as Ordem); }
}
