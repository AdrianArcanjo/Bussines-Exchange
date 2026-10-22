import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Categoria, ChamadoResumo, Pagina } from '../../core/models/chamado.models';
import { AuthService } from '../../core/services/auth.service';
import { ChamadosService } from '../../core/services/chamados.service';
import { BrlPipe, DataBrPipe, mensagemErro, StatusLabelPipe } from '../../shared/util';

/** Mural: chamados abertos com filtros (tela principal após o login). */
@Component({
  selector: 'bx-mural',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, BrlPipe, DataBrPipe, StatusLabelPipe],
  styleUrls: ['./chamados.css'],
  template: `
    <h1>Mural de chamados</h1>
    <p class="sub">Microtarefas técnicas com recompensa fixa. O valor já está retido: você recebe quando o contratante validar a entrega.</p>

    <form class="filtros" [formGroup]="filtro" (ngSubmit)="buscar()">
      <label>Buscar <input type="search" formControlName="q" placeholder="Ex.: checkout, banco de dados" /></label>
      <label>Categoria
        <select formControlName="categoriaId">
          <option value="">Todas</option>
          @for (c of categorias(); track c.id) { <option [value]="c.id">{{ c.nome }}</option> }
        </select>
      </label>
      <label>Valor mín. (R$) <input type="number" min="0" step="0.01" formControlName="valorMin" /></label>
      <label>Valor máx. (R$) <input type="number" min="0" step="0.01" formControlName="valorMax" /></label>
      <button class="btn" type="submit">Filtrar</button>
    </form>

    @if (erro()) { <div class="alerta" role="alert">{{ erro() }}</div> }

    @if (carregando()) {
      <p class="vazio">Carregando chamados…</p>
    } @else if (dados() && dados()!.itens.length === 0) {
      <p class="vazio">
        Nenhum chamado aberto com esses filtros.
        @if (auth.usuario()?.tipo === 'contratante') { <a routerLink="/chamados/novo">Publique o primeiro</a> }
      </p>
    } @else {
      <div class="lista">
        @for (c of dados()?.itens; track c.id) {
          <a class="card" [routerLink]="['/chamados', c.id]">
            <div>
              <span class="cod">#{{ c.codigo }}</span>
              <h2>{{ c.titulo }}</h2>
              <p>{{ c.descricao }}</p>
              <div class="meta">
                <span>{{ c.categoria }}</span>
                <span>Contratante: {{ c.contratante }} (nota {{ c.contratanteNota }})</span>
                <span>Publicado em {{ c.criadoEm | dataBr }}</span>
                @if (c.prazoEntrega) { <span>Prazo: {{ c.prazoEntrega | dataBr }}</span> }
              </div>
            </div>
            <div class="lado">
              <span class="valor">{{ c.valorFixo | brl }}</span>
              <span class="rotulo">Recompensa fixa</span>
              <span class="selo" [attr.data-status]="c.status">{{ c.status | statusLabel }}</span>
            </div>
          </a>
        }
      </div>

      @if (totalPaginas() > 1) {
        <div class="paginacao">
          <button class="btn sec" type="button" [disabled]="paginaAtual() <= 1" (click)="irPara(paginaAtual() - 1)">Anterior</button>
          <span>Página {{ paginaAtual() }} de {{ totalPaginas() }}</span>
          <button class="btn sec" type="button" [disabled]="paginaAtual() >= totalPaginas()" (click)="irPara(paginaAtual() + 1)">Próxima</button>
        </div>
      }
    }
  `,
})
export class ChamadosComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly api = inject(ChamadosService);
  private readonly fb = inject(FormBuilder);

  readonly filtro = this.fb.nonNullable.group({ q: '', categoriaId: '', valorMin: '', valorMax: '' });
  readonly categorias = signal<Categoria[]>([]);
  readonly dados = signal<Pagina<ChamadoResumo> | null>(null);
  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly paginaAtual = signal(1);

  totalPaginas = () => {
    const d = this.dados();
    return d ? Math.max(1, Math.ceil(d.total / d.limite)) : 1;
  };

  ngOnInit(): void {
    this.api.categorias().subscribe({ next: (c) => this.categorias.set(c) });
    this.carregar();
  }

  buscar(): void {
    this.irPara(1);
  }

  irPara(pagina: number): void {
    this.paginaAtual.set(pagina);
    this.carregar();
  }

  private carregar(): void {
    const v = this.filtro.getRawValue();
    this.carregando.set(true);
    this.erro.set(null);
    this.api
      .listar({
        q: v.q.trim() || undefined,
        categoriaId: v.categoriaId ? Number(v.categoriaId) : undefined,
        valorMin: v.valorMin !== '' ? Number(v.valorMin) : undefined,
        valorMax: v.valorMax !== '' ? Number(v.valorMax) : undefined,
        pagina: this.paginaAtual(),
      })
      .subscribe({
        next: (d) => {
          this.dados.set(d);
          this.carregando.set(false);
        },
        error: (e) => {
          this.erro.set(mensagemErro(e, 'Não foi possível carregar os chamados.'));
          this.carregando.set(false);
        },
      });
  }
}
