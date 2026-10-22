import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChamadoResumo, Pagina, StatusChamado } from '../../core/models/chamado.models';
import { AuthService } from '../../core/services/auth.service';
import { ChamadosService } from '../../core/services/chamados.service';
import { BrlPipe, DataBrPipe, mensagemErro, ROTULO_STATUS, StatusLabelPipe } from '../../shared/util';

@Component({
  selector: 'bx-meus-chamados',
  standalone: true,
  imports: [RouterLink, BrlPipe, DataBrPipe, StatusLabelPipe],
  styleUrls: ['./chamados.css'],
  template: `
    <h1>Meus chamados</h1>
    <p class="sub">
      @if (ehContratante) { Chamados que você publicou. } @else { Chamados que você aceitou. }
    </p>

    <div class="abas" role="group" aria-label="Filtrar por status">
      <button type="button" [attr.aria-pressed]="status() === ''" (click)="filtrar('')">Todos</button>
      @for (s of statusFiltro; track s) {
        <button type="button" [attr.aria-pressed]="status() === s" (click)="filtrar(s)">{{ rotulos[s] }}</button>
      }
    </div>

    @if (erro()) { <div class="alerta" role="alert">{{ erro() }}</div> }

    @if (carregando()) {
      <p class="vazio">Carregando…</p>
    } @else if (dados() && dados()!.itens.length === 0) {
      <p class="vazio">
        Nada por aqui ainda.
        @if (ehContratante) { <a routerLink="/chamados/novo">Publicar um chamado</a> }
        @else { <a routerLink="/chamados">Ver chamados abertos</a> }
      </p>
    } @else {
      <div class="lista">
        @for (c of dados()?.itens; track c.id) {
          <a class="card" [routerLink]="['/chamados', c.id]">
            <div>
              <span class="cod">#{{ c.codigo }}</span>
              <h2>{{ c.titulo }}</h2>
              <div class="meta">
                <span>{{ c.categoria }}</span>
                @if (ehContratante) {
                  <span>Executor: {{ c.executor ?? 'ainda sem executor' }}</span>
                } @else {
                  <span>Contratante: {{ c.contratante }}</span>
                }
                <span>Publicado em {{ c.criadoEm | dataBr }}</span>
              </div>
            </div>
            <div class="lado">
              <span class="valor">{{ c.valorFixo | brl }}</span>
              <span class="selo" [attr.data-status]="c.status">{{ c.status | statusLabel }}</span>
              @if (c.status === 'concluido' && c.jaAvaliei === false) { <span class="selo" data-status="aberto">Avaliar</span> }
            </div>
          </a>
        }
      </div>

      @if (totalPaginas() > 1) {
        <div class="paginacao">
          <button class="btn sec" type="button" [disabled]="pagina() <= 1" (click)="irPara(pagina() - 1)">Anterior</button>
          <span>Página {{ pagina() }} de {{ totalPaginas() }}</span>
          <button class="btn sec" type="button" [disabled]="pagina() >= totalPaginas()" (click)="irPara(pagina() + 1)">Próxima</button>
        </div>
      }
    }
  `,
})
export class MeusChamadosComponent implements OnInit {
  private readonly api = inject(ChamadosService);
  readonly ehContratante = inject(AuthService).usuario()?.tipo === 'contratante';

  readonly rotulos = ROTULO_STATUS;
  readonly statusFiltro: StatusChamado[] = ['aberto', 'em_andamento', 'em_validacao', 'concluido', 'cancelado'];

  readonly status = signal<StatusChamado | ''>('');
  readonly pagina = signal(1);
  readonly dados = signal<Pagina<ChamadoResumo> | null>(null);
  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);

  totalPaginas = () => {
    const d = this.dados();
    return d ? Math.max(1, Math.ceil(d.total / d.limite)) : 1;
  };

  ngOnInit(): void {
    this.carregar();
  }

  filtrar(s: StatusChamado | ''): void {
    this.status.set(s);
    this.irPara(1);
  }

  irPara(p: number): void {
    this.pagina.set(p);
    this.carregar();
  }

  private carregar(): void {
    this.carregando.set(true);
    this.erro.set(null);
    this.api.meus(this.status(), this.pagina()).subscribe({
      next: (d) => {
        this.dados.set(d);
        this.carregando.set(false);
      },
      error: (e) => {
        this.erro.set(mensagemErro(e, 'Não foi possível carregar seus chamados.'));
        this.carregando.set(false);
      },
    });
  }
}
