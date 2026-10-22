import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Chamado } from '../../../../shared/models/chamado.model';
import { ChamadosService } from '../../data-access/chamados.service';
import { CategoriaFiltro, Ordem } from '../../models/filtros.model';
import { ChamadoCardComponent } from '../../components/chamado-card/chamado-card.component';
import { ChamadoFiltrosComponent } from '../../components/chamado-filtros/chamado-filtros.component';

/** Página "inteligente": busca dados, guarda o estado e orquestra os componentes de apresentação. */
@Component({
  selector: 'app-mural-chamados',
  imports: [ChamadoCardComponent, ChamadoFiltrosComponent],
  templateUrl: './mural-chamados.component.html',
  styleUrl: './mural-chamados.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MuralChamadosComponent implements OnInit {
  private readonly service = inject(ChamadosService);
  private readonly destroyRef = inject(DestroyRef);

  // Estado
  protected readonly chamados = signal<Chamado[]>([]);
  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly aceitandoId = signal<string | null>(null);
  protected readonly aviso = signal<string | null>(null);

  // Filtros
  protected readonly busca = signal('');
  protected readonly categoria = signal<CategoriaFiltro>('todas');
  protected readonly ordem = signal<Ordem>('recentes');

  // Estado derivado: recalcula sozinho quando algum signal usado muda
  protected readonly visiveis = computed(() => {
    const termo = this.busca().trim().toLowerCase();
    const categoria = this.categoria();

    const lista = this.chamados().filter(
      (c) =>
        (categoria === 'todas' || c.categoria === categoria) &&
        (!termo || `${c.codigo} ${c.titulo} ${c.descricao}`.toLowerCase().includes(termo)),
    );

    switch (this.ordem()) {
      case 'maior_recompensa': return lista.sort((a, b) => b.recompensa - a.recompensa);
      case 'menor_recompensa': return lista.sort((a, b) => a.recompensa - b.recompensa);
      default: return lista.sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
    }
  });

  ngOnInit(): void {
    this.carregar();
  }

  protected carregar(): void {
    this.carregando.set(true);
    this.erro.set(null);
    this.service
      .listarAbertos()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (lista) => { this.chamados.set(lista); this.carregando.set(false); },
        error: () => {
          this.erro.set('Não foi possível carregar os chamados. Verifique sua conexão e tente de novo.');
          this.carregando.set(false);
        },
      });
  }

  protected aceitar(id: string): void {
    if (this.aceitandoId()) return;
    this.aceitandoId.set(id);
    this.aviso.set(null);

    this.service
      .aceitar(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (aceito) => {
          // Saiu do mural: agora está "em andamento" e pertence ao executor.
          this.chamados.update((lista) => lista.filter((c) => c.id !== id));
          this.aviso.set(`Você aceitou o chamado ${aceito.codigo}. Ele agora está em andamento.`);
          this.aceitandoId.set(null);
        },
        error: () => {
          this.aviso.set('Não foi possível aceitar o chamado. Ele pode já ter sido aceito por outro executor.');
          this.aceitandoId.set(null);
          this.carregar();
        },
      });
  }

  protected limparFiltros(): void {
    this.busca.set('');
    this.categoria.set('todas');
    this.ordem.set('recentes');
  }
}
